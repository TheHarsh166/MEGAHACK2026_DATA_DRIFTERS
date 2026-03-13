from fastapi import FastAPI, Body, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Optional, List
import os
import sys
import tempfile
from pydantic import BaseModel

# Ensure the project root is in sys.path for absolute imports
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from ML.feature1.pipeline.topic_pipeline import generate_topic_hierarchy
from ML.feature_3.src.question_service import QuestionService

# Import integrated features using absolute package paths
from ML.Feature7.src.inference import detect_misconception
# Use new Gemini-based recommendation engine
from ML.Feature8.src.gemini_recommendation_engine import recommend_learning_resources
from ML.feature3_student_knowledge_tracking.services.knowledge_service import process_student_answer
from ML.feature3_student_knowledge_tracking.database import student_knowledge_collection, student_attempts_collection
from ML.feature3_student_knowledge_tracking.config import settings

# Diagnostic: Verify database configuration on server load
print(f"\n[Server] Starting ML Service with MONGODB_URI: " + 
      (f"{settings.MONGODB_URI.split('@')[0].split(':')[0]}@..." if '@' in settings.MONGODB_URI else settings.MONGODB_URI))

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events gracefully"""
    # Startup
    print("[Server] Application starting up...")
    yield
    # Shutdown
    print("[Server] Application shutting down...")

app = FastAPI(
    title="ThinkMap Unified ML API",
    lifespan=lifespan
)

# Relaxed CORS so the frontend can always talk to the backend during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UnifiedSubmitRequest(BaseModel):
    userId: str
    questionId: str
    concept: str
    selectedAnswer: str
    selectedOptionNumber: Optional[int] = None  # Option number (1-indexed)
    questionText: Optional[str] = None  # Full question text
    options: Optional[List[str]] = None  # All available options
    correctAnswer: Optional[str] = None  # Correct answer text
    explanation: str

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "ThinkMap Unified ML API"}


@app.post("/api/topic-hierarchy")
async def topic_hierarchy(text: str = Body(..., embed=True)):
    """
    Accept raw text and return the topic hierarchy.
    """
    if not isinstance(text, str) or not text.strip():
        return {"error": "Provide 'text' in the request."}

    try:
        hierarchy = generate_topic_hierarchy(text)
        return {"hierarchy": hierarchy}
    except Exception as exc:
        return {"error": f"Backend error while generating hierarchy: {exc}"}

@app.post("/api/topic-hierarchy-file")
async def topic_hierarchy_file(file: UploadFile = File(...)):
    """
    Accept PDF, Image, or Docx and return the topic hierarchy.
    """
    try:
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        try:
            hierarchy = generate_topic_hierarchy(tmp_path)
            # Re-read text if needed for sourceText storage? 
            # The pipeline extracts it internally. For now return hierarchy.
            return {"hierarchy": hierarchy, "filename": file.filename}
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
                
    except Exception as exc:
        print(f"[API] Error processing file {file.filename}: {exc}")
        return {"error": f"File processing failed: {str(exc)}"}

@app.post("/api/generate-questions")
async def generate_questions_api(concept: str = Body(..., embed=True)):
    """
    Generate 3 AI questions for a concept.
    """
    print(f"\n[API] Received request: POST /api/generate-questions | Concept: {concept}")
    try:
        svc = QuestionService()
        questions = svc.ai_generate_questions(concept)
        return {"questions": questions}
    except Exception as exc:
        print(f"[API] ERROR during generation: {exc}")
        return {"error": f"AI generation failed: {str(exc)}"}

@app.get("/api/student-knowledge/{userId}")
async def get_student_knowledge(userId: str):
    """
    Fetch all concept states for a specific user.
    """
    try:
        doc = student_knowledge_collection.find_one({"userId": userId})
        if not doc:
            return {"conceptStates": {}}
        return {"conceptStates": doc.get("conceptStates", {})}
    except Exception as exc:
        return {"error": f"Failed to fetch knowledge states: {exc}"}

@app.get("/api/student-attempts/{userId}/{concept:path}")
async def get_student_attempts(userId: str, concept: str):
    """
    Fetch all attempts for a specific user and concept.
    """
    try:
        cursor = student_attempts_collection.find(
            {"userId": userId, "concept": concept}
        ).sort("timestamp", -1)
        attempts = []
        for doc in cursor:
            # Convert ObjectId and datetime if necessary for JSON serialization
            doc["_id"] = str(doc["_id"])
            if "timestamp" in doc:
                doc["timestamp"] = doc["timestamp"].isoformat()
            attempts.append(doc)
        return {"attempts": attempts}
    except Exception as exc:
        return {"error": f"Failed to fetch attempts: {exc}"}

@app.post("/api/submit-answer")
async def submit_answer_integrated(request: UnifiedSubmitRequest):
    """
    Unified endpoint integrating all 4 features:
    1. Knowledge Tracking (Feature 3 Student Knowledge Tracking)
    2. Question Generation (Feature 3)
    3. Misconception Detection (Feature 7)
    4. Learning Recommendations (Feature 8)
    
    Stores all data in MongoDB including:
    - Question attempts with option numbers
    - Misconceptions
    - Recommendations
    - Knowledge states
    """
    print(f"\n[API] Received request: POST /api/submit-answer | User: {request.userId} | Concept: {request.concept}")
    
    try:
        # 1. Misconception Detection (Feature 7) - Run first to use in recommendations
        misconception_result = detect_misconception(
            request.explanation,
            selected_answer=request.selectedAnswer,
            correct_answer=request.correctAnswer
        )
        print(f"[API] Feature7 - Misconception detected: {misconception_result.get('misconception_detected', False)}")
        
        # 2. Learning Recommendations (Feature 8) - Use misconception result with context
        understanding_level = "misconception" if misconception_result.get("misconception_detected", False) else "basic"
        recommendations = recommend_learning_resources(
            concept=request.concept,
            misconception=misconception_result.get("misconception", "No Misconception"),
            understanding_level=understanding_level,
            question_text=request.questionText,
            student_answer=request.selectedAnswer
        )
        print(f"[API] Feature8 - Generated {len(recommendations.get('recommendations', []))} personalized recommendations")
        
        # 3. Process via Knowledge Service (Feature 3 Student Knowledge Tracking)
        # This handles DB storage and knowledge state updates
        knowledge_result = await process_student_answer(
            user_id=request.userId,
            question_id=str(request.questionId),
            concept=request.concept,
            selected_answer=request.selectedAnswer,
            selected_option_number=request.selectedOptionNumber,
            question_text=request.questionText,
            options=request.options or [],
            correct_answer=request.correctAnswer,
            explanation=request.explanation,
            misconception_result=misconception_result,
            recommendations=recommendations.get("recommendations", [])
        )
        print(f"[API] Feature3 - Knowledge state: {knowledge_result.get('state', 'unknown')}")
        
        # 4. Return integrated response for frontend
        return {
            "status": "success",
            "conceptId": knowledge_result.get("conceptId", request.concept),
            "state": knowledge_result.get("state", "yellow"),
            "feedback": knowledge_result.get("feedback", "Thank you for your submission."),
            "misconception": misconception_result,
            "recommendations": recommendations.get("recommendations", [])
        }
        
    except Exception as exc:
        import traceback
        print(f"[API] ERROR during integrated submission: {exc}")
        traceback.print_exc()
        return {"error": f"Integrated analysis failed: {str(exc)}"}


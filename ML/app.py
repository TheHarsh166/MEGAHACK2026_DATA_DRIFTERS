from fastapi import FastAPI, Body, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Optional, List
import os
import sys
import tempfile
from pydantic import BaseModel
from datetime import datetime, time, timedelta

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
from ML.feature3_student_knowledge_tracking.database import student_knowledge_collection, student_attempts_collection, db
from ML.feature3_student_knowledge_tracking.config import settings
from ML.FeatureNotes.src.note_service import note_service
from typing import Dict, Any

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

class NoteRequest(BaseModel):
    userId: str
    hierarchy: Dict[str, Any]

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "ThinkMap Unified ML API"}

@app.post("/api/topic-hierarchy")
async def topic_hierarchy(text: str = Body(..., embed=True)):
    if not isinstance(text, str) or not text.strip():
        return {"error": "Provide 'text' in the request."}
    try:
        hierarchy = generate_topic_hierarchy(text)
        return {"hierarchy": hierarchy}
    except Exception as exc:
        return {"error": f"Backend error while generating hierarchy: {exc}"}

@app.post("/api/topic-hierarchy-file")
async def topic_hierarchy_file(file: UploadFile = File(...)):
    try:
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        try:
            hierarchy = generate_topic_hierarchy(tmp_path)
            return {"hierarchy": hierarchy, "filename": file.filename}
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    except Exception as exc:
        return {"error": f"File processing failed: {str(exc)}"}

@app.post("/api/generate-questions")
async def generate_questions_api(concept: str = Body(..., embed=True)):
    try:
        svc = QuestionService()
        questions = svc.ai_generate_questions(concept)
        return {"questions": questions}
    except Exception as exc:
        return {"error": f"AI generation failed: {str(exc)}"}

@app.get("/api/student-knowledge/{userId}")
async def get_student_knowledge(userId: str):
    try:
        doc = student_knowledge_collection.find_one({"userId": userId})
        if not doc:
            return {"conceptStates": {}}
        return {"conceptStates": doc.get("conceptStates", {})}
    except Exception as exc:
        return {"error": f"Failed to fetch knowledge states: {exc}"}

from ML.feature3_student_knowledge_tracking.services.support_service import detect_struggle, get_struggle_support

class TrackAttemptRequest(BaseModel):
    userId: str
    questionId: str
    concept: str
    timeSpent: int
    attempts: int
    reasoningScore: Optional[float] = 1.0

class SupportContentRequest(BaseModel):
    type: str # hint, example, simplify
    questionText: str
    concept: str
    studentExplanation: Optional[str] = ""

@app.post("/api/track-attempt")
async def track_attempt(request: TrackAttemptRequest):
    """
    Track student behavior and detect struggle.
    """
    is_struggling = detect_struggle(request.timeSpent, request.attempts, request.reasoningScore)
    
    if is_struggling:
        return {
            "intervention": True,
            "helpOptions": ["hint", "example", "simplify", "skip"]
        }
    return {"intervention": False}

@app.post("/api/get-support-content")
async def get_support_content(request: SupportContentRequest):
    """
    Generate help content for a struggling student.
    """
    content = await get_struggle_support(
        type=request.type,
        question_text=request.questionText,
        concept=request.concept,
        student_explanation=request.studentExplanation
    )
    return {"content": content}

@app.get("/api/student-attempts/{userId}/{concept:path}")
async def get_student_attempts(userId: str, concept: str):
    try:
        cursor = student_attempts_collection.find({"userId": userId, "concept": concept}).sort("timestamp", -1)
        attempts = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            if "timestamp" in doc:
                doc["timestamp"] = doc["timestamp"].isoformat()
            attempts.append(doc)
        return {"attempts": attempts}
    except Exception as exc:
        return {"error": f"Failed to fetch attempts: {exc}"}

from ML.feature3_student_knowledge_tracking.services.tutor_service import get_tutor_response

class TutorChatRequest(BaseModel):
    userId: str
    misunderstood_concept: str
    student_explanation: str
    history: List[dict] # [{role: "user", content: "..."}, {role: "assistant", content: "..."}]

@app.post("/api/tutor/chat")
async def tutor_chat(request: TutorChatRequest):
    """
    Handle chat interaction with AI tutor.
    """
    print(f"\n[API] Received tutor chat: User: {request.userId} | Concept: {request.misunderstood_concept}")
    
    try:
        tutor_result = await get_tutor_response(
            misunderstood_concept=request.misunderstood_concept,
            student_explanation=request.student_explanation,
            history=request.history
        )
        return tutor_result
    except Exception as exc:
        print(f"[API] ERROR during tutor chat: {exc}")
        return {"error": f"Tutor chat failed: {str(exc)}"}

@app.post("/api/submit-answer")
async def submit_answer_integrated(request: UnifiedSubmitRequest):
    try:
        misconception_result = detect_misconception(request.explanation, selected_answer=request.selectedAnswer, correct_answer=request.correctAnswer)
        understanding_level = "misconception" if misconception_result.get("misconception_detected", False) else "basic"
        recommendations = recommend_learning_resources(concept=request.concept, misconception=misconception_result.get("misconception", "No Misconception"), understanding_level=understanding_level, question_text=request.questionText, student_answer=request.selectedAnswer)
        knowledge_result = await process_student_answer(user_id=request.userId, question_id=str(request.questionId), concept=request.concept, selected_answer=request.selectedAnswer, selected_option_number=request.selectedOptionNumber, question_text=request.questionText, options=request.options or [], correct_answer=request.correctAnswer, explanation=request.explanation, misconception_result=misconception_result, recommendations=recommendations.get("recommendations", []))
        return {"status": "success", "conceptId": knowledge_result.get("conceptId", request.concept), "state": knowledge_result.get("state", "yellow"), "feedback": knowledge_result.get("feedback", "Thank you for your submission."), "misconception": misconception_result, "recommendations": recommendations.get("recommendations", [])}
    except Exception as exc:
        import traceback
        traceback.print_exc()
        return {"error": f"Integrated analysis failed: {str(exc)}"}

@app.get("/api/student-stats/{userId}")
async def get_student_stats(userId: str):
    try:
        now = datetime.utcnow()
        start_of_day = datetime.combine(now.date(), time.min)
        knowledge = student_knowledge_collection.find_one({"userId": userId})
        concept_states = knowledge.get("conceptStates", {}) if knowledge else {}
        mastered_count = sum(1 for s in concept_states.values() if s == "green")
        daily_solved = student_attempts_collection.count_documents({"userId": userId, "timestamp": {"$gte": start_of_day}})
        recent_attempts = student_attempts_collection.find({"userId": userId, "misconception.misconception_detected": True}).sort("timestamp", -1).limit(5)
        misconceptions = list(set([a.get("misconception", {}).get("misconception") for a in recent_attempts if a.get("misconception", {}).get("misconception")]))
        return {"points": knowledge.get("points", 0) if knowledge else 0, "streak": knowledge.get("streak", 0) if knowledge else 0, "dailySolved": daily_solved, "totalSolved": knowledge.get("totalQuestionsSolved", 0) if knowledge else 0, "masteredCount": mastered_count, "misconceptions": misconceptions}
    except Exception as exc:
        return {"error": f"Failed to fetch stats: {exc}"}

@app.get("/api/leaderboard")
async def get_leaderboard(timeframe: str = "lifetime"):
    try:
        users_coll = db["users"]
        user_cursor = users_coll.find({}, {"email": 1, "name": 1})
        user_map = {str(u["_id"]): u.get("name") or u.get("email", "Unknown").split("@")[0] for u in user_cursor}
        if timeframe == "lifetime":
            cursor = student_knowledge_collection.find().sort("points", -1).limit(20)
            members = []
            for doc in cursor:
                uid = doc["userId"]
                states = doc.get("conceptStates", {})
                mastered = sum(1 for s in states.values() if s == "green")
                members.append({"userId": uid, "name": user_map.get(uid, "Guest"), "points": doc.get("points", 0), "solved": mastered, "progress": round((mastered / max(len(states), 1)) * 100) if states else 0, "streak": doc.get("streak", 0)})
            return {"members": members}
        delta = {"daily": timedelta(days=1), "weekly": timedelta(days=7), "monthly": timedelta(days=30)}.get(timeframe, timedelta(days=1))
        start_time = datetime.utcnow() - delta
        pipeline = [{"$match": {"timestamp": {"$gte": start_time}}}, {"$group": {"_id": "$userId", "totalPoints": {"$sum": "$points"}, "questionsSolved": {"$sum": 1}}}, {"$sort": {"totalPoints": -1}}, {"$limit": 20}]
        results = list(student_attempts_collection.aggregate(pipeline))
        members = []
        for res in results:
            uid = res["_id"]
            k_doc = student_knowledge_collection.find_one({"userId": uid})
            states = k_doc.get("conceptStates", {}) if k_doc else {}
            mastered = sum(1 for s in states.values() if s == "green")
            members.append({"userId": uid, "name": user_map.get(uid, "Guest"), "points": res["totalPoints"], "solved": mastered, "progress": round((mastered / max(len(states), 1)) * 100) if states else 0})
        return {"members": members}
    except Exception as exc:
        return {"error": f"Failed to generate leaderboard: {exc}"}

@app.post("/api/recommend-concept")
async def recommend_concept(request: NoteRequest):
    """
    Recommend the next best concept to study based on student history and hierarchy.
    """
    try:
        # Fetch knowledge states for the user
        knowledge = student_knowledge_collection.find_one({"userId": request.userId})
        concept_states = knowledge.get("conceptStates", {}) if knowledge else {}
        
        # Flatten hierarchy to get all concepts
        all_concepts = []
        for main_topic, subtopics in request.hierarchy.items():
            for subtopic, concepts in subtopics.items():
                all_concepts.append(subtopic)
                all_concepts.extend(concepts)
        
        # Priority 1: Concepts with detected misconceptions (Red)
        for c in all_concepts:
            state = concept_states.get(c.replace(".", "_"))
            if state == "red":
                return {
                    "concept": c, 
                    "reason": f"You're struggling a bit with '{c}'. Let's clear up those misconceptions first!",
                    "priority": "high"
                }
        
        # Priority 2: In-progress concepts (Yellow)
        for c in all_concepts:
            state = concept_states.get(c.replace(".", "_"))
            if state == "yellow":
                return {
                    "concept": c, 
                    "reason": f"You've started exploring '{c}'. Let's master it completely!",
                    "priority": "medium"
                }

        # Priority 3: First unattempted concept
        for c in all_concepts:
            if c.replace(".", "_") not in concept_states:
                return {
                    "concept": c, 
                    "reason": f"Ready for something new? '{c}' is a great next step in your journey.",
                    "priority": "low"
                }
        
        # Default: First concept in hierarchy if everything is mastered or error
        first_concept = all_concepts[0] if all_concepts else "General Concepts"
        return {
            "concept": first_concept, 
            "reason": "You've mastered everything here! Want to do a quick review?",
            "priority": "none"
        }
            
    except Exception as exc:
        return {"error": f"Failed to recommend concept: {exc}"}

@app.post("/api/notes/generate")
async def generate_notes_api(request: NoteRequest):
    try:
        # Fetch knowledge states for the user
        knowledge = student_knowledge_collection.find_one({"userId": request.userId})
        concept_states = knowledge.get("conceptStates", {}) if knowledge else {}
        
        notes = await note_service.get_notes_for_book(
            user_id=request.userId,
            hierarchy=request.hierarchy,
            concept_states=concept_states
        )
        return {"notes": notes}
    except Exception as exc:
        import traceback
        traceback.print_exc()
        return {"error": f"Failed to generate notes: {exc}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

from datetime import datetime
from fastapi import HTTPException
from typing import Optional, List, Dict
from ..database import questions_collection, concepts_collection, student_attempts_collection, student_knowledge_collection
from ..utils.state_rules import determine_concept_state
from .gemini_service import analyze_student_reasoning

async def process_student_answer(
    user_id: str, 
    question_id: str, 
    selected_answer: str, 
    explanation: str,
    concept: Optional[str] = None,
    selected_option_number: Optional[int] = None,
    question_text: Optional[str] = None,
    options: Optional[List[str]] = None,
    correct_answer: Optional[str] = None,
    misconception_result: Optional[Dict] = None,
    recommendations: Optional[List[Dict]] = None
) -> dict:
    """
    Process student answer with full integration of all features.
    Handles both existing questions in DB and new questions from frontend.
    """
    # 1. Try to fetch question from MongoDB, or create from request data
    question = questions_collection.find_one({"questionId": question_id})
    
    if question:
        # Question exists in DB
        concept_id = question.get("conceptId", concept or "unknown")
        correct_answer = question.get("correctAnswer") or correct_answer or ""
        question_text = question.get("questionText") or question_text or ""
        options = question.get("options", []) or options or []
    else:
        # Question doesn't exist - create it from request data
        concept_id = concept or "unknown"
        correct_answer = correct_answer or ""
        question_text = question_text or "No question text provided"
        options = options or []
    
    # CRITICAL: Sanitize concept_id for MongoDB keys (no dots allowed in $set keys)
    concept_id = concept_id.replace('.', '_')
    
    if not question:
        # Create question document in DB
        question_doc = {
            "questionId": question_id,
            "questionText": question_text,
            "conceptId": concept_id,
            "concept": concept or "",
            "options": options,
            "correctAnswer": correct_answer,
            "subjectId": "general",  # Default subject
            "createdAt": datetime.utcnow()
        }
        questions_collection.insert_one(question_doc)
        print(f"[KnowledgeService] Created new question in DB: {question_id}")
    
    # 2. Ensure concept exists in concepts collection
    concept_doc = concepts_collection.find_one({"conceptId": concept_id})
    if not concept_doc and concept:
        concept_doc = {
            "conceptId": concept_id,
            "name": concept,
            "subjectId": "general",
            "description": f"Concept: {concept}",
            "prerequisites": []
        }
        concepts_collection.insert_one(concept_doc)
        print(f"[KnowledgeService] Created new concept in DB: {concept_id}")
    
    # 3. Check correctness of answer
    is_correct = (selected_answer == correct_answer) if correct_answer else False
    
    # 4. Send explanation to Gemini API for reasoning analysis (Feature 3)
    gemini_result = await analyze_student_reasoning(
        question_text=question_text,
        correct_answer=correct_answer,
        selected_answer=selected_answer,
        explanation=explanation
    )
    
    # Use misconception from Feature7 if provided, otherwise use Gemini result
    has_misconception = False
    if misconception_result:
        has_misconception = misconception_result.get("misconception_detected", False)
    else:
        has_misconception = gemini_result.get("misconception", False)
    
    feedback = gemini_result.get("feedback", "Thank you for your submission.")
    
    # 5. Determine concept state and points
    evaluation_state = gemini_result.get("evaluation_state")
    new_state = determine_concept_state(is_correct, has_misconception, evaluation_state)
    
    # Points: +10 correct, -10 incorrect, +5 partial
    if new_state == "green": points = 10
    elif new_state == "yellow": points = 5
    else: points = -10

    # 6. Store comprehensive attempt in student_attempts collection
    attempt_doc = {
        "userId": user_id,
        "questionId": question_id,
        "conceptId": concept_id,
        "concept": concept or concept_id,
        "selectedAnswer": selected_answer,
        "selectedOptionNumber": selected_option_number,
        "questionText": question_text,
        "options": options,
        "correctAnswer": correct_answer,
        "explanation": explanation,
        "isCorrect": is_correct,
        "points": points,
        # Feature outputs
        "misconception": misconception_result,
        "recommendations": recommendations if new_state != "green" else [], # Only suggest if not correct
        "feedback": feedback,
        "state": new_state,
        "timestamp": datetime.utcnow()
    }
    student_attempts_collection.insert_one(attempt_doc)
    print(f"[KnowledgeService] Stored attempt for user {user_id}, question {question_id}, points {points}")
    
    # 7. Update student_knowledge collection with summative logic & points
    # Points: +10 correct, -10 incorrect, +5 partial
    if new_state == "green": points = 10
    elif new_state == "yellow": points = 5
    else: points = -10

    # Fetch last 3 attempts for this concept to determine aggregate state
    recent_attempts = list(student_attempts_collection.find(
        {"userId": user_id, "conceptId": concept_id}
    ).sort("timestamp", -1).limit(3))
    
    states = [a.get("state") for a in recent_attempts]
    
    if len(states) < 3:
        summative_graph_state = new_state
    else:
        green_count = states.count("green")
        red_count = states.count("red")
        if green_count >= 2: summative_graph_state = "green"
        elif red_count >= 2: summative_graph_state = "red"
        else: summative_graph_state = "yellow"
    
    # Update cumulative stats and streak
    now = datetime.utcnow()
    knowledge_doc = student_knowledge_collection.find_one({"userId": user_id})
    current_points = (knowledge_doc.get("points", 0) if knowledge_doc else 0) + points
    current_streak = knowledge_doc.get("streak", 0) if knowledge_doc else 0
    last_activity = knowledge_doc.get("lastActivity") if knowledge_doc else None
    
    # Streak logic: if last activity was yesterday, increment. If today, same. Else, reset.
    if last_activity:
        days_diff = (now.date() - last_activity.date()).days
        if days_diff == 1:
            current_streak += 1
        elif days_diff > 1:
            current_streak = 1 # reset
    else:
        current_streak = 1

    student_knowledge_collection.update_one(
        {"userId": user_id},
        {
            "$set": {
                f"conceptStates.{concept_id}": summative_graph_state,
                "points": max(0, current_points),
                "streak": current_streak,
                "lastActivity": now
            },
            "$inc": { "totalQuestionsSolved": 1 }
        },
        upsert=True
    )
    
    # 8. Return response
    return {
        "conceptId": concept_id,
        "state": new_state, # Return current state for feedback
        "graphState": summative_graph_state,
        "feedback": feedback,
        "points": points
    }

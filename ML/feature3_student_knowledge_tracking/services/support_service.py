import json
import os
from .gemini_service import client, USE_NEW_API, gemini_api_key

async def get_struggle_support(type: str, question_text: str, concept: str, student_explanation: str = "") -> str:
    """
    Generates support content (hint, example, or simplified question) using Gemini.
    """
    if not client or not gemini_api_key:
        return "I'm sorry, I'm having trouble generating help right now. Try reviewing the concept!"

    prompts = {
        "hint": f"Provide a small, helpful hint for the following question on {concept}. Do not give the answer. Question: {question_text}",
        "example": f"Provide a real-world example that illustrates the concept of {concept} related to this question: {question_text}",
        "simplify": f"Explain the core concept of this question in very simple terms for a beginner. Question: {question_text}",
    }

    prompt = prompts.get(type, prompts["hint"])
    
    try:
        if USE_NEW_API:
            model_name = "gemini-1.5-flash"
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            return response.text.strip()
        else:
            import google.generativeai as genai
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            return response.text.strip()
    except Exception as e:
        print(f"[SupportService] Error: {e}")
        return "Think about the basics of the concept and how they apply here."

def detect_struggle(time_spent: int, attempts: int, reasoning_score: float = 1.0) -> bool:
    """
    Logic to determine if a student is struggling.
    """
    # Simple rule-based logic
    if time_spent > 90 and attempts >= 2:
        return True
    if attempts >= 3:
        return True
    if reasoning_score < 0.4 and attempts >= 2:
        return True
    return False

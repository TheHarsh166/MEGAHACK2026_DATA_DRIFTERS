import json
import os
from .gemini_service import client, USE_NEW_API, gemini_api_key

TUTOR_PROMPT = """You are a patient, encouraging, and clear Conversational AI Tutor for the ThinkMap platform.
Your goal is to help students overcome misconceptions and master concepts.

Misunderstood Concept: {misunderstood_concept}
Student's Original Explanation: {student_explanation}

CONVERSATION STYLE:
- Be encouraging and supportive.
- Use clear examples.
- Don't just give the answer; guide the student to understand.
- Ask questions to check for understanding.
- Keep responses relatively concise but thorough.

If this is the FIRST message (history is empty), you should:
1. Explain the misconception they had.
2. Provide a clear explanation of the correct concept.
3. Invite them to ask any questions.

If this is a continuation of the conversation, follow the history and respond to the student's latest question.

Respond in JSON format with:
- "response": Your textual response.
- "isUnderstood": Boolean (true if the student seems to have fully understood based on their latest input, false otherwise).
"""

async def get_tutor_response(misunderstood_concept: str, student_explanation: str, history: list) -> dict:
    """
    history format: [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
    """
    if not client or not gemini_api_key:
        return {
            "response": "I'm sorry, I am currently unable to provide tutor assistance. Please try again later.",
            "isUnderstood": False
        }

    # Format the history into the prompt or send as messages
    system_prompt = TUTOR_PROMPT.format(
        misunderstood_concept=misunderstood_concept,
        student_explanation=student_explanation
    )
    
    # Prepare messages
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    
    # Gemini prompt construction
    full_prompt = system_prompt + "\n\nConversation History:\n"
    for msg in history:
        full_prompt += f"{msg['role']}: {msg['content']}\n"
    
    full_prompt += "\nStudent's latest message or first message if history is empty. Respond with JSON: {\"response\": \"...\", \"isUnderstood\": boolean}"

    try:
        if USE_NEW_API:
            model_name = "gemini-1.5-flash"
            response = client.models.generate_content(
                model=model_name,
                contents=full_prompt
            )
            text = response.text.strip()
        else:
            # Re-using the prompt style from gemini_service
            # We'll assume the old API logic if USE_NEW_API is False
            import google.generativeai as genai
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(full_prompt)
            text = response.text.strip()

        # Sanitize and parse JSON
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        
        text = text.strip()
        start_idx = text.find('{')
        end_idx = text.rfind('}') + 1
        
        if start_idx >= 0 and end_idx > start_idx:
            json_text = text[start_idx:end_idx]
            result = json.loads(json_text)
        else:
            result = json.loads(text)
            
        return {
            "response": result.get("response", "I'm sorry, I had trouble generating a response."),
            "isUnderstood": result.get("isUnderstood", False)
        }
        
    except Exception as e:
        print(f"[TutorService] Error: {e}")
        return {
            "response": "I'm having a little trouble connecting right now. Can we try again?",
            "isUnderstood": False
        }

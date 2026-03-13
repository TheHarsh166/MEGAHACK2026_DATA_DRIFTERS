import logging
import time
from typing import Optional
from google import genai
from ML.feature1.config.config import Settings

logger = logging.getLogger(__name__)

class GeminiQuizClient:
    """
    Gemini client for Feature 3 question generation.
    Uses the modern `google-genai` SDK and gemini-1.5-flash.
    """
    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or Settings()
        api_key = self.settings.gemini_api_key
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY environment variable is not set.")

        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-flash-latest"

    def generate_questions(self, concept: str, max_retries: int = 1) -> str:
        prompt = (
            "You are an expert educator.\n\n"
            f"Generate 3 diverse Multiple-Choice Questions (MCQ) EXCLUSIVELY for the concept: {concept}\n\n"
            "Requirements:\n"
            "• Generate exactly 3 Multiple-Choice Questions (MCQ)\n"
            "• THE QUESTIONS MUST BE DIRECTLY ABOUT THE GIVEN CONCEPT. DO NOT ASK GENERAL OR UNRELATED QUESTIONS.\n\n"
            "Return JSON format:\n"
            "{\n"
            '  "questions": [\n'
            "    {\n"
            '      "type": "conceptual | application | definition",\n'
            '      "is_mcq": true,\n'
            '      "question": "string",\n'
            '      "options": ["string", "string", "string", "string"],\n'
            '      "answer": "string (the exact text of the correct option)"\n'
            "    }\n"
            "  ]\n"
            "}\n"
            "Return ONLY JSON. Do NOT include Markdown formatting or backticks."
        )

        last_exc = None
        for attempt in range(max_retries + 1):
            try:
                resp = self.client.models.generate_content(
                    model=self.model,
                    contents=prompt,
                )
                text = (getattr(resp, "text", None) or "").strip()
                if not text:
                    raise RuntimeError("Empty response from Gemini.")
                return text
            except Exception as exc:
                last_exc = exc
                logger.warning(f"Gemini API call failed on attempt {attempt + 1}: {exc}")
                if attempt < max_retries:
                    time.sleep(1.0)

        raise last_exc

"""
Gemini-based Learning Resource Recommendation Engine
Generates personalized learning recommendations using Google Gemini API
"""
import json
import os
import sys
from pathlib import Path

# Add project root to path for config access
current_dir = os.path.dirname(os.path.abspath(__file__))
feature8_root = os.path.dirname(current_dir)
project_root = os.path.dirname(feature8_root)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Try new google.genai first, fallback to old google.generativeai
try:
    from google import genai as google_genai
    USE_NEW_API = True
except ImportError:
    try:
        import google.generativeai as google_genai
        USE_NEW_API = False
    except ImportError:
        google_genai = None
        USE_NEW_API = None

# Import config from feature3_student_knowledge_tracking
from ML.feature3_student_knowledge_tracking.config import settings

class GeminiRecommendationEngine:
    def __init__(self):
        self.gemini_api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
        self.client = None
        self.model_name = None
        
        if not self.gemini_api_key:
            print("[GeminiRecommendationEngine] WARNING: GEMINI_API_KEY not set. Will use fallback recommendations.")
        else:
            try:
                # Prefer old API (google.generativeai) as it's more stable
                if USE_NEW_API is False:
                    google_genai.configure(api_key=self.gemini_api_key)
                    self.model_name = "gemini-2.5-flash"
                    self.client = None  # Old API doesn't use client
                elif USE_NEW_API:
                    self.client = google_genai.Client(api_key=self.gemini_api_key)
                    self.model_name = "gemini-2.5-flash"
                else:
                    self.client = None
            except Exception as e:
                print(f"[GeminiRecommendationEngine] Error initializing Gemini: {e}")
                self.client = None
                self.model_name = None

    def _generate_with_gemini(self, prompt: str) -> str:
        """Generate content using Gemini API with fallback models"""
        if not self.client and not self.model_name:
            return None
        
        # Try old API first (google.generativeai) as it's more stable
        if USE_NEW_API is False:
            model_names = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]
            for model_name in model_names:
                try:
                    model = google_genai.GenerativeModel(model_name)
                    response = model.generate_content(prompt)
                    return response.text.strip()
                except Exception as e:
                    print(f"[GeminiRecommendationEngine] Model {model_name} failed: {type(e).__name__}")
                    continue
        
        # Try new API if old one not available
        if USE_NEW_API and self.client:
            # For new API, try to list available models first
            try:
                # Try common model names for new API
                model_names = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest"]
                for model_name in model_names:
                    try:
                        response = self.client.models.generate_content(
                            model=model_name,
                            contents=prompt
                        )
                        return response.text.strip()
                    except Exception as e:
                        continue
            except Exception as e:
                print(f"[GeminiRecommendationEngine] New API failed: {type(e).__name__}")
        
        return None

    def recommend(self, concept: str, misconception: str, understanding_level: str, 
                  question_text: str = None, student_answer: str = None) -> dict:
        """
        Generate personalized learning recommendations using Gemini AI.
        
        Args:
            concept: The concept being studied
            misconception: Detected misconception (or "No Misconception")
            understanding_level: "basic", "intermediate", "advanced", or "misconception"
            question_text: Optional question text for context
            student_answer: Optional student's answer for context
        """
        # Build comprehensive prompt for Gemini
        has_misconception = misconception and misconception != "No Misconception"
        
        prompt = f"""You are an expert educational AI assistant. Generate personalized learning recommendations for a student.

STUDENT CONTEXT:
- Concept: {concept}
- Understanding Level: {understanding_level}
- Misconception Detected: {has_misconception}
{f"- Specific Misconception: {misconception}" if has_misconception else ""}
{f"- Question: {question_text}" if question_text else ""}
{f"- Student's Answer: {student_answer}" if student_answer else ""}

TASK:
Generate 4-5 diverse, high-quality learning recommendations to help this student master the concept "{concept}".

REQUIREMENTS:
1. Recommendations must be SPECIFIC to the concept "{concept}"
2. If misconception is detected, include resources that directly address and correct it
3. Vary the resource types (Video, Article, Interactive, Practice Problems, etc.)
4. Match difficulty to understanding level ({understanding_level})
5. Provide actionable, real learning resources
6. Make titles specific and descriptive (not generic like "Introduction to X")

OUTPUT FORMAT (JSON only, no markdown):
{{
  "recommendations": [
    {{
      "title": "Specific, descriptive title of the resource",
      "type": "Video|Article|Interactive|Practice|Tutorial|Course",
      "url": "Direct link to the resource (MUST be a valid YouTube URL for 'Video' type)",
      "difficulty": "Beginner|Intermediate|Advanced",
      "content_preview": "2-3 sentence description of what the student will learn and why it helps",
      "relevance_score": 0.95,
      "why_relevant": "Brief explanation of why this resource is recommended for this specific student"
    }}
  ]
}}

IMPORTANT:
- Return ONLY valid JSON, no markdown formatting, no code blocks
- For "Video" types, you MUST provide a real, specific YouTube video URL that directly relates to "{concept}". Avoid generic channel links.
- For other types, provide a relevant educational URL (e.g., Khan Academy, Coursera, Wikipedia).
- Focus on correcting misconceptions if present
- Provide resources that build understanding progressively
"""

        try:
            response_text = self._generate_with_gemini(prompt)
            
            if not response_text:
                # Gemini not available, use intelligent fallback
                print("[GeminiRecommendationEngine] Gemini API not available, using intelligent fallback")
                return self._fallback_recommendations(concept, misconception, understanding_level, question_text, student_answer)
            
            # Clean response text
            text = response_text.strip()
            
            # Remove markdown code blocks if present
            if text.startswith("```json"):
                text = text[7:]
            elif text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            
            # Extract JSON from response
            start_idx = text.find('{')
            end_idx = text.rfind('}') + 1
            
            if start_idx >= 0 and end_idx > start_idx:
                json_text = text[start_idx:end_idx]
                result = json.loads(json_text)
            else:
                result = json.loads(text)
            
            recommendations = result.get("recommendations", [])
            
            # Validate and enhance recommendations
            validated_recs = []
            for rec in recommendations:
                if not isinstance(rec, dict):
                    continue
                    
                validated_rec = {
                    "title": str(rec.get("title", f"Learn {concept}")),
                    "type": str(rec.get("type", "Article")),
                    "url": str(rec.get("url") or f"https://www.youtube.com/results?search_query={concept.replace(' ', '+')}+{rec.get('type', 'tutorial')}"),
                    "difficulty": str(rec.get("difficulty", "Intermediate")),
                    "content_preview": str(rec.get("content_preview", f"Learn about {concept}")),
                    "relevance_score": float(rec.get("relevance_score", 0.85)),
                    "why_relevant": str(rec.get("why_relevant", "Recommended for your learning level"))
                }
                validated_recs.append(validated_rec)
            
            if not validated_recs:
                raise Exception("No valid recommendations generated")
            
            print(f"[GeminiRecommendationEngine] Generated {len(validated_recs)} personalized recommendations")
            
            return {
                "concept": concept,
                "misconception": misconception,
                "understanding_level": understanding_level,
                "recommendations": validated_recs
            }
            
        except json.JSONDecodeError as e:
            print(f"[GeminiRecommendationEngine] JSON decode error: {e}")
            print(f"[GeminiRecommendationEngine] Response: {response_text[:200] if response_text else 'None'}...")
            return self._fallback_recommendations(concept, misconception, understanding_level)
        except Exception as e:
            print(f"[GeminiRecommendationEngine] Error: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            return self._fallback_recommendations(concept, misconception, understanding_level)

    def _fallback_recommendations(self, concept: str, misconception: str, understanding_level: str,
                                   question_text: str = None, student_answer: str = None) -> dict:
        """Generate intelligent fallback recommendations when Gemini is unavailable"""
        has_misconception = misconception and misconception != "No Misconception"
        
        recommendations = []
        
        # Analyze context for better recommendations
        difficulty_map = {
            "basic": "Beginner",
            "intermediate": "Intermediate", 
            "advanced": "Advanced",
            "misconception": "Intermediate"
        }
        base_difficulty = difficulty_map.get(understanding_level, "Intermediate")
        
        # 1. Foundation resource - always include
        recommendations.append({
            "title": f"Mastering {concept}: Complete Guide",
            "type": "Video",
            "url": f"https://www.youtube.com/results?search_query={concept.replace(' ', '+')}+complete+guide",
            "difficulty": "Beginner" if understanding_level in ["basic", "misconception"] else base_difficulty,
            "content_preview": f"Comprehensive video tutorial covering all aspects of {concept}. Includes clear explanations, visual demonstrations, and worked examples. Perfect for building a strong foundation and correcting misunderstandings.",
            "relevance_score": 0.92,
            "why_relevant": "Provides comprehensive foundation for understanding this concept"
        })
        
        # 2. Misconception-specific resource (if applicable)
        if has_misconception:
            recommendations.append({
                "title": f"Debunking the '{misconception}' Misconception",
                "type": "Article",
                "url": f"https://www.youtube.com/results?search_query={concept.replace(' ', '+')}+{misconception.replace(' ', '+')}+explained",
                "difficulty": "Intermediate",
                "content_preview": f"This detailed article specifically addresses the misconception '{misconception}' about {concept}. It explains why this belief is incorrect, provides the correct understanding, and includes examples to help you avoid this common mistake in the future.",
                "relevance_score": 0.95,
                "why_relevant": f"Directly targets your specific misconception and provides correction"
            })
            
            # Additional misconception correction resource
            recommendations.append({
                "title": f"Common Mistakes in Understanding {concept}",
                "type": "Tutorial",
                "url": f"https://www.youtube.com/results?search_query={concept.replace(' ', '+')}+common+mistakes",
                "difficulty": "Intermediate",
                "content_preview": f"Learn about common errors students make when learning {concept}, including '{misconception}'. This tutorial shows you how to identify and correct these mistakes with clear examples and practice.",
                "relevance_score": 0.9,
                "why_relevant": "Helps you recognize and avoid common misconceptions"
            })
        
        # 3. Practice and application
        recommendations.append({
            "title": f"Hands-On Practice: {concept}",
            "type": "Practice",
            "url": f"https://www.youtube.com/results?search_query={concept.replace(' ', '+')}+practice+problems",
            "difficulty": base_difficulty,
            "content_preview": f"Apply your knowledge of {concept} through carefully designed practice problems. Each problem includes step-by-step solutions and explanations to help you understand not just the answer, but the reasoning behind it.",
            "relevance_score": 0.88,
            "why_relevant": "Practice reinforces learning and helps identify areas needing more work"
        })
        
        # 4. Interactive/Visual learning
        recommendations.append({
            "title": f"Interactive Exploration: {concept}",
            "type": "Interactive",
            "url": f"https://www.youtube.com/results?search_query={concept.replace(' ', '+')}+simulation",
            "difficulty": "Beginner",
            "content_preview": f"Explore {concept} through interactive simulations and visualizations. Manipulate variables, see cause-and-effect relationships, and develop an intuitive understanding of how {concept} works in different scenarios.",
            "relevance_score": 0.87,
            "why_relevant": "Interactive learning helps build deeper understanding"
        })
        
        # 5. Advanced/Real-world (if not struggling)
        if understanding_level not in ["misconception", "basic"]:
            recommendations.append({
                "title": f"Advanced Applications: {concept} in Real Life",
                "type": "Article",
                "url": f"https://www.youtube.com/results?search_query={concept.replace(' ', '+')}+real+world+applications",
                "difficulty": "Advanced",
                "content_preview": f"Discover how {concept} is applied in real-world situations, from everyday examples to cutting-edge applications. See the practical importance of understanding {concept} deeply.",
                "relevance_score": 0.85,
                "why_relevant": "Shows practical value and advanced applications"
            })
        else:
            # For struggling students, add a simplified explanation
            recommendations.append({
                "title": f"Simple Explanation: {concept} Made Easy",
                "type": "Article",
                "url": f"https://www.youtube.com/results?search_query={concept.replace(' ', '+')}+for+beginners",
                "difficulty": "Beginner",
                "content_preview": f"A simplified, step-by-step explanation of {concept} that breaks down complex ideas into easy-to-understand parts. Uses analogies and simple language to make the concept accessible.",
                "relevance_score": 0.9,
                "why_relevant": "Simplified explanation helps build understanding from the ground up"
            })
        
        return {
            "concept": concept,
            "misconception": misconception,
            "understanding_level": understanding_level,
            "recommendations": recommendations
        }


def recommend_learning_resources(concept: str, misconception: str, understanding_level: str,
                                  question_text: str = None, student_answer: str = None) -> dict:
    """
    Main entry point for Feature 8 - Gemini-based recommendations.
    
    Args:
        concept: The concept being studied
        misconception: Detected misconception from Feature7
        understanding_level: Student's understanding level
        question_text: Optional question text for better context
        student_answer: Optional student's answer for better context
    """
    engine = GeminiRecommendationEngine()
    return engine.recommend(concept, misconception, understanding_level, question_text, student_answer)


if __name__ == "__main__":
    # Test the recommendation engine
    result = recommend_learning_resources(
        concept="Photosynthesis",
        misconception="Plants get their food from soil",
        understanding_level="misconception",
        question_text="How do plants make their food?",
        student_answer="Plants absorb nutrients from the soil"
    )
    print(json.dumps(result, indent=2))

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import yaml
import os
import sys

# Ensure src modules can be accessed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.preprocessing import clean_text

class MisconceptionDetector:
    def __init__(self, config_path="config/model_config.yaml"):
        # Resolve config path relative to the Feature7 directory
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        resolved_config_path = os.path.join(self.base_dir, config_path)
        
        try:
            if os.path.exists(resolved_config_path):
                with open(resolved_config_path, "r") as f:
                    config = yaml.safe_load(f)
                self.model_dir = os.path.join(self.base_dir, config.get('model', {}).get('output_dir', 'models/misconception_detector'))
            else:
                self.model_dir = os.path.join(self.base_dir, "models/misconception_detector")
        except Exception:
            self.model_dir = os.path.join(self.base_dir, "models/misconception_detector")
            
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.is_loaded = False
        
        try:
            if os.path.exists(self.model_dir) and os.path.isdir(self.model_dir):
                self.model = AutoModelForSequenceClassification.from_pretrained(self.model_dir)
                self.tokenizer = AutoTokenizer.from_pretrained(self.model_dir)
                self.model.to(self.device)
                self.model.eval()
                self.is_loaded = True
                print(f"[Feature7] Loaded misconception detection model from {self.model_dir}")
            else:
                # Model not trained yet - this is expected and fallback logic will be used
                print(f"[Feature7] Model not found at {self.model_dir}. Using heuristic fallback logic. (To train: python src/train.py)")
        except Exception as e:
            print(f"[Feature7] Warning: Failed to load misconception model. Error: {e}. Using fallback logic.")
            
        self.label_map = {
            0: "No Misconception",
            1: "Factual Error / Direct Contradiction",
            2: "Unrelated / Missing Information",
            3: "Conceptual Misunderstanding",
            4: "Misapplied Principle / Reasoning Error"
        }

    def detect_misconception(self, student_explanation: str, selected_answer: str = None, correct_answer: str = None) -> dict:
        """
        Takes a student's explanation and optionally their answer choice.
        Predicts misconception classes and assesses overall understanding strength.
        """
        is_answer_correct = (selected_answer == correct_answer) if (selected_answer and correct_answer) else None
        
        if not self.is_loaded:
            # Enhanced fallback logic for when model is missing
            cleaned_explanation = student_explanation.lower()
            misconception_detected = False
            misconception_class_str = ""
            confidence_val = 0.6
            
            # Enhanced heuristic patterns for different misconception types
            uncertainty_patterns = ["don't know", "unsure", "maybe", "guess", "think", "not sure", "probably"]
            factual_error_patterns = ["always", "never", "all", "none", "impossible", "can't happen"]
            conceptual_error_patterns = ["stop", "need force", "pushing", "pulling", "requires force to move", "force makes it move"]
            missing_info_patterns = ["because", "just", "it is", "that's how", "that's why", "obviously"]
            
            if any(word in cleaned_explanation for word in uncertainty_patterns):
                misconception_detected = True
                misconception_class_str = "Unrelated / Missing Information"
                confidence_val = 0.7
            elif any(word in cleaned_explanation for word in factual_error_patterns):
                misconception_detected = True
                misconception_class_str = "Factual Error / Direct Contradiction"
                confidence_val = 0.75
            elif any(word in cleaned_explanation for word in conceptual_error_patterns):
                misconception_detected = True
                misconception_class_str = "Conceptual Misunderstanding"
                confidence_val = 0.8
            elif any(word in cleaned_explanation for word in missing_info_patterns) and len(cleaned_explanation) < 20:
                misconception_detected = True
                misconception_class_str = "Unrelated / Missing Information"
                confidence_val = 0.65
            elif len(cleaned_explanation) < 10:
                misconception_detected = True
                misconception_class_str = "Unrelated / Missing Information"
                confidence_val = 0.7

            # Determine understanding strength
            if is_answer_correct is True:
                if not misconception_detected:
                    strength = "Strong"
                    explanation_msg = "Correct answer with sound reasoning. Great understanding!"
                else:
                    strength = "Moderate"
                    explanation_msg = f"Correct answer, but reasoning shows potentially a lucky guess or {misconception_class_str}."
            elif is_answer_correct is False:
                strength = "Weak"
                explanation_msg = f"Incorrect answer and reasoning suggests: {misconception_class_str or 'misunderstanding'}."
            else:
                strength = "N/A"
                explanation_msg = f"Reasoning suggests: {misconception_class_str}." if misconception_detected else "Reasoning appears reasonable."

            return {
                "misconception_detected": misconception_detected,
                "misconception": misconception_class_str if misconception_detected else "No Misconception",
                "concept": "Newton's First Law" if "force" in cleaned_explanation or "motion" in cleaned_explanation else "General Scientific Concept",
                "confidence": confidence_val,
                "understanding_strength": strength,
                "explanation": explanation_msg
            }
            
        from src.preprocessing import clean_text
        cleaned_text = clean_text(student_explanation)
        
        inputs = self.tokenizer(
            cleaned_text,
            return_tensors="pt",
            truncation=True,
            max_length=128,
            padding=True
        ).to(self.device)
        
        with torch.no_grad():
            outputs = self.model(**inputs)
            probs = torch.nn.functional.softmax(outputs.logits, dim=1)
            confidence, predicted_class = torch.max(probs, dim=1)
            
        pred_label_id = predicted_class.item()
        confidence_val = confidence.item()
        
        misconception_detected = (pred_label_id != 0)
        misconception_class_str = self.label_map.get(pred_label_id, "Unknown Structure")
        
        # Determine understanding strength for model-based inference
        if is_answer_correct is True:
            if not misconception_detected:
                strength = "Strong"
                explanation_msg = "Valid reasoning supporting the correct choice."
            else:
                strength = "Moderate"
                explanation_msg = f"Correct choice, but reasoning indicates: {misconception_class_str}."
        elif is_answer_correct is False:
            strength = "Weak"
            explanation_msg = f"Incorrect answer with reasoning exhibiting: {misconception_class_str}."
        else:
            strength = "N/A"
            explanation_msg = f"Reasoning exhibits: {misconception_class_str}" if misconception_detected else "Reasoning appears factual."

        return {
            "misconception_detected": misconception_detected,
            "misconception": misconception_class_str if misconception_detected else "",
            "concept": "Newton's First Law" if "force" in cleaned_text else "General Scientific Concept",
            "confidence": round(confidence_val, 4),
            "understanding_strength": strength,
            "explanation": explanation_msg
        }

# Pre-initialized global instance
detector = MisconceptionDetector()

def detect_misconception(student_explanation: str, selected_answer: str = None, correct_answer: str = None) -> dict:
    """
    Public entrypoint function intended to be imported directly by backend developers.
    """
    return detector.detect_misconception(student_explanation, selected_answer, correct_answer)

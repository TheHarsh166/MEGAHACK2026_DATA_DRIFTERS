import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))
    api_key = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=api_key)

with open("full_model_list.txt", "w") as f:
    for m in genai.list_models():
        f.write(f"{m.name}\n")

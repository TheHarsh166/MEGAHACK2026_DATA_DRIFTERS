import os
import google.generativeai as genai
from dotenv import load_dotenv
import time

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    # Try backend .env
    load_dotenv(os.path.join("backend", ".env"))
    api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    # Try root .env directly
    with open(".env", "r") as f:
        for line in f:
            if "GEMINI_API_KEY" in line:
                api_key = line.split("=")[1].strip().strip("'").strip('"')
                break

if not api_key:
    print("FATAL: GEMINI_API_KEY not found anywhere.")
    exit(1)

genai.configure(api_key=api_key)

test_models = [
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-flash-latest",
    "gemini-1.5-flash-latest",
    "gemini-pro-latest"
]

print(f"Testing models with API Key (starts with {api_key[:8]}...):")

for model_name in test_models:
    print(f"\n--- Testing {model_name} ---")
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Say 'hello' in one word.")
        print(f"SUCCESS: {response.text.strip()}")
    except Exception as e:
        print(f"FAILED: {e}")
    time.sleep(1) # Small delay

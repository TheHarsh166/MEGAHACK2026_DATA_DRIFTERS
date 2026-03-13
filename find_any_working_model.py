import os
import google.generativeai as genai
from dotenv import load_dotenv
import time

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    load_dotenv(os.path.join("backend", ".env"))
    api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("FATAL: GEMINI_API_KEY not found.")
    exit(1)

genai.configure(api_key=api_key)

try:
    models = genai.list_models()
    valid_models = [m.name for m in models if 'generateContent' in m.supported_generation_methods]
except Exception as e:
    print(f"Error listing models: {e}")
    exit(1)

print(f"Testing {len(valid_models)} models...")

for model_name in valid_models:
    # Skip models we know failed or are likely to fail
    if "embedding" in model_name or "aqa" in model_name or "imagen" in model_name:
        continue
        
    print(f"Testing {model_name}... ", end="", flush=True)
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Hi", generation_config={"max_output_tokens": 5})
        print(f"SUCCESS: {response.text.strip()}")
        print(f"\nFOUND WORKING MODEL: {model_name}")
        # Save to a file for the agent to read
        with open("working_model.txt", "w") as f:
            f.write(model_name)
        exit(0)
    except Exception as e:
        err_msg = str(e)
        if "429" in err_msg:
            print("FAILED (429 Quota)")
        elif "404" in err_msg:
            print("FAILED (404 Not Found)")
        else:
            print(f"FAILED ({err_msg[:50]}...)")
    time.sleep(0.5)

print("\nNo working models found.")

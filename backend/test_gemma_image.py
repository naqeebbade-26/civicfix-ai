
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from google import genai

load_dotenv("api.env")

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("ERROR: API key not found in api.env")
    sys.exit(1)

if len(sys.argv) < 2:
    print("Usage: python test_gemma_image.py path_to_image")
    sys.exit(1)

image_path = Path(sys.argv[1])

if not image_path.is_file():
    print("ERROR: Image file not found:", image_path)
    sys.exit(1)

client = genai.Client(api_key=api_key)

try:
    print("Uploading image to Google's temporary Files API...")

    uploaded_file = client.files.upload(file=str(image_path))

    print("Image uploaded. Requesting Gemma analysis...")

    response = client.models.generate_content(
        model="gemma-4-26b-a4b-it",
        contents=[
            uploaded_file,
            (
                "Describe the visible contents of this image. "
                "If you see a civic infrastructure problem, identify it, "
                "suggest a category, and explain whether its visible "
                "severity appears Low, Medium, or High. Do not invent "
                "details that cannot be seen."
            ),
        ],
    )

    print("\n--- GEMMA IMAGE ANALYSIS ---\n")
    print(response.text or "The model returned no text.")

except Exception as exc:
    print("Image analysis failed.")
    print("Error type:", type(exc).__name__)
    print("Error:", str(exc))

finally:
    client.close()

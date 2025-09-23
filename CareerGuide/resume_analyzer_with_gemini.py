# filename: resume_analyzer_with_gemini.py
# pip install fastapi "uvicorn[standard]" python-multipart pandas python-docx PyMuPDF scikit-learn google-generativeai
# or if you use OpenAI-compatible access: pip install openai

from fastapi.middleware.cors import CORSMiddleware

from fastapi import FastAPI, UploadFile, File, HTTPException
import pandas as pd
import re
import random
import fitz  # PyMuPDF
import docx
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import os
import json
from typing import Dict, Any

from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="Resume Analyzer + Gemini Suggestions")

# This allows your React app to communicate with the backend
origins = [
    "http://localhost:5000",
    "https://67f446f9-285e-4920-9d2c-6b1587c1dbb1-00-1ld3ivy6pb0b6.spock.replit.dev",  # Replit domain
    "http://localhost:3000",
    "http://localhost:3001", 
    "http://localhost:5173", # Common for Vite React apps
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)
# +++++++++++++++++++++++++++++++++++++++++

# ---------- Config ----------
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")    # or set directly (not recommended)
JD_CSV_PATH = r"jd/UpdatedResumeDataSet.csv"

# ------------------------
# Helper functions
# ------------------------ 
def clean_text(text: str) -> str:
    text = str(text or "").lower()
    text = re.sub(r'http\S+|www\S+|https\S+', '', text)
    text = re.sub(r'[^a-zA-Z0-9\s\.\,\-\+\/]', ' ', text)  # keep some punctuation
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def extract_keywords(text: str, top_n: int = 20):
    vectorizer = TfidfVectorizer(max_features=500, stop_words='english')
    tfidf = vectorizer.fit_transform([text])
    names = vectorizer.get_feature_names_out()
    scores = tfidf.toarray().flatten()
    order = scores.argsort()[-top_n:][::-1]
    return [names[i] for i in order]

def calculate_match_score(resume_text: str, jd_text: str) -> float:
    vectorizer = CountVectorizer().fit([resume_text, jd_text])
    vectors = vectorizer.transform([resume_text, jd_text])
    similarity = cosine_similarity(vectors[0], vectors[1])[0][0]
    return round(similarity * 100, 2)

def generate_report(resume_text: str, jd_keywords: list, score: float):
    resume_words = set(re.findall(r'\w+', resume_text.lower()))
    missing_keywords = [kw for kw in jd_keywords if kw.lower() not in resume_words]
    if score > 80:
        feedback = "Strong match! Your resume aligns well with the expected role."
    elif score > 60:
        feedback = "Good match, but strengthen your resume by adding details about missing keywords."
    else:
        feedback = "Weak match. Tailor your resume with more focus on the target skills."

    suggestions = []
    for kw in missing_keywords:
        templates = [
            f"Incorporate '{kw}' by describing a project where you used this skill.",
            f"Highlight your experience with '{kw}' in your work history (1-2 bullets).",
            f"Add '{kw}' to your skills/technical summary section if applicable.",
        ]
        suggestions.append(random.choice(templates))

    return {
        "ATS Score (%)": float(score),
        "Missing Keywords": missing_keywords,
        "Feedback": feedback,
        "Suggested Additions": suggestions
    }

# ------------------------
# File parsing
# ------------------------
def extract_text_from_file(file: UploadFile):
    filename = file.filename.lower()
    if filename.endswith(".pdf"):
        # pyMuPDF expects bytes or file-like - we already have file.file
        pdf = fitz.open(stream=file.file.read(), filetype="pdf")
        text = ""
        for page in pdf:
            text += page.get_text("text") + "\n"
        return text
    elif filename.endswith(".docx"):
        doc = docx.Document(file.file)
        text = " ".join([para.text for para in doc.paragraphs])
        return text
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Upload PDF or DOCX only.")

# ------------------------
# Load JD dataset (example)
# ------------------------
# Make sure this path is valid on your server. Replace with your CSV path.
try:
    jd_dataset = pd.read_csv(JD_CSV_PATH)
    if "job_description" not in jd_dataset.columns:
        raise ValueError("CSV must have a 'job_description' column")
except Exception as e:
    # If dataset not found, create a minimal fallback list to avoid server crash.
    print("Warning: couldn't load JD dataset:", e)
    jd_dataset = pd.DataFrame({"job_description": [
        "Data Science role requiring Python, pandas, scikit-learn, NLP, machine learning, SQL, tableau"
    ]})

# ------------------------
# LLM integration: helper wrappers
# ------------------------
def build_gemini_prompt(resume_text: str, jd_text: str, missing_keywords: list) -> str:
    '''prompt = f"""
You are a professional resume coach. Given the candidate resume (DELIMITED BY <<<RESUME>>>)
and the target job description (DELIMITED BY <<<JD>>>), do the following:
1) Produce 6 concise, ATS-optimized resume bullets that better describe the candidate's strongest relevant work for this JD.
   - Keep each bullet <= 2 lines, use action verbs and metrics when possible.
2) Provide 8 suggested keywords/phrases (single or multiword) to add to the resume to improve ATS matching.
3) Provide 5 specific formatting suggestions (where to place skills, reorder sections, bullet vs paragraph).
4) Provide a single "improved resume snippet" that is the original resume but with the suggested bullets replaced in the relevant work section.
Return output as a JSON object with keys: bullets (list), suggested_keywords (list), formatting (list), improved_snippet (string).
If any information isn't present in the resume, infer plausible but conservative details (label inferred fields clearly).
<<<RESUME>>>
{resume_text}
<<<JD>>>
{jd_text}
<<<MISSING_KEYWORDS>>>
{', '.join(missing_keywords)}
"""'''
    # --- MODIFIED AND IMPROVED PROMPT ---
    prompt = f"""
You are an expert resume coach reviewing a resume for a specific job description.
Your task is to provide feedback in a structured JSON format.

**Instructions:**
1.  **rewrittenSummary**: Write a concise, professional summary (2-4 sentences) for the resume. This summary should be impactful and tailored to the job description.
2.  **bullets**: Generate exactly 6 specific, ATS-optimized bullet points. Each bullet should highlight a key achievement or skill relevant to the job. Use action verbs and quantify results where possible. These bullets will be the main "Improvement Suggestions".

**Input:**

<<<RESUME>>>
{resume_text}
<<<RESUME>>>

<<<JD>>>
{jd_text}
<<<JD>>>

**Output Format (JSON only):**
Return a single, clean JSON object with the keys "rewrittenSummary" (string) and "bullets" (list of strings). Do not include any other text or markdown formatting.
"""
    return prompt

# Google Gemini (google-generativeai)
def call_gemini_google(prompt: str) -> Dict[str, Any]:
    try:
        import google.generativeai as genai
    except Exception as e:
        raise RuntimeError("google-generativeai library not installed. pip install google-generativeai") from e
    if not GOOGLE_API_KEY:
        raise RuntimeError("GOOGLE_API_KEY not set in env")
    genai.configure(api_key=GOOGLE_API_KEY)

    # Choose a model available to you, e.g. gemini-1.5-pro-latest or gemini-1.5-flash-latest
    # model = "models/gemini-1.5-pro-latest"

    # Use the modern GenerativeModel API
    model = genai.GenerativeModel("gemini-1.5-flash-latest") # Using flash for speed

    # generate a structured text response
    '''response = genai.generate(
        model=model,
        prompt=prompt,
        max_output_tokens=800
    )'''

    # Generate content using the new method
    response = model.generate_content(prompt)

    # the library may put content in response.candidates[0].output or response.text
    '''content = ""
    if hasattr(response, "candidates") and len(response.candidates) > 0:
        content = response.candidates[0].output
    elif hasattr(response, "text"):
        content = response.text
    else:
        content = str(response)
    # Try to parse JSON from content, but if not JSON, return raw text
    try:
        parsed = json.loads(content)
    except Exception:
        parsed = {"raw": content}
    return parsed'''

    content = response.text

    # --- ADDED CLEANUP LOGIC ---
    # Clean the response to remove markdown formatting before parsing
    if content.strip().startswith("```json"):
        content = re.sub(r'```json\s*|\s*```', '', content).strip()
    # --- END OF CLEANUP LOGIC ---

    try:
        # The model should return a clean JSON string as requested in the prompt
        parsed = json.loads(content)
    except (json.JSONDecodeError, TypeError):
        # If it fails to parse, return the raw text for debugging
        print(f"Gemini response was not valid JSON: {content}")
        parsed = {"raw": content}
    return parsed

# ------------------------
# Main endpoint
# ------------------------
@app.post("/analyze_resume/")
async def analyze_resume(file: UploadFile = File(...)):
    """
    Upload a resume (PDF/DOCX) and analyze against JD dataset.
    Returns:
      - Best matching JD,
      - Basic ATS report,
      - LLM-based improved bullets & suggestions (uses Gemini/OpenAI).
    """
    resume_text_raw = extract_text_from_file(file)
    cleaned_resume = clean_text(resume_text_raw)

    best_match = None
    best_score = -1
    best_jd = None
    best_jd_keywords = None
    best_report = None

    for jd in jd_dataset["job_description"]:
        cleaned_jd = clean_text(jd)
        jd_keywords = extract_keywords(cleaned_jd, top_n=20)
        score = calculate_match_score(cleaned_resume, cleaned_jd)
        report = generate_report(cleaned_resume, jd_keywords, score)
        if score > best_score:
            best_score = score
            best_match = jd
            best_jd = cleaned_jd
            best_jd_keywords = jd_keywords
            best_report = report

    # Build prompt for LLM
    prompt = build_gemini_prompt(cleaned_resume, best_jd or "", best_report["Missing Keywords"])

    # Call the LLM
    try:
        llm_output = call_gemini_google(prompt)
    except Exception as e:
        # return the basic info and error about LLM call so the frontend can still show ATS results
        return {
            "Best Matching JD": best_match,
            "Report": best_report,
            "LLM_Error": str(e),
            "LLM_Output": None
        }

    return {
        "Best Matching JD": best_match,
        "Report": best_report,
        "LLM_Output": llm_output
    }

# ------------------------
# If you want a simple health check
# ------------------------
@app.get("/health")
def health():
    return {"status": "ok"}


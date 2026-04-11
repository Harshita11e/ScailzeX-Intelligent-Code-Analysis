import os
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from models import ReviewRequest, ReviewResponse
from reviewer import run_review, SUPPORTED_LANGUAGES
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="ScailzeX API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

EXT_MAP = {
    '.py': 'python',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'javascript', '.java': 'java', '.c': 'c',
    '.cpp': 'cpp', '.cc': 'cpp', '.h': 'c', '.hpp': 'cpp',
    '.js': 'javascript', '.jsx': 'javascript', '.mjs': 'javascript',
}

MAX_SIZE = 50_000

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ScailzeX API", "version": "1.0.0", "languages": list(SUPPORTED_LANGUAGES)}

@app.post("/review", response_model=ReviewResponse)
async def review_code(request: ReviewRequest):
    if not request.code.strip():
        raise HTTPException(400, "Code cannot be empty.")
    if len(request.code) > MAX_SIZE:
        raise HTTPException(400, f"Code too large. Maximum {MAX_SIZE} characters.")
    if request.language not in SUPPORTED_LANGUAGES:
        raise HTTPException(400, f"Unsupported language '{request.language}'. Supported: {list(SUPPORTED_LANGUAGES)}")
    try:
        return run_review(code=request.code, language=request.language, filename=request.filename)
    except ValueError as e:
        raise HTTPException(422, f"Invalid response from AI: {str(e)}")
    except Exception as e:
        raise HTTPException(500, f"Review failed: {str(e)}")

@app.post("/review/upload", response_model=ReviewResponse)
async def review_upload(file: UploadFile = File(...)):
    import os as _os
    ext = _os.path.splitext(file.filename)[1].lower()
    if ext not in EXT_MAP:
        raise HTTPException(400, f"Unsupported file type '{ext}'. Supported: {list(EXT_MAP.keys())}")
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(400, "File too large. Maximum 50KB.")
    try:
        code = content.decode('utf-8', errors='replace')
    except Exception:
        raise HTTPException(400, "Cannot read file — ensure it is a plain text source file.")
    try:
        return run_review(code=code, language=EXT_MAP[ext], filename=file.filename)
    except ValueError as e:
        raise HTTPException(422, f"Invalid response from AI: {str(e)}")
    except Exception as e:
        raise HTTPException(500, f"Review failed: {str(e)}")
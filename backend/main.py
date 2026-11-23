

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from users import router as users_router
from document_router import router as document_router
import pytesseract

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

app = FastAPI(
    title="COALA DOCS API",
    description="Backend de gestion documentaire COALA",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://192.168.1.55:5173"
    "http://192.168.1.14:8080"
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)
app.include_router(document_router, prefix="")

@app.get("/")
def accueil():
    return {
        "message": "Bienvenue sur le backend COALA DOCS",
        "status": "active"
    }


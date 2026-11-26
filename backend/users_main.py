from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from users import router as users_router

app = FastAPI(
    title="COALA DOCS - Gestion des utilisateurs",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://coalasbz-max.github.io",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)


@app.get("/")
def accueil():
    return {
        "message": "COALA DOCS - API utilisateurs",
        "status": "active"
    }

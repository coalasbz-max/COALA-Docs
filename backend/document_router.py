
import os
import tempfile

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from document_reader import (
    extract_text_from_pdf,
    extract_text_from_image
)
from document_search import (
    add_document_to_index,
    search_document_index
)

router = APIRouter(
    prefix="/documents",
    tags=["Lecture des documents"]
)


@router.post("/extract-text")
async def extract_document_text(file: UploadFile = File(...)):

    allowed_extensions = {
        ".pdf", ".jpg", ".jpeg", ".png"
    }

    extension = os.path.splitext(file.filename)[1].lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Format non pris en charge. Utilisez PDF, JPG ou PNG."
        )

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Le fichier est vide."
        )

    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Le fichier dépasse la limite de 20 Mo."
        )

        temp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension
        ) as temp_file:
            temp_file.write(content)
            temp_path = temp_file.name

        if extension == ".pdf":
            extracted_text = extract_text_from_pdf(temp_path)
        else:
            extracted_text = extract_text_from_image(temp_path)

        passages_count = add_document_to_index(
            temp_path,
            file.filename
        )

        return {
            "filename": file.filename,
            "language_support": ["fra", "eng", "ara"],
            "extracted_text": extracted_text,
            "indexed_passages": passages_count,
            "success": True
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Erreur pendant la lecture du document."
        )

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
        await file.close()

class SearchRequest(BaseModel):
    question: str


@router.post("/search")
def search_documents(request: SearchRequest):

    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Veuillez saisir une question."
        )

    results = search_document_index(
        request.question,
        top_k=3
    )

    return {
        "question": request.question,
        "results": results,
        "success": True
    }
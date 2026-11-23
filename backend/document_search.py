import tempfile
import os

from document_reader import extract_text_from_pdf, extract_text_from_image
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# Modèle multilingue : français, anglais et arabe
MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"

# Chargement du modèle
model = SentenceTransformer(MODEL_NAME)


def create_embedding(text):
    """
    Transforme un texte en représentation numérique.
    """

    embedding = model.encode(
        text,
        convert_to_numpy=True,
        normalize_embeddings=True
    )

    return embedding


def split_text_into_chunks(text, chunk_size=500, overlap=100):
    """
    Découpe un texte en passages avec un chevauchement.
    """

    words = text.split()
    chunks = []
    start = 0

    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])

        if chunk.strip():
            chunks.append(chunk)

        start += chunk_size - overlap

    return chunks
    from sklearn.metrics.pairwise import cosine_similarity


def search_similar_chunks(question, chunks, top_k=3):
    """
    Recherche les passages les plus proches de la question
    et conserve les références des documents.
    """

    if not chunks:
        return []

    texts = [
        chunk["text"] if isinstance(chunk, dict) else chunk
        for chunk in chunks
    ]

    question_embedding = create_embedding(question)
    chunk_embeddings = model.encode(
        texts,
        convert_to_numpy=True,
        normalize_embeddings=True
    )

    scores = cosine_similarity(
        question_embedding.reshape(1, -1),
        chunk_embeddings
    )[0]

    results = []

    for index in scores.argsort()[::-1][:top_k]:
        result = {
            "text": texts[index],
            "score": float(scores[index])
        }

        if isinstance(chunks[index], dict):
            result["filename"] = chunks[index]["filename"]
            result["page"] = chunks[index]["page"]

        results.append(result)

    return results
def split_document_by_pages(text, filename, chunk_size=500, overlap=100):
    """
    Découpe un document en passages en conservant le nom du fichier
    et le numéro de page.
    """

    import re

    pages = re.split(
        r"--- Page (\d+) ---",
        text
    )

    passages = []

    for i in range(1, len(pages), 2):
        page_number = int(pages[i])
        page_text = pages[i + 1].strip()

        chunks = split_text_into_chunks(
            page_text,
            chunk_size,
            overlap
        )

        for chunk in chunks:
            passages.append({
                "filename": filename,
                "page": page_number,
                "text": chunk
            })

    return passages


def index_document(file_path, filename):
    """
    Extrait le texte d'un document et prépare ses passages
    pour la recherche intelligente.
    """

    extension = os.path.splitext(filename)[1].lower()

    if extension == ".pdf":
        extracted_text = extract_text_from_pdf(file_path)

        passages = split_document_by_pages(
            extracted_text,
            filename
        )

    elif extension in [".jpg", ".jpeg", ".png"]:
        extracted_text = extract_text_from_image(file_path)

        chunks = split_text_into_chunks(extracted_text)

        passages = [
            {
                "filename": filename,
                "page": None,
                "text": chunk
            }
            for chunk in chunks
        ]

    else:
        raise ValueError("Format de document non pris en charge.")

    return passages

    # Index temporaire des documents
document_index = []


def add_document_to_index(file_path, filename):
    """
    Ajoute les passages d'un document à l'index de recherche.
    """

    passages = index_document(file_path, filename)

    document_index.extend(passages)

    return len(passages)


def search_document_index(question, top_k=3):
    """
    Recherche dans tous les documents indexés.
    """

    return search_similar_chunks(
        question,
        document_index,
        top_k
    )
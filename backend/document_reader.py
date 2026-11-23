
import pymupdf
import pytesseract

from PIL import Image


# Chemin de Tesseract sous Windows
pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)

# Français, anglais et arabe
OCR_LANGUAGES = "fra+eng+ara"


def extract_text_from_pdf(file_path):
    """Extrait le texte d'un fichier PDF."""

    extracted_text = ""

    document = pymupdf.open(file_path)

    for page_number, page in enumerate(document, start=1):
        text = page.get_text("text").strip()

        if not text:
            pix = page.get_pixmap(matrix=pymupdf.Matrix(2, 2))

            image = Image.frombytes(
                "RGB",
                [pix.width, pix.height],
                pix.samples
            )

            text = pytesseract.image_to_string(
                image,
                lang=OCR_LANGUAGES
            ).strip()

        if text:
            extracted_text += (
                f"\n\n--- Page {page_number} ---\n{text}"
            )

    document.close()

    return extracted_text.strip()


def extract_text_from_image(file_path):
    """Extrait le texte d'une image avec OCR."""

    image = Image.open(file_path)

    text = pytesseract.image_to_string(
        image,
        lang=OCR_LANGUAGES
    )

    return text.strip()

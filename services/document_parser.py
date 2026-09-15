from io import BytesIO
import pypdf
import docx

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    filename_lower = filename.lower()
    text = ""
    
    if filename_lower.endswith(".pdf"):
        pdf_reader = pypdf.PdfReader(BytesIO(file_bytes))
        for page in pdf_reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
    elif filename_lower.endswith(".docx"):
        doc = docx.Document(BytesIO(file_bytes))
        for paragraph in doc.paragraphs:
            if paragraph.text:
                text += paragraph.text + "\n"
    else:
        raise ValueError("Unsupported file format. Please upload a PDF or DOCX file.")
        
    return text.strip()
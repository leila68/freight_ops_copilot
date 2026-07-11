"""
Document management endpoints — staff only.
- GET    /documents          list all documents
- POST   /documents          upload a new PDF
- DELETE /documents/{id}     delete a document and all its chunks
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User, Document, DocumentChunk
from app.schemas.documents import DocumentResponse
from app.api.auth import get_current_user
from app.api.freight import require_staff
from app.services.embeddings import extract_text_from_pdf, chunk_text, embed_texts

router = APIRouter(prefix="/documents", tags=["documents"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def _process_document(document_id: uuid.UUID, file_bytes: bytes, db: Session):
    """
    Background task: extract text, chunk, embed, and save to DB.
    Runs after the upload endpoint returns so the user isn't waiting.
    """
    try:
        text = extract_text_from_pdf(file_bytes)
        if not text:
            return

        chunks = chunk_text(text)
        if not chunks:
            return

        vectors = embed_texts(chunks)

        for i, (chunk_text_content, vector) in enumerate(zip(chunks, vectors)):
            chunk = DocumentChunk(
                document_id=document_id,
                chunk_index=i,
                content=chunk_text_content,
                embedding=vector,
            )
            db.add(chunk)

        # Update chunk count on parent document
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.chunk_count = len(chunks)

        db.commit()
    except Exception as e:
        print(f"Error processing document {document_id}: {e}")
        db.rollback()


@router.get("", response_model=list[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    return db.query(Document).order_by(Document.created_at.desc()).all()


@router.post("", response_model=DocumentResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    # Validate file type
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_bytes = await file.read()

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Save document metadata immediately
    doc = Document(
        title=title,
        filename=file.filename,
        file_size=len(file_bytes),
        mime_type="application/pdf",
        uploaded_by=current_user.id,
        chunk_count=0,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # # Process embedding in background so upload returns fast
    # background_tasks.add_task(_process_document, doc.id, file_bytes, db)
    
     # Process document immediately
    _process_document(doc.id, file_bytes, db)

    db.refresh(doc)

    return doc


@router.delete("/{document_id}", status_code=204)
def delete_document(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Chunks are deleted automatically via CASCADE
    db.delete(doc)
    db.commit()
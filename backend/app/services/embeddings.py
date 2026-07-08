"""
Embedding and chunking service.
Uses OpenAI text-embedding-3-small via LangChain.
Chunks PDFs semantically using LangChain's semantic text splitter.
"""
import fitz  # PyMuPDF
from langchain_openai import OpenAIEmbeddings
from langchain_experimental.text_splitter import SemanticChunker

from app.core.config import settings


# Single shared embeddings instance
embeddings_model = OpenAIEmbeddings(
    model="text-embedding-3-small",
    openai_api_key=settings.OPENAI_API_KEY,
)


# Single shared semantic splitter
semantic_splitter = SemanticChunker(
    embeddings_model,
    breakpoint_threshold_type="percentile",
    breakpoint_threshold_amount=85,
)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract all text from a PDF file."""
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""

    for page in doc:
        text += page.get_text()

    doc.close()
    return text.strip()


def chunk_text(text: str) -> list[str]:
    """
    Split text into semantic chunks using LangChain's SemanticChunker.
    Falls back to returning short text directly.
    """
    if len(text) < 200:
        return [text] if text else []

    docs = semantic_splitter.create_documents([text])

    return [
        doc.page_content
        for doc in docs
        if doc.page_content.strip()
    ]


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a list of text chunks, returns list of 1536-dim vectors."""
    return embeddings_model.embed_documents(texts)


def embed_query(query: str) -> list[float]:
    """Embed a single query string for similarity search."""
    return embeddings_model.embed_query(query)
from langchain_openai import ChatOpenAI
from app.core.config import settings

llm = ChatOpenAI(
    model=settings.OPENAI_LLM_MODEL,
    openai_api_key=settings.OPENAI_API_KEY,
    temperature=0,
)
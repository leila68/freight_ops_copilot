"""
LangGraph agent for the Freight Ops Copilot.

Graph structure:
    START -> agent -> tools -> agent -> ... -> END

The agent node calls the LLM with bound tools.
If the LLM decides to call a tool, we go to the tools node.
If the LLM returns a final answer, we go to END.
This loop continues until the LLM is satisfied.
"""
from typing import Annotated
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, SystemMessage
from typing_extensions import TypedDict
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import User
from app.ai.tools import make_sql_tools, make_rag_tool, make_pricing_tools, make_quote_creation_tools
from app.ai.prompts import build_system_prompt


class AgentState(TypedDict):
    """State that flows through the graph at each step."""
    messages: Annotated[list[BaseMessage], add_messages]


def build_agent(db: Session, current_user: User):
    """
    Build and compile a LangGraph agent for the given user and DB session.
    Called once per request — each request gets its own agent instance
    so the DB session and user context are correctly scoped.
    """

    # 1. Build tools list
    sql_tools = make_sql_tools(db, current_user)
    rag_tool = make_rag_tool(db)
    pricing_tools = make_pricing_tools(db)
    all_tools = sql_tools + rag_tool + pricing_tools
    if current_user.role == "customer":
        all_tools += make_quote_creation_tools(db, current_user)
    

    # 2. Initialize LLM with tools bound
    llm = ChatOpenAI(
        model=settings.OPENAI_LLM_MODEL,
        openai_api_key=settings.OPENAI_API_KEY,
        temperature=0,  # deterministic for operational queries
    )
    llm_with_tools = llm.bind_tools(all_tools)

    # 3. System prompt (role-aware)
    system_prompt = build_system_prompt(
        user_role=current_user.role,
        user_name=current_user.full_name,
    )

    # 4. Agent node — calls LLM, decides whether to use a tool or respond
    def agent_node(state: AgentState) -> AgentState:
        messages = [SystemMessage(content=system_prompt)] + state["messages"]
        response = llm_with_tools.invoke(messages)
        return {"messages": [response]}

    # 5. Routing — if LLM called a tool, go to tool executor; else end
    def should_continue(state: AgentState) -> str:
        last_message = state["messages"][-1]
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            return "tools"
        return END

    # 6. Tool executor node — runs whichever tool the LLM chose
    tool_node = ToolNode(all_tools)

    # 7. Build the graph
    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)

    graph.set_entry_point("agent")
    graph.add_conditional_edges("agent", should_continue)
    graph.add_edge("tools", "agent")  # after tool runs, go back to agent

    return graph.compile()


async def run_agent(
    message: str,
    history: list[dict],
    db: Session,
    current_user: User,
) -> str:
    """
    Run the agent with a user message and conversation history.
    Returns the final text response.

    Args:
        message: The user's current message
        history: List of previous messages [{"role": "user"|"assistant", "content": "..."}]
        db: SQLAlchemy session
        current_user: The authenticated user
    """
    from langchain_core.messages import HumanMessage, AIMessage

    # Convert history to LangChain message format
    lc_messages: list[BaseMessage] = []
    for msg in history:
        if msg["role"] == "user":
            lc_messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            lc_messages.append(AIMessage(content=msg["content"]))

    # Add the current user message
    lc_messages.append(HumanMessage(content=message))

    # Build and run the agent
    agent = build_agent(db, current_user)
    result = await agent.ainvoke({"messages": lc_messages})

    # Extract the final text response
    final_message = result["messages"][-1]
    return final_message.content
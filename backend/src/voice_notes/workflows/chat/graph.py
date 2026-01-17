"""Voice Notes Chat Workflow Graph."""

from langchain_core.messages import BaseMessage
from langgraph.graph import StateGraph

from voice_notes.workflows.chat.state import ChatWorkflowState


def execute_chat_workflow(messages_history: list[BaseMessage]):
    """Invoke chat workflow graph."""
    graph = StateGraph(ChatWorkflowState)

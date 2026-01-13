"""Main entry point for the VoiceNotes Streamlit application."""

from pathlib import Path

import streamlit as st

from voice_notes.repositories.content import ContentRepository
from voice_notes.repositories.notes import NotesRepository
from voice_notes.services.database import create_tables

st.set_page_config(layout="wide")

create_tables()

if "notes_repo" not in st.session_state:
    st.session_state.notes_repo = NotesRepository()
    st.session_state.content_repo = ContentRepository()

pages = [
    st.Page(
        Path("pages/notes.py"), title="Notes"
    ),  # Both Voice Notes and Meetings (computer audio) Notes
    st.Page(
        Path("pages/content.py"), title="Content"
    ),  # Select Notes and create: meeting report, to-do list, translate, blog post, email, summary, custom prompt
    st.Page(
        Path("pages/chat.py"), title="Notes AI"
    ),  # Ask AI questions based on all notes
]

nav = st.navigation(pages, position="top")

nav.run()

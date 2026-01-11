"""Main entry point for the VoiceNotes Streamlit application."""

from pathlib import Path

import streamlit as st

st.set_page_config(layout="wide")

pages = [
    st.Page(
        Path("pages/notes.py"), title="Notes"
    ),  # Both Voice Notes and Meetings (computer audio) Notes
    st.Page(
        Path("pages/content.py"), title="Content"
    ),  # Select Notes and create: meeting report, to-do list, translate, blog post, email, summary, custom prompt
    st.Page(Path("pages/ai.py"), title="AI"),  # Ask AI questions based on all notes
]

nav = st.navigation(pages, position="top")

nav.run()

"""Streamlit page for Speech-To-Text Notes functionality."""

from time import sleep

import streamlit as st

from voice_notes.models.voice_note import VoiceNote
from voice_notes.repositories.notes import NotesRepository

notes_repo: NotesRepository = st.session_state.notes_repo

with st.container(border=True):
    st.header("Create Voice Notes")
    st.write("Record and transcribe your voice notes directly in the app.")
    with st.container(border=True):
        if audio := st.audio_input(label="Create new note"):
            title: str = st.text_input(
                "Enter a title for your voice note",
                value=f"Voice Note {len(st.session_state.get('voice_notes', [])) + 1}",
            )

            with st.spinner("Transcribing audio..."):
                # Simulate transcription process
                sleep(2)
                transcription: str = (
                    "This is a simulated transcription of the recorded audio."
                )
                with st.expander("Note Preview"):
                    st.markdown(transcription)

                repo: NotesRepository = st.session_state.notes_repo
                repo.create(
                    VoiceNote(
                        title=title,
                        transcription=transcription,
                        tags=[],
                    )
                )

st.divider()

with st.container(border=True):
    st.header("Your voice notes")

    repo: NotesRepository = st.session_state.notes_repo
    notes: list[VoiceNote] = repo.get_all()
    if not notes:
        st.info("No voice notes available. Please record a voice note above.")
        st.stop()

    for note in notes:
        with st.expander(note.title):
            st.markdown(note.transcription)

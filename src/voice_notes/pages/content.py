"""Streamlit page for Content generation for notes."""

import streamlit as st

from voice_notes.models.content import CONTENT_TYPES, Content
from voice_notes.models.schemas.content import ContentUpdate
from voice_notes.models.voice_note import VoiceNote
from voice_notes.repositories.content import ContentRepository
from voice_notes.repositories.notes import NotesRepository

content_repo: ContentRepository = st.session_state.content_repo
notes_repo: NotesRepository = st.session_state.notes_repo


@st.dialog("Edit Content", width="large")
def show_content_modal(idx: int, content: Content) -> None:
    """Display and edit content details in a modal dialog."""
    title: str = st.text_input("Title", value=content.title)

    content_type: str = st.selectbox(
        "Content Type",
        options=CONTENT_TYPES,
        index=CONTENT_TYPES.index(content.content_type),
    )

    body: str = st.text_area("Content", value=content.body, height=300)

    if st.button("Save Changes"):
        update_data: ContentUpdate = ContentUpdate(
            title=title, content_type=content_type, body=body
        )
        content_repo.update(content.id, update_data)
        st.success("Content updated successfully!")


with st.container(border=True):
    st.header("Create Content from Voice Notes")
    st.write(
        "Select a voice note and generate content such as meeting reports, to-do lists, translations, blog posts, emails, summaries, or custom prompts."
    )

    notes: list[VoiceNote] = notes_repo.get_all()
    if not notes:
        st.info(
            "No voice notes available. Please record a voice note in the Notes page."
        )
        st.stop()

    selected_note: VoiceNote = st.selectbox(
        "Select a voice note to generate content from",
        options=notes,
        format_func=lambda note: note.title + f" ({note.created_at})",
    )

    content_type: str = st.selectbox(
        "Select content type to generate",
        options=CONTENT_TYPES,
    )

    if content_type == "Custom Prompt":
        custom_prompt: str = st.text_area("Enter your custom prompt")

    if st.button("Generate Content"):
        with st.spinner("Generating content..."):
            # Simulate content generation process
            generated_content: str = f"Generated {content_type} based on the note titled '{selected_note.title}'."

            content_repo.create(
                Content(
                    note_id=selected_note.id,
                    title=selected_note.title,
                    content_type=content_type,
                    body=generated_content,
                )
            )

            st.success("Content generated successfully!")
            st.rerun()


with st.container(border=True):
    st.header("Generated Content")

    contents: list[Content] = content_repo.get_all()
    if not contents:
        st.info("No generated content available.")
        st.stop()

    for idx, content in enumerate(contents):
        if st.button(
            f"View: {content.content_type} - {content.title}",
            key=f"btn_{idx}",
            use_container_width=True,
        ):
            show_content_modal(idx, content)

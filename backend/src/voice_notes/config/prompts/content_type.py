"""Content type prompt templates for content generation."""

CONTENT_TYPE_PROMPTS: dict[str, str] = {
    "Meeting Report": (
        "Create a professional meeting report based on the following voice note transcriptions. "
        "Include key discussion points, decisions made, and action items. "
        "Use clear headings and bullet points."
    ),
    "To-Do List": (
        "Extract all actionable tasks and to-do items from the following voice note transcriptions. "
        "Organize them by priority or category. Use checkbox-style formatting."
    ),
    "Translate": (
        "Translate the following voice note transcriptions into clear, professional English. "
        "Preserve the original meaning and tone."
    ),
    "Blog Post": (
        "Transform the following voice note transcriptions into an engaging blog post. "
        "Add an introduction, structure the content with headings, and include a conclusion."
    ),
    "Email": (
        "Draft a professional email based on the following voice note transcriptions. "
        "Include a clear subject line suggestion, greeting, body, and sign-off."
    ),
    "Summary": (
        "Create a concise summary of the following voice note transcriptions. "
        "Capture the key points and main ideas in a clear, structured format."
    ),
    "Custom Prompt": (
        "Process the following voice note transcriptions and create well-structured content "
        "based on the information provided."
    ),
}

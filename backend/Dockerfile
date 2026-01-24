FROM python:3.13-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

ENV UV_NO_DEV=1

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project

COPY src ./src
RUN uv sync --frozen

EXPOSE 8080

CMD ["uv", "run", "uvicorn", "voice_notes.main:app", "--host", "0.0.0.0", "--port", "8080"]
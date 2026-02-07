.PHONY: install dev backend frontend help db-up db-down db-logs

# Color output
BLUE := \033[0;34m
GREEN := \033[0;32m
NC := \033[0m # No Color

help:
	@echo "$(BLUE)VoiceNotes$(NC)"
	@echo ""
	@echo "$(GREEN)make install$(NC)      Install dependencies"
	@echo "$(GREEN)make dev$(NC)           Run backend + frontend"
	@echo "$(GREEN)make backend$(NC)       Run backend only"
	@echo "$(GREEN)make frontend$(NC)      Run frontend only"
	@echo ""
	@echo "$(GREEN)make db-up$(NC)         Start PostgreSQL"
	@echo "$(GREEN)make db-down$(NC)       Stop PostgreSQL"
	@echo "$(GREEN)make db-logs$(NC)       View database logs"

install:
	cd backend && uv sync
	cd frontend && bun install

backend:
	cd backend && uv run uvicorn voice_notes.main:app --reload

frontend:
	cd frontend && bun run dev

dev:
	cd backend && uv run uvicorn voice_notes.main:app --reload & \
	cd frontend && bun run dev & \
	wait

db-up:
	docker compose up -d db

db-down:
	docker compose down

db-logs:
	docker compose logs -f db

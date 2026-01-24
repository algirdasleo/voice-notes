.PHONY: install dev backend frontend help

# Color output
BLUE := \033[0;34m
GREEN := \033[0;32m
NC := \033[0m # No Color

help:
	@echo "$(BLUE)VoiceNotes Development Commands$(NC)"
	@echo ""
	@echo "$(GREEN)install$(NC)               Install all dependencies (backend and frontend)"
	@echo "$(GREEN)backend$(NC)               Run backend server only (http://localhost:8000)"
	@echo "$(GREEN)frontend$(NC)              Run frontend dev server only (http://localhost:5173)"
	@echo "$(GREEN)dev$(NC)                   Run both backend and frontend"

install:
	@echo "$(BLUE)Installing backend dependencies...$(NC)"
	cd backend && uv sync
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	cd frontend && npm install
	@echo "$(GREEN)✓ All dependencies installed$(NC)"

backend:
	@echo "$(BLUE)Starting backend server...$(NC)"
	cd backend && uv run uvicorn voice_notes.main:app --reload

frontend:
	@echo "$(BLUE)Starting frontend dev server...$(NC)"
	cd frontend && npm run dev

dev:
	@echo "$(BLUE)Starting both backend and frontend...$(NC)"
	@echo "$(GREEN)Backend: http://localhost:8000$(NC)"
	@echo "$(GREEN)Frontend: http://localhost:5173$(NC)"
	@echo ""
	@echo "$(BLUE)Press Ctrl+C to stop both servers$(NC)"
	@echo ""
	cd backend && uv run uvicorn voice_notes.main:app --reload & \
	cd frontend && npm run dev & \
	wait


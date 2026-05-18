.PHONY: up seed test

up:
	docker compose up --build -d
	@echo "Waiting for backend to be ready..."
	@until curl -sf http://localhost:8000/health > /dev/null; do sleep 1; done
	@echo "Stack is up. Frontend: http://localhost:5173  API: http://localhost:8000"

seed:
	docker compose exec backend python -m scripts.seed

test:
	docker compose exec backend pytest /app/tests -v

# Run locally (without Docker) — requires Postgres + Redis on localhost
dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

dev-migrate:
	cd backend && alembic upgrade head

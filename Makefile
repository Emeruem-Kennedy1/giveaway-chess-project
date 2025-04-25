.PHONY: dev prod build-dev build-prod down clean logs help test frontend-install backend-install install port-info

# Default target
help:
	@echo "Available commands:"
	@echo "  make install       - Install dependencies for both frontend and backend"
	@echo "  make dev           - Start development environment (Frontend: 3478, Backend: 5566)"
	@echo "  make prod          - Start production environment (Frontend: 8089, Backend: 7654)"
	@echo "  make build-dev     - Build development images"
	@echo "  make build-prod    - Build production images"
	@echo "  make down          - Stop all containers"
	@echo "  make clean         - Remove all containers, images, and volumes"
	@echo "  make logs          - View logs from all containers"
	@echo "  make test          - Run tests"
	@echo "  make port-info     - Display port usage information"
	@echo "  make frontend-shell - Access shell in frontend container"
	@echo "  make backend-shell  - Access shell in backend container"

# Install dependencies
install: frontend-install backend-install

# Install frontend dependencies
frontend-install:
	cd giveaway-chess && npm install

# Install backend dependencies
backend-install:
	cd backend && pip install -r requirements.txt

# Development environment
dev: build-dev
	@echo "Starting development environment..."
	@echo "Frontend will be available at: http://localhost:3478"
	@echo "Backend will be available at: http://localhost:5566"
	docker-compose -f docker-compose.dev.yml up

# Production environment
prod: build-prod
	@echo "Starting production environment..."
	@echo "Application will be available at: http://localhost:8089"
	docker-compose -f docker-compose.prod.yml up -d
	@echo "Containers started in detached mode. Use 'make logs' to view logs."

# Build development images
build-dev:
	docker-compose -f docker-compose.dev.yml build

# Build production images
build-prod:
	docker-compose -f docker-compose.prod.yml build

# Stop containers
down:
	docker-compose -f docker-compose.dev.yml down || true
	docker-compose -f docker-compose.prod.yml down || true

# Clean up
clean: down
	docker system prune -af
	docker volume prune -f

# View logs
logs:
	@if [ -n "$$(docker-compose -f docker-compose.dev.yml ps -q 2>/dev/null)" ]; then \
		docker-compose -f docker-compose.dev.yml logs -f; \
	elif [ -n "$$(docker-compose -f docker-compose.prod.yml ps -q 2>/dev/null)" ]; then \
		docker-compose -f docker-compose.prod.yml logs -f; \
	else \
		echo "No running containers found."; \
	fi

# Display port information
port-info:
	@echo "Development Environment:"
	@echo "  Frontend: http://localhost:3478"
	@echo "  Backend API: http://localhost:5566"
	@echo ""
	@echo "Production Environment:"
	@echo "  Frontend: http://localhost:8089"
	@echo "  Backend API: http://localhost:7654"

# Run tests
test:
	cd backend && python -m pytest

# Development mode with detached containers
dev-detached: build-dev
	@echo "Starting development environment in detached mode..."
	@echo "Frontend will be available at: http://localhost:3478"
	@echo "Backend will be available at: http://localhost:5566"
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Containers started in detached mode. Use 'make logs' to view logs."

# Restart containers
restart:
	@if [ -n "$$(docker-compose -f docker-compose.dev.yml ps -q 2>/dev/null)" ]; then \
		docker-compose -f docker-compose.dev.yml restart; \
	elif [ -n "$$(docker-compose -f docker-compose.prod.yml ps -q 2>/dev/null)" ]; then \
		docker-compose -f docker-compose.prod.yml restart; \
	else \
		echo "No running containers found."; \
	fi

# Shell into frontend container
frontend-shell:
	@if [ -n "$$(docker-compose -f docker-compose.dev.yml ps -q frontend 2>/dev/null)" ]; then \
		docker-compose -f docker-compose.dev.yml exec frontend /bin/sh; \
	elif [ -n "$$(docker-compose -f docker-compose.prod.yml ps -q frontend 2>/dev/null)" ]; then \
		docker-compose -f docker-compose.prod.yml exec frontend /bin/sh; \
	else \
		echo "Frontend container is not running."; \
	fi

# Shell into backend container
backend-shell:
	@if [ -n "$$(docker-compose -f docker-compose.dev.yml ps -q backend 2>/dev/null)" ]; then \
		docker-compose -f docker-compose.dev.yml exec backend /bin/bash; \
	elif [ -n "$$(docker-compose -f docker-compose.prod.yml ps -q backend 2>/dev/null)" ]; then \
		docker-compose -f docker-compose.prod.yml exec backend /bin/bash; \
	else \
		echo "Backend container is not running."; \
	fi
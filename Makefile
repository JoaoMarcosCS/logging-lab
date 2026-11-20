SHELL := /bin/bash
.SHELLFLAGS := -o pipefail -c

NODE := cd backend && source $${NVM_DIR:-$$HOME/.nvm}/nvm.sh >/dev/null && nvm use >/dev/null &&
COMPOSE := docker compose --env-file backend/.env

.PHONY: up infra migrate seed api logs down db-reset migration-generate migration-revert

up: api
	$(NODE) pnpm seed
	@$(MAKE) --no-print-directory logs

infra:
	$(COMPOSE) up -d --wait postgres redis

migrate: infra
	$(NODE) pnpm migration:run

seed: migrate
	$(NODE) pnpm seed

api: infra
	$(COMPOSE) up -d --build --wait api

logs:
	$(COMPOSE) logs -f api

down:
	$(COMPOSE) down

db-reset:
	$(COMPOSE) down -v
	@$(MAKE) --no-print-directory seed

migration-generate: infra
	@test -n "$(name)" || (echo "Uso: make migration-generate name=NomeDaMigration" && exit 1)
	$(NODE) pnpm migration:generate src/infra/database/migrations/$(name)

migration-revert: infra
	$(NODE) pnpm migration:revert

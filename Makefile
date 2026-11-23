SHELL := /bin/bash
.SHELLFLAGS := -o pipefail -c

NODE := cd backend && source $${NVM_DIR:-$$HOME/.nvm}/nvm.sh >/dev/null && nvm use >/dev/null &&
FRONT := cd frontend && source $${NVM_DIR:-$$HOME/.nvm}/nvm.sh >/dev/null && nvm use >/dev/null &&
COMPOSE := docker compose --env-file backend/.env
# Mesmo projeto compose, com os serviços do profile "logging" (infra/docker-compose.yml) habilitados.
LOGGING := $(COMPOSE) --profile logging
# Nome do projeto compose: o nome da pasta da raiz. Prefixa os volumes (<projeto>_elasticsearch-data).
PROJECT := $(notdir $(CURDIR))

.PHONY: dev front up infra migrate seed api logs down db-reset migration-generate migration-revert \
	logging-up logging-down logging-reset logging-logs

dev: api
	$(NODE) pnpm seed
	@$(MAKE) --no-print-directory front

front:
	@test -f frontend/.env.local || cp frontend/.env.example frontend/.env.local
	@test -d frontend/node_modules || ($(FRONT) pnpm install)
	$(FRONT) pnpm dev

up: api
	$(NODE) pnpm seed
	@$(MAKE) --no-print-directory logs

# O docker-compose.yml inclui infra/docker-compose.yml, que lê infra/.env. Sem o arquivo,
# todo comando do compose (até make infra) reclamaria das variáveis da stack de logs.
# Esta regra cria o infra/.env a partir do exemplo só quando ele ainda não existe.
infra/.env:
	cp infra/.env.example infra/.env

infra: infra/.env
	$(COMPOSE) up -d --wait postgres redis

migrate: infra
	$(NODE) pnpm migration:run

seed: migrate
	$(NODE) pnpm seed

api: infra
	$(COMPOSE) up -d --build --wait api

logs: infra/.env
	$(COMPOSE) logs -f api

# --profile logging: sem ele, o down deixaria de fora os containers da stack de logs.
down: infra/.env
	$(LOGGING) down

db-reset: infra/.env
	$(COMPOSE) down -v
	@$(MAKE) --no-print-directory seed

migration-generate: infra
	@test -n "$(name)" || (echo "Uso: make migration-generate name=NomeDaMigration" && exit 1)
	$(NODE) pnpm migration:generate src/infra/database/migrations/$(name)

migration-revert: infra
	$(NODE) pnpm migration:revert

# Sobe Elasticsearch, Kibana e Fluent Bit. O --wait espera os healthchecks; os containers de
# setup (elasticsearch-setup e kibana-setup) rodam uma vez como dependência e terminam.
logging-up: infra/.env
	$(LOGGING) up -d --wait elasticsearch kibana fluent-bit
	$(LOGGING) up --no-deps kibana-setup
	@echo "Kibana: http://127.0.0.1:5601 (usuário e senha em infra/.env)"

# Para a stack de logs e mantém os dados (índices e estado do Fluent Bit).
logging-down: infra/.env
	$(LOGGING) stop elasticsearch elasticsearch-setup kibana kibana-setup fluent-bit
	$(LOGGING) rm -f elasticsearch elasticsearch-setup kibana kibana-setup fluent-bit

# Para a stack de logs e apaga os volumes dela: todos os logs guardados e o estado do Fluent Bit.
logging-reset: logging-down
	docker volume rm -f $(PROJECT)_elasticsearch-data $(PROJECT)_kibana-data $(PROJECT)_fluent-bit-state

# Acompanha os logs do Fluent Bit (útil para ver documentos recusados pelo Elasticsearch).
logging-logs: infra/.env
	$(LOGGING) logs -f fluent-bit

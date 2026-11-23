#!/bin/sh
# Configuração inicial do Kibana. Roda no container kibana-setup, depois que o Kibana fica saudável.
# Cria (ou sobrescreve) a data view dos logs da API e a define como padrão.

set -eu

KB="${KIBANA_URL}"

log() { echo "[kibana-setup] $*"; }

# Chamada autenticada à API do Kibana. O header kbn-xsrf é obrigatório em requisições que
# alteram estado (proteção contra CSRF); o valor não importa.
kb() {
  method="$1"
  path="$2"
  shift 2
  curl -sS --fail-with-body -u "elastic:${ELASTIC_PASSWORD}" \
    -X "$method" -H 'kbn-xsrf: setup' -H 'Content-Type: application/json' \
    "${KB}${path}" "$@"
  echo
}

# Data view: diz ao Kibana quais índices consultar e qual campo é o tempo.
# id fixo permite referenciar a data view em links e dashboards.
# title: padrão de índices (aqui, os data streams logs-task-flow-*).
# timeFieldName: campo usado pelo seletor de período (últimos 15 minutos etc.).
# override: true sobrescreve se já existir, o que torna o script idempotente.
log "data view task-flow-api"
kb POST /api/data_views/data_view --data '{
  "override": true,
  "data_view": {
    "id": "task-flow-api",
    "name": "task-flow-api",
    "title": "logs-task-flow-*",
    "timeFieldName": "@timestamp"
  }
}' >/dev/null

# Data view padrão: é a que abre no Discover sem precisar escolher.
log "data view padrão"
kb POST /api/data_views/default --data '{ "data_view_id": "task-flow-api", "force": true }' >/dev/null

log "pronto"

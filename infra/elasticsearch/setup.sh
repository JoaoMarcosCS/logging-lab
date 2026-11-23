#!/bin/sh
# Configuração inicial do Elasticsearch. Roda no container elasticsearch-setup a cada make logging-up.
# Todas as chamadas são PUT ou POST de "definir valor", então rodar de novo não duplica nada:
# só reaplica o que está nos arquivos (útil depois de editar o template ou a política).
# A imagem curlimages/curl não tem bash nem jq; o script usa só sh e curl.

# -e: para no primeiro erro. -u: erro ao usar variável não definida.
set -eu

ES="${ELASTICSEARCH_URL}"

log() { echo "[elasticsearch-setup] $*"; }

# Chamada autenticada como "elastic". --fail-with-body faz o curl sair com erro em respostas
# 4xx/5xx e ainda mostrar o corpo, que traz o motivo da recusa.
# Content-Type application/yaml: o Elasticsearch aceita YAML no corpo, o que permite manter
# os arquivos comentados.
es() {
  method="$1"
  path="$2"
  content_type="$3"
  shift 3
  curl -sS --fail-with-body -u "elastic:${ELASTIC_PASSWORD}" \
    -X "$method" -H "Content-Type: ${content_type}" \
    "${ES}${path}" "$@"
  echo
}

# Monta um JSON simples de usuário. As senhas são interpoladas direto, então não podem conter aspas.
user_json() {
  printf '{"password":"%s","roles":["%s"],"full_name":"%s"}' "$1" "$2" "$3"
}

log "senha do kibana_system (usuário interno com que o Kibana se conecta)"
es POST /_security/user/kibana_system/_password application/json \
  --data "$(printf '{"password":"%s"}' "$KIBANA_SYSTEM_PASSWORD")" >/dev/null

log "usuário ${KIBANA_USER} (login no Kibana, papel superuser)"
es PUT "/_security/user/${KIBANA_USER}" application/json \
  --data "$(user_json "$KIBANA_USER_PASSWORD" superuser "Usuário de estudo")" >/dev/null

# Papel de menor privilégio para o coletor: só cria documentos nos data streams da API.
# create_doc: só inserir (não altera nem apaga). auto_configure: cria o data stream
# na primeira escrita, aplicando o index template.
log "papel e usuário fluent-bit (só escreve em logs-task-flow-*)"
es PUT /_security/role/fluent-bit-writer application/json --data '{
  "indices": [
    { "names": ["logs-task-flow-*"], "privileges": ["create_doc", "auto_configure"] }
  ]
}' >/dev/null
es PUT /_security/user/fluent-bit application/json \
  --data "$(user_json "$FLUENT_BIT_PASSWORD" fluent-bit-writer "Coletor Fluent Bit")" >/dev/null

# A política precisa existir antes do template, que a referencia por nome.
log "política de ciclo de vida task-flow-logs (rollover diário, apaga após 7 dias)"
es PUT /_ilm/policy/task-flow-logs application/yaml --data-binary @/setup/ilm-policy.yaml >/dev/null

log "index template task-flow-logs (mapeamento explícito de logs-task-flow-*)"
es PUT /_index_template/task-flow-logs application/yaml --data-binary @/setup/index-template.yaml >/dev/null

log "pronto"

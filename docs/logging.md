# Logging estruturado com Fluent Bit, Elasticsearch e Kibana

Guia de estudo da stack de logs deste projeto. Cobre como subir e usar, como cada peça funciona e por que as escolhas foram feitas.

## Sumário

1. [Arquitetura](#arquitetura)
2. [Como subir](#como-subir)
3. [Arquivos](#arquivos)
4. [O que a API registra](#o-que-a-api-registra)
5. [Fluent Bit](#fluent-bit)
6. [Elasticsearch](#elasticsearch)
7. [Kibana](#kibana)
8. [Consultas](#consultas)
9. [Exercícios](#exercícios)
10. [Perguntas frequentes](#perguntas-frequentes)
11. [Solução de problemas](#solução-de-problemas)

## Arquitetura

```
API (NestJS + pino)
  | escreve uma linha JSON por evento no stdout
  v
Docker (driver json-file)
  | grava em /var/lib/docker/containers/<id>/<id>-json.log, com rotação (3 x 10 MB)
  v
Fluent Bit
  | lê os arquivos, fica só com o serviço "api", interpreta o JSON e ajusta os nomes dos campos
  v
Elasticsearch
  | guarda no data stream logs-task-flow-local, com mapeamento explícito e retenção de 7 dias
  v
Kibana
  | busca (Discover), gráficos (Lens), dashboards e alertas
```

A API não sabe que o Elasticsearch existe. Ela só escreve no stdout, e o resto é infraestrutura. Trocar o Elasticsearch por outra ferramenta, ou desligar a coleta, não exige mudar nem fazer deploy da API.

| Serviço | Endereço | Acesso |
| --- | --- | --- |
| Kibana | http://127.0.0.1:5601 | usuário `teste`, senha `#Demo2026` |
| Elasticsearch | http://127.0.0.1:9200 | os mesmos usuários (API REST) |
| Fluent Bit | http://127.0.0.1:2020/api/v1/metrics | sem login |

Consumo aproximado: 2,5 a 3 GB de RAM.

## Como subir

```bash
make api          # API, Postgres e Redis (se ainda não estiverem de pé)
make logging-up   # Elasticsearch, Kibana e Fluent Bit
```

O `make logging-up`:

1. cria `infra/.env` a partir de `infra/.env.example`, se ainda não existir;
2. sobe o Elasticsearch e espera o healthcheck;
3. roda o `elasticsearch-setup`, que cria usuários, papel, política de retenção e template;
4. sobe o Kibana e o Fluent Bit;
5. roda o `kibana-setup`, que cria a data view.

Na primeira vez leva de 1 a 2 minutos. Depois, abra o Kibana, faça login e vá em Discover.

| Comando | O que faz |
| --- | --- |
| `make logging-up` | sobe a stack de logs e reaplica a configuração |
| `make logging-down` | para a stack de logs e mantém os dados |
| `make logging-reset` | para a stack e apaga todos os logs guardados |
| `make logging-logs` | acompanha os logs do Fluent Bit |
| `make down` | para tudo, inclusive a stack de logs |

Os serviços de logs estão no profile `logging`. Por isso `make infra`, `make api` e `make up` continuam subindo só API, Postgres e Redis.

## Arquivos

```
infra/
├─ docker-compose.yml           serviços da stack de logs (profile logging)
├─ .env.example                 senhas e portas; copiado para infra/.env (fora do git)
├─ fluent-bit/fluent-bit.yaml   entrada, filtros e saída do coletor
├─ elasticsearch/
│  ├─ setup.sh                  usuários, papel, política e template
│  ├─ ilm-policy.yaml           retenção (rollover diário, apaga após 7 dias)
│  └─ index-template.yaml       mapeamento explícito dos campos
└─ kibana/setup.sh              data view
docker-compose.yml              inclui infra/docker-compose.yml; limita os logs de todos os containers
```

Todos os arquivos têm um comentário em cada propriedade explicando o que ela faz.

O `docker-compose.yml` da raiz usa `include` para trazer o `infra/docker-compose.yml`. Tudo é um projeto só: mesma rede, mesmo `docker compose ps`. As variáveis do arquivo incluído vêm de `infra/.env`, e as da API continuam em `backend/.env`.

### Usuários

| Usuário | Papel | Para quê |
| --- | --- | --- |
| `elastic` | superusuário embutido | só o setup e o healthcheck usam |
| `teste` | `superuser` | o seu login no Kibana |
| `kibana_system` | embutido | conexão do Kibana com o Elasticsearch |
| `fluent-bit` | `fluent-bit-writer` | só pode criar documentos em `logs-task-flow-*` |

O Fluent Bit usa um usuário de menor privilégio. Se a senha dele vazar, quem a tiver consegue inserir logs, mas não consegue ler, alterar nem apagar nada. Experimente:

```bash
curl -u 'fluent-bit:#Demo2026' -X DELETE http://127.0.0.1:9200/logs-task-flow-local
# 403
```

### Rotação dos logs dos containers

Sem configuração, o driver `json-file` do Docker grava os logs sem limite. Numa API com tráfego, o arquivo cresce até encher o disco. Todos os serviços (API, Postgres, Redis, migrations e a própria stack de logs) usam:

```yaml
max-size: "10m"   # rotaciona ao chegar em 10 MB
max-file: "3"     # mantém 3 arquivos, no máximo 30 MB por container
```

O Fluent Bit acompanha a rotação: continua lendo o arquivo antigo por 30 s (`rotate_wait`) e passa para o novo.

## O que a API registra

Implementado nas fases 1 e 2 (`backend/src/infra/logger/`):

| Campo | Exemplo | Origem |
| --- | --- | --- |
| `@timestamp` | `2026-11-23T16:25:22.101Z` | `time` do pino |
| `message` | `request completed` | `msg` do pino |
| `log.level` | `warn` | `level` do pino |
| `service`, `env` | `task-flow-api`, `local` | campos fixos do pino |
| `context` | `LoginUseCase` | classe que gerou o log |
| `requestId` | `teste-123` | header `X-Request-Id` ou gerado |
| `userId`, `sessionId` | | `AuthGuard` (rotas autenticadas) |
| `method`, `path`, `route`, `statusCode`, `durationMs` | | access log |
| `errorMessage` | `Credenciais inválidas` | erros 4xx |
| `err.type`, `err.message`, `err.stack`, `err.code` | | erros 5xx e falhas de infraestrutura |
| `event`, `reason` | `auth.login.failed`, `invalid_password` | eventos de domínio |
| `container.name`, `log.stream` | `logging-api-1`, `stdout` | Docker, via Fluent Bit |

Exemplo real de um login com senha errada, como fica guardado no Elasticsearch:

```json
{
  "@timestamp": "2026-11-23T16:25:22.096Z",
  "log.level": "warn",
  "message": "login failed",
  "service": "task-flow-api",
  "env": "local",
  "context": "LoginUseCase",
  "event": "auth.login.failed",
  "reason": "invalid_password",
  "userId": "019c21fe-6a15-7158-902d-42568866035a",
  "requestId": "teste-123",
  "container": { "name": "logging-api-1" },
  "log.stream": "stdout"
}
```

## Fluent Bit

Arquivo: `infra/fluent-bit/fluent-bit.yaml`.

Um coletor recebe ou lê os logs e os entrega a um ou mais destinos. Ele fica entre a aplicação e o backend de logs para que a aplicação não precise saber para onde os logs vão, nem lidar com falhas de rede, retries e buffers.

### Como o Fluent Bit recebe os logs

Há duas formas de um coletor receber logs de containers:

| Forma | Como funciona | Quando usar |
| --- | --- | --- |
| Logging driver (push) | o Docker envia cada linha ao coletor (drivers `fluentd`, `gelf`) | quando não há acesso aos arquivos do host |
| Leitura de arquivos (pull) | o Docker grava em `json-file` e o coletor lê os arquivos | o padrão em Kubernetes; nenhum serviço precisa mudar |

Este projeto usa a leitura de arquivos:

- a API continua com o driver padrão, e `docker logs` funciona normalmente;
- se o Fluent Bit cair, os logs continuam nos arquivos e são lidos quando ele voltar;
- é o mesmo modelo do Kubernetes, em que um Fluent Bit por nó (DaemonSet) lê `/var/log/containers`.

### Pipeline

```
tail (arquivos do Docker)
  -> grep     fica só com attrs['com.docker.compose.service'] == api
  -> parser   transforma o texto do campo "log" (a linha do pino) em campos
  -> lua      container.name, remove campos do Docker, trata linhas que não são JSON
  -> modify   msg -> message, level -> log.level, stream -> log.stream
  -> es       envia ao data stream logs-task-flow-local
```

Cada linha do arquivo do Docker tem este formato:

```json
{"log":"{\"level\":\"warn\",\"msg\":\"login failed\",...}\n","stream":"stdout","attrs":{"com.docker.compose.service":"api","tag":"logging-api-1"},"time":"..."}
```

O JSON do pino está dentro do campo `log`, como texto. O `attrs` existe porque o `docker-compose.yml` configura as opções `tag` (nome do container) e `labels` (serviço do compose) no driver `json-file`.

### Garantias de entrega

| Mecanismo | O que protege |
| --- | --- |
| `db` (posição de leitura em SQLite) | num restart do Fluent Bit, continua de onde parou, sem duplicar nem pular linhas |
| `read_from_head: true` | as primeiras linhas de um container novo (o boot) não se perdem enquanto o arquivo não é descoberto |
| `storage.type: filesystem` | os registros lidos ficam em disco até o Elasticsearch aceitar |
| `retry_limit: false` | reenvia sem limite enquanto o Elasticsearch estiver fora |
| `rotate_wait: 30` | linhas escritas logo antes de uma rotação não se perdem |

Isso foi testado: com o Elasticsearch parado, 20 requisições foram feitas; quando ele voltou, as 20 apareceram, sem duplicatas.

### Métricas do Fluent Bit

```bash
curl -s http://127.0.0.1:2020/api/v1/metrics
```

Em `output.es.0`: `proc_records` (enviados), `retries` (tentativas repetidas), `errors` e `dropped_records` (descartados). `dropped_records` acima de zero indica perda de logs.

## Elasticsearch

### É um banco de dados?

É, mas não no sentido do Postgres. É um motor de busca e análise que guarda documentos JSON, classificado como banco NoSQL orientado a documentos.

| | Postgres | Elasticsearch |
| --- | --- | --- |
| Papel | fonte de verdade dos dados | encontrar e agregar dados rapidamente |
| Unidade | linhas em tabelas | documentos JSON em índices |
| Transações | sim (ACID) | não; cada documento é gravado sozinho |
| Joins | sim | praticamente não |
| Consistência | o dado está visível assim que o commit termina | quase em tempo real (cerca de 1 s) |
| Ponto forte | integridade e regras | busca por texto, filtros em qualquer campo, agregações em milhões de registros |

Para logs, que são escritos uma vez, nunca alterados e pesquisados de muitas formas, o Elasticsearch é adequado. Para boards e tasks, que precisam de transações e consistência imediata, não seria.

### Elasticsearch, Kibana, Prometheus e Grafana

| Ferramenta | Papel | Guarda dados? | Tipo de dado |
| --- | --- | --- | --- |
| Elasticsearch | armazenamento e busca | sim | eventos (documentos), aqui logs |
| Kibana | interface do Elasticsearch | não | lê do Elasticsearch |
| Prometheus | armazenamento de métricas | sim | séries temporais (números ao longo do tempo) |
| Grafana | dashboards de várias fontes | não | lê do Prometheus, Loki, Elasticsearch, Postgres... |

Log é um registro por evento, com todos os detalhes: quem, o quê, quanto tempo, qual erro. Métrica é um número agregado, sem detalhes individuais: requisições por segundo, p95 de latência. Logs respondem "o que aconteceu com esta requisição?"; métricas respondem "o sistema está saudável agora?". Métricas custam bem menos e são guardadas por meses; logs custam mais e são guardados por dias ou semanas.

### Como funciona por dentro

Estrutura:

- Cluster: um ou mais nós (processos Java). Aqui, um nó só.
- Índice: o equivalente a uma tabela. É dividido em shards.
- Shard: um índice completo do Lucene, a biblioteca que faz a indexação. Shards ficam em nós diferentes e são pesquisados em paralelo.
- Segmento: cada shard é formado por segmentos, arquivos imutáveis com seus próprios índices.

Caminho de uma escrita:

```
documento recebido
  -> buffer em memória + translog (registro em disco que evita perda numa queda)
  -> refresh (a cada 1 s): o buffer vira um segmento novo, pesquisável
  -> merge (em segundo plano): segmentos pequenos são fundidos em maiores
```

Por isso a busca é quase em tempo real: um documento aparece cerca de 1 s depois de gravado (`index.refresh_interval` no template).

Caminho de uma busca:

1. Fase query: o nó que recebeu a busca a envia a todos os shards. Cada um devolve só os ids e a ordenação dos melhores resultados.
2. Fase fetch: o nó junta, ordena e busca o documento completo só dos que vão ser exibidos.

### Índice invertido

Ao gravar um documento, cada campo `text` passa por um analisador:

```
"Credenciais inválidas para o usuário"
  -> tokenizer:  [Credenciais] [inválidas] [para] [o] [usuário]
  -> lowercase:  [credenciais] [inválidas] [para] [o] [usuário]
```

Cada termo vai para um dicionário que aponta para a lista dos documentos onde ele aparece (posting list):

```
termo           documentos
credenciais  -> [3, 17, 98, 1204]
inválidas    -> [3, 17, 98, 1204, 5530]
usuário      -> [3, 98, 771]
```

Buscar `credenciais AND usuário` é cruzar duas listas ordenadas, resultando em `[3, 98]`, sem ler nenhum documento.

Campos `keyword` não são analisados: o valor inteiro vira um único termo (`/api/v1/boards/:id`). Números e datas usam outra estrutura, a BKD tree, otimizada para intervalos (`statusCode >= 500`).

### Comparação com a B-tree do Postgres

| | B-tree (Postgres) | Índice invertido (Elasticsearch) |
| --- | --- | --- |
| Chave | o valor inteiro da coluna | cada termo do texto |
| Bom para | igualdade, intervalo, ordenação, prefixo (`LIKE 'abc%'`) | palavras em qualquer posição, combinação de campos |
| `LIKE '%inválidas%'` | não usa o índice; varre a tabela | busca direta pelo termo |
| Quem cria | você, coluna por coluna (`CREATE INDEX`) | todo campo mapeado é indexado |
| Alteração | atualiza a árvore no lugar | segmentos imutáveis; alterar é apagar e inserir de novo |

O Postgres também tem índice invertido: o GIN, usado em busca textual (`tsvector`) e em `jsonb`. No Elasticsearch, ele é a base de tudo.

### Por que é rápido

- Tudo já está indexado: responder é consultar estruturas prontas, não ler documentos.
- Segmentos imutáveis: não precisam de locks, o sistema operacional os mantém no cache de memória (page cache) e eles podem ser bem comprimidos.
- Posting lists ordenadas, comprimidas e com atalhos (skip lists) para cruzar listas sem percorrê-las inteiras.
- Filtros viram bitsets em cache. `statusCode: 500` repetido é respondido pelo cache, e filtros não calculam relevância.
- Doc values: uma cópia colunar de cada campo. Agregar `durationMs` lê só aquela coluna.
- Paralelismo entre shards, nós e núcleos.

O preço: mais disco (o índice ocupa espaço além do dado), escrita mais cara (análise, indexação e merges), alterar um documento é reescrevê-lo, não há transações nem joins, e um mapeamento mal feito degrada o cluster inteiro.

### Data stream

Arquivo: `infra/elasticsearch/index-template.yaml` (`data_stream: {}`).

Para logs, um índice único é ruim: cresce para sempre, e apagar os antigos é apagar documento por documento. Um data stream é um nome lógico que aponta para vários índices de apoio, criados automaticamente:

```
logs-task-flow-local  (você grava e pesquisa por este nome)
  ├─ .ds-logs-task-flow-local-2026.11.23-000001   (só leitura)
  ├─ .ds-logs-task-flow-local-2026.11.24-000002   (só leitura)
  └─ .ds-logs-task-flow-local-2026.11.25-000003   (recebe as escritas)
```

- Só aceita inserção (`op_type: create`), o que combina com log. Por isso o Fluent Bit usa `write_operation: create`.
- Exige o campo `@timestamp`.
- O nome segue a convenção `logs-<dataset>-<namespace>`: aqui o dataset é `task-flow` e o namespace é `local`. Outro ambiente usaria `logs-task-flow-production`.

### Ciclo de vida (ILM)

Arquivo: `infra/elasticsearch/ilm-policy.yaml`.

| Fase | Quando | Ação |
| --- | --- | --- |
| hot | ao criar o índice | recebe escritas; rollover após 1 dia ou 1 GB no shard primário |
| delete | 7 dias depois do rollover | apaga o índice inteiro |

Apagar um índice inteiro é instantâneo, por isso os logs são separados por dia. Veja o estado em Kibana, Stack Management, Index Lifecycle Policies, ou:

```bash
curl -s -u 'elastic:#Demo2026' 'http://127.0.0.1:9200/logs-task-flow-local/_ilm/explain?pretty'
```

### Mapeamento explícito

Arquivo: `infra/elasticsearch/index-template.yaml`.

O mapeamento é o schema: o tipo de cada campo.

- Dinâmico: o Elasticsearch adivinha o tipo pelo primeiro documento. Se o primeiro `statusCode` chegar como texto, o campo vira texto para sempre e `statusCode >= 500` deixa de funcionar. Campos com nomes variáveis criam milhares de mapeamentos (mapping explosion).
- Explícito: os tipos são declarados antes, no index template. É o que este projeto usa.

| Tipo | Campos | Para quê |
| --- | --- | --- |
| `keyword` | `requestId`, `userId`, `route`, `method`, `event`, `log.level`, `context` | filtro exato e agregação |
| `text` com subcampo `keyword` | `message`, `errorMessage`, `err.message` | busca por palavra e agregação |
| `text` | `err.stack` | só busca por palavra |
| `short`, `long` | `statusCode`, `durationMs` | intervalos, médias e percentis |
| `date` | `@timestamp` | intervalos de tempo e histogramas |

Duas configurações protegem o índice:

- `dynamic: false`: campos que não estão no template ficam no documento (`_source`), mas não são indexados. Um log com chaves inesperadas não cria campos novos.
- `index.mapping.ignore_malformed: true`: um valor com tipo errado não derruba o documento. O campo é ignorado na indexação e o nome dele vai para `_ignored`.

Teste feito na implementação: um documento com `"statusCode": "abc"` foi aceito, ficou com `_ignored: ["statusCode"]` e o valor `abc` continuou visível no `_source`.

Para tornar um campo novo pesquisável, adicione-o ao template e rode `make logging-up`. A mudança vale a partir do próximo índice (rollover). Para aplicar já:

```bash
curl -s -u 'elastic:#Demo2026' -X POST 'http://127.0.0.1:9200/logs-task-flow-local/_rollover'
```

## Kibana

### Data view

O `kibana-setup` cria a data view `task-flow-api`. Ela diz ao Kibana:

- quais índices consultar: `logs-task-flow-*`;
- qual campo é o tempo: `@timestamp`, o que alimenta o seletor de período ("últimos 15 minutos").

A data view não guarda dados: é só um ponteiro com metadados. Antes se chamava index pattern.

### Onde explorar

| Área | Caminho no menu | Para quê |
| --- | --- | --- |
| Discover | Analytics, Discover | buscar e ler os logs |
| Lens | Analytics, Visualize Library, Create, Lens | gráficos por arrastar e soltar |
| Dashboards | Analytics, Dashboards | juntar gráficos e buscas |
| Alertas | Stack Management, Rules | regras que disparam a partir de consultas |
| Index Management | Stack Management, Index Management, Data Streams | ver o data stream e os índices |
| Dev Tools | Management, Dev Tools | chamar a API do Elasticsearch direto |

## Consultas

### KQL

KQL (Kibana Query Language) é a linguagem da barra de busca do Discover. O Kibana a traduz para a Query DSL, o JSON que o Elasticsearch entende.

| Pergunta | KQL |
| --- | --- |
| Uma requisição inteira | `requestId : "teste-123"` |
| Tudo de um usuário | `userId : "019c21fe-6a15-7158-902d-42568866035a"` |
| Erros do servidor | `statusCode >= 500` |
| Erros e avisos | `log.level : (error or warn)` |
| Logins com senha errada | `event : "auth.login.failed" and reason : "invalid_password"` |
| Reuso de refresh token | `event : "auth.refresh.reuse_detected"` |
| Requisições lentas | `durationMs > 1000` |
| Uma rota, menos os sucessos | `route : "/api/v1/boards/:id" and not statusCode < 400` |
| Rotas que começam com boards | `route : /api/v1/boards*` |
| Erros do cache | `context : "RedisCacheProvider" and log.level : "error"` |
| Erros por código | `err.code : "ECONNREFUSED"` |
| Busca por palavra na stack | `err.stack : "TCPConnectWrap"` |
| Logs com campo existente | `userId : *` |
| Requisições para rotas inexistentes | `route : "*path"` |

Dicas:

- No Discover, clique num valor de `requestId` e em "Filter for value" para ver toda a requisição.
- Adicione colunas (`log.level`, `route`, `statusCode`, `durationMs`, `requestId`) para ler os logs como uma tabela.
- Rotas que não existem aparecem com `route: *path`, a rota coringa do Express 5 que responde 404.

### ES|QL

ES|QL é uma linguagem com pipes, parecida com SQL, para agregações. No Discover, troque o modo de busca para ES|QL, ou use Dev Tools com `POST /_query`.

```
FROM logs-task-flow-* | WHERE statusCode >= 400 | STATS total = COUNT(*) BY route, statusCode | SORT total DESC

FROM logs-task-flow-* | WHERE durationMs IS NOT NULL | STATS p95 = PERCENTILE(durationMs, 95), media = AVG(durationMs) BY route | SORT p95 DESC

FROM logs-task-flow-* | STATS total = COUNT(*) BY log.level

FROM logs-task-flow-* | WHERE event == "auth.login.failed" | STATS falhas = COUNT(*) BY userId, reason | SORT falhas DESC

FROM logs-task-flow-* | STATS erros = COUNT(*) BY minuto = BUCKET(@timestamp, 1 minute) | SORT minuto
```

### Pela API (curl)

```bash
curl -s -u 'teste:#Demo2026' 'http://127.0.0.1:9200/logs-task-flow-local/_search?q=requestId:teste-123&pretty'
curl -s -u 'teste:#Demo2026' 'http://127.0.0.1:9200/logs-task-flow-local/_count?q=log.level:error'
```

## Exercícios

Gere tráfego com o frontend (`make front`) ou com curl. O header `X-Request-Id` facilita achar as requisições:

```bash
curl -s -H 'X-Request-Id: exercicio-1' -H 'Content-Type: application/json' \
  -d '{"email":"teste@gmail.com","password":"errada"}' http://127.0.0.1:3000/api/v1/auth/login
```

### 1. Seguir uma requisição

Faça a requisição acima e busque `requestId : "exercicio-1"`. São duas linhas: o evento `auth.login.failed` do `LoginUseCase` e o access log com `statusCode: 401`. Confira que as duas têm o mesmo `requestId` e que a resposta HTTP trouxe o header `X-Request-Id: exercicio-1`.

### 2. Erro 500 real

Com o frontend aberto e logado, pare o Postgres:

```bash
docker compose --env-file backend/.env stop postgres
```

Abra um board. Busque `statusCode >= 500` e veja `err.type`, `err.code` (`EAI_AGAIN`) e `err.stack`. Suba o Postgres de novo com `start postgres`.

### 3. Redis fora

```bash
docker compose --env-file backend/.env stop redis
```

Busque `context : "RedisCacheProvider"`. A sequência é `redis connection error`, `redis reconnecting` repetidos, e `redis connection established` quando ele volta.

Note um efeito que só os logs mostram: as rotas autenticadas passam a responder 401. As sessões ficam no Redis (ADR 0001), então sem ele o `AuthGuard` não encontra a sessão. O cache é opcional para a API, mas a sessão não é.

### 4. Resiliência da coleta

```bash
docker compose --env-file backend/.env --profile logging stop elasticsearch
# faça algumas requisições
curl -s http://127.0.0.1:2020/api/v1/metrics   # veja retries em output.es.0
docker compose --env-file backend/.env --profile logging start elasticsearch
```

Em cerca de 1 minuto, todas as requisições feitas com o Elasticsearch fora aparecem no Discover.

### 5. Mapeamento

Em Dev Tools:

```
GET logs-task-flow-local/_mapping
GET logs-task-flow-local/_field_caps?fields=statusCode,durationMs,requestId
```

Depois, insira um documento com tipo errado e procure o `_ignored`:

```
POST logs-task-flow-local/_doc?refresh=true
{ "@timestamp": "2026-11-23T12:00:00Z", "message": "tipo errado", "statusCode": "abc", "requestId": "malformed-1" }

GET logs-task-flow-local/_search?q=requestId:malformed-1
```

Para remover o documento de teste:

```
POST logs-task-flow-local/_delete_by_query?q=requestId:malformed-1
```

### 6. Gráficos no Lens

Monte um dashboard com:

- Contagem de requisições ao longo do tempo, dividida por `log.level` (barras empilhadas).
- Percentil 95 de `durationMs` por `route` (barras horizontais).
- Top 5 `errorMessage.keyword` (tabela).
- Contagem de `event : "auth.login.failed"` por `reason` (pizza).

### 7. Alerta

Em Stack Management, Rules, crie uma regra do tipo "Elasticsearch query":

- data view `task-flow-api`;
- consulta KQL `event : "auth.refresh.reuse_detected"`;
- condição: contagem maior que 0 nos últimos 5 minutos;
- ação: "Server log" (escreve no log do Kibana).

Para disparar, faça login, guarde o cookie `refresh_token`, chame `POST /api/v1/auth/refresh` e depois repita a chamada com o cookie antigo.

## Perguntas frequentes

### Por que não enviar os logs direto da aplicação para o Elasticsearch?

Daria para usar um transport do pino que envia para o Elasticsearch. Mas a aplicação passaria a depender do backend de logs: trocar de ferramenta exige deploy, falhas de rede viram problema da aplicação, e cada serviço repete a configuração de retry e buffer. Com o coletor, a aplicação só escreve no stdout.

### E num blue/green deployment, muda alguma coisa?

Na coleta, não. O Fluent Bit lê `/var/lib/docker/containers/*/*-json.log` e procura arquivos novos a cada 5 s, então a versão nova é coletada assim que sobe. O `read_from_head: true` garante que as linhas do boot não se percam.

O que vale acrescentar numa aplicação real:

- Um campo com a versão ou a cor (`version`, `deployment: green`) nos campos fixos do pino. Sem ele, não dá para comparar a taxa de erro da versão nova com a da antiga, que é o que decide se a troca continua.
- Um tempo de espera antes de remover o container antigo. O arquivo de log some junto com o container; se o Fluent Bit não tiver terminado de ler, as últimas linhas se perdem.
- Com vários servidores, um Fluent Bit por servidor. No Kubernetes, ele roda como DaemonSet e o filtro `kubernetes` acrescenta os labels do pod.

### O que é `jq`?

Uma ferramenta de linha de comando para filtrar JSON, como um `grep` que entende a estrutura:

```bash
docker logs logging-api-1 | jq 'select(.level == "error") | .msg'
```

A stack não depende dele: os setups rodam dentro de containers.

### Por que o Elasticsearch está sem TLS?

Simplificação de estudo. As portas ficam publicadas só em `127.0.0.1`. Numa aplicação real, a comunicação com o cluster é sempre cifrada (`xpack.security.http.ssl.enabled: true`) e cada serviço tem seu próprio usuário de menor privilégio, como o `fluent-bit` aqui.

### Por que a senha está entre aspas no `infra/.env`?

Sem aspas, o `#` pode ser lido como início de comentário. Com aspas, o valor chega inteiro (`#Demo2026`).

## Solução de problemas

| Sintoma | Verificação |
| --- | --- |
| Discover vazio | período no canto superior direito; `make logging-logs` para erros do Fluent Bit; `curl -s http://127.0.0.1:2020/api/v1/metrics` |
| Campo aparece no documento mas não filtra | o campo não está no template (`dynamic: false`); adicione em `index-template.yaml` e faça rollover |
| Documento com `_ignored` | valor com tipo diferente do mapeado |
| Fluent Bit com erro 401 ou 403 | senha do `fluent-bit` em `infra/.env` diferente da aplicada; rode `make logging-up` |
| Kibana em "server is not ready yet" | o Elasticsearch ainda está subindo; espere ou veja `docker compose --env-file backend/.env --profile logging logs kibana` |
| Elasticsearch não sobe | memória disponível (precisa de cerca de 2 GB livres) e `sysctl vm.max_map_count` (mínimo 262144) |
| Logs de containers antigos sumiram | rotação de 30 MB por container e retenção de 7 dias no Elasticsearch |

Para recomeçar do zero:

```bash
make logging-reset
make logging-up
```

# Estudo de logging estruturado

Projeto de estudo de logging estruturado e de ferramentas de coleta, armazenamento e busca de logs. Roda só localmente, com Docker, e não vai para produção.

A aplicação usada como cobaia é o task-flow-base: uma API NestJS de gerenciamento de tarefas, com frontend Next.js, Postgres e Redis. A base foi copiada e desvinculada do repositório original para que o estudo pudesse mudar o que fosse preciso.

## Objetivo

Entender, na prática, como uma aplicação real deve registrar e entregar logs:

- o que registrar, em qual formato e com quais campos;
- como correlacionar todos os logs de uma mesma requisição;
- como os logs saem do container e chegam a uma ferramenta de busca, sem a aplicação depender dela;
- como guardar, pesquisar, agregar e apagar logs;
- como cada peça funciona por dentro (coletor, Elasticsearch, Kibana).

O estudo é só do backend. O frontend continua no projeto apenas para gerar tráfego.

## Fluxo

```
API (NestJS + pino)
  | uma linha JSON por evento no stdout
  v
Docker (driver json-file, com rotação 3 x 10 MB)
  | grava em /var/lib/docker/containers/<id>/<id>-json.log
  v
Fluent Bit
  | lê os arquivos, fica só com o serviço "api", transforma o JSON em campos
  v
Elasticsearch
  | data stream logs-task-flow-local, mapeamento explícito, retenção de 7 dias
  v
Kibana
  | busca (Discover), gráficos (Lens), dashboards e alertas
```

A API não sabe que o Elasticsearch existe: ela só escreve no stdout. Trocar a ferramenta de busca, ou desligar a coleta, não exige mudar nem fazer deploy da API.

## Fases

O estudo avança uma fase por vez.

| Fase | Entrega |
| --- | --- |
| 1. Logger JSON | pino no lugar do logger padrão do Nest; JSON no container, texto colorido (pino-pretty) no terminal; nível e formato por variável de ambiente |
| 2. Contexto da requisição | `requestId` em todos os logs de uma requisição; `userId` e `sessionId` nas rotas autenticadas; uma linha de access log por requisição; eventos de autenticação; dados sensíveis mascarados |
| 3. Coleta e busca | Fluent Bit, Elasticsearch e Kibana em Docker, com configuração versionada em `infra/` |

O que está em cada fase, campo a campo, está em [docs/logging.md](docs/logging.md).

## Decisões

### Na aplicação

| Decisão | Escolha | Motivo |
| --- | --- | --- |
| Biblioteca de log | pino, via `nestjs-pino` | JSON nativo, um dos loggers mais rápidos do Node, integração com o Nest e contexto por requisição (AsyncLocalStorage) |
| Destino | stdout | a aplicação não conhece o backend de logs; falhas de rede, retry e buffer ficam com o coletor |
| Mensagens | texto constante (`login failed`), com o que varia em campos | permite contar e agrupar por mensagem |
| Correlação | `requestId`, aceitando o header `X-Request-Id` de quem chamou e devolvendo-o na resposta | basta para seguir uma requisição; tracing (OpenTelemetry) ficou para depois |
| Access log | uma linha por requisição, com `route`, `statusCode` e `durationMs`; nível pelo status (5xx error, 4xx warn) | um registro por requisição, fácil de filtrar e agregar |
| Erros | 5xx com `err` completo (tipo, mensagem, stack); 4xx só com `errorMessage` | erro do servidor precisa de stack; erro do cliente não |
| Dados sensíveis | `redact` do pino para senhas, tokens, cookies e `authorization` | rede de segurança caso algum desses campos chegue a um log |
| Health check | fora do access log | é chamado a cada poucos segundos e só geraria ruído |

### Na infraestrutura

| Decisão | Escolha | Motivo |
| --- | --- | --- |
| Coletor | Fluent Bit | leve (escrito em C), padrão em Kubernetes, saída nativa para o Elasticsearch, buffer em disco |
| Forma de coleta | leitura dos arquivos `json-file` do Docker | nenhum serviço muda de driver, `docker logs` continua funcionando e, se o coletor cair, os logs esperam nos arquivos; é o mesmo modelo do Kubernetes |
| Armazenamento e busca | Elasticsearch, com Kibana como interface | o estudo começou pensando no Graylog, que guarda os logs num motor de busca da família do Elasticsearch (OpenSearch); aqui o motor é estudado diretamente, com busca por texto, agregações e ES\|QL |
| Estrutura dos dados | data stream com política ILM (rollover diário, exclusão após 7 dias) | logs só recebem inserção e expiram por idade; apagar um índice inteiro é instantâneo |
| Mapeamento | explícito no index template, com `dynamic: false` e `ignore_malformed` | tipos certos para filtros e agregações; um log com campo inesperado ou tipo errado não cria campos nem é recusado |
| Segurança | autenticação ligada, sem TLS; o Fluent Bit usa um usuário que só pode inserir | mostra o princípio do menor privilégio; TLS foi deixado de fora para simplificar, com as portas publicadas só em `127.0.0.1` |
| Rotação dos logs dos containers | `max-size: 10m` e `max-file: 3` em todos os serviços | sem limite, o `json-file` cresce até encher o disco |
| Organização | pasta `infra/` incluída no `docker-compose.yml` da raiz, no profile `logging` | um projeto compose só, sem misturar com a API; `make api` continua subindo só a aplicação |
| Configuração | arquivos YAML comentados, aplicados por containers de setup | tudo versionado e reproduzível; o Elasticsearch aceita corpo em YAML, o que permite comentar cada propriedade |

As alternativas consideradas e as explicações de cada conceito (índice invertido, segmentos, shards, ILM, KQL) estão em [docs/logging.md](docs/logging.md).

## Como rodar

Requisitos: Docker, Node na versão do `backend/.nvmrc` (via nvm) e pnpm (via corepack). A stack de logs usa cerca de 3 GB de RAM.

1. Crie o `backend/.env` com as variáveis validadas em `backend/src/shared/environment/env.ts`.
2. Instale as dependências do backend: `cd backend && pnpm install`.
3. Na raiz:

```bash
make up           # Postgres, Redis, migrations, API e seed
make logging-up   # Elasticsearch, Kibana e Fluent Bit
```

O `make logging-up` cria o `infra/.env` a partir do `infra/.env.example` se ele não existir. Na primeira vez leva de 1 a 2 minutos.

| Serviço | Endereço | Acesso |
| --- | --- | --- |
| API | http://127.0.0.1:3000/api/v1 | |
| Frontend (`make front`) | http://localhost:5173 | `teste@gmail.com`, senha `#Demo2026` |
| Kibana | http://127.0.0.1:5601 | `teste`, senha `#Demo2026` |
| Elasticsearch | http://127.0.0.1:9200 | os mesmos usuários |
| Fluent Bit (métricas) | http://127.0.0.1:2020/api/v1/metrics | sem login |

No Kibana, abra Discover e busque, por exemplo, `requestId : "teste-123"` depois de uma requisição com o header `X-Request-Id: teste-123`.

### Comandos

| Comando | O que faz |
| --- | --- |
| `make up` | sobe a aplicação, aplica as migrations, roda o seed e acompanha os logs da API |
| `make dev` | o mesmo, e inicia o frontend |
| `make logs` | acompanha os logs da API no terminal |
| `make logging-up` | sobe a stack de logs e reaplica a configuração |
| `make logging-down` | para a stack de logs e mantém os dados |
| `make logging-reset` | para a stack de logs e apaga todos os logs guardados |
| `make logging-logs` | acompanha os logs do Fluent Bit |
| `make down` | para tudo |
| `make db-reset` | recria o banco com o seed |

## Estrutura

```
backend/
  src/infra/logger/        configuração do pino e do access log
  src/infra/http/filters/  filtro de exceções (erros no access log)
infra/
  docker-compose.yml       Elasticsearch, Kibana, Fluent Bit e containers de setup
  .env.example             senhas e portas
  fluent-bit/              pipeline do coletor
  elasticsearch/           usuários, papel, política ILM e index template
  kibana/                  data view
docker-compose.yml         aplicação, rotação de logs e include do infra/
Makefile                   fluxos do dia a dia
docs/logging.md            guia de estudo completo
```

## E se fosse para produção?

Nesse repo tudo roda numa máquina só. Em produção, a aplicação e a stack de logs ficariam em servidores separados:

```
servidor da aplicação                         servidor de logs
┌──────────────────────────────┐              ┌──────────────────────────────┐
│ API (container)              │              │ Elasticsearch                │
│   | stdout                   │              │   guarda e indexa os logs    │
│   v                          │    HTTPS     │                              │
│ arquivos json-file do Docker │              │ Kibana                       │
│   |                          │              │   interface para consultar   │
│   v                          │              │                              │
│ Fluent Bit ──────────────────┼─────────────>│                              │
└──────────────────────────────┘              └──────────────────────────────┘
```

### No servidor da aplicação

A API roda num servidor próprio, e o Fluent Bit roda nesse mesmo servidor. Ele lê os arquivos de log que o Docker grava no disco local, então precisa estar na máquina onde os containers rodam. Com mais de um servidor de aplicação, cada um tem o seu Fluent Bit.

No `infra/fluent-bit/fluent-bit.yaml`, só a saída muda, para apontar para o servidor do Elasticsearch:

```yaml
outputs:
  - name: es
    match: docker.*
    # Endereço do servidor de logs, em vez do nome "elasticsearch" da rede do compose.
    host: logs.seudominio.com.br
    port: 9200
    # Os logs passam pela rede: a conexão precisa ser cifrada e o certificado, verificado.
    tls: on
    tls.verify: on
    http_user: fluent-bit
    http_passwd: ${FLUENT_BIT_PASSWORD}
    # Namespace do ambiente: os logs de produção ficam num data stream próprio.
    index: logs-task-flow-production
    write_operation: create
    suppress_type_name: on
    retry_limit: false
```

O resto do pipeline (leitura dos arquivos, filtros e buffer em disco) continua igual. O `docker-compose.yml` do servidor da aplicação mantém a rotação dos logs e passa a ter só a API e o Fluent Bit.

### No servidor de logs

O Elasticsearch e o Kibana rodam juntos no servidor de logs:

- O Elasticsearch com TLS ligado e a porta 9200 aberta no firewall só para os IPs dos servidores da aplicação.
- O Kibana atrás de HTTPS, que é o endereço que você abre no navegador para consultar os logs.
- O `elasticsearch-setup` e o `kibana-setup` rodam ali, com a mesma configuração de `infra/`. A política de retenção passa a seguir a regra do negócio (por exemplo, 30 dias), e não os 7 dias do estudo.

### Consultando no Kibana

Depois de entrar no Kibana, as consultas do dia a dia ficam no menu Analytics, Discover.

1. Seguir uma requisição que um usuário reportou. Discover, linguagem KQL (o padrão):

   ```
   requestId : "4f2c1a9e-7b3d-4e8a-9c1f-2d6b8e0a5f3c"
   ```

   Mostra, em ordem, todos os logs daquela requisição: o que o usecase registrou e a linha do access log com status e duração. O `requestId` vem no header `X-Request-Id` da resposta.

2. Erros do servidor nas últimas horas. Discover, KQL, com o período ajustado no seletor de tempo do canto superior direito:

   ```
   statusCode >= 500
   ```

   Abra um documento para ver `err.type`, `err.message` e `err.stack`.

3. Rotas mais lentas. Discover, trocando o modo de busca para ES|QL pelo botão no topo da tela:

   ```
   FROM logs-task-flow-* | WHERE durationMs IS NOT NULL | STATS p95 = PERCENTILE(durationMs, 95), total = COUNT(*) BY route | SORT p95 DESC | LIMIT 10
   ```

   Devolve uma tabela com as 10 rotas de maior p95 de latência.

Mais consultas e o que cada área do Kibana faz estão em [docs/logging.md](docs/logging.md).

## A aplicação base

O domínio é um gerenciador de tarefas pessoal: cada usuário organiza as próprias tarefas em boards que só ele enxerga.

- Backend: NestJS com ESM, TypeORM, Postgres, autenticação com JWT em cookies e sessões no Redis, cache no Redis, testes com Vitest e testcontainers.
- Frontend: Next.js com React, TanStack Query e Tailwind.
- Seed: usuário `teste@gmail.com`, 200 usuários extras, boards e tarefas, incluindo um board com 5000 tarefas.

Testes, dentro de `backend/`:

```bash
pnpm test
pnpm test:integration
```

## Documentação

- [docs/logging.md](docs/logging.md): guia de estudo da stack de logs (uso, funcionamento interno, consultas, exercícios e perguntas frequentes).
- [CONTEXT.md](CONTEXT.md): glossário do domínio.
- [docs/api-frontend.md](docs/api-frontend.md): contrato da API.
- [docs/adr/](docs/adr/): decisões de arquitetura da aplicação base.
- [CLAUDE.md](CLAUDE.md): convenções de código do backend.

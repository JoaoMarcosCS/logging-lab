# Task Flow Base

Projeto base para estudos. Ele entrega um sistema completo e funcionando (API, frontend, banco, cache, autenticação e dados de exemplo) para servir de ponto de partida a outros projetos, sem precisar montar tudo do zero a cada novo estudo.

A ideia é clonar esta base e evoluir em cima dela.

Tudo o que está aqui pode ser modificado: módulos, regras de negócio, estrutura do banco e entidades. A base existe para poupar o trabalho repetitivo, não para limitar o que vem depois.

## O que já vem pronto

O domínio é um gerenciador de tarefas pessoal: cada usuário organiza as próprias tarefas em boards que só ele enxerga. O glossário completo está em [CONTEXT.md](CONTEXT.md).

Backend (`backend/`):

- NestJS com ESM, TypeORM e PostgreSQL;
- autenticação com JWT em cookies httpOnly, sessões no Redis, rotação do refresh token e detecção de reuso (decisão registrada em [docs/adr/0001-sessoes-jwt-no-redis.md](docs/adr/0001-sessoes-jwt-no-redis.md));
- módulos de usuários, boards e tarefas, com um use case por pasta (controller, schema, usecase e teste);
- validação com zod, rate limit com `@nestjs/throttler`, CORS restrito e versionamento de rotas (`/api/v1`);
- cache no Redis com invalidação por prefixo;
- paginação por cursor e ids UUIDv7;
- exclusão lógica: excluir um board exclui as tarefas dele na mesma transação;
- testes unitários com Vitest e testes de integração com testcontainers;
- seed com um usuário principal, 200 usuários extras, boards e tarefas variados, incluindo um board com 5000 tarefas.

Frontend (`frontend/`):

- Next.js com React, TanStack Query, Zustand, react-hook-form, zod e Tailwind;
- telas de login, cadastro, boards, quadro de tarefas com arrastar e soltar, e perfil.

Infraestrutura (raiz):

- `docker-compose.yml` com PostgreSQL, Redis, serviço de migrations e a API;
- `Makefile` com os fluxos do dia a dia;
- hooks do husky: lint e formatação no pre-commit, testes no pre-push.

## Estrutura do banco

| Tabela | Colunas principais | Relação |
| --- | --- | --- |
| `users` | `id`, `name`, `email`, `password`, `status` (ativo ou inativo) | dono de zero ou mais boards |
| `boards` | `id`, `user_id`, `title`, `description`, `is_active` | pertence a um usuário, contém zero ou mais tarefas |
| `tasks` | `id`, `board_id`, `title`, `description`, `priority`, `work_status`, `is_active` | pertence a exatamente um board |

Todas as tabelas têm `created_at` e `updated_at`. A tarefa não tem dono próprio: o dono dela é o dono do board.

## Como rodar

Requisitos: Docker, Node na versão do `.nvmrc` (via nvm) e pnpm (via corepack).

1. Crie o `backend/.env` com as variáveis validadas em `backend/src/shared/environment/env.ts`: `API_PORT`, `NODE_VERSION`, `ENVIRONMENT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`, `REDIS_HOST`, `REDIS_PORT`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL` e `JWT_REFRESH_TTL`.
2. Instale as dependências do backend com `cd backend && pnpm install`.
3. Na raiz, rode `make dev` para subir tudo e abrir o frontend, ou `make up` para subir só a API e acompanhar os logs.

O `make up` sobe Postgres e Redis, aplica as migrations, sobe a API e roda o seed. O `make dev` faz o mesmo e depois inicia o frontend em `http://localhost:5173`, criando o `frontend/.env.local` a partir do `.env.example` se ele não existir.

Usuário de demonstração criado pelo seed: `teste@gmail.com`, senha `#Demo2026`.

Outros comandos:

| Comando | O que faz |
| --- | --- |
| `make infra` | sobe Postgres e Redis |
| `make migrate` | aplica as migrations pendentes |
| `make seed` | aplica as migrations e roda o seed (não faz nada se o usuário principal já existir) |
| `make migration-generate name=Nome` | gera uma migration a partir das entidades |
| `make migration-revert` | reverte a última migration |
| `make db-reset` | apaga os volumes e recria o banco com o seed |
| `make down` | derruba os containers |

Testes, dentro de `backend/`:

```bash
pnpm test
pnpm test:integration
```

Os testes de integração precisam do Docker rodando.

## Documentação

- [CONTEXT.md](CONTEXT.md): glossário do domínio e relações entre as entidades.
- [docs/api-frontend.md](docs/api-frontend.md): contrato da API (rotas, tipos, autenticação, refresh, rate limit e CORS).
- [docs/adr/](docs/adr/): decisões de arquitetura.
- [CLAUDE.md](CLAUDE.md): convenções de código do backend (estrutura de módulos, repositories, schemas e testes).

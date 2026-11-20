# task-flow-base

Projeto base em NestJS para outros projetos. A organização segue os padrões do backend Express + tsyringe, adaptados ao Nest.

Instruções do framework, ESM e Vitest: @AGENTS.md

## Repositório

- `backend/`: API NestJS (código, `package.json`, `Dockerfile`, `.env`, `.nvmrc`). Os caminhos `src/...` deste arquivo são relativos a `backend/`.
- `frontend/`: aplicação web.
- Na raiz ficam o `docker-compose.yml`, o `Makefile`, os hooks do husky (`.husky/`), `docs/` e `CONTEXT.md`.
- Contrato da API para o frontend: `docs/api-frontend.md`.

## Comandos

Os comandos de `pnpm` rodam dentro de `backend/`. Usar a versão do Node do `.nvmrc` (`nvm use`) antes de rodar `pnpm`.
A versão do pnpm é a do campo `packageManager` do `package.json`, aplicada pelo corepack, inclusive no Dockerfile.

```bash
pnpm build
pnpm test
pnpm test:integration
pnpm lint
npx tsc --noEmit -p tsconfig.json
```

## Estrutura de módulo

```
src/modules/<modulo>/
  entity/<entidade>.entity.ts
  repository/<entidade>.repository.ts
  repository/<entidade>-interface.repository.ts
  usecase/<acao>/<acao>-<entidade>.controller.ts
  usecase/<acao>/<acao>-<entidade>.schema.ts
  usecase/<acao>/<acao>-<entidade>.usecase.ts
  usecase/<acao>/<acao>-<entidade>.spec.ts
  <modulo>.module.ts
```

`src/modules/users` é o módulo de referência.

## Versionamento da API

- Todas as rotas ficam sob `/api/v<versão>`, no formato `https://dominio.com.br/api/v1/<endpoint>`.
- O prefixo `api` vem do `app.setGlobalPrefix('api')` e a versão do `app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })`, ambos em `src/main.ts`.
- Os controllers não repetem `api` nem `v1` em `@Controller('<recurso>')`. Uma versão nova de um endpoint usa `@Version('2')` no controller do use case, mantendo a anterior enquanto existir cliente usando.
- Caminhos que dependem da URL completa, como o `Path` de cookies, usam o prefixo versionado (ex.: `/api/v1/auth`).

## Use cases

- Cada use case tem a própria pasta com controller, schema, usecase e spec.
- Um controller por use case. Todos os controllers do módulo usam o mesmo prefixo em `@Controller('<recurso>')`.
- O controller só valida a entrada e chama `execute`. Regra de negócio fica no usecase.
- Exceções HTTP vêm de `@nestjs/common`. Mensagens ficam em `src/shared/enums/errors.enum.ts`.

## Schemas

- Validação com zod via `@Body({ schema })`, `@Query({ schema })` e `@Param('id', { schema })`. O `StandardSchemaValidationPipe` está registrado como pipe global.
- O schema exporta o tipo inferido com o nome `<Acao><Entidade>Data`, por exemplo `CreateUserData`, `UpdateUserData`, `ListUsersData`. Não usar o sufixo `DTO`.

## Repositories

Todo repository novo segue este formato:

- O contrato é uma classe abstrata em `repository/<entidade>-interface.repository.ts`, chamada `I<Entidade>Repository` (ex.: `IUserRepository`), com todos os métodos `abstract`. Não usar `interface` do TypeScript, token (`Symbol` ou string) nem `@Inject`.
- A implementação fica em `repository/<entidade>.repository.ts`, chamada `<Entidade>Repository` (ex.: `UserRepository`), com `@Injectable()` e `implements I<Entidade>Repository`.
- A ligação fica no `providers` do módulo: `{ provide: IUserRepository, useClass: UserRepository }`. Se outro módulo precisar do repository, exportar a classe abstrata.
- O usecase recebe o contrato direto no construtor: `constructor(private readonly userRepository: IUserRepository) {}`. O import da classe abstrata no usecase é import de valor, não `import type`, porque o Nest usa a classe como token em runtime.
- Tipos de entrada usados por um único usecase vêm do schema desse usecase (`CreateUserData` em `create`, `UpdateUserData` em `update`) e não são redeclarados na interface.
- Ficam no arquivo da interface somente:
  - tipos que se repetem em mais de um usecase, como projeções da entidade (`PublicUser`);
  - tipos de uso exclusivo do repository, como parâmetros de busca (`FindUserByParams`).
- O repository não tem funções de mapeamento. O formato de retorno é resolvido na própria query: uma constante com as colunas e aliases (`created_at AS "createdAt"`) é usada tanto no `select` quanto no `returning`, e as leituras usam `getRawOne`/`getRawMany`. Assim leitura e escrita devolvem objetos simples com o mesmo formato. Quando não for possível resolver na query, o mapeamento fica no usecase.
- Nos métodos de um repository não deve haver validações, como verificar se um usuário já existe com o mesmo email que está sendo cadastrado, pois essas validações são regras de negócios e devem ficar no usecase.
- A única função auxiliar permitida no repository é a tradução de erros do banco, como `toConflict` para violação de unique constraint.
- Colunas sensíveis usam `select: false` na entity e só são lidas por métodos explícitos.

## Testes

- Unitários: `<acao>-<entidade>.spec.ts` dentro da pasta do usecase. Instanciam a classe direto, com o repository mockado: `{ [K in keyof IUserRepository]: Mock<IUserRepository[K]> }`.
- Integração: `src/tests/integration/modules/<modulo>/*.integration.spec.ts`, com config própria (`vitest.integration.config.ts`). Sobem um Postgres descartável com testcontainers (precisa de Docker), criam o schema com `synchronize` e truncam as tabelas antes de cada teste.
- Todo repository tem teste de integração cobrindo cada método, inclusive o formato exato do retorno (chaves em camelCase, sem colunas sensíveis).
- Variáveis de ambiente de teste ficam em `src/tests/setup.ts`.

## Git hooks (husky)

- pre-commit: `lint-staged` roda `oxlint --fix` e `prettier --write` nos arquivos `.ts` staged.
- pre-push: testes unitários e de integração.

## Docker

- O `Makefile` da raiz concentra os fluxos: `make up` sobe a infraestrutura, aplica as migrations, sobe a API e roda o seed. Também há `make infra`, `make migrate`, `make seed`, `make migration-generate name=<Nome>`, `make migration-revert`, `make db-reset` e `make down`.
- O `.env` fica em `backend/.env`. O compose lê dele as variáveis do próprio arquivo (`${DB_USER}`, `${API_PORT}`...), então todo comando manual precisa de `--env-file backend/.env`, como faz o `Makefile`: `docker compose --env-file backend/.env up -d --wait postgres redis` sobe a infraestrutura local. As portas ficam publicadas só em `127.0.0.1`.
- O serviço `api` sobrescreve `DB_HOST`, `DB_PORT`, `REDIS_HOST` e `REDIS_PORT` para os nomes e portas da rede do compose. O `backend/.env` continua apontando para `localhost`, para uso fora do container.
- O `Dockerfile` é multi-stage: `build` compila, `prod-deps` instala só dependências de produção, e a imagem final roda como o usuário `node`, com o código pertencente ao root e somente leitura.
- Migrations são geradas no host, com o banco do compose. Para aplicar, o serviço `apply-migrations` usa a mesma imagem da API, roda as pendentes e termina. A `api` só sobe depois que ele conclui com sucesso. No host, `make migrate` aplica sem rebuild.

## Ambiente

- Variáveis de ambiente são lidas somente pelo objeto `env` de `src/shared/environment/env.ts`, validado com zod no import. Nunca acessar `process.env` direto.
- Variável nova entra no schema de `env.ts`.

## Código

- ESM: imports relativos terminam em `.js`, usar `import.meta.dirname` no lugar de `__dirname`.

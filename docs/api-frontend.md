# API do Task Flow: referência para o frontend

Este documento descreve o contrato HTTP da API do Task Flow para quem vai construir o frontend. Tudo aqui foi extraído do código em `backend/src/`. Em caso de divergência, o código vale.

## Domínio em uma página

Gerenciador de tarefas pessoal. Cada usuário organiza as próprias tarefas em boards que só ele enxerga.

- Usuário: pessoa cadastrada que se autentica. Pode excluir a própria conta, o que é irreversível.
- Board: lista de tarefas com título e descrição opcional. Pertence a um único usuário (o dono).
- Tarefa: item de trabalho dentro de exatamente um board. O dono da tarefa é sempre o dono do board.
- Status de trabalho da tarefa: aguardando início, fazendo, pausada ou encerrada. Pode ir de qualquer estágio para qualquer outro.
- Prioridade da tarefa: baixa, média ou alta. Obrigatória na criação.

Relações: um usuário tem zero ou mais boards; um board tem zero ou mais tarefas. Um usuário pode ter vários boards com o mesmo título.

Exclusões são lógicas e definitivas: board excluído e tarefa excluída somem de todas as respostas e não aceitam mais operações. Não existe lixeira nem restauração. Excluir um board exclui todas as tarefas dele no mesmo momento.

O glossário completo está em `CONTEXT.md`.

## Conexão

| Item | Valor |
| --- | --- |
| Base URL local | `http://localhost:3000/api/v1` |
| Health check | `GET http://localhost:3000/api/health` (sem versão, sem autenticação, sem rate limit) |
| Formato | JSON (`Content-Type: application/json`) |
| Autenticação | Cookies httpOnly definidos pela API |
| Origens liberadas no CORS (ambiente `local`) | `http://localhost:3000` e `http://localhost:5173` |

Toda rota de negócio fica sob `/api/v1`. Uma versão nova de um endpoint seria publicada como `/api/v2/...`, mantendo a v1.

### CORS e cookies

- O CORS está com `credentials: true` e uma lista fixa de origens por ambiente (`backend/src/infra/http/security/cors-origins.ts`). Em `local`, o frontend deve rodar em `http://localhost:5173` (porta padrão do Vite). Nos ambientes `development` e `production` a lista está vazia hoje e precisa ser preenchida antes do deploy do frontend.
- Toda requisição precisa enviar cookies:
  - `fetch(url, { credentials: 'include' })`
  - axios: `withCredentials: true`
- `localhost:5173` e `localhost:3000` são o mesmo site para o navegador (a porta não entra no conceito de site), então os cookies `SameSite=Strict` funcionam no desenvolvimento local.
- Se o frontend usar proxy de desenvolvimento (ex.: `server.proxy` do Vite), o caminho `/api/v1/auth` precisa ser preservado, porque o cookie de refresh está preso a ele.

## Autenticação

### Modelo

A autenticação usa dois JWT (HS256) guardados em cookies httpOnly e uma sessão guardada no Redis.

| Cookie | Conteúdo | Path | Validade | Flags |
| --- | --- | --- | --- | --- |
| `access_token` | JWT com `sub` (id do usuário) e `sid` (id da sessão) | `/` | 900 s (15 min) | `HttpOnly`, `SameSite=Strict`, `Secure` fora de `local`/`test` |
| `refresh_token` | JWT com `sub`, `sid` e `jti` (id do refresh atual) | `/api/v1/auth` | 86400 s (1 dia) | iguais |

Consequências para o frontend:

1. O JavaScript não consegue ler nenhum dos dois cookies. O frontend nunca guarda token em `localStorage`, estado ou header `Authorization`. A API não lê esse header.
2. O frontend não sabe se está logado olhando cookies. Para descobrir, chama `GET /users/me`: 200 significa logado, 401 significa não logado (depois de tentar o refresh, ver abaixo).
3. Login e refresh respondem 204 sem corpo. Os dados do usuário vêm sempre de `GET /users/me`.

### Como a API valida uma requisição protegida

O `AuthGuard` é global: toda rota exige autenticação, exceto as marcadas como públicas (login, refresh, cadastro e health). Para cada requisição protegida:

1. Lê o cookie `access_token`. Se não existir, responde 401.
2. Verifica assinatura, algoritmo (só HS256) e expiração. Se falhar, 401.
3. Busca a sessão `sid` do usuário `sub` no Redis. Se a sessão não existir (logout, troca de senha, exclusão da conta, expiração), 401, mesmo com o access token ainda dentro dos 15 minutos.

Toda resposta 401 por esse motivo tem a mensagem `Não autenticado`.

### Ciclo de vida da sessão

- Login cria uma sessão nova. Um usuário pode ter várias sessões ao mesmo tempo, uma por login (vários navegadores ou dispositivos).
- A sessão vive 1 dia. Cada refresh bem-sucedido renova esse prazo por mais 1 dia.
- Logout encerra só a sessão atual.
- Trocar a senha ou excluir a conta encerra todas as sessões do usuário, inclusive as de outros dispositivos.

### Refresh com rotação

`POST /auth/refresh` lê o cookie `refresh_token`, valida e devolve um par novo de cookies. A cada refresh, o `jti` da sessão muda, e o refresh token anterior deixa de valer.

Detecção de reuso: se um refresh token já substituído for usado de novo, a API entende que ele pode ter sido roubado, encerra a sessão inteira e responde 401. Isso tem um efeito direto no frontend:

- Duas chamadas de refresh em paralelo com o mesmo cookie fazem a segunda ser tratada como reuso, e o usuário é deslogado.
- O frontend precisa garantir um único refresh em andamento por vez (single flight): a primeira requisição que receber 401 dispara o refresh, e as outras esperam a mesma promise.
- Múltiplas abas abertas podem disparar refresh ao mesmo tempo. Se isso for um problema, coordenar entre abas (ex.: `BroadcastChannel` ou `navigator.locks`).

### Fluxo recomendado no cliente

```
requisição protegida
  -> 200: segue
  -> 401:
       se a rota for /auth/login, /auth/refresh ou /users (cadastro): não tenta refresh
       senão: aguarda o refresh único (POST /auth/refresh)
         -> 204: repete a requisição original uma vez
         -> 401: limpa o estado do usuário e manda para o login
```

Na inicialização do app: chamar `GET /users/me` passando pelo mesmo fluxo. Se terminar em 401, o usuário não está logado.

Opcional: renovar de forma proativa um pouco antes dos 15 minutos do access token para evitar o primeiro 401. Não é obrigatório, o fluxo reativo acima basta.

## Rate limit

Feito pelo `@nestjs/throttler`, com contadores por IP e por rota, guardados em memória do processo.

| Escopo | Limite |
| --- | --- |
| Global (todas as rotas) | 100 requisições por minuto |
| `POST /auth/login` | 5 por minuto |
| `POST /users` (cadastro) | 5 por minuto |
| `POST /auth/refresh` | 10 por minuto |
| `GET /api/health` | sem limite |

Ao passar do limite, a API responde 429 e bloqueia aquele IP na rota por 60 segundos. O frontend deve mostrar uma mensagem do tipo "Muitas tentativas, aguarde um minuto" e não repetir automaticamente. Cuidado com loops de refresh: 10 tentativas por minuto se esgotam rápido.

## Formato de erros

As respostas de erro seguem o padrão do NestJS.

Erro de regra de negócio ou autenticação, com `message` em texto:

```json
{ "statusCode": 404, "message": "Board não encontrado", "error": "Not Found" }
```

Erro de validação (400), com `message` como lista. Quando o problema está num campo, a mensagem vem prefixada pelo caminho do campo:

```json
{
  "statusCode": 400,
  "message": [
    "title: Título é obrigatório",
    "password: Senha deve conter ao menos um número"
  ],
  "error": "Bad Request"
}
```

Detalhes:

- Validações de parâmetro de rota (ex.: id inválido) e regras que envolvem o objeto inteiro (ex.: "Informe ao menos um campo para atualizar") vêm sem prefixo de campo.
- Campos ausentes ou com tipo errado usam a mensagem padrão do zod, em inglês (ex.: `title: Invalid input: expected string, received undefined`). As mensagens de tamanho, formato e enum estão em português.
- Para mapear erros a campos do formulário, separar pelo primeiro `: ` de cada item.
- Rate limit: `{ "statusCode": 429, "message": "ThrottlerException: Too Many Requests" }`.
- Erro inesperado: `{ "statusCode": 500, "message": "Internal server error" }`.

Mensagens de negócio possíveis (`backend/src/shared/enums/errors.enum.ts`):

| Mensagem | Status | Quando |
| --- | --- | --- |
| `E-mail já cadastrado` | 409 | cadastro ou troca de email para um email em uso |
| `Usuário não encontrado` | 404 | operações em `/users/me` com usuário que não existe mais |
| `Credenciais inválidas` | 401 | login com email inexistente, senha errada ou usuário inativo (a API não diz qual) |
| `Não autenticado` | 401 | sem cookie, token inválido ou expirado, sessão encerrada, refresh reutilizado |
| `Senha atual incorreta` | 400 | troca de senha com `currentPassword` errada |
| `Board não encontrado` | 404 | board inexistente, excluído ou de outro usuário |
| `Tarefa não encontrada` | 404 | tarefa inexistente, excluída ou de outro board |

Um board ou tarefa de outro usuário responde 404, não 403. O frontend deve tratar os dois casos da mesma forma (ex.: "não encontrado" e voltar para a lista).

## Paginação

As listagens usam paginação por cursor, sem número de página nem total.

Query:

| Parâmetro | Tipo | Padrão | Regra |
| --- | --- | --- | --- |
| `limit` | inteiro | 20 | de 1 a 100 |
| `cursor` | UUID | ausente | o `nextCursor` da página anterior |

Resposta:

```ts
type Paginated<T> = {
  data: T[];
  nextCursor: string | null;
};
```

- A ordem é sempre da mais recente para a mais antiga (por id, que é UUIDv7 e cresce com o tempo de criação).
- `nextCursor: null` indica a última página.
- Para a próxima página, repetir a mesma requisição (mesmos filtros e `limit`) adicionando `cursor=<nextCursor>`.
- Combina bem com scroll infinito ou botão "carregar mais". Não existe "ir para a página N" nem contagem total.

## Tipos compartilhados

Datas chegam como string ISO 8601 (ex.: `"2026-11-19T18:42:10.123Z"`). Ids são UUID v7.

```ts
type UUID = string;
type ISODateString = string;

enum WorkStatus {
  AWAITING_START = 0,
  IN_PROGRESS = 1,
  PAUSED = 2,
  CLOSED = 3,
}

enum Priority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
}

type PublicUser = {
  id: UUID;
  name: string;
  email: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

type PublicBoard = {
  id: UUID;
  userId: UUID;
  title: string;
  description: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

type PublicTask = {
  id: UUID;
  boardId: UUID;
  title: string;
  description: string | null;
  priority: Priority;
  workStatus: WorkStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

type ApiError = {
  statusCode: number;
  message: string | string[];
  error?: string;
};
```

Rótulos sugeridos para a interface:

| Valor | Status de trabalho | Prioridade |
| --- | --- | --- |
| 0 | Aguardando início | Baixa |
| 1 | Fazendo | Média |
| 2 | Pausada | Alta |
| 3 | Encerrada | |

Senhas e status do usuário nunca aparecem nas respostas.

## Endpoints

Legenda: "Pública" significa que a rota não exige cookie de acesso. Todas as outras exigem e podem responder 401.

### Auth

#### POST /auth/login

Pública. Rate limit de 5 por minuto.

Body:

```ts
type LoginBody = {
  email: string;
  password: string;
};
```

| Campo | Regras |
| --- | --- |
| `email` | email válido, até 255 caracteres; a API converte para minúsculas |
| `password` | obrigatório, de 1 a 72 caracteres |

Respostas:

- 204 sem corpo, com os cookies `access_token` e `refresh_token` definidos.
- 400 validação.
- 401 `Credenciais inválidas`: email inexistente, senha errada ou conta excluída.
- 429 rate limit.

Depois do 204, chamar `GET /users/me` para obter os dados do usuário.

#### POST /auth/refresh

Pública (usa o cookie `refresh_token`, enviado pelo navegador só para `/api/v1/auth`). Rate limit de 10 por minuto. Sem body.

Respostas:

- 204 sem corpo, com os dois cookies renovados.
- 401 `Não autenticado`: sem cookie, token inválido ou expirado, sessão encerrada, ou refresh já usado (nesse último caso a sessão inteira é encerrada).
- 429 rate limit.

Ver a seção de refresh com rotação para o cuidado com chamadas em paralelo.

#### POST /auth/logout

Protegida. Sem body.

Respostas:

- 204 sem corpo. Encerra a sessão atual no servidor e apaga os dois cookies.
- 401 se já não estiver autenticado. Nesse caso o frontend pode limpar o estado local do mesmo jeito.

Outras sessões do mesmo usuário (outros dispositivos) continuam ativas.

### Usuários

#### POST /users

Pública. Rate limit de 5 por minuto. Cria a conta, mas não faz login.

Body:

```ts
type CreateUserBody = {
  name: string;
  email: string;
  password: string;
};
```

| Campo | Regras |
| --- | --- |
| `name` | texto com espaços das pontas removidos, de 3 a 255 caracteres |
| `email` | email válido, até 255 caracteres; a API converte para minúsculas |
| `password` | de 8 a 72 caracteres, com ao menos uma letra maiúscula, uma minúscula, um número e um símbolo (qualquer caractere fora de A-Z, a-z e 0-9) |

Mensagens de senha, úteis para validar no cliente com as mesmas regras:

- `Senha deve ter no mínimo 8 caracteres`
- `Senha deve ter no máximo 72 caracteres`
- `Senha deve conter ao menos uma letra maiúscula`
- `Senha deve conter ao menos uma letra minúscula`
- `Senha deve conter ao menos um número`
- `Senha deve conter ao menos um símbolo`

Respostas:

- 201 com `PublicUser`.
- 400 validação.
- 409 `E-mail já cadastrado`. Vale também para o email de uma conta excluída, que continua reservado para sempre.
- 429 rate limit.

Fluxo sugerido de cadastro: `POST /users`, depois `POST /auth/login` com as mesmas credenciais, depois `GET /users/me`.

#### GET /users/me

Protegida. Retorna o usuário logado.

- 200 com `PublicUser`.
- 401 não autenticado.
- 404 `Usuário não encontrado`.

#### PATCH /users/me

Protegida. Atualiza nome e/ou email.

```ts
type UpdateUserBody = {
  name?: string;
  email?: string;
};
```

- Mesmas regras de `name` e `email` do cadastro.
- Pelo menos um dos dois campos é obrigatório. Sem nenhum, 400 `Informe ao menos um campo para atualizar`.

Respostas:

- 200 com o `PublicUser` atualizado.
- 400 validação.
- 409 `E-mail já cadastrado`.
- 404 `Usuário não encontrado`.

Trocar o email não encerra a sessão.

#### PATCH /users/me/password

Protegida. Troca a senha.

```ts
type UpdatePasswordBody = {
  currentPassword: string;
  newPassword: string;
};
```

| Campo | Regras |
| --- | --- |
| `currentPassword` | obrigatório (mensagem `Informe a senha atual`) |
| `newPassword` | mesmas regras de senha do cadastro |

Respostas:

- 204 sem corpo. Encerra todas as sessões do usuário (inclusive as de outros dispositivos) e apaga os cookies deste navegador.
- 400 validação ou `Senha atual incorreta`.
- 404 `Usuário não encontrado`.

Depois do 204, o frontend deve limpar o estado do usuário e mandar para o login, de preferência com um aviso de que a senha foi alterada.

#### DELETE /users/me

Protegida. Exclui a própria conta.

- 204 sem corpo. A conta fica inativa, todas as sessões são encerradas e os cookies são apagados.
- 404 `Usuário não encontrado`.

Regras que a interface deve deixar claras antes de confirmar:

- É irreversível. A conta não pode ser reativada.
- O email continua reservado e não pode ser usado em um novo cadastro.
- Os boards e tarefas ficam inacessíveis.

### Boards

Todas as rotas são protegidas e só enxergam os boards do usuário logado.

#### POST /boards

```ts
type CreateBoardBody = {
  title: string;
  description?: string | null;
};
```

| Campo | Regras |
| --- | --- |
| `title` | espaços das pontas removidos, de 1 a 100 caracteres |
| `description` | opcional; espaços das pontas removidos, até 500 caracteres; `null` ou ausente salva sem descrição |

Respostas: 201 com `PublicBoard`, 400 validação.

#### GET /boards

Lista os boards ativos do usuário logado.

Query: `limit` e `cursor` (ver Paginação).

Resposta: 200 com `Paginated<PublicBoard>`.

#### GET /boards/:id

`:id` precisa ser UUID (senão 400 `Id inválido`).

Respostas: 200 com `PublicBoard`, 404 `Board não encontrado` (inexistente, excluído ou de outro usuário).

#### PATCH /boards/:id

```ts
type UpdateBoardBody = {
  title?: string;
  description?: string | null;
};
```

- Mesmas regras de `title` e `description` da criação.
- Pelo menos um campo é obrigatório (400 `Informe ao menos um campo para atualizar`).
- Para remover a descrição, enviar `"description": null`.

Respostas: 200 com o `PublicBoard` atualizado, 400 validação, 404 `Board não encontrado`.

#### DELETE /boards/:id

Respostas: 204 sem corpo, 404 `Board não encontrado`.

Exclui o board e todas as tarefas dele, de forma definitiva. A confirmação na interface deve deixar isso claro.

### Tarefas

Todas as rotas são protegidas e aninhadas no board: `/boards/:boardId/tasks`. Antes de qualquer operação, a API confere se o board existe, está ativo e pertence ao usuário. Se não, responde 404 `Board não encontrado`. `:boardId` e `:taskId` precisam ser UUID (senão 400 `Id inválido`).

#### POST /boards/:boardId/tasks

```ts
type CreateTaskBody = {
  title: string;
  description?: string | null;
  priority: Priority;
};
```

| Campo | Regras |
| --- | --- |
| `title` | espaços das pontas removidos, de 1 a 255 caracteres |
| `description` | opcional; espaços das pontas removidos, até 2000 caracteres |
| `priority` | obrigatório, número 0, 1 ou 2 (mensagem `Prioridade inválida`) |

A tarefa sempre nasce com `workStatus = 0` (aguardando início). Um `workStatus` enviado na criação é ignorado.

Respostas: 201 com `PublicTask`, 400 validação, 404 `Board não encontrado`.

#### GET /boards/:boardId/tasks

Lista as tarefas ativas do board.

Query:

| Parâmetro | Tipo | Regra |
| --- | --- | --- |
| `limit` | inteiro | de 1 a 100, padrão 20 |
| `cursor` | UUID | opcional |
| `workStatus` | número | opcional, 0 a 3; filtra por status de trabalho |
| `priority` | número | opcional, 0 a 2; filtra por prioridade |

Os filtros podem ser combinados. Ao trocar um filtro, recomeçar a paginação sem `cursor`.

Resposta: 200 com `Paginated<PublicTask>`, 400 validação, 404 `Board não encontrado`.

Para montar um quadro estilo kanban com uma coluna por status, fazer uma listagem por coluna com `workStatus` fixo, cada uma com sua própria paginação.

#### GET /boards/:boardId/tasks/:taskId

Respostas: 200 com `PublicTask`, 404 `Board não encontrado` ou `Tarefa não encontrada`.

#### PATCH /boards/:boardId/tasks/:taskId

```ts
type UpdateTaskBody = {
  title?: string;
  description?: string | null;
  priority?: Priority;
  workStatus?: WorkStatus;
};
```

- Mesmas regras da criação, mais `workStatus` (0 a 3, mensagem `Status de trabalho inválido`).
- Pelo menos um campo é obrigatório (400 `Informe ao menos um campo para atualizar`).
- `workStatus` pode ir de qualquer valor para qualquer outro, inclusive reabrir uma tarefa encerrada.
- Para mover uma tarefa entre colunas de um kanban, enviar só `{ "workStatus": <novo> }`.
- Não é possível mover uma tarefa para outro board.

Respostas: 200 com o `PublicTask` atualizado, 400 validação, 404 `Board não encontrado` ou `Tarefa não encontrada`.

#### DELETE /boards/:boardId/tasks/:taskId

Respostas: 204 sem corpo, 404 `Board não encontrado` ou `Tarefa não encontrada`.

A exclusão é definitiva e não altera o `workStatus` da tarefa.

## Resumo das rotas

| Método | Caminho | Acesso | Rate limit | Sucesso |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | pública | nenhum | 200 `{ "status": "ok" }` |
| POST | `/api/v1/auth/login` | pública | 5/min | 204 + cookies |
| POST | `/api/v1/auth/refresh` | pública (cookie de refresh) | 10/min | 204 + cookies |
| POST | `/api/v1/auth/logout` | protegida | 100/min | 204, apaga cookies |
| POST | `/api/v1/users` | pública | 5/min | 201 `PublicUser` |
| GET | `/api/v1/users/me` | protegida | 100/min | 200 `PublicUser` |
| PATCH | `/api/v1/users/me` | protegida | 100/min | 200 `PublicUser` |
| PATCH | `/api/v1/users/me/password` | protegida | 100/min | 204, encerra todas as sessões |
| DELETE | `/api/v1/users/me` | protegida | 100/min | 204, encerra todas as sessões |
| POST | `/api/v1/boards` | protegida | 100/min | 201 `PublicBoard` |
| GET | `/api/v1/boards` | protegida | 100/min | 200 `Paginated<PublicBoard>` |
| GET | `/api/v1/boards/:id` | protegida | 100/min | 200 `PublicBoard` |
| PATCH | `/api/v1/boards/:id` | protegida | 100/min | 200 `PublicBoard` |
| DELETE | `/api/v1/boards/:id` | protegida | 100/min | 204 |
| POST | `/api/v1/boards/:boardId/tasks` | protegida | 100/min | 201 `PublicTask` |
| GET | `/api/v1/boards/:boardId/tasks` | protegida | 100/min | 200 `Paginated<PublicTask>` |
| GET | `/api/v1/boards/:boardId/tasks/:taskId` | protegida | 100/min | 200 `PublicTask` |
| PATCH | `/api/v1/boards/:boardId/tasks/:taskId` | protegida | 100/min | 200 `PublicTask` |
| DELETE | `/api/v1/boards/:boardId/tasks/:taskId` | protegida | 100/min | 204 |

Os limites são contados por IP e por rota: cada rota tem o próprio contador, então as 100 requisições por minuto valem separadamente para cada endpoint.

## Cache no servidor

A API guarda no Redis, por 5 minutos, as leituras de board, tarefa e listagens. Toda criação, edição ou exclusão invalida o cache afetado na mesma requisição, então a resposta seguinte já reflete a mudança. O frontend não precisa tratar nada disso. Pode confiar que um `GET` feito depois de um `POST`, `PATCH` ou `DELETE` bem-sucedido traz o dado novo.

## Dados de desenvolvimento

O seed (`make seed`, também executado por `make up` e `make db-reset`) cria:

- Usuário principal: `teste@gmail.com`, senha `#Demo2026`, com cerca de 120 boards. Entre eles estão "Estudos", "Trabalho", "Casa" e outros com títulos fixos, e o "Board de carga", com 5.000 tarefas, para testar paginação e filtros.
- 200 usuários extras, de `user001@taskflow.local` a `user200@taskflow.local`, com a mesma senha. 10 deles estão inativos e não conseguem logar.

## Checklist para o frontend

- Enviar cookies em toda requisição (`credentials: 'include'`).
- Nunca guardar token no cliente. Descobrir o usuário logado com `GET /users/me`.
- Implementar refresh reativo em 401, com uma única chamada de refresh em andamento por vez, e repetir a requisição original uma vez.
- Não tentar refresh nos 401 de login, cadastro e do próprio refresh.
- Após logout, troca de senha ou exclusão de conta, limpar o estado e ir para o login.
- Tratar 429 com aviso e sem repetição automática.
- Tratar 404 de board e tarefa voltando para a listagem.
- Validar formulários no cliente com as mesmas regras (tamanhos, regras de senha, prioridade obrigatória) e exibir as mensagens de 400 por campo.
- Paginação por cursor com "carregar mais" ou scroll infinito.
- Confirmar ações destrutivas: excluir board (leva as tarefas junto), excluir tarefa e excluir conta (irreversível, email fica reservado).

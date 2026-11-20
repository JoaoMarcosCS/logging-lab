# Task Flow

Gerenciador de tarefas pessoal e mínimo. Cada usuário organiza as próprias tarefas em boards que só ele enxerga.

## Language

Usuário:
Pessoa cadastrada que se autentica e organiza as próprias tarefas.
_Avoid_: conta, cliente

Usuário inativo:
Usuário que excluiu a própria conta. Não consegue entrar, perde as sessões abertas e não pode ser reativado. Seus boards e tarefas permanecem como estavam, inacessíveis. O email continua reservado e não pode ser usado em novo cadastro.
_Avoid_: usuário deletado, usuário removido

Sessão:
Acesso aberto por um login de um usuário. Um usuário pode ter várias sessões ao mesmo tempo, uma por login. A sessão expira depois de um dia sem ser renovada. Logout encerra só a sessão atual. Se um token de renovação já substituído for usado de novo, a sessão inteira é encerrada. Excluir o usuário encerra todas as sessões dele.
_Avoid_: token, login (como substantivo), dispositivo

Board:
Lista de tarefas criada por um usuário, com título e descrição opcional.
_Avoid_: lista, projeto, quadro

Tarefa:
Item de trabalho que pertence a exatamente um board.
_Avoid_: task, item, card

Board excluído:
Board que o dono excluiu. Deixa de aparecer e de aceitar operações, e todas as suas tarefas passam a ser tarefas excluídas no mesmo momento. Não há restauração.
_Avoid_: board arquivado

Tarefa excluída:
Tarefa que o dono excluiu, ou que pertencia a um board excluído. Deixa de aparecer e de aceitar operações. Excluir não altera o status da tarefa.
_Avoid_: tarefa arquivada, tarefa cancelada

Status de trabalho:
Estágio em que a tarefa está: aguardando início, fazendo, pausada ou encerrada. Uma tarefa nova sempre começa em aguardando início, e depois pode passar livremente de qualquer estágio para qualquer outro, inclusive ser reaberta depois de encerrada. É independente de a tarefa estar excluída.
_Avoid_: status (sozinho, pois o usuário também tem status), situação, estado

Prioridade:
Urgência da tarefa: baixa, média ou alta. Quem cria a tarefa sempre informa a prioridade, e ela pode ser alterada depois.
_Avoid_: importância, peso

Status do usuário:
Indica se o usuário está ativo ou inativo.
_Avoid_: status de trabalho

Dono:
O usuário que criou o board. É dono do board e de todas as tarefas dele, e é o único que pode vê-los ou alterá-los.
_Avoid_: responsável, autor

## Relationships

- Um usuário é dono de zero ou mais boards.
- Um board contém zero ou mais tarefas.
- Uma tarefa pertence a exatamente um board e não tem dono próprio: o dono dela é o dono do board.
- Um usuário pode ter vários boards com o mesmo título.

## Example dialogue

> Dev: "A tarefa 'Ler sobre blue-green' é da Maria?"
> Domain expert: "É, porque está no board 'Estudos', que a Maria criou. Tarefa não tem dono separado do board."

## Flagged ambiguities

- "Dono da tarefa" foi usado como se fosse um atributo da tarefa. Resolvido: o dono é sempre o dono do board.

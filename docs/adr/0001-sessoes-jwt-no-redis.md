# Sessões de JWT guardadas no Redis

Os tokens são JWT, mas o logout precisa invalidar o access token na hora e a exclusão do usuário precisa encerrar todas as sessões dele. Por isso cada login cria uma sessão no Redis (`session:{userId}:{sid}`, com TTL igual ao do refresh token), gravada pelo mesmo `ICacheProvider` usado no cache. Toda requisição autenticada valida a assinatura e confere se a sessão do `sid` ainda existe. Encerrar todas as sessões de um usuário é um `invalidateByPrefix('session:{userId}:')`. Como a exclusão do usuário apaga todas as sessões dele, a sessão existir já garante que o usuário está ativo, sem consulta ao Postgres por requisição.

## Considered Options

- Tabela de sessões no Postgres: uma query no banco por requisição e limpeza manual das sessões expiradas.
- Denylist de `jti` no Redis: não guarda as sessões ativas, então não dá para revogar todas as sessões de um usuário na exclusão.
- Repository de sessão próprio, que lança erro quando o Redis falha: mais correto, mas exige outro client Redis ou extrair o client para um provider compartilhado.

## Consequences

- O Redis vira dependência crítica de autenticação. Se ele for limpo ou ficar indisponível, todos os usuários perdem a sessão.
- O `ICacheProvider` falha em silêncio. Com o Redis fora, a leitura não encontra a sessão e responde 401 (falha fechada), e o login responde sucesso sem ter gravado a sessão.
- Cache e sessões dividem a mesma instância do Redis e ficam separados pelos prefixos `cache:` e `session:`.

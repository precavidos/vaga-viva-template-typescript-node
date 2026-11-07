# Missão `api-security`: proteção da API

Exija autenticação e separe o que recepcionistas e profissionais podem fazer, com guards do NestJS.

Testes: `test/missions/api-security.spec.ts`. Para rodar só esta missão: `npm test -- missions/api-security`.

## Usuários e papéis

A segurança lê os usuários de um arquivo JSON indicado pela variável de ambiente `CLINIC_SECURITY_USERS_FILE`. O caminho pode ser absoluto ou relativo à raiz do projeto (a pasta de onde a aplicação e os testes rodam). O arquivo tem a lista `users`, com itens de `username`, `password` (em texto puro) e `role`. Os papéis são `RECEPTIONIST` e `PROFESSIONAL`.

Nos testes, o setup do Jest (`test/support/global-setup.ts`) define `CLINIC_SECURITY_USERS_FILE=test/config/security-users.json`. Use esse arquivo, sem alterá-lo. Todos os testes do projeto se autenticam com esses usuários:

```json
{
  "users": [
    { "username": "recepcao", "password": "recepcao-senha", "role": "RECEPTIONIST" },
    { "username": "dra.helena", "password": "profissional-senha", "role": "PROFESSIONAL" }
  ]
}
```

| Usuário | Senha | Papel |
| --- | --- | --- |
| `recepcao` | `recepcao-senha` | `RECEPTIONIST` |
| `dra.helena` | `profissional-senha` | `PROFESSIONAL` |

## Contrato

- Autenticação HTTP Basic (cabeçalho `Authorization: Basic ...`).
- Sem credenciais, com senha errada ou com usuário desconhecido: `401 Unauthorized`.
- `GET /health` continua público, sem credenciais.
- `RECEPTIONIST` pode usar toda a API.
- `PROFESSIONAL` só pode consultar (`GET`). Qualquer outro método, como `POST /patients`, `PUT /patients/{id}`, `DELETE /patients/{id}` ou `POST /appointments`, responde `403 Forbidden`.
- A API não guarda sessão: nenhuma resposta cria sessão nem envia cookie, e cada requisição se autentica de novo.
- Como não há sessão nem formulário de login, não há proteção CSRF: os `POST`, `PUT` e `DELETE` dos testes das outras missões só mandam o cabeçalho `Authorization` e precisam continuar funcionando.

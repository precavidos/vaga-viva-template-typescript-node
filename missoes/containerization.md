# Missão `containerization`: aplicação em contêiner

Empacote a aplicação em uma imagem Docker e suba tudo com Docker Compose.

Testes: `test/missions/containerization.spec.ts`. Para rodar só esta missão: `npm test -- missions/containerization`. O primeiro teste constrói a imagem e pode levar alguns minutos (o limite é de 10 minutos).

## `Dockerfile`, na raiz do projeto

- O contexto do build é a raiz do projeto. A imagem precisa ser construída só a partir do código-fonte: a instalação das dependências e a compilação do TypeScript acontecem dentro do `docker build`, porque o teste roda antes de existir um `dist/`.
- A aplicação escuta na porta `8080` e responde `200` com `{"status":"ok"}` em `/health`.
- A conexão com o banco vem da variável de ambiente `DATABASE_URL`. O teste usa `postgresql://clinic:clinic@db:5432/clinic`, com o banco vazio: a aplicação aplica as migrações do Prisma ao subir (`prisma migrate deploy`).
- O `npm ci` também baixa o *schema engine* do Prisma, usado pelas migrações, de `binaries.prisma.sh`. Por isso o build precisa de acesso a esse endereço, além do registro do npm.
- O `npm ci` roda `prisma generate` (script `postinstall`), que lê `prisma.config.ts` e `prisma/schema.prisma`.
- Sugestão: rode o `npm ci` numa camada separada do código-fonte (copie `package.json`, `package-lock.json`, `prisma.config.ts` e `prisma/` antes, e `src/` depois), assim o Docker reaproveita o cache das dependências e do *schema engine* quando só o código muda. Um `.dockerignore` que exclua `node_modules/`, `dist/` e `reports/` também deixa o build mais rápido.

## `compose.yaml`, na raiz do projeto

- Um serviço para a aplicação, com `build` apontando para o `Dockerfile` e a porta `8080` publicada em `ports`.
- Um serviço para o banco com a imagem `postgres:17` (ou uma variante, como `postgres:17-alpine`).
- No serviço da aplicação, `environment` define `DATABASE_URL` apontando para o serviço do banco pelo nome dele (por exemplo, `postgresql://clinic:clinic@db:5432/clinic`).

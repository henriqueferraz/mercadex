# Trilha 1 — Limpeza, Reorganização e Setup de Infraestrutura

**Responsável:** Dev 1
**Branch:** `chore/limpeza-e-infra`
**Base:** `develop`
**Estimativa:** 1–2 dias
**Pré-requisito:** Nenhum — esta trilha é a primeira a ser executada

> ⚠️ Cada tarefa deve ser commitada separadamente para facilitar rollback.
> Abrir PR para `develop` ao concluir todas as tarefas desta trilha.

---

## Contexto

O repositório possuía arquivos de lixo, duplicatas e dependências desatualizadas.
O protótipo HTML da Fase 1 havia sido deletado sem arquivamento. Esta trilha
limpou o repositório, arquivou o histórico, atualizou o frontend e configurou
o backend com Prisma 7 + Neon DB.

---

## Tarefa 1.1 — Limpeza de arquivos de lixo ✅

**Commit:** `65c237d` — `chore: remove .DS_Store e prompt.txt, adiciona .DS_Store ao .gitignore`

O que foi feito:
- Removidos arquivos `.DS_Store` e `prompt.txt`
- Adicionado `.DS_Store` ao `.gitignore` raiz

---

## Tarefa 1.2 — Arquivamento do protótipo HTML (Fase 1) ✅

**Commit:** `3c110a1` — `chore: arquiva prototipo HTML Fase 1 em docs/fase1-prototipo`

O que foi feito:
- Os arquivos do protótipo já haviam sido deletados em commit anterior (`006c7ae`)
- Recuperados do histórico git (commit `21b67e35`) e arquivados em `docs/fase1-prototipo/`
- Arquivos preservados: `README.md`, `index.html`, `css/style.css`, `js/main.js`, `assets/logo-mercadex.png`

---

## Tarefa 1.3 — Remoção de duplicatas / arquivos vazios ✅

**Commit:** `35fcf62` — `chore: remove backend/ vazio (apenas .gitkeep), sera recriado na tarefa 1.7`

O que foi feito:
- Não havia `mercadex/` aninhado rastreado (estava no `.gitignore`)
- `docs/` era o único e foi mantido
- `backend/` continha apenas `.gitkeep` (placeholder vazio) — removido, recriado na Tarefa 1.7

---

## Tarefa 1.4 — Reorganização da árvore de diretórios ✅

**Commit:** `ae51105` — `chore: reorganiza raiz — move planejamento.md para docs/ e limpa .gitignore`

O que foi feito:
- A estrutura já estava na raiz (o `mercadex/` aninhado nunca foi rastreado)
- `planejamento.md` movido para `docs/PLANEJAMENTO.md`
- Entrada obsoleta `mercadex/` removida do `.gitignore`

Estrutura final da raiz:

```
mercadex/
├── .github/workflows/ci.yml
├── .gitignore
├── .gitmessage.txt
├── CLAUDE.md
├── README.md
├── backend/
├── docs/
├── frontend/
└── tasks/
```

---

## Tarefa 1.5 — Migração Vitest → Jest ✅

**Commit:** `f1e30d9` — `chore: migra Vitest para Jest 30, 163 testes passando`

O que foi feito:
- Vitest, `@vitest/coverage-v8` e `jsdom` removidos
- Jest 30, `jest-environment-jsdom`, `ts-jest`, `@types/jest` instalados
- `frontend/jest.config.js` criado com `next/jest`, alias `@/`, thresholds 80%
- `frontend/jest.setup.js` criado com mocks de `next/image`, `next/navigation` e `localStorage`
- Scripts atualizados: `test`, `test:watch`, `test:coverage`, `test:e2e`, `test:e2e:ui`
- `vitest.config.ts` e `vitest.setup.ts` removidos

Resultado: **163/163 testes passando**, cobertura global > 80%

> Nota: 163 testes (não 164) — um teste foi consolidado durante a migração.

---

## Tarefa 1.6 — Atualização de dependências do frontend ✅

**Commit:** `c367137` — `chore: atualiza dependencias frontend (Next 16, React 19, ESLint 9, Playwright 1.60)`

Versões atualizadas:

| Dependência | Antes | Depois |
|---|---|---|
| Next.js | 14.2.5 | **16.2.6** |
| React | 18.x | **19.2.6** |
| ESLint | 8.57.0 | **9.39.4** |
| Playwright | 1.54.1 | **1.60.0** |
| @types/react | anterior | **latest** |

> Nota sobre ESLint: o planejamento pedia ESLint 10, mas `eslint-config-next@16`
> usa `typescript-eslint@^8.46.0` internamente, que só suporta ESLint `^8.57 || ^9`.
> A versão correta e funcional com Next.js 16 é o **ESLint 9**.

Também foi criado `frontend/eslint.config.js` (flat config obrigatório no ESLint 9+)
e o script `lint` atualizado para a sintaxe moderna (`eslint src`).

Verificações: `npm run build` ✅ · `npm run test` 163/163 ✅ · `npm run lint` sem warnings ✅

---

## Tarefa 1.7 — Setup do backend (Neon DB + Prisma 7) ✅

**Commits:**
- `a9b7751` — `chore: setup inicial do backend (Node.js + TypeScript + Prisma)`
- `342d864` — `chore: migra backend para Prisma 7 + Neon DB (adapter serverless, migration init)`

> Alteração em relação ao planejamento original: PostgreSQL local substituído por
> **Neon DB** (PostgreSQL serverless), e Prisma atualizado de v6 para **v7**.

### Dependências instaladas

Produção:

```
express@^4.21  @prisma/client@^7.8  @prisma/adapter-neon@^7.8
@neondatabase/serverless@^1.1  bcryptjs  jsonwebtoken  zod
cors  helmet  express-rate-limit  dotenv  ws
```

Dev:

```
typescript  ts-node  nodemon  prisma@^7.8  jest@^30  ts-jest
@types/*  supertest
```

### Arquivos criados

- `backend/package.json` — scripts: `dev`, `build`, `start`, `test`, `db:migrate`, `db:generate`, `db:seed`
- `backend/tsconfig.json` — target ES2022, strict, paths `@/*`
- `backend/jest.config.js` — ts-jest, node env, threshold 80%
- `backend/nodemon.json` — hot-reload via ts-node
- `backend/prisma/schema.prisma` — datasource PostgreSQL (sem `url`, Prisma 7)
- `backend/prisma.config.ts` — `url` + `adapter` Neon para migrate e runtime
- `backend/src/db.ts` — singleton `PrismaClient` com `PrismaNeon` adapter
- `backend/src/server.ts` — Express com `/health` que verifica conectividade real com o banco
- `backend/.env.example` — template com placeholder para Neon DB
- `backend/.gitignore` — ignora `node_modules/`, `dist/`, `.env`, `src/generated/`

### Migration aplicada

```
prisma/migrations/20260512195437_init/migration.sql  →  tabela User criada no Neon
```

Verificações: `tsc --noEmit` zero erros ✅ · servidor sobe em `:3001` ✅ · `SELECT 1` retorna do Neon ✅

---

## Checklist Final da Trilha 1

Antes de abrir o PR:

- [x] Tarefa 1.1 concluída e commitada
- [x] Tarefa 1.2 concluída e commitada
- [x] Tarefa 1.3 concluída e commitada
- [x] Tarefa 1.4 concluída e commitada
- [x] Tarefa 1.5 concluída — `npm run test` passando (163 testes)
- [x] Tarefa 1.6 concluída — `npm run build` passando
- [x] Tarefa 1.7 concluída — backend sobe sem erros
- [x] Nenhum `.env` ou secret commitado
- [x] PR aberto para `develop` com descrição das mudanças

**Título do PR:** `chore: limpeza do repositorio, migracao Jest, atualizacao deps e setup backend`

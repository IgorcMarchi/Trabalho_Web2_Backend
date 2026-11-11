# TecShop API (back-end)

API da TecShop em **NestJS 11 + TypeORM + SQLite**, com autenticação **JWT**, autorização por perfil (CLIENTE/ADMIN) e documentação **Swagger UI**.

A documentação completa (arquitetura, endpoints, relacionamentos, testes e limitações) está no [README da raiz do repositório](../README.md).

## Começo rápido

```bash
npm install
cp .env.example .env      # preencha JWT_SECRET (mínimo 32 caracteres) e ADMIN_PASSWORD
npm run seed              # admin (ADMIN_EMAIL / ADMIN_PASSWORD), 4 categorias, 20 produtos...
npm run start:dev         # http://localhost:3001  |  Swagger: http://localhost:3001/docs
```

Gerar um `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

O front-end (`../Trabalho01-Web-main/.env.local`) precisa do **mesmo** `JWT_SECRET`.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run start:dev` | API em modo desenvolvimento (recarrega ao salvar) |
| `npm run build` / `npm run start:prod` | Compila / roda o build |
| `npm run seed` | Popula o banco (pode rodar várias vezes sem duplicar) |
| `npm test` | Testes unitários dos services |
| `npm run test:e2e` | Testes de integração (banco SQLite temporário) |
| `npm run lint` | ESLint + Prettier |
| `npm run migration:gerar -- src/database/migrations/Nome` | Gera migration a partir das entidades |

Em desenvolvimento o `synchronize` cria as tabelas. Com `NODE_ENV=production`, ele fica desligado e as migrations rodam ao subir a API.

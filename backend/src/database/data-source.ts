import 'reflect-metadata';
import { join } from 'node:path';
import { DataSource } from 'typeorm';

// Usado só pela CLI do TypeORM para gerar migrations
// (npm run migration:gerar -- src/database/migrations/NomeDaMudanca).
// A API em si usa o TypeOrmModule (src/database/opcoes-banco.ts) e,
// em produção, roda as migrations sozinha ao subir (migrationsRun).
//
// Atenção: este arquivo não lê o .env, e a migration nova sai da diferença
// entre as entidades e o banco de DB_PATH. O banco de desenvolvimento não
// serve, porque o synchronize já o deixa igual às entidades (nenhuma
// diferença aparece). Gere contra um banco criado só pelas migrations:
// aponte DB_PATH para um arquivo novo, rode as migrations existentes
// (npx typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts)
// e só depois o migration:gerar.
export default new DataSource({
  type: 'better-sqlite3',
  database: process.env.DB_PATH ?? './dados/tecshop.sqlite',
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
});

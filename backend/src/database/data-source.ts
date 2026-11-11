import 'reflect-metadata';
import { join } from 'node:path';
import { DataSource } from 'typeorm';

// Usado só pela CLI do TypeORM para gerar migrations
// (npm run migration:gerar -- src/database/migrations/NomeDaMudanca).
// A API em si usa o TypeOrmModule (src/database/opcoes-banco.ts) e,
// em produção, roda as migrations sozinha ao subir (migrationsRun).
export default new DataSource({
  type: 'better-sqlite3',
  database: process.env.DB_PATH ?? './dados/tecshop.sqlite',
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
});

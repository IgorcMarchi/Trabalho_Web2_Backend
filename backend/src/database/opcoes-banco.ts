import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

// SQLite em arquivo: os dados continuam lá depois de reiniciar a API.
export function criarOpcoesBanco(config: ConfigService): TypeOrmModuleOptions {
  const caminho = config.get<string>('DB_PATH', './dados/tecshop.sqlite');
  const producao = config.get<string>('NODE_ENV') === 'production';

  // o better-sqlite3 cria o arquivo, mas não a pasta
  mkdirSync(dirname(resolve(caminho)), { recursive: true });

  return {
    type: 'better-sqlite3',
    database: caminho,
    // cada módulo registra as próprias entidades com forFeature
    autoLoadEntities: true,
    // synchronize cria/altera as tabelas a partir das entidades.
    // Só em desenvolvimento! Em produção quem muda o banco são as migrations.
    synchronize: !producao,
    migrations: [join(__dirname, 'migrations', '*.js')],
    migrationsRun: producao,
  };
}

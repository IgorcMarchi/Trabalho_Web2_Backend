import { MigrationInterface, QueryRunner } from 'typeorm';

export class Inicial1794410982468 implements MigrationInterface {
  name = 'Inicial1794410982468';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "categorias" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "nome" varchar(80) NOT NULL, "ativa" boolean NOT NULL DEFAULT (1), "criado_em" datetime NOT NULL DEFAULT (datetime('now')), "atualizado_em" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_de8a2d8979f7820616e31dc1e15" UNIQUE ("nome"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "produtos" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "nome" varchar(200) NOT NULL, "descricao" text NOT NULL, "preco" decimal(10,2) NOT NULL, "preco_promocional" decimal(10,2), "imagem" varchar(500) NOT NULL, "status" varchar CHECK( "status" IN ('ATIVO','INATIVO') ) NOT NULL DEFAULT ('ATIVO'), "estoque" integer NOT NULL DEFAULT (0), "categoria_id" integer, "criado_em" datetime NOT NULL DEFAULT (datetime('now')), "atualizado_em" datetime NOT NULL DEFAULT (datetime('now')), "excluido_em" datetime)`,
    );
    await queryRunner.query(
      `CREATE TABLE "itens_pedido" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "produto_id" integer, "nome_produto" varchar(200) NOT NULL, "imagem" varchar(500) NOT NULL, "categoria_id" integer, "categoria_nome" varchar(80), "quantidade" integer NOT NULL, "preco_original" decimal(10,2) NOT NULL, "preco_unitario" decimal(10,2) NOT NULL, "subtotal" decimal(10,2) NOT NULL, "pedido_id" integer NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE TABLE "pedidos" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "usuario_id" integer NOT NULL, "cliente_nome" varchar(120) NOT NULL, "telefone" varchar(20) NOT NULL, "cep" varchar(9) NOT NULL, "endereco" varchar(200) NOT NULL, "cidade" varchar(100) NOT NULL, "forma_pagamento" varchar CHECK( "forma_pagamento" IN ('PIX','BOLETO','CARTAO') ) NOT NULL, "status" varchar CHECK( "status" IN ('AGUARDANDO PAGAMENTO','PAGAMENTO APROVADO','EM PREPARAÇÃO','ENVIADO','ENTREGUE','CANCELADO') ) NOT NULL DEFAULT ('AGUARDANDO PAGAMENTO'), "status_pagamento" varchar CHECK( "status_pagamento" IN ('PENDENTE','APROVADO','CANCELADO') ) NOT NULL DEFAULT ('PENDENTE'), "total" decimal(10,2) NOT NULL, "criado_em" datetime NOT NULL DEFAULT (datetime('now')), "atualizado_em" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `CREATE TABLE "usuarios" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "nome" varchar(120) NOT NULL, "email" varchar(160) NOT NULL, "senha_hash" varchar NOT NULL, "papel" varchar CHECK( "papel" IN ('CLIENTE','ADMIN') ) NOT NULL DEFAULT ('CLIENTE'), "ativo" boolean NOT NULL DEFAULT (1), "criado_em" datetime NOT NULL DEFAULT (datetime('now')), "atualizado_em" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_446adfc18b35418aac32ae0b7b5" UNIQUE ("email"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "promocoes" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "nome" varchar(120) NOT NULL, "tipo" varchar CHECK( "tipo" IN ('PORCENTAGEM','VALOR') ) NOT NULL, "valor" decimal(10,2) NOT NULL, "data_inicio" date NOT NULL, "data_fim" date NOT NULL, "alvo" varchar CHECK( "alvo" IN ('CATEGORIA','PRODUTO') ) NOT NULL, "categoria_id" integer, "produto_id" integer, "ativa" boolean NOT NULL DEFAULT (1), "criado_em" datetime NOT NULL DEFAULT (datetime('now')), "atualizado_em" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `CREATE TABLE "feedbacks" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "usuario_id" integer, "autor_nome" varchar(120) NOT NULL, "nota" integer NOT NULL, "comentario" varchar(1000) NOT NULL, "criado_em" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `CREATE TABLE "avaliacoes" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "produto_id" integer NOT NULL, "usuario_id" integer, "autor_nome" varchar(120) NOT NULL, "nota" integer NOT NULL, "comentario" varchar(1000) NOT NULL, "criado_em" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lista_desejos" ("usuario_id" integer NOT NULL, "produto_id" integer NOT NULL, PRIMARY KEY ("usuario_id", "produto_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3c64edac7d22e844fd24eaf15f" ON "lista_desejos" ("usuario_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cc7c50a774c6deff46443b4645" ON "lista_desejos" ("produto_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_produtos" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "nome" varchar(200) NOT NULL, "descricao" text NOT NULL, "preco" decimal(10,2) NOT NULL, "preco_promocional" decimal(10,2), "imagem" varchar(500) NOT NULL, "status" varchar CHECK( "status" IN ('ATIVO','INATIVO') ) NOT NULL DEFAULT ('ATIVO'), "estoque" integer NOT NULL DEFAULT (0), "categoria_id" integer, "criado_em" datetime NOT NULL DEFAULT (datetime('now')), "atualizado_em" datetime NOT NULL DEFAULT (datetime('now')), "excluido_em" datetime, CONSTRAINT "FK_330ac6c492cb0bbcce953f3d9eb" FOREIGN KEY ("categoria_id") REFERENCES "categorias" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_produtos"("id", "nome", "descricao", "preco", "preco_promocional", "imagem", "status", "estoque", "categoria_id", "criado_em", "atualizado_em", "excluido_em") SELECT "id", "nome", "descricao", "preco", "preco_promocional", "imagem", "status", "estoque", "categoria_id", "criado_em", "atualizado_em", "excluido_em" FROM "produtos"`,
    );
    await queryRunner.query(`DROP TABLE "produtos"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_produtos" RENAME TO "produtos"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_itens_pedido" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "produto_id" integer, "nome_produto" varchar(200) NOT NULL, "imagem" varchar(500) NOT NULL, "categoria_id" integer, "categoria_nome" varchar(80), "quantidade" integer NOT NULL, "preco_original" decimal(10,2) NOT NULL, "preco_unitario" decimal(10,2) NOT NULL, "subtotal" decimal(10,2) NOT NULL, "pedido_id" integer NOT NULL, CONSTRAINT "FK_4857bab44b0ffd40ac76c2d89c8" FOREIGN KEY ("pedido_id") REFERENCES "pedidos" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_62858ad64cfe45434e204e01fe6" FOREIGN KEY ("produto_id") REFERENCES "produtos" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_itens_pedido"("id", "produto_id", "nome_produto", "imagem", "categoria_id", "categoria_nome", "quantidade", "preco_original", "preco_unitario", "subtotal", "pedido_id") SELECT "id", "produto_id", "nome_produto", "imagem", "categoria_id", "categoria_nome", "quantidade", "preco_original", "preco_unitario", "subtotal", "pedido_id" FROM "itens_pedido"`,
    );
    await queryRunner.query(`DROP TABLE "itens_pedido"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_itens_pedido" RENAME TO "itens_pedido"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_pedidos" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "usuario_id" integer NOT NULL, "cliente_nome" varchar(120) NOT NULL, "telefone" varchar(20) NOT NULL, "cep" varchar(9) NOT NULL, "endereco" varchar(200) NOT NULL, "cidade" varchar(100) NOT NULL, "forma_pagamento" varchar CHECK( "forma_pagamento" IN ('PIX','BOLETO','CARTAO') ) NOT NULL, "status" varchar CHECK( "status" IN ('AGUARDANDO PAGAMENTO','PAGAMENTO APROVADO','EM PREPARAÇÃO','ENVIADO','ENTREGUE','CANCELADO') ) NOT NULL DEFAULT ('AGUARDANDO PAGAMENTO'), "status_pagamento" varchar CHECK( "status_pagamento" IN ('PENDENTE','APROVADO','CANCELADO') ) NOT NULL DEFAULT ('PENDENTE'), "total" decimal(10,2) NOT NULL, "criado_em" datetime NOT NULL DEFAULT (datetime('now')), "atualizado_em" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_44db92bd8242455d454c1d2c5d9" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_pedidos"("id", "usuario_id", "cliente_nome", "telefone", "cep", "endereco", "cidade", "forma_pagamento", "status", "status_pagamento", "total", "criado_em", "atualizado_em") SELECT "id", "usuario_id", "cliente_nome", "telefone", "cep", "endereco", "cidade", "forma_pagamento", "status", "status_pagamento", "total", "criado_em", "atualizado_em" FROM "pedidos"`,
    );
    await queryRunner.query(`DROP TABLE "pedidos"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_pedidos" RENAME TO "pedidos"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_promocoes" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "nome" varchar(120) NOT NULL, "tipo" varchar CHECK( "tipo" IN ('PORCENTAGEM','VALOR') ) NOT NULL, "valor" decimal(10,2) NOT NULL, "data_inicio" date NOT NULL, "data_fim" date NOT NULL, "alvo" varchar CHECK( "alvo" IN ('CATEGORIA','PRODUTO') ) NOT NULL, "categoria_id" integer, "produto_id" integer, "ativa" boolean NOT NULL DEFAULT (1), "criado_em" datetime NOT NULL DEFAULT (datetime('now')), "atualizado_em" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_e867253061ffc3eaea2fab15d01" FOREIGN KEY ("categoria_id") REFERENCES "categorias" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_2fc5111c2e5223e9d44a837c1a2" FOREIGN KEY ("produto_id") REFERENCES "produtos" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_promocoes"("id", "nome", "tipo", "valor", "data_inicio", "data_fim", "alvo", "categoria_id", "produto_id", "ativa", "criado_em", "atualizado_em") SELECT "id", "nome", "tipo", "valor", "data_inicio", "data_fim", "alvo", "categoria_id", "produto_id", "ativa", "criado_em", "atualizado_em" FROM "promocoes"`,
    );
    await queryRunner.query(`DROP TABLE "promocoes"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_promocoes" RENAME TO "promocoes"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_feedbacks" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "usuario_id" integer, "autor_nome" varchar(120) NOT NULL, "nota" integer NOT NULL, "comentario" varchar(1000) NOT NULL, "criado_em" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_04f7fc58493ea7685a32202e42a" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_feedbacks"("id", "usuario_id", "autor_nome", "nota", "comentario", "criado_em") SELECT "id", "usuario_id", "autor_nome", "nota", "comentario", "criado_em" FROM "feedbacks"`,
    );
    await queryRunner.query(`DROP TABLE "feedbacks"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_feedbacks" RENAME TO "feedbacks"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_avaliacoes" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "produto_id" integer NOT NULL, "usuario_id" integer, "autor_nome" varchar(120) NOT NULL, "nota" integer NOT NULL, "comentario" varchar(1000) NOT NULL, "criado_em" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_906e647329011bb5aca79cbdd4d" FOREIGN KEY ("produto_id") REFERENCES "produtos" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_66413181eb487cda3046f9c93b4" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_avaliacoes"("id", "produto_id", "usuario_id", "autor_nome", "nota", "comentario", "criado_em") SELECT "id", "produto_id", "usuario_id", "autor_nome", "nota", "comentario", "criado_em" FROM "avaliacoes"`,
    );
    await queryRunner.query(`DROP TABLE "avaliacoes"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_avaliacoes" RENAME TO "avaliacoes"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_3c64edac7d22e844fd24eaf15f"`);
    await queryRunner.query(`DROP INDEX "IDX_cc7c50a774c6deff46443b4645"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_lista_desejos" ("usuario_id" integer NOT NULL, "produto_id" integer NOT NULL, CONSTRAINT "FK_3c64edac7d22e844fd24eaf15fd" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "FK_cc7c50a774c6deff46443b4645c" FOREIGN KEY ("produto_id") REFERENCES "produtos" ("id") ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY ("usuario_id", "produto_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_lista_desejos"("usuario_id", "produto_id") SELECT "usuario_id", "produto_id" FROM "lista_desejos"`,
    );
    await queryRunner.query(`DROP TABLE "lista_desejos"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_lista_desejos" RENAME TO "lista_desejos"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3c64edac7d22e844fd24eaf15f" ON "lista_desejos" ("usuario_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cc7c50a774c6deff46443b4645" ON "lista_desejos" ("produto_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_cc7c50a774c6deff46443b4645"`);
    await queryRunner.query(`DROP INDEX "IDX_3c64edac7d22e844fd24eaf15f"`);
    await queryRunner.query(
      `ALTER TABLE "lista_desejos" RENAME TO "temporary_lista_desejos"`,
    );
    await queryRunner.query(
      `CREATE TABLE "lista_desejos" ("usuario_id" integer NOT NULL, "produto_id" integer NOT NULL, PRIMARY KEY ("usuario_id", "produto_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "lista_desejos"("usuario_id", "produto_id") SELECT "usuario_id", "produto_id" FROM "temporary_lista_desejos"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_lista_desejos"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_cc7c50a774c6deff46443b4645" ON "lista_desejos" ("produto_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3c64edac7d22e844fd24eaf15f" ON "lista_desejos" ("usuario_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "avaliacoes" RENAME TO "temporary_avaliacoes"`,
    );
    await queryRunner.query(
      `CREATE TABLE "avaliacoes" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "produto_id" integer NOT NULL, "usuario_id" integer, "autor_nome" varchar(120) NOT NULL, "nota" integer NOT NULL, "comentario" varchar(1000) NOT NULL, "criado_em" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `INSERT INTO "avaliacoes"("id", "produto_id", "usuario_id", "autor_nome", "nota", "comentario", "criado_em") SELECT "id", "produto_id", "usuario_id", "autor_nome", "nota", "comentario", "criado_em" FROM "temporary_avaliacoes"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_avaliacoes"`);
    await queryRunner.query(
      `ALTER TABLE "feedbacks" RENAME TO "temporary_feedbacks"`,
    );
    await queryRunner.query(
      `CREATE TABLE "feedbacks" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "usuario_id" integer, "autor_nome" varchar(120) NOT NULL, "nota" integer NOT NULL, "comentario" varchar(1000) NOT NULL, "criado_em" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `INSERT INTO "feedbacks"("id", "usuario_id", "autor_nome", "nota", "comentario", "criado_em") SELECT "id", "usuario_id", "autor_nome", "nota", "comentario", "criado_em" FROM "temporary_feedbacks"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_feedbacks"`);
    await queryRunner.query(
      `ALTER TABLE "promocoes" RENAME TO "temporary_promocoes"`,
    );
    await queryRunner.query(
      `CREATE TABLE "promocoes" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "nome" varchar(120) NOT NULL, "tipo" varchar CHECK( "tipo" IN ('PORCENTAGEM','VALOR') ) NOT NULL, "valor" decimal(10,2) NOT NULL, "data_inicio" date NOT NULL, "data_fim" date NOT NULL, "alvo" varchar CHECK( "alvo" IN ('CATEGORIA','PRODUTO') ) NOT NULL, "categoria_id" integer, "produto_id" integer, "ativa" boolean NOT NULL DEFAULT (1), "criado_em" datetime NOT NULL DEFAULT (datetime('now')), "atualizado_em" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `INSERT INTO "promocoes"("id", "nome", "tipo", "valor", "data_inicio", "data_fim", "alvo", "categoria_id", "produto_id", "ativa", "criado_em", "atualizado_em") SELECT "id", "nome", "tipo", "valor", "data_inicio", "data_fim", "alvo", "categoria_id", "produto_id", "ativa", "criado_em", "atualizado_em" FROM "temporary_promocoes"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_promocoes"`);
    await queryRunner.query(
      `ALTER TABLE "pedidos" RENAME TO "temporary_pedidos"`,
    );
    await queryRunner.query(
      `CREATE TABLE "pedidos" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "usuario_id" integer NOT NULL, "cliente_nome" varchar(120) NOT NULL, "telefone" varchar(20) NOT NULL, "cep" varchar(9) NOT NULL, "endereco" varchar(200) NOT NULL, "cidade" varchar(100) NOT NULL, "forma_pagamento" varchar CHECK( "forma_pagamento" IN ('PIX','BOLETO','CARTAO') ) NOT NULL, "status" varchar CHECK( "status" IN ('AGUARDANDO PAGAMENTO','PAGAMENTO APROVADO','EM PREPARAÇÃO','ENVIADO','ENTREGUE','CANCELADO') ) NOT NULL DEFAULT ('AGUARDANDO PAGAMENTO'), "status_pagamento" varchar CHECK( "status_pagamento" IN ('PENDENTE','APROVADO','CANCELADO') ) NOT NULL DEFAULT ('PENDENTE'), "total" decimal(10,2) NOT NULL, "criado_em" datetime NOT NULL DEFAULT (datetime('now')), "atualizado_em" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `INSERT INTO "pedidos"("id", "usuario_id", "cliente_nome", "telefone", "cep", "endereco", "cidade", "forma_pagamento", "status", "status_pagamento", "total", "criado_em", "atualizado_em") SELECT "id", "usuario_id", "cliente_nome", "telefone", "cep", "endereco", "cidade", "forma_pagamento", "status", "status_pagamento", "total", "criado_em", "atualizado_em" FROM "temporary_pedidos"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_pedidos"`);
    await queryRunner.query(
      `ALTER TABLE "itens_pedido" RENAME TO "temporary_itens_pedido"`,
    );
    await queryRunner.query(
      `CREATE TABLE "itens_pedido" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "produto_id" integer, "nome_produto" varchar(200) NOT NULL, "imagem" varchar(500) NOT NULL, "categoria_id" integer, "categoria_nome" varchar(80), "quantidade" integer NOT NULL, "preco_original" decimal(10,2) NOT NULL, "preco_unitario" decimal(10,2) NOT NULL, "subtotal" decimal(10,2) NOT NULL, "pedido_id" integer NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "itens_pedido"("id", "produto_id", "nome_produto", "imagem", "categoria_id", "categoria_nome", "quantidade", "preco_original", "preco_unitario", "subtotal", "pedido_id") SELECT "id", "produto_id", "nome_produto", "imagem", "categoria_id", "categoria_nome", "quantidade", "preco_original", "preco_unitario", "subtotal", "pedido_id" FROM "temporary_itens_pedido"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_itens_pedido"`);
    await queryRunner.query(
      `ALTER TABLE "produtos" RENAME TO "temporary_produtos"`,
    );
    await queryRunner.query(
      `CREATE TABLE "produtos" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "nome" varchar(200) NOT NULL, "descricao" text NOT NULL, "preco" decimal(10,2) NOT NULL, "preco_promocional" decimal(10,2), "imagem" varchar(500) NOT NULL, "status" varchar CHECK( "status" IN ('ATIVO','INATIVO') ) NOT NULL DEFAULT ('ATIVO'), "estoque" integer NOT NULL DEFAULT (0), "categoria_id" integer, "criado_em" datetime NOT NULL DEFAULT (datetime('now')), "atualizado_em" datetime NOT NULL DEFAULT (datetime('now')), "excluido_em" datetime)`,
    );
    await queryRunner.query(
      `INSERT INTO "produtos"("id", "nome", "descricao", "preco", "preco_promocional", "imagem", "status", "estoque", "categoria_id", "criado_em", "atualizado_em", "excluido_em") SELECT "id", "nome", "descricao", "preco", "preco_promocional", "imagem", "status", "estoque", "categoria_id", "criado_em", "atualizado_em", "excluido_em" FROM "temporary_produtos"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_produtos"`);
    await queryRunner.query(`DROP INDEX "IDX_cc7c50a774c6deff46443b4645"`);
    await queryRunner.query(`DROP INDEX "IDX_3c64edac7d22e844fd24eaf15f"`);
    await queryRunner.query(`DROP TABLE "lista_desejos"`);
    await queryRunner.query(`DROP TABLE "avaliacoes"`);
    await queryRunner.query(`DROP TABLE "feedbacks"`);
    await queryRunner.query(`DROP TABLE "promocoes"`);
    await queryRunner.query(`DROP TABLE "usuarios"`);
    await queryRunner.query(`DROP TABLE "pedidos"`);
    await queryRunner.query(`DROP TABLE "itens_pedido"`);
    await queryRunner.query(`DROP TABLE "produtos"`);
    await queryRunner.query(`DROP TABLE "categorias"`);
  }
}

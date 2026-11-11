import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { popularBanco } from './popular-banco';

// npm run seed
// (console.log porque o logger do Nest fica só com erros e avisos aqui)
// Sobe só o "miolo" da aplicação (sem servidor HTTP), usando a mesma
// configuração de banco da API, e popula os dados iniciais.
async function executarSeed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const config = app.get(ConfigService);
    const resumo = await popularBanco(app.get(DataSource), {
      adminNome: config.get<string>('ADMIN_NOME', 'Administrador'),
      adminEmail: config.get<string>('ADMIN_EMAIL'),
      adminSenha: config.get<string>('ADMIN_PASSWORD'),
      producao: config.get<string>('NODE_ENV') === 'production',
    });

    console.log(
      `Banco: ${config.get<string>('DB_PATH', './dados/tecshop.sqlite')}`,
    );
    console.log(`Administrador: ${resumo.admin}`);
    if (resumo.admin === 'não configurado') {
      console.warn(
        'Defina ADMIN_EMAIL e ADMIN_PASSWORD no .env para criar a conta administrativa.',
      );
    }
    console.log(
      `Criados agora: ${resumo.categoriasCriadas} categoria(s), ${resumo.produtosCriados} produto(s), ` +
        `${resumo.avaliacoesCriadas} avaliação(ões), ${resumo.feedbacksCriados} feedback(s).`,
    );
    console.log('Seed concluído. Rodar de novo não duplica os dados.');
  } finally {
    await app.close();
  }
}

executarSeed().catch((erro: unknown) => {
  console.error('Falha no seed:', erro instanceof Error ? erro.message : erro);
  process.exit(1);
});

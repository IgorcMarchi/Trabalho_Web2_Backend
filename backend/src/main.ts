import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarAplicacao } from './configurar-aplicacao';
import { CAMINHO_DOCS, configurarSwagger, swaggerHabilitado } from './swagger';

async function iniciar() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  configurarAplicacao(app);

  const config = app.get(ConfigService);
  const comDocs = swaggerHabilitado(config);
  if (comDocs) {
    configurarSwagger(app);
  }

  const porta = config.get<number>('PORT', 3001);
  await app.listen(porta);

  const logger = new Logger('TecShop');
  logger.log(`API rodando em http://localhost:${porta}`);
  if (comDocs) {
    logger.log(
      `Documentação (Swagger UI) em http://localhost:${porta}/${CAMINHO_DOCS}`,
    );
  }
}

void iniciar();

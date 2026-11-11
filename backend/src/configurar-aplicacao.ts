import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TodosErrosFilter } from './comum/filtros/todos-erros.filter';
import { RespostaInterceptor } from './comum/interceptors/resposta.interceptor';

// Configuração global da API. Fica numa função separada para o main.ts
// e os testes de integração usarem exatamente a mesma coisa.
export function configurarAplicacao(app: INestApplication): void {
  const config = app.get(ConfigService);

  // só o front-end da TecShop pode chamar a API pelo navegador
  const origens = config
    .get<string>('FRONTEND_URL', 'http://localhost:3000')
    .split(',')
    .map((origem) => origem.trim());
  app.enableCors({ origin: origens, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove o que não está no DTO...
      forbidNonWhitelisted: true, // ...e responde 400 se vier campo a mais
      transform: true, // converte o JSON/query para a classe do DTO
    }),
  );

  // erro em um formato só; sucesso embrulhado em { sucesso, dados }
  app.useGlobalFilters(new TodosErrosFilter());
  app.useGlobalInterceptors(new RespostaInterceptor());
}

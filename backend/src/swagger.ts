import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const CAMINHO_DOCS = 'docs';

const DESCRICAO = `
API da **TecShop**, a loja da primeira etapa, agora com back-end próprio
(NestJS + TypeORM + SQLite).

### Como testar por aqui
1. Abra **Autenticação → POST /auth/login**, clique em **Try it out** e envie
   \`{ "email": "admin@tecshop.com", "senha": "admin123" }\` (conta de demonstração criada pelo seed).
2. Copie o valor de \`dados.token\` da resposta.
3. Clique em **Authorize** (cadeado no topo), cole **só o token** e confirme.
   O Swagger envia sozinho o cabeçalho \`Authorization: Bearer <token>\`.
4. Agora as rotas com cadeado funcionam. O token vale 1 hora.

### Quem pode usar cada rota
- **[Público]**: qualquer visitante, sem token (sem cadeado).
- **Com cadeado, sem marcação**: qualquer usuário logado (CLIENTE ou ADMIN).
- **[ADMIN]**: só administradores. Token de cliente recebe **403**.

### Formato das respostas
Sucesso: \`{ "sucesso": true, "dados": ... }\`.
Erro: \`{ "sucesso": false, "erro": { "status", "mensagem" }, "caminho", "timestamp" }\`.
Listas paginadas devolvem \`{ "itens": [...], "meta": { "total", "pagina", "limite", "paginas" } }\`
(no máximo 50 itens por página).
`;

// Em desenvolvimento a documentação fica sempre ligada. Em produção ela
// só liga se SWAGGER_ENABLED=true (dá para desligar em qualquer ambiente
// com SWAGGER_ENABLED=false).
export function swaggerHabilitado(config: ConfigService): boolean {
  const opcao = config.get<string>('SWAGGER_ENABLED');
  if (opcao === 'true') return true;
  if (opcao === 'false') return false;
  return config.get<string>('NODE_ENV') !== 'production';
}

export function configurarSwagger(app: INestApplication): void {
  const configuracao = new DocumentBuilder()
    .setTitle('TecShop API')
    .setDescription(DESCRICAO)
    .setVersion('2.0.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description:
        'Cole aqui só o token devolvido por POST /auth/login (sem a palavra Bearer).',
    })
    .addTag('Autenticação', 'Cadastro, login e identificação pelo JWT')
    .addTag('Usuários', 'Contas cadastradas (administração)')
    .addTag('Produtos', 'Catálogo: busca, filtros e CRUD')
    .addTag('Categorias', 'Categorias da loja')
    .addTag('Carrinho', 'Cálculo do carrinho com preços do servidor')
    .addTag('Pedidos', 'Checkout, histórico e status')
    .addTag('Lista de desejos', 'Produtos guardados por cada cliente')
    .addTag('Promoções', 'Descontos por produto ou categoria')
    .addTag('Avaliações', 'Avaliações dos produtos')
    .addTag('Feedback', 'Avaliações do site')
    .addTag('Relatórios', 'Indicadores do painel administrativo')
    .build();

  const documento = SwaggerModule.createDocument(app, configuracao);

  SwaggerModule.setup(CAMINHO_DOCS, app, documento, {
    customSiteTitle: 'TecShop API - Documentação',
    swaggerOptions: {
      persistAuthorization: true, // mantém o token ao recarregar a página
      docExpansion: 'none', // grupos fechados: abre só o que interessa
      displayRequestDuration: true,
      filter: true,
      tagsSorter: (a: string, b: string) => a.localeCompare(b),
    },
  });
}

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';

// Banco temporário só dos testes (nunca o ./dados/tecshop.sqlite de desenvolvimento).
// As variáveis do ambiente têm prioridade sobre o .env no ConfigModule.
const pastaTemporaria = mkdtempSync(join(tmpdir(), 'tecshop-e2e-'));
process.env.DB_PATH = join(pastaTemporaria, 'teste.sqlite');
process.env.JWT_SECRET = 'segredo-so-para-os-testes-com-mais-de-32-caracteres';
process.env.JWT_EXPIRES_IN = '1h';
process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:3000';

// importados depois das variáveis, para o ConfigModule enxergar os valores acima
import { AppModule } from '../src/app.module';
import { configurarAplicacao } from '../src/configurar-aplicacao';
import { popularBanco } from '../src/seed/popular-banco';
import { configurarSwagger } from '../src/swagger';

interface Corpo<T = any> {
  sucesso: boolean;
  dados: T;
  erro?: {
    status: number;
    mensagem: string;
    codigo?: string;
    detalhes?: string[];
  };
  caminho?: string;
}

const corpo = <T = any>(resposta: request.Response) =>
  resposta.body as Corpo<T>;

async function criarApp(): Promise<INestApplication<App>> {
  const modulo = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = modulo.createNestApplication<INestApplication<App>>({
    logger: false,
  });
  configurarAplicacao(app);
  configurarSwagger(app);
  await app.init();
  return app;
}

describe('TecShop API (integração)', () => {
  let app: INestApplication<App>;
  let api: () => ReturnType<typeof request>;

  let tokenAdmin: string;
  let tokenAna: string;
  let tokenBruno: string;
  let pedidoDaAna: number;
  let produtoCriado: number;

  beforeAll(async () => {
    app = await criarApp();
    api = () => request(app.getHttpServer());

    await popularBanco(app.get(DataSource), {
      adminNome: 'Administrador',
      adminEmail: 'admin@tecshop.com',
      adminSenha: 'admin123',
      producao: false,
    });

    const login = await api()
      .post('/auth/login')
      .send({ email: 'admin@tecshop.com', senha: 'admin123' });
    tokenAdmin = corpo<{ token: string }>(login).dados.token;
  });

  afterAll(async () => {
    await app.close();
    rmSync(pastaTemporaria, { recursive: true, force: true });
  });

  describe('Autenticação', () => {
    it('POST /auth/registro com dados válidos -> 201, CLIENTE e sem senha na resposta', async () => {
      const resposta = await api()
        .post('/auth/registro')
        .send({ nome: 'Ana Souza', email: 'Ana@Email.com', senha: 'senha123' })
        .expect(201);

      const { dados, sucesso } = corpo(resposta);
      expect(sucesso).toBe(true);
      expect(dados.token).toEqual(expect.any(String));
      expect(dados.usuario).toMatchObject({
        nome: 'Ana Souza',
        email: 'ana@email.com',
        papel: 'CLIENTE',
      });
      expect(JSON.stringify(dados)).not.toMatch(/senha/i);
      tokenAna = dados.token;

      const bruno = await api()
        .post('/auth/registro')
        .send({
          nome: 'Bruno Lima',
          email: 'bruno@email.com',
          senha: 'senha123',
        })
        .expect(201);
      tokenBruno = corpo(bruno).dados.token;
    });

    it('POST /auth/registro com e-mail duplicado -> 409', async () => {
      const resposta = await api()
        .post('/auth/registro')
        .send({ nome: 'Outra Ana', email: 'ana@email.com', senha: 'senha123' })
        .expect(409);
      expect(corpo(resposta).erro?.mensagem).toBe(
        'Este e-mail já está cadastrado.',
      );
    });

    it('POST /auth/registro tentando enviar papel ADMIN -> 400', async () => {
      const resposta = await api()
        .post('/auth/registro')
        .send({
          nome: 'Espertinho',
          email: 'esperto@email.com',
          senha: 'senha123',
          papel: 'ADMIN',
        })
        .expect(400);
      expect(corpo(resposta).erro?.detalhes).toContain(
        'property papel should not exist',
      );
    });

    it('POST /auth/registro com dados inválidos -> 400 com detalhes', async () => {
      const resposta = await api()
        .post('/auth/registro')
        .send({ nome: 'A', email: 'nao-e-email', senha: '1' })
        .expect(400);
      expect(corpo(resposta).erro?.detalhes?.length).toBeGreaterThanOrEqual(3);
    });

    it('POST /auth/login com credenciais válidas -> 200 + JWT', async () => {
      const resposta = await api()
        .post('/auth/login')
        .send({ email: 'ana@email.com', senha: 'senha123' })
        .expect(200);

      const token = corpo<{ token: string }>(resposta).dados.token;
      const payload = app
        .get(JwtService)
        .decode<Record<string, unknown>>(token);
      // payload mínimo: sub, email, papel (+ iat/exp do próprio JWT)
      expect(Object.keys(payload).sort()).toEqual([
        'email',
        'exp',
        'iat',
        'papel',
        'sub',
      ]);
      expect(Number(payload.exp) - Number(payload.iat)).toBe(3600);
    });

    it('POST /auth/login com senha incorreta -> 401 com mensagem genérica', async () => {
      const resposta = await api()
        .post('/auth/login')
        .send({ email: 'ana@email.com', senha: 'errada' })
        .expect(401);
      expect(corpo(resposta).erro?.mensagem).toBe('E-mail ou senha inválidos.');

      // e-mail inexistente recebe a mesma mensagem
      const inexistente = await api()
        .post('/auth/login')
        .send({ email: 'ninguem@email.com', senha: 'qualquer' })
        .expect(401);
      expect(corpo(inexistente).erro?.mensagem).toBe(
        'E-mail ou senha inválidos.',
      );
    });

    it('a senha fica no banco só como hash bcrypt', async () => {
      const linha = await app
        .get(DataSource)
        .query<{ senha_hash: string }[]>(
          'SELECT senha_hash FROM usuarios WHERE email = ?',
          ['ana@email.com'],
        );
      expect(linha[0].senha_hash).toMatch(/^\$2[aby]\$10\$/);
      expect(linha[0].senha_hash).not.toContain('senha123');
    });

    it('GET /auth/eu devolve o dono do token, sem senha', async () => {
      const resposta = await api()
        .get('/auth/eu')
        .set('Authorization', `Bearer ${tokenAna}`)
        .expect(200);
      expect(corpo(resposta).dados).toMatchObject({
        email: 'ana@email.com',
        papel: 'CLIENTE',
      });
      expect(corpo(resposta).dados).not.toHaveProperty('senhaHash');
    });

    it('JWT expirado -> 401 "Sessão expirada"', async () => {
      const expirado = app
        .get(JwtService)
        .sign(
          { sub: 2, email: 'ana@email.com', papel: 'CLIENTE' },
          { expiresIn: -60 },
        );

      const resposta = await api()
        .get('/auth/eu')
        .set('Authorization', `Bearer ${expirado}`)
        .expect(401);
      expect(corpo(resposta).erro?.mensagem).toBe(
        'Sessão expirada. Faça login novamente.',
      );
    });

    it('JWT adulterado (virar ADMIN mudando o payload) -> 401', async () => {
      const [cabecalho, , assinatura] = tokenAna.split('.');
      const payloadFalso = Buffer.from(
        JSON.stringify({ sub: 2, email: 'ana@email.com', papel: 'ADMIN' }),
      ).toString('base64url');

      await api()
        .get('/relatorios/dashboard')
        .set(
          'Authorization',
          `Bearer ${cabecalho}.${payloadFalso}.${assinatura}`,
        )
        .expect(401);
    });
  });

  describe('Produtos e categorias', () => {
    it('GET /produtos (público) -> 200 paginado', async () => {
      const resposta = await api().get('/produtos').expect(200);
      const { dados } = corpo(resposta);
      expect(dados.meta).toEqual({
        total: 20,
        pagina: 1,
        limite: 10,
        paginas: 2,
      });
      expect(dados.itens).toHaveLength(10);
      expect(dados.itens[0].categoria.nome).toEqual(expect.any(String));
    });

    it('GET /produtos com busca e categoria filtra no banco', async () => {
      const busca = await api()
        .get('/produtos?busca=casual&limite=50')
        .expect(200);
      expect(corpo(busca).dados.meta.total).toBe(3);

      const categorias = await api().get('/categorias').expect(200);
      const joias = corpo<{ id: number; nome: string }[]>(
        categorias,
      ).dados.find((c) => c.nome === 'Joias')!;
      const porCategoria = await api()
        .get(`/produtos?categoriaId=${joias.id}&limite=50`)
        .expect(200);
      expect(corpo(porCategoria).dados.meta.total).toBe(4);
    });

    it('GET /produtos?status=TODOS sem ser admin -> 403', async () => {
      await api().get('/produtos?status=TODOS').expect(403);
      await api()
        .get('/produtos?status=TODOS')
        .set('Authorization', `Bearer ${tokenAna}`)
        .expect(403);
      await api()
        .get('/produtos?status=TODOS')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);
    });

    it('GET /produtos/:id inexistente -> 404', async () => {
      const resposta = await api().get('/produtos/999').expect(404);
      expect(corpo(resposta)).toMatchObject({
        sucesso: false,
        erro: { status: 404, mensagem: 'Produto 999 não encontrado.' },
        caminho: '/produtos/999',
      });
    });

    it('GET /produtos/:id traz média das avaliações', async () => {
      const resposta = await api().get('/produtos/1').expect(200);
      expect(corpo(resposta).dados).toMatchObject({
        id: 1,
        mediaAvaliacoes: 4.5,
        totalAvaliacoes: 2,
      });
    });

    it('GET /categorias (público) -> 200 com contagem de produtos', async () => {
      const resposta = await api().get('/categorias').expect(200);
      const lista =
        corpo<{ nome: string; quantidadeProdutos: number }[]>(resposta).dados;
      expect(lista).toHaveLength(4);
      expect(lista.reduce((soma, c) => soma + c.quantidadeProdutos, 0)).toBe(
        20,
      );
    });

    const novoProduto = {
      nome: 'Fone Bluetooth TecShop',
      descricao: 'Fone sem fio com cancelamento de ruído.',
      preco: 199.9,
      imagem: 'https://exemplo.com/fone.png',
      categoriaId: 3,
      estoque: 3,
    };

    it('POST /produtos com token de cliente -> 403', async () => {
      const resposta = await api()
        .post('/produtos')
        .set('Authorization', `Bearer ${tokenAna}`)
        .send(novoProduto)
        .expect(403);
      expect(corpo(resposta).erro?.mensagem).toBe(
        'Acesso permitido apenas para: ADMIN.',
      );
    });

    it('POST /produtos sem token -> 401', async () => {
      await api().post('/produtos').send(novoProduto).expect(401);
    });

    it('POST /produtos admin com dados válidos -> 201', async () => {
      const resposta = await api()
        .post('/produtos')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send(novoProduto)
        .expect(201);
      expect(corpo(resposta).dados).toMatchObject({
        ...novoProduto,
        status: 'ATIVO',
        precoPromocional: null,
      });
      produtoCriado = corpo(resposta).dados.id;
    });

    it('POST /produtos com preço negativo e campo extra -> 400', async () => {
      await api()
        .post('/produtos')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ ...novoProduto, preco: -5, campoInventado: true })
        .expect(400);
    });

    it('POST /produtos com promoção maior que o preço -> 422', async () => {
      await api()
        .post('/produtos')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ ...novoProduto, precoPromocional: 250 })
        .expect(422);
    });

    it('PATCH /produtos/:id com dados válidos -> 200 e o resto igual', async () => {
      const resposta = await api()
        .patch(`/produtos/${produtoCriado}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ preco: 189.9 })
        .expect(200);
      expect(corpo(resposta).dados).toMatchObject({
        preco: 189.9,
        nome: novoProduto.nome,
        estoque: 3,
      });
    });

    it('produto INATIVO some da loja mas continua no painel', async () => {
      await api()
        .patch(`/produtos/${produtoCriado}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ status: 'INATIVO' })
        .expect(200);
      await api().get(`/produtos/${produtoCriado}`).expect(404);
      await api()
        .get(`/produtos/${produtoCriado}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);
      await api()
        .patch(`/produtos/${produtoCriado}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ status: 'ATIVO' })
        .expect(200);
    });

    it('categoria com produtos não pode ser excluída -> 409', async () => {
      await api()
        .delete('/categorias/1')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(409);
    });

    it('categoria duplicada -> 409; nova categoria -> 201; excluir vazia -> 204', async () => {
      await api()
        .post('/categorias')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ nome: 'joias' })
        .expect(409);
      const criada = await api()
        .post('/categorias')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ nome: 'Livros' })
        .expect(201);
      await api()
        .delete(`/categorias/${corpo(criada).dados.id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(204);
    });
  });

  describe('Carrinho e pedidos', () => {
    it('POST /carrinho/calcular usa os preços do banco', async () => {
      const resposta = await api()
        .post('/carrinho/calcular')
        .send({
          itens: [
            { produtoId: 1, quantidade: 2 },
            { produtoId: 2, quantidade: 1 },
          ],
        })
        .expect(200);
      const { dados } = corpo(resposta);
      // produto 1: 109.95 com 20% = 87.96; produto 2: 22.30 sem promoção
      expect(dados.total).toBe(198.22);
      expect(dados.valido).toBe(true);
    });

    it('POST /carrinho/calcular avisa estoque insuficiente sem lançar erro', async () => {
      const resposta = await api()
        .post('/carrinho/calcular')
        .send({ itens: [{ produtoId: produtoCriado, quantidade: 5 }] })
        .expect(200);
      expect(corpo(resposta).dados).toMatchObject({ valido: false });
      expect(corpo(resposta).dados.itens[0].problema).toBe(
        'Só restam 3 unidade(s) em estoque.',
      );
    });

    const entrega = {
      nome: 'Ana Souza',
      telefone: '(45) 99999-0000',
      cep: '85892-000',
      endereco: 'Rua das Flores, 100',
      cidade: 'Santa Helena',
      formaPagamento: 'PIX',
    };

    it('GET /pedidos/meus sem token -> 401', async () => {
      await api().get('/pedidos/meus').expect(401);
    });

    it('POST /pedidos válido -> 201, total calculado no servidor e estoque baixado', async () => {
      const resposta = await api()
        .post('/pedidos')
        .set('Authorization', `Bearer ${tokenAna}`)
        .send({
          ...entrega,
          itens: [
            { produtoId: 1, quantidade: 2 },
            { produtoId: 2, quantidade: 1 },
          ],
        })
        .expect(201);

      const { dados } = corpo(resposta);
      expect(dados).toMatchObject({
        total: 198.22,
        status: 'AGUARDANDO PAGAMENTO',
        statusPagamento: 'PENDENTE',
        usuario: { email: 'ana@email.com' },
      });
      expect(dados.itens).toHaveLength(2);
      expect(dados.itens[0]).toMatchObject({
        produtoId: 1,
        quantidade: 2,
        precoUnitario: 87.96,
        subtotal: 175.92,
      });
      pedidoDaAna = dados.id;

      const produto = await api().get('/produtos/1').expect(200);
      expect(corpo(produto).dados.estoque).toBe(28);
    });

    it('POST /pedidos com preço vindo do navegador -> 400 (o preço não é aceito)', async () => {
      await api()
        .post('/pedidos')
        .set('Authorization', `Bearer ${tokenAna}`)
        .send({
          ...entrega,
          itens: [{ produtoId: 1, quantidade: 1, preco: 0.01 }],
        })
        .expect(400);
    });

    it('POST /pedidos com produto inexistente -> 404', async () => {
      const resposta = await api()
        .post('/pedidos')
        .set('Authorization', `Bearer ${tokenAna}`)
        .send({ ...entrega, itens: [{ produtoId: 999, quantidade: 1 }] })
        .expect(404);
      expect(corpo(resposta).erro?.mensagem).toBe(
        'Produto 999 não encontrado ou indisponível.',
      );
    });

    it('POST /pedidos com estoque insuficiente -> 409 e nada é gravado (transação)', async () => {
      const resposta = await api()
        .post('/pedidos')
        .set('Authorization', `Bearer ${tokenAna}`)
        .send({
          ...entrega,
          // o 1º item tem estoque, o 2º não: o 1º NÃO pode ficar baixado
          itens: [
            { produtoId: 4, quantidade: 1 },
            { produtoId: produtoCriado, quantidade: 5 },
          ],
        })
        .expect(409);
      expect(corpo(resposta).erro?.codigo).toBe('SEM_ESTOQUE');

      const produto4 = await api().get('/produtos/4').expect(200);
      expect(corpo(produto4).dados.estoque).toBe(30);
      const meus = await api()
        .get('/pedidos/meus')
        .set('Authorization', `Bearer ${tokenAna}`)
        .expect(200);
      expect(corpo(meus).dados.meta.total).toBe(1);
    });

    it('GET /pedidos/meus cliente autenticado -> 200 só com os pedidos dele', async () => {
      const ana = await api()
        .get('/pedidos/meus')
        .set('Authorization', `Bearer ${tokenAna}`)
        .expect(200);
      expect(corpo(ana).dados.itens.map((p: { id: number }) => p.id)).toEqual([
        pedidoDaAna,
      ]);

      const bruno = await api()
        .get('/pedidos/meus')
        .set('Authorization', `Bearer ${tokenBruno}`)
        .expect(200);
      expect(corpo(bruno).dados.meta.total).toBe(0);
    });

    it('pedido de outro cliente -> acesso negado (404, sem confirmar que existe)', async () => {
      await api()
        .get(`/pedidos/${pedidoDaAna}`)
        .set('Authorization', `Bearer ${tokenBruno}`)
        .expect(404);
      await api()
        .get(`/pedidos/${pedidoDaAna}`)
        .set('Authorization', `Bearer ${tokenAna}`)
        .expect(200);
      await api()
        .get(`/pedidos/${pedidoDaAna}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);
    });

    it('GET /pedidos (todos) é só do admin', async () => {
      await api()
        .get('/pedidos')
        .set('Authorization', `Bearer ${tokenAna}`)
        .expect(403);
      const todos = await api()
        .get('/pedidos?busca=ana')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);
      expect(corpo(todos).dados.meta.total).toBe(1);
    });

    it('PATCH /pedidos/:id/status com token de cliente -> 403', async () => {
      await api()
        .patch(`/pedidos/${pedidoDaAna}/status`)
        .set('Authorization', `Bearer ${tokenAna}`)
        .send({ status: 'PAGAMENTO APROVADO' })
        .expect(403);
    });

    it('PATCH /pedidos/:id/status pulando etapas -> 422; próximo status -> 200', async () => {
      await api()
        .patch(`/pedidos/${pedidoDaAna}/status`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ status: 'ENVIADO' })
        .expect(422);

      const resposta = await api()
        .patch(`/pedidos/${pedidoDaAna}/status`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ status: 'PAGAMENTO APROVADO' })
        .expect(200);
      expect(corpo(resposta).dados).toMatchObject({
        status: 'PAGAMENTO APROVADO',
        statusPagamento: 'APROVADO',
      });
    });

    it('cancelar o pedido devolve o estoque', async () => {
      await api()
        .patch(`/pedidos/${pedidoDaAna}/status`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ status: 'CANCELADO' })
        .expect(200);
      const produto = await api().get('/produtos/1').expect(200);
      expect(corpo(produto).dados.estoque).toBe(30);
    });
  });

  describe('Lista de desejos, avaliações, feedback e promoções', () => {
    it('lista de desejos: adicionar 201, repetido 409, listar, remover 204', async () => {
      const auth = { Authorization: `Bearer ${tokenAna}` };
      await api()
        .post('/lista-desejos')
        .set(auth)
        .send({ produtoId: 3 })
        .expect(201);
      await api()
        .post('/lista-desejos')
        .set(auth)
        .send({ produtoId: 3 })
        .expect(409);

      const lista = await api().get('/lista-desejos').set(auth).expect(200);
      expect(corpo(lista).dados.itens.map((p: { id: number }) => p.id)).toEqual(
        [3],
      );

      // a lista é de cada um
      const doBruno = await api()
        .get('/lista-desejos')
        .set('Authorization', `Bearer ${tokenBruno}`)
        .expect(200);
      expect(corpo(doBruno).dados.meta.total).toBe(0);

      await api().delete('/lista-desejos/3').set(auth).expect(204);
      await api().delete('/lista-desejos/3').set(auth).expect(404);
    });

    it('avaliação: cliente cria com o próprio nome; e-mail só aparece para o admin', async () => {
      await api()
        .post('/avaliacoes')
        .send({ produtoId: 2, nota: 5, comentario: 'Muito boa!' })
        .expect(401);

      const criada = await api()
        .post('/avaliacoes')
        .set('Authorization', `Bearer ${tokenAna}`)
        .send({ produtoId: 2, nota: 5, comentario: 'Muito boa!' })
        .expect(201);
      expect(corpo(criada).dados).toMatchObject({
        autorNome: 'Ana Souza',
        nota: 5,
      });

      const publica = await api().get('/avaliacoes?produtoId=2').expect(200);
      expect(corpo(publica).dados.itens[0]).not.toHaveProperty('autorEmail');

      const admin = await api()
        .get('/avaliacoes?produtoId=2')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);
      expect(corpo(admin).dados.itens[0].autorEmail).toBe('ana@email.com');

      await api()
        .delete(`/avaliacoes/${corpo(criada).dados.id}`)
        .set('Authorization', `Bearer ${tokenAna}`)
        .expect(403);
      await api()
        .delete(`/avaliacoes/${corpo(criada).dados.id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(204);
    });

    it('feedback do site: nota fora de 1-5 -> 400; válido -> 201', async () => {
      await api()
        .post('/feedbacks')
        .set('Authorization', `Bearer ${tokenAna}`)
        .send({ nota: 7, comentario: 'Gostei muito' })
        .expect(400);
      await api()
        .post('/feedbacks')
        .set('Authorization', `Bearer ${tokenAna}`)
        .send({ nota: 4, comentario: 'Gostei muito' })
        .expect(201);
      const lista = await api().get('/feedbacks').expect(200);
      expect(corpo(lista).dados.meta.total).toBe(3);
    });

    it('promoção valendo aplica o preço; desativar devolve o preço normal', async () => {
      const hoje = new Date();
      const data = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const criada = await api()
        .post('/promocoes')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nome: 'Fone em oferta',
          tipo: 'PORCENTAGEM',
          valor: 10,
          dataInicio: data(hoje),
          dataFim: data(new Date(hoje.getTime() + 7 * 86400000)),
          alvo: 'PRODUTO',
          produtoId: produtoCriado,
        })
        .expect(201);
      expect(corpo(criada).dados).toMatchObject({
        valendo: true,
        quantidadeProdutos: 1,
      });

      const comDesconto = await api()
        .get(`/produtos/${produtoCriado}`)
        .expect(200);
      expect(corpo(comDesconto).dados.precoPromocional).toBe(170.91);

      const publicas = await api().get('/promocoes').expect(200);
      expect(corpo(publicas).dados).toHaveLength(1);

      await api()
        .patch(`/promocoes/${corpo(criada).dados.id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ ativa: false })
        .expect(200);
      const semDesconto = await api()
        .get(`/produtos/${produtoCriado}`)
        .expect(200);
      expect(corpo(semDesconto).dados.precoPromocional).toBeNull();

      // porcentagem acima de 100 é regra violada
      await api()
        .post('/promocoes')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nome: 'Errada',
          tipo: 'PORCENTAGEM',
          valor: 150,
          dataInicio: data(hoje),
          dataFim: data(hoje),
          alvo: 'CATEGORIA',
          categoriaId: 1,
        })
        .expect(422);
    });
  });

  describe('Relatórios e usuários (admin)', () => {
    it('dashboard calcula a partir dos pedidos gravados', async () => {
      await api()
        .get('/relatorios/dashboard')
        .set('Authorization', `Bearer ${tokenAna}`)
        .expect(403);

      // um pedido novo do Bruno (o da Ana foi cancelado e não conta)
      await api()
        .post('/pedidos')
        .set('Authorization', `Bearer ${tokenBruno}`)
        .send({
          nome: 'Bruno Lima',
          telefone: '(45) 98888-0000',
          cep: '85892000',
          endereco: 'Avenida Brasil, 50',
          cidade: 'Santa Helena',
          formaPagamento: 'BOLETO',
          itens: [{ produtoId: 2, quantidade: 3 }],
        })
        .expect(201);

      const resposta = await api()
        .get('/relatorios/dashboard')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);
      expect(corpo(resposta).dados).toMatchObject({
        totalVendas: 1,
        totalPedidos: 2,
        faturamento: 66.9,
        clientes: 2,
        produtos: 21,
        categorias: 4,
      });
      expect(corpo(resposta).dados.maisVendidos[0]).toMatchObject({ valor: 3 });
    });

    it('relatório de vendas com filtro de período inválido -> 422', async () => {
      await api()
        .get('/relatorios/vendas?de=2026-12-31&ate=2026-01-01')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(422);
      const resposta = await api()
        .get('/relatorios/vendas')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);
      expect(corpo(resposta).dados).toMatchObject({
        totalVendas: 1,
        pecasVendidas: 3,
        ticketMedio: 66.9,
      });
    });

    it('conta desativada pelo admin não consegue entrar -> 403', async () => {
      const usuarios = await api()
        .get('/usuarios?busca=bruno')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);
      const bruno = corpo(usuarios).dados.itens[0] as { id: number };

      await api()
        .patch(`/usuarios/${bruno.id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ ativo: false })
        .expect(200);
      await api()
        .post('/auth/login')
        .send({ email: 'bruno@email.com', senha: 'senha123' })
        .expect(403);
    });

    it('DELETE /produtos/:id existente -> 204; de novo -> 404', async () => {
      await api()
        .delete(`/produtos/${produtoCriado}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(204);
      await api()
        .delete(`/produtos/${produtoCriado}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(404);
      await api().get(`/produtos/${produtoCriado}`).expect(404);
    });
  });

  describe('Swagger / OpenAPI', () => {
    it('GET /docs abre o Swagger UI', async () => {
      const resposta = await api().get('/docs').expect(200);
      expect(resposta.text).toContain('swagger-ui');
    });

    it('o documento OpenAPI tem todos os grupos, o Bearer JWT e as rotas protegidas marcadas', async () => {
      const resposta = await api().get('/docs-json').expect(200);
      const doc = resposta.body as {
        paths: Record<
          string,
          Record<string, { security?: unknown[]; tags?: string[] }>
        >;
        components: { securitySchemes: Record<string, { scheme: string }> };
      };

      expect(doc.components.securitySchemes.bearer.scheme).toBe('bearer');

      const tags = new Set(
        Object.values(doc.paths).flatMap((metodos) =>
          Object.values(metodos).flatMap((op) => op.tags ?? []),
        ),
      );
      expect([...tags].sort()).toEqual(
        [
          'Autenticação',
          'Avaliações',
          'Carrinho',
          'Categorias',
          'Feedback',
          'Lista de desejos',
          'Pedidos',
          'Produtos',
          'Promoções',
          'Relatórios',
          'Usuários',
        ].sort(),
      );

      // protegida tem cadeado; pública não
      expect(doc.paths['/produtos'].post.security).toEqual([{ bearer: [] }]);
      expect(doc.paths['/produtos'].get.security).toBeUndefined();
      expect(doc.paths['/pedidos/meus'].get.security).toEqual([{ bearer: [] }]);
    });
  });

  describe('Persistência', () => {
    it('os dados continuam no SQLite depois de reiniciar a API', async () => {
      await app.close();
      app = await criarApp();
      api = () => request(app.getHttpServer());

      const login = await api()
        .post('/auth/login')
        .send({ email: 'ana@email.com', senha: 'senha123' })
        .expect(200);
      const token = corpo(login).dados.token as string;
      const meus = await api()
        .get('/pedidos/meus')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(corpo(meus).dados.itens[0]).toMatchObject({
        id: pedidoDaAna,
        status: 'CANCELADO',
      });
    });
  });

  // Casos encontrados na revisão do código. Cada um falhava antes da correção.
  describe('Regressões da revisão', () => {
    const data = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const hoje = data(new Date());
    const comoAdmin = () => ({ Authorization: `Bearer ${tokenAdmin}` });
    let comoCarla: { Authorization: string };

    const precoPromocionalDo = async (produtoId: number) =>
      corpo<{ precoPromocional: number | null }>(
        await api().get(`/produtos/${produtoId}`).expect(200),
      ).dados.precoPromocional;

    beforeAll(async () => {
      const registro = await api()
        .post('/auth/registro')
        .send({
          nome: 'Carla Dias',
          email: 'carla@email.com',
          senha: 'senha123',
        })
        .expect(201);
      comoCarla = { Authorization: `Bearer ${corpo(registro).dados.token}` };
    });

    it('paginação de pedidos conta pedidos, e não itens', async () => {
      // 3 pedidos com 2 itens cada
      for (let i = 0; i < 3; i++) {
        await api()
          .post('/pedidos')
          .set(comoCarla)
          .send({
            nome: 'Carla Dias',
            telefone: '(45) 97777-0000',
            cep: '85892-000',
            endereco: 'Rua Paraná, 10',
            cidade: 'Santa Helena',
            formaPagamento: 'PIX',
            itens: [
              { produtoId: 5, quantidade: 1 },
              { produtoId: 6, quantidade: 1 },
            ],
          })
          .expect(201);
      }

      // com 2 por página: página 1 com 2 pedidos, página 2 com 1
      const idsDasPaginas = async (
        url: string,
        auth: { Authorization: string },
      ) => {
        const ids: number[] = [];
        for (const pagina of [1, 2]) {
          const resposta = await api()
            .get(`${url}&pagina=${pagina}`)
            .set(auth)
            .expect(200);
          const { itens, meta } = corpo<{
            itens: { id: number; itens: { id: number }[] }[];
            meta: { total: number; paginas: number };
          }>(resposta).dados;
          expect(meta).toMatchObject({ total: 3, paginas: 2 });

          for (const pedido of itens) {
            const idsDosItens = pedido.itens.map((item) => item.id);
            expect(idsDosItens).toHaveLength(2);
            expect(idsDosItens).toEqual([...idsDosItens].sort((a, b) => a - b));
          }
          ids.push(...itens.map((pedido) => pedido.id));
        }
        return ids;
      };

      const meus = await idsDasPaginas('/pedidos/meus?limite=2', comoCarla);
      expect(new Set(meus).size).toBe(3);

      const doPainel = await idsDasPaginas(
        '/pedidos?busca=carla&limite=2',
        comoAdmin(),
      );
      expect(new Set(doPainel)).toEqual(new Set(meus));
    });

    // cria uma promoção valendo hoje e "volta no tempo" direto no banco,
    // como se a data de término já tivesse passado
    async function criarPromocaoVencida(produtoId: number): Promise<number> {
      const criada = await api()
        .post('/promocoes')
        .set(comoAdmin())
        .send({
          nome: 'Promoção que vai vencer',
          tipo: 'PORCENTAGEM',
          valor: 10,
          dataInicio: hoje,
          dataFim: hoje,
          alvo: 'PRODUTO',
          produtoId,
        })
        .expect(201);
      const id = corpo<{ id: number }>(criada).dados.id;
      expect(await precoPromocionalDo(produtoId)).not.toBeNull();

      await app
        .get(DataSource)
        .query(
          "UPDATE promocoes SET data_inicio = '2000-01-01', data_fim = '2000-01-02' WHERE id = ?",
          [id],
        );
      return id;
    }

    it('desativar promoção vencida devolve o preço normal', async () => {
      const id = await criarPromocaoVencida(7);
      await api()
        .patch(`/promocoes/${id}`)
        .set(comoAdmin())
        .send({ ativa: false })
        .expect(200);
      expect(await precoPromocionalDo(7)).toBeNull();
    });

    it('excluir promoção vencida devolve o preço normal', async () => {
      const id = await criarPromocaoVencida(8);
      await api().delete(`/promocoes/${id}`).set(comoAdmin()).expect(204);
      expect(await precoPromocionalDo(8)).toBeNull();
    });

    it('null em campo obrigatório -> 400 (antes virava 500)', async () => {
      await api()
        .patch('/categorias/1')
        .set(comoAdmin())
        .send({ nome: null })
        .expect(400);
      await api()
        .patch('/produtos/5')
        .set(comoAdmin())
        .send({ nome: null })
        .expect(400);
      await api()
        .patch('/produtos/5')
        .set(comoAdmin())
        .send({ estoque: null })
        .expect(400);
      await api()
        .post('/promocoes')
        .set(comoAdmin())
        .send({
          nome: 'Com ativa nula',
          tipo: 'VALOR',
          valor: 5,
          dataInicio: hoje,
          dataFim: hoje,
          alvo: 'PRODUTO',
          produtoId: 5,
          ativa: null,
        })
        .expect(400);

      // categoriaId null não pode trocar a categoria do produto em silêncio
      const categoriaDo20 = async () =>
        corpo<{ categoriaId: number }>(
          await api().get('/produtos/20').expect(200),
        ).dados.categoriaId;
      const antes = await categoriaDo20();
      await api()
        .patch('/produtos/20')
        .set(comoAdmin())
        .send({ categoriaId: null })
        .expect(400);
      expect(await categoriaDo20()).toBe(antes);

      // precoPromocional continua aceitando null (= sem promoção)
      await api()
        .patch('/produtos/5')
        .set(comoAdmin())
        .send({ precoPromocional: null })
        .expect(200);
    });

    it('promoções sobrepostas: vale o menor preço, em qualquer ordem', async () => {
      const { categoriaId } = corpo<{ categoriaId: number }>(
        await api().get('/produtos/5').expect(200),
      ).dados;
      const novaPromocao = async (dados: Record<string, unknown>) =>
        corpo<{ id: number }>(
          await api()
            .post('/promocoes')
            .set(comoAdmin())
            .send({
              tipo: 'PORCENTAGEM',
              dataInicio: hoje,
              dataFim: hoje,
              ...dados,
            })
            .expect(201),
        ).dados.id;

      const daCategoria = await novaPromocao({
        nome: 'Categoria inteira',
        valor: 10,
        alvo: 'CATEGORIA',
        categoriaId,
      });
      const precoCom10 = await precoPromocionalDo(5);

      const doProduto = await novaPromocao({
        nome: 'Só o produto 5',
        valor: 30,
        alvo: 'PRODUTO',
        produtoId: 5,
      });
      const precoCom30 = await precoPromocionalDo(5);
      expect(precoCom30).toBeLessThan(precoCom10 ?? 0);

      // mexer só no nome da promoção da categoria não derruba o desconto maior
      await api()
        .patch(`/promocoes/${daCategoria}`)
        .set(comoAdmin())
        .send({ nome: 'Categoria inteira (renomeada)' })
        .expect(200);
      expect(await precoPromocionalDo(5)).toBe(precoCom30);

      // tirando a de 30%, volta a valer a de 10%; tirando as duas, preço normal
      await api()
        .delete(`/promocoes/${doProduto}`)
        .set(comoAdmin())
        .expect(204);
      expect(await precoPromocionalDo(5)).toBe(precoCom10);
      await api()
        .delete(`/promocoes/${daCategoria}`)
        .set(comoAdmin())
        .expect(204);
      expect(await precoPromocionalDo(5)).toBeNull();
    });

    it('promoção de produto excluído não aparece na lista pública', async () => {
      const produto = await api()
        .post('/produtos')
        .set(comoAdmin())
        .send({
          nome: 'Produto temporário',
          descricao: 'Criado só para este teste.',
          preco: 50,
          imagem: 'https://exemplo.com/produto.png',
          categoriaId: 1,
          estoque: 5,
        })
        .expect(201);
      const produtoId = corpo<{ id: number }>(produto).dados.id;

      const promocao = await api()
        .post('/promocoes')
        .set(comoAdmin())
        .send({
          nome: 'Promoção do temporário',
          tipo: 'VALOR',
          valor: 5,
          dataInicio: hoje,
          dataFim: hoje,
          alvo: 'PRODUTO',
          produtoId,
        })
        .expect(201);
      const promocaoId = corpo<{ id: number }>(promocao).dados.id;

      await api().delete(`/produtos/${produtoId}`).set(comoAdmin()).expect(204);

      const publicas = corpo<{ id: number }[]>(
        await api().get('/promocoes').expect(200),
      ).dados;
      expect(publicas.map((p) => p.id)).not.toContain(promocaoId);

      // o admin continua vendo (com o produto vazio), para poder excluir
      const todas = corpo<{ id: number; produto: unknown }[]>(
        await api()
          .get('/promocoes?situacao=TODAS')
          .set(comoAdmin())
          .expect(200),
      ).dados;
      expect(todas.find((p) => p.id === promocaoId)).toMatchObject({
        produto: null,
      });
      await api()
        .delete(`/promocoes/${promocaoId}`)
        .set(comoAdmin())
        .expect(204);
    });

    it('avaliação de produto inativo só aparece para o admin', async () => {
      const criada = await api()
        .post('/avaliacoes')
        .set(comoCarla)
        .send({ produtoId: 10, nota: 4, comentario: 'Gostei bastante.' })
        .expect(201);
      const id = corpo<{ id: number }>(criada).dados.id;

      const idsDasAvaliacoes = async (auth: Record<string, string> = {}) =>
        corpo<{ itens: { id: number }[] }>(
          await api().get('/avaliacoes?limite=50').set(auth).expect(200),
        ).dados.itens.map((avaliacao) => avaliacao.id);

      await api()
        .patch('/produtos/10')
        .set(comoAdmin())
        .send({ status: 'INATIVO' })
        .expect(200);
      expect(await idsDasAvaliacoes()).not.toContain(id);
      expect(await idsDasAvaliacoes(comoAdmin())).toContain(id);

      await api()
        .patch('/produtos/10')
        .set(comoAdmin())
        .send({ status: 'ATIVO' })
        .expect(200);
      expect(await idsDasAvaliacoes()).toContain(id);
      await api().delete(`/avaliacoes/${id}`).set(comoAdmin()).expect(204);
    });

    it('relatório com filtro de produto conta só os pedidos que têm o produto', async () => {
      const resposta = await api()
        .get('/relatorios/vendas?produtoId=6')
        .set(comoAdmin())
        .expect(200);
      const dados = corpo<{
        totalVendas: number;
        pecasVendidas: number;
        faturamento: number;
        ticketMedio: number;
        faturamentoPorDia: { valor: number }[];
        pedidosPorDia: { valor: number }[];
      }>(resposta).dados;
      const soma = (linhas: { valor: number }[]) =>
        linhas.reduce((total, linha) => total + linha.valor, 0);

      // só os 3 pedidos da Carla têm o produto 6 (1 unidade em cada)
      expect(dados).toMatchObject({ totalVendas: 3, pecasVendidas: 3 });
      expect(dados.ticketMedio).toBeCloseTo(dados.faturamento / 3, 2);
      expect(soma(dados.faturamentoPorDia)).toBeCloseTo(dados.faturamento, 2);
      expect(soma(dados.pedidosPorDia)).toBe(3);
    });
  });
});

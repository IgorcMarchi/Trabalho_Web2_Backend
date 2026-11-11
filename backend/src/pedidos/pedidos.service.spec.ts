import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { Papel } from '../comum/tipos/papel.enum';
import { Produto } from '../produtos/produto.entity';
import { ProdutosService } from '../produtos/produtos.service';
import { StatusProduto } from '../produtos/status-produto.enum';
import { CriarPedidoDto } from './dto/pedido.dto';
import { Pedido } from './pedido.entity';
import { FormaPagamento, StatusPedido } from './pedido.enums';
import { PedidosRepository } from './pedidos.repository';
import { PedidosService } from './pedidos.service';
import { SemEstoqueException } from './sem-estoque.exception';

// Teste unitário: só o service de verdade. Banco, repository e o service
// de produtos são falsos (jest.fn()), então nada de servidor nem SQLite.

const ana = { sub: 2, email: 'ana@email.com', papel: Papel.CLIENTE };
const bruno = { sub: 3, email: 'bruno@email.com', papel: Papel.CLIENTE };
const admin = { sub: 1, email: 'admin@tecshop.com', papel: Papel.ADMIN };

function produto(dados: Partial<Produto>): Produto {
  return Object.assign(new Produto(), {
    status: StatusProduto.ATIVO,
    precoPromocional: null,
    estoque: 10,
    categoriaId: 1,
    categoria: { id: 1, nome: 'Joias' },
    imagem: 'https://exemplo.com/x.png',
    ...dados,
  });
}

const dto = (itens: CriarPedidoDto['itens']): CriarPedidoDto => ({
  nome: 'Ana Souza',
  telefone: '(45) 99999-0000',
  cep: '85892-000',
  endereco: 'Rua das Flores, 100',
  cidade: 'Santa Helena',
  formaPagamento: FormaPagamento.PIX,
  itens,
});

describe('PedidosService', () => {
  let service: PedidosService;
  const produtosService = {
    buscarVarios: jest.fn(),
    baixarEstoque: jest.fn(),
    devolverEstoque: jest.fn(),
  };
  const pedidosRepository = {
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    atualizarStatus: jest.fn(),
  };
  // a "transação" falsa só executa o callback com um manager qualquer
  const dataSource = {
    transaction: jest.fn((callback: (m: object) => unknown) => callback({})),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const modulo = await Test.createTestingModule({
      providers: [
        PedidosService,
        { provide: DataSource, useValue: dataSource },
        { provide: PedidosRepository, useValue: pedidosRepository },
        { provide: ProdutosService, useValue: produtosService },
      ],
    }).compile();
    service = modulo.get(PedidosService);
  });

  it('calcula preços e total com os dados do banco (promoção incluída)', async () => {
    produtosService.buscarVarios.mockResolvedValue([
      produto({ id: 1, nome: 'Anel', preco: 100, precoPromocional: 80 }),
      produto({ id: 2, nome: 'Colar', preco: 19.99 }),
    ]);
    produtosService.baixarEstoque.mockResolvedValue(true);
    pedidosRepository.criar.mockImplementation((dados: Partial<Pedido>) => ({
      id: 7,
      ...dados,
    }));
    pedidosRepository.buscarPorId.mockImplementation((id: number) => ({ id }));

    await service.criar(
      dto([
        { produtoId: 1, quantidade: 2 },
        { produtoId: 2, quantidade: 3 },
      ]),
      ana,
    );

    const gravado = pedidosRepository.criar.mock.calls[0][0] as Pedido;
    expect(gravado.total).toBe(219.97); // 2 x 80 + 3 x 19.99
    expect(gravado.usuarioId).toBe(ana.sub); // dono vem do token
    expect(gravado.status).toBe(StatusPedido.AGUARDANDO_PAGAMENTO);
    expect(gravado.itens[0]).toMatchObject({
      precoOriginal: 100,
      precoUnitario: 80,
      subtotal: 160,
    });
  });

  it('junta itens repetidos do mesmo produto', async () => {
    produtosService.buscarVarios.mockResolvedValue([
      produto({ id: 1, nome: 'Anel', preco: 10 }),
    ]);
    produtosService.baixarEstoque.mockResolvedValue(true);
    pedidosRepository.criar.mockImplementation((dados: Partial<Pedido>) => ({
      id: 1,
      ...dados,
    }));
    pedidosRepository.buscarPorId.mockResolvedValue({ id: 1 });

    await service.criar(
      dto([
        { produtoId: 1, quantidade: 1 },
        { produtoId: 1, quantidade: 2 },
      ]),
      ana,
    );

    expect(produtosService.baixarEstoque).toHaveBeenCalledWith(1, 3, {});
  });

  it('produto inexistente ou inativo -> 404, sem baixar estoque', async () => {
    produtosService.buscarVarios.mockResolvedValue([
      produto({
        id: 1,
        nome: 'Anel',
        preco: 10,
        status: StatusProduto.INATIVO,
      }),
    ]);

    await expect(
      service.criar(dto([{ produtoId: 1, quantidade: 1 }]), ana),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.criar(dto([{ produtoId: 99, quantidade: 1 }]), ana),
    ).rejects.toThrow('Produto 99 não encontrado ou indisponível.');
    expect(produtosService.baixarEstoque).not.toHaveBeenCalled();
  });

  it('estoque insuficiente -> SemEstoqueException (409, codigo SEM_ESTOQUE)', async () => {
    produtosService.buscarVarios.mockResolvedValue([
      produto({ id: 1, nome: 'Anel', preco: 10, estoque: 1 }),
    ]);
    produtosService.baixarEstoque.mockResolvedValue(false);

    const erro = await service
      .criar(dto([{ produtoId: 1, quantidade: 5 }]), ana)
      .catch((e: unknown) => e);

    expect(erro).toBeInstanceOf(SemEstoqueException);
    expect((erro as SemEstoqueException).getStatus()).toBe(409);
    expect((erro as SemEstoqueException).getResponse()).toMatchObject({
      codigo: 'SEM_ESTOQUE',
    });
    expect(pedidosRepository.criar).not.toHaveBeenCalled();
  });

  it('cliente não abre pedido de outro cliente (404); dono e admin abrem', async () => {
    pedidosRepository.buscarPorId.mockResolvedValue({
      id: 5,
      usuarioId: ana.sub,
    });

    await expect(service.buscar(5, bruno)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.buscar(5, ana)).resolves.toMatchObject({ id: 5 });
    await expect(service.buscar(5, admin)).resolves.toMatchObject({ id: 5 });
  });

  it('status só avança uma etapa por vez', async () => {
    pedidosRepository.buscarPorId.mockResolvedValue({
      id: 5,
      status: StatusPedido.AGUARDANDO_PAGAMENTO,
      itens: [],
    });

    await expect(
      service.atualizarStatus(5, StatusPedido.ENVIADO),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    await service.atualizarStatus(5, StatusPedido.PAGAMENTO_APROVADO);
    expect(pedidosRepository.atualizarStatus).toHaveBeenCalledWith(
      5,
      StatusPedido.PAGAMENTO_APROVADO,
      'APROVADO',
      {},
    );
  });

  it('pedido entregue não pode ser cancelado; cancelado não muda mais', async () => {
    pedidosRepository.buscarPorId.mockResolvedValueOnce({
      id: 5,
      status: StatusPedido.ENTREGUE,
      itens: [],
    });
    await expect(
      service.atualizarStatus(5, StatusPedido.CANCELADO),
    ).rejects.toThrow('Pedido já entregue não pode ser cancelado.');

    pedidosRepository.buscarPorId.mockResolvedValueOnce({
      id: 5,
      status: StatusPedido.CANCELADO,
      itens: [],
    });
    await expect(
      service.atualizarStatus(5, StatusPedido.PAGAMENTO_APROVADO),
    ).rejects.toThrow('Pedido cancelado não pode mudar de status.');
  });

  it('cancelar devolve as unidades ao estoque', async () => {
    pedidosRepository.buscarPorId.mockResolvedValue({
      id: 5,
      status: StatusPedido.EM_PREPARACAO,
      itens: [
        { produtoId: 1, quantidade: 2 },
        { produtoId: null, quantidade: 1 },
      ],
    });

    await service.atualizarStatus(5, StatusPedido.CANCELADO);

    expect(produtosService.devolverEstoque).toHaveBeenCalledTimes(1);
    expect(produtosService.devolverEstoque).toHaveBeenCalledWith(1, 2, {});
    expect(pedidosRepository.atualizarStatus).toHaveBeenCalledWith(
      5,
      StatusPedido.CANCELADO,
      'CANCELADO',
      {},
    );
  });
});

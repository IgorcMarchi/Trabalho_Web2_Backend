import {
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CategoriasService } from '../categorias/categorias.service';
import { Papel } from '../comum/tipos/papel.enum';
import { FiltroStatusProduto, ListarProdutosDto } from './dto/produto.dto';
import { ProdutosRepository } from './produtos.repository';
import { ProdutosService } from './produtos.service';
import { StatusProduto } from './status-produto.enum';

describe('ProdutosService', () => {
  let service: ProdutosService;
  const repositorio = {
    listar: jest.fn().mockResolvedValue([[], 0]),
    buscarPorId: jest.fn(),
    criar: jest.fn(),
    salvar: jest.fn(),
    excluir: jest.fn(),
    resumoAvaliacoes: jest.fn().mockResolvedValue({ media: 0, total: 0 }),
  };
  const categoriasService = {
    buscarEntidade: jest.fn().mockResolvedValue({ id: 1, nome: 'Joias' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const modulo = await Test.createTestingModule({
      providers: [
        ProdutosService,
        { provide: ProdutosRepository, useValue: repositorio },
        { provide: CategoriasService, useValue: categoriasService },
      ],
    }).compile();
    service = modulo.get(ProdutosService);
  });

  const filtros = (status: FiltroStatusProduto) =>
    Object.assign(new ListarProdutosDto(), { pagina: 1, limite: 10, status });

  it('visitante e cliente não listam produtos inativos (403)', async () => {
    await expect(
      service.listar(filtros(FiltroStatusProduto.TODOS)),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.listar(filtros(FiltroStatusProduto.INATIVO), {
        sub: 2,
        email: 'a@a.com',
        papel: Papel.CLIENTE,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('a loja pede só ATIVO; o admin com TODOS não filtra status', async () => {
    await service.listar(filtros(FiltroStatusProduto.ATIVO));
    expect(repositorio.listar).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: StatusProduto.ATIVO }),
    );

    await service.listar(filtros(FiltroStatusProduto.TODOS), {
      sub: 1,
      email: 'admin@x.com',
      papel: Papel.ADMIN,
    });
    expect(repositorio.listar).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: undefined }),
    );
  });

  it('produto inativo não aparece para o cliente (404)', async () => {
    repositorio.buscarPorId.mockResolvedValue({
      id: 1,
      status: StatusProduto.INATIVO,
    });
    await expect(service.buscar(1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('preço promocional igual ou maior que o preço -> 422', async () => {
    await expect(
      service.criar({
        nome: 'Anel',
        descricao: 'Anel de prata 925',
        preco: 50,
        precoPromocional: 50,
        imagem: 'https://exemplo.com/anel.png',
        categoriaId: 1,
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(repositorio.criar).not.toHaveBeenCalled();
  });

  it('PATCH que baixa o preço abaixo da promoção também é barrado', async () => {
    repositorio.buscarPorId.mockResolvedValue({
      id: 1,
      preco: 100,
      precoPromocional: 80,
      categoriaId: 1,
    });
    await expect(service.atualizar(1, { preco: 70 })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(repositorio.salvar).not.toHaveBeenCalled();
  });

  it('excluir produto inexistente -> 404', async () => {
    repositorio.buscarPorId.mockResolvedValue(null);
    await expect(service.remover(99)).rejects.toBeInstanceOf(NotFoundException);
    expect(repositorio.excluir).not.toHaveBeenCalled();
  });
});

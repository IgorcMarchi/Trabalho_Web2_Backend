import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CategoriasRepository } from './categorias.repository';
import { CategoriasService } from './categorias.service';

describe('CategoriasService', () => {
  let service: CategoriasService;
  const repositorio = {
    buscarPorId: jest.fn(),
    buscarPorNome: jest.fn(),
    contarProdutos: jest.fn(),
    criar: jest.fn(),
    salvar: jest.fn(),
    remover: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const modulo = await Test.createTestingModule({
      providers: [
        CategoriasService,
        { provide: CategoriasRepository, useValue: repositorio },
      ],
    }).compile();
    service = modulo.get(CategoriasService);
  });

  it('não exclui categoria que ainda tem produtos (409)', async () => {
    repositorio.buscarPorId.mockResolvedValue({ id: 1, nome: 'Joias' });
    repositorio.contarProdutos.mockResolvedValue(4);

    await expect(service.remover(1)).rejects.toBeInstanceOf(ConflictException);
    expect(repositorio.remover).not.toHaveBeenCalled();
  });

  it('exclui categoria vazia', async () => {
    repositorio.buscarPorId.mockResolvedValue({ id: 5, nome: 'Livros' });
    repositorio.contarProdutos.mockResolvedValue(0);

    await service.remover(5);
    expect(repositorio.remover).toHaveBeenCalledWith(5);
  });

  it('nome repetido (sem diferenciar maiúsculas) -> 409', async () => {
    repositorio.buscarPorNome.mockResolvedValue({ id: 2, nome: 'Joias' });
    await expect(service.criar({ nome: 'JOIAS' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('categoria inexistente -> 404', async () => {
    repositorio.buscarPorId.mockResolvedValue(null);
    await expect(service.buscarEntidade(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

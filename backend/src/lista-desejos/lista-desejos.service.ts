import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  calcularSalto,
  montarPagina,
  Pagina,
  PaginacaoDto,
} from '../comum/dto/paginacao.dto';
import type { UsuarioToken } from '../comum/tipos/usuario-token.interface';
import { Produto } from '../produtos/produto.entity';
import { ProdutosService } from '../produtos/produtos.service';
import { ListaDesejosRepository } from './lista-desejos.repository';

// Cada usuário mexe só na própria lista: o id vem sempre do token.
@Injectable()
export class ListaDesejosService {
  constructor(
    private readonly listaDesejosRepository: ListaDesejosRepository,
    private readonly produtosService: ProdutosService,
  ) {}

  async listar(
    usuario: UsuarioToken,
    paginacao: PaginacaoDto,
  ): Promise<Pagina<Produto>> {
    const { skip, take } = calcularSalto(paginacao);
    const [itens, total] = await this.listaDesejosRepository.listar(
      usuario.sub,
      skip,
      take,
    );
    return montarPagina(itens, total, paginacao);
  }

  async adicionar(usuario: UsuarioToken, produtoId: number): Promise<Produto> {
    const produto = await this.produtosService.buscarAtivo(produtoId);

    if (await this.listaDesejosRepository.contem(usuario.sub, produtoId)) {
      throw new ConflictException(
        'Este produto já está na sua lista de desejos.',
      );
    }

    await this.listaDesejosRepository.adicionar(usuario.sub, produtoId);
    return produto;
  }

  async remover(usuario: UsuarioToken, produtoId: number): Promise<void> {
    if (!(await this.listaDesejosRepository.contem(usuario.sub, produtoId))) {
      throw new NotFoundException(
        'Este produto não está na sua lista de desejos.',
      );
    }

    await this.listaDesejosRepository.remover(usuario.sub, produtoId);
  }
}

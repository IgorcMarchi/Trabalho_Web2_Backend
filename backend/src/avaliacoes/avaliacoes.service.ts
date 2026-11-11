import { Injectable, NotFoundException } from '@nestjs/common';
import {
  calcularSalto,
  montarPagina,
  Pagina,
} from '../comum/dto/paginacao.dto';
import { Papel } from '../comum/tipos/papel.enum';
import type { UsuarioToken } from '../comum/tipos/usuario-token.interface';
import { ProdutosService } from '../produtos/produtos.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { Avaliacao } from './avaliacao.entity';
import { AvaliacoesRepository } from './avaliacoes.repository';
import {
  AvaliacaoRespostaDto,
  CriarAvaliacaoDto,
  ListarAvaliacoesDto,
} from './dto/avaliacao.dto';

@Injectable()
export class AvaliacoesService {
  constructor(
    private readonly avaliacoesRepository: AvaliacoesRepository,
    private readonly produtosService: ProdutosService,
    private readonly usuariosService: UsuariosService,
  ) {}

  async listar(
    filtros: ListarAvaliacoesDto,
    usuario?: UsuarioToken,
  ): Promise<Pagina<AvaliacaoRespostaDto>> {
    const admin = usuario?.papel === Papel.ADMIN;
    const { skip, take } = calcularSalto(filtros);
    const [itens, total] = await this.avaliacoesRepository.listar(
      filtros.produtoId,
      skip,
      take,
      admin,
    );

    return montarPagina(
      itens.map((avaliacao) => this.paraResposta(avaliacao, admin)),
      total,
      filtros,
    );
  }

  async criar(
    dto: CriarAvaliacaoDto,
    usuario: UsuarioToken,
  ): Promise<AvaliacaoRespostaDto> {
    // só dá para avaliar produto que está à venda
    const produto = await this.produtosService.buscarAtivo(dto.produtoId);
    const autor = await this.usuariosService.buscarPorId(usuario.sub);

    const criada = await this.avaliacoesRepository.criar({
      produto,
      usuarioId: autor.id,
      autorNome: autor.nome,
      nota: dto.nota,
      comentario: dto.comentario,
    });

    const completa = await this.avaliacoesRepository.buscarPorId(criada.id);
    return this.paraResposta(completa!, usuario.papel === Papel.ADMIN);
  }

  async remover(id: number): Promise<void> {
    const removidas = await this.avaliacoesRepository.remover(id);
    if (removidas === 0) {
      throw new NotFoundException(`Avaliação ${id} não encontrada.`);
    }
  }

  // o e-mail de quem avaliou é dado pessoal: só o admin enxerga
  private paraResposta(
    avaliacao: Avaliacao,
    admin: boolean,
  ): AvaliacaoRespostaDto {
    return {
      id: avaliacao.id,
      produtoId: avaliacao.produtoId,
      produtoNome: avaliacao.produto?.nome ?? null,
      autorNome: avaliacao.autorNome,
      ...(admin ? { autorEmail: avaliacao.usuario?.email ?? null } : {}),
      nota: avaliacao.nota,
      comentario: avaliacao.comentario,
      criadoEm: avaliacao.criadoEm,
    };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import {
  calcularSalto,
  montarPagina,
  Pagina,
  PaginacaoDto,
} from '../comum/dto/paginacao.dto';
import { Papel } from '../comum/tipos/papel.enum';
import type { UsuarioToken } from '../comum/tipos/usuario-token.interface';
import { UsuariosService } from '../usuarios/usuarios.service';
import { CriarFeedbackDto, FeedbackRespostaDto } from './dto/feedback.dto';
import { Feedback } from './feedback.entity';
import { FeedbackRepository } from './feedback.repository';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly feedbackRepository: FeedbackRepository,
    private readonly usuariosService: UsuariosService,
  ) {}

  async listar(
    paginacao: PaginacaoDto,
    usuario?: UsuarioToken,
  ): Promise<Pagina<FeedbackRespostaDto>> {
    const { skip, take } = calcularSalto(paginacao);
    const [itens, total] = await this.feedbackRepository.listar(skip, take);
    const admin = usuario?.papel === Papel.ADMIN;
    return montarPagina(
      itens.map((f) => this.paraResposta(f, admin)),
      total,
      paginacao,
    );
  }

  async criar(
    dto: CriarFeedbackDto,
    usuario: UsuarioToken,
  ): Promise<FeedbackRespostaDto> {
    const autor = await this.usuariosService.buscarPorId(usuario.sub);

    const criado = await this.feedbackRepository.criar({
      usuarioId: autor.id,
      autorNome: autor.nome,
      nota: dto.nota,
      comentario: dto.comentario,
    });

    const completo = await this.feedbackRepository.buscarPorId(criado.id);
    return this.paraResposta(completo!, usuario.papel === Papel.ADMIN);
  }

  async remover(id: number): Promise<void> {
    const removidos = await this.feedbackRepository.remover(id);
    if (removidos === 0) {
      throw new NotFoundException(`Feedback ${id} não encontrado.`);
    }
  }

  private paraResposta(
    feedback: Feedback,
    admin: boolean,
  ): FeedbackRespostaDto {
    return {
      id: feedback.id,
      autorNome: feedback.autorNome,
      ...(admin ? { autorEmail: feedback.usuario?.email ?? null } : {}),
      nota: feedback.nota,
      comentario: feedback.comentario,
      criadoEm: feedback.criadoEm,
    };
  }
}

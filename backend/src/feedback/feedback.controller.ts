import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  AcessoAdmin,
  AcessoAutenticado,
  AcessoPublico,
} from '../comum/decorators/acesso.decorator';
import {
  ApiErros,
  ApiSemConteudo,
  ApiSucesso,
} from '../comum/decorators/api-respostas.decorator';
import { UsuarioAtual } from '../comum/decorators/usuario-atual.decorator';
import { PaginacaoDto } from '../comum/dto/paginacao.dto';
import type { UsuarioToken } from '../comum/tipos/usuario-token.interface';
import { CriarFeedbackDto, FeedbackRespostaDto } from './dto/feedback.dto';
import { FeedbackService } from './feedback.service';

@ApiTags('Feedback')
@Controller('feedbacks')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  @AcessoPublico()
  @ApiOperation({
    summary: 'Listar feedbacks do site [Público]',
    description:
      'Com token de ADMIN, cada feedback traz também o e-mail do autor.',
  })
  @ApiSucesso(FeedbackRespostaDto, { paginada: true })
  @ApiErros(400)
  listar(
    @Query() paginacao: PaginacaoDto,
    @UsuarioAtual() usuario?: UsuarioToken,
  ) {
    return this.feedbackService.listar(paginacao, usuario);
  }

  @Post()
  @AcessoAutenticado()
  @ApiOperation({ summary: 'Enviar feedback sobre o site' })
  @ApiSucesso(FeedbackRespostaDto, {
    status: 201,
    descricao: 'Feedback criado',
  })
  @ApiErros(400)
  criar(@Body() dto: CriarFeedbackDto, @UsuarioAtual() usuario: UsuarioToken) {
    return this.feedbackService.criar(dto, usuario);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AcessoAdmin()
  @ApiOperation({ summary: 'Remover feedback (moderação) [ADMIN]' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiSemConteudo()
  @ApiErros(400, { status: 404, mensagem: 'Feedback 99 não encontrado.' })
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.feedbackService.remover(id);
  }
}

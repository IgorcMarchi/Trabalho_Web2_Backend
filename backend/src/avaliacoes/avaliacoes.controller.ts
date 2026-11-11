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
import type { UsuarioToken } from '../comum/tipos/usuario-token.interface';
import { AvaliacoesService } from './avaliacoes.service';
import {
  AvaliacaoRespostaDto,
  CriarAvaliacaoDto,
  ListarAvaliacoesDto,
} from './dto/avaliacao.dto';

@ApiTags('Avaliações')
@Controller('avaliacoes')
export class AvaliacoesController {
  constructor(private readonly avaliacoesService: AvaliacoesService) {}

  @Get()
  @AcessoPublico()
  @ApiOperation({
    summary: 'Listar avaliações de produtos [Público]',
    description:
      'Filtre por produtoId para a página do produto. Com token de ADMIN, cada avaliação traz também o e-mail do autor.',
  })
  @ApiSucesso(AvaliacaoRespostaDto, { paginada: true })
  @ApiErros(400)
  listar(
    @Query() filtros: ListarAvaliacoesDto,
    @UsuarioAtual() usuario?: UsuarioToken,
  ) {
    return this.avaliacoesService.listar(filtros, usuario);
  }

  @Post()
  @AcessoAutenticado()
  @ApiOperation({
    summary: 'Avaliar um produto',
    description: 'O nome do autor é o do usuário logado (não vem no corpo).',
  })
  @ApiSucesso(AvaliacaoRespostaDto, {
    status: 201,
    descricao: 'Avaliação criada',
  })
  @ApiErros(400, {
    status: 404,
    mensagem: 'Produto 999 não encontrado ou indisponível.',
  })
  criar(@Body() dto: CriarAvaliacaoDto, @UsuarioAtual() usuario: UsuarioToken) {
    return this.avaliacoesService.criar(dto, usuario);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AcessoAdmin()
  @ApiOperation({ summary: 'Remover avaliação (moderação) [ADMIN]' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiSemConteudo()
  @ApiErros(400, { status: 404, mensagem: 'Avaliação 99 não encontrada.' })
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.avaliacoesService.remover(id);
  }
}

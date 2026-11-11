import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  AcessoAdmin,
  AcessoPublico,
} from '../comum/decorators/acesso.decorator';
import {
  ApiErros,
  ApiSemConteudo,
  ApiSucesso,
} from '../comum/decorators/api-respostas.decorator';
import { UsuarioAtual } from '../comum/decorators/usuario-atual.decorator';
import type { UsuarioToken } from '../comum/tipos/usuario-token.interface';
import {
  AtualizarPromocaoDto,
  CriarPromocaoDto,
  ListarPromocoesDto,
  PromocaoRespostaDto,
} from './dto/promocao.dto';
import { PromocoesService } from './promocoes.service';

@ApiTags('Promoções')
@Controller('promocoes')
export class PromocoesController {
  constructor(private readonly promocoesService: PromocoesService) {}

  @Get()
  @AcessoPublico()
  @ApiOperation({
    summary: 'Listar promoções [Público]',
    description:
      'Sem filtro: só as que estão valendo hoje (ativas e dentro do período). situacao=TODAS exige token de ADMIN.',
  })
  @ApiSucesso(PromocaoRespostaDto, { lista: true })
  @ApiErros(400, {
    status: 403,
    mensagem: 'Somente administradores podem ver promoções fora do período.',
  })
  listar(
    @Query() filtros: ListarPromocoesDto,
    @UsuarioAtual() usuario?: UsuarioToken,
  ) {
    return this.promocoesService.listar(filtros.situacao, usuario);
  }

  @Get(':id')
  @AcessoPublico()
  @ApiOperation({
    summary: 'Consultar promoção [Público]',
    description:
      'Promoção fora do período só é visível para ADMIN (para os outros, 404).',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiSucesso(PromocaoRespostaDto)
  @ApiErros(400, { status: 404, mensagem: 'Promoção 9 não encontrada.' })
  buscar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario?: UsuarioToken,
  ) {
    return this.promocoesService.buscar(id, usuario);
  }

  @Post()
  @AcessoAdmin()
  @ApiOperation({
    summary: 'Cadastrar promoção [ADMIN]',
    description:
      'Se ela já estiver valendo, o preço promocional é gravado na hora nos produtos alcançados.',
  })
  @ApiSucesso(PromocaoRespostaDto, {
    status: 201,
    descricao: 'Promoção criada',
  })
  @ApiErros(
    400,
    { status: 404, mensagem: 'Categoria 99 não encontrada.' },
    { status: 422, mensagem: 'A porcentagem não pode passar de 100.' },
  )
  criar(@Body() dto: CriarPromocaoDto) {
    return this.promocoesService.criar(dto);
  }

  @Patch(':id')
  @AcessoAdmin()
  @ApiOperation({
    summary: 'Atualizar, ativar ou desativar promoção [ADMIN]',
    description:
      'Desativar ({ "ativa": false }) devolve o preço normal dos produtos.',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiSucesso(PromocaoRespostaDto)
  @ApiErros(400, 404, {
    status: 422,
    mensagem:
      'A data de término precisa ser igual ou depois da data de início.',
  })
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarPromocaoDto,
  ) {
    return this.promocoesService.atualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AcessoAdmin()
  @ApiOperation({
    summary: 'Excluir promoção [ADMIN]',
    description: 'Antes de apagar, devolve o preço normal dos produtos.',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiSemConteudo()
  @ApiErros(400, { status: 404, mensagem: 'Promoção 9 não encontrada.' })
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.promocoesService.remover(id);
  }
}

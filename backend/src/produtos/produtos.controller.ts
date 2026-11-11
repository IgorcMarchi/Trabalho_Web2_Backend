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
  AtualizarProdutoDto,
  CriarProdutoDto,
  ListarProdutosDto,
  ProdutoDetalheDto,
} from './dto/produto.dto';
import { Produto } from './produto.entity';
import { ProdutosService } from './produtos.service';

@ApiTags('Produtos')
@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  @Get()
  @AcessoPublico()
  @ApiOperation({
    summary: 'Listar produtos [Público]',
    description:
      'Busca por nome, filtro por categoria e por promoção, com paginação (máx. 50 por página). ' +
      'Visitantes veem só os ATIVOS; status=INATIVO ou TODOS exige token de ADMIN.',
  })
  @ApiSucesso(Produto, { paginada: true })
  @ApiErros(400, {
    status: 403,
    mensagem: 'Somente administradores podem listar produtos inativos.',
  })
  listar(
    @Query() filtros: ListarProdutosDto,
    @UsuarioAtual() usuario?: UsuarioToken,
  ) {
    return this.produtosService.listar(filtros, usuario);
  }

  @Get(':id')
  @AcessoPublico()
  @ApiOperation({
    summary: 'Consultar um produto [Público]',
    description: 'Traz também a média e o total de avaliações.',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiSucesso(ProdutoDetalheDto)
  @ApiErros(400, { status: 404, mensagem: 'Produto 999 não encontrado.' })
  buscar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario?: UsuarioToken,
  ) {
    return this.produtosService.buscar(id, usuario);
  }

  @Post()
  @AcessoAdmin()
  @ApiOperation({ summary: 'Cadastrar produto [ADMIN]' })
  @ApiSucesso(Produto, { status: 201, descricao: 'Produto criado' })
  @ApiErros(
    400,
    { status: 404, mensagem: 'Categoria 99 não encontrada.' },
    {
      status: 422,
      mensagem: 'O preço promocional precisa ser menor que o preço normal.',
    },
  )
  criar(@Body() dto: CriarProdutoDto) {
    return this.produtosService.criar(dto);
  }

  @Patch(':id')
  @AcessoAdmin()
  @ApiOperation({
    summary: 'Atualizar produto [ADMIN]',
    description:
      'Atualização parcial: envie só os campos que mudam. Ativar/desativar = { "status": "INATIVO" }.',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiSucesso(Produto)
  @ApiErros(400, 404, {
    status: 422,
    mensagem: 'O preço promocional precisa ser menor que o preço normal.',
  })
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarProdutoDto,
  ) {
    return this.produtosService.atualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AcessoAdmin()
  @ApiOperation({
    summary: 'Excluir produto [ADMIN]',
    description:
      'Exclusão lógica (soft delete): some da loja e do painel, mas os pedidos antigos continuam apontando para ele.',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiSemConteudo()
  @ApiErros(400, { status: 404, mensagem: 'Produto 999 não encontrado.' })
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.produtosService.remover(id);
  }
}

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
import { CategoriasService } from './categorias.service';
import {
  AtualizarCategoriaDto,
  CategoriaRespostaDto,
  CriarCategoriaDto,
  ListarCategoriasDto,
} from './dto/categoria.dto';

@ApiTags('Categorias')
@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Get()
  @AcessoPublico()
  @ApiOperation({
    summary: 'Listar categorias [Público]',
    description:
      'Lista curta e sem paginação (é usada nos menus e filtros). Cada categoria traz quantos produtos tem.',
  })
  @ApiSucesso(CategoriaRespostaDto, { lista: true })
  @ApiErros(400)
  listar(@Query() filtros: ListarCategoriasDto) {
    return this.categoriasService.listar(filtros.ativa);
  }

  @Get(':id')
  @AcessoPublico()
  @ApiOperation({ summary: 'Consultar uma categoria [Público]' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiSucesso(CategoriaRespostaDto)
  @ApiErros(400, { status: 404, mensagem: 'Categoria 99 não encontrada.' })
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.categoriasService.buscar(id);
  }

  @Post()
  @AcessoAdmin()
  @ApiOperation({ summary: 'Cadastrar categoria [ADMIN]' })
  @ApiSucesso(CategoriaRespostaDto, {
    status: 201,
    descricao: 'Categoria criada',
  })
  @ApiErros(400, {
    status: 409,
    mensagem: 'Já existe uma categoria com esse nome.',
  })
  criar(@Body() dto: CriarCategoriaDto) {
    return this.categoriasService.criar(dto);
  }

  @Patch(':id')
  @AcessoAdmin()
  @ApiOperation({
    summary: 'Renomear, ativar ou desativar categoria [ADMIN]',
    description: 'Categoria desativada some dos filtros da loja.',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiSucesso(CategoriaRespostaDto)
  @ApiErros(400, 404, {
    status: 409,
    mensagem: 'Já existe uma categoria com esse nome.',
  })
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarCategoriaDto,
  ) {
    return this.categoriasService.atualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AcessoAdmin()
  @ApiOperation({
    summary: 'Excluir categoria [ADMIN]',
    description:
      'Só é permitido quando a categoria não tem produtos (senão 409).',
  })
  @ApiParam({ name: 'id', example: 5 })
  @ApiSemConteudo()
  @ApiErros(400, 404, {
    status: 409,
    mensagem:
      'Essa categoria ainda tem 6 produto(s). Mova ou exclua os produtos primeiro.',
  })
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.categoriasService.remover(id);
  }
}

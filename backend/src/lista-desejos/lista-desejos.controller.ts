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
import { AcessoAutenticado } from '../comum/decorators/acesso.decorator';
import {
  ApiErros,
  ApiSemConteudo,
  ApiSucesso,
} from '../comum/decorators/api-respostas.decorator';
import { UsuarioAtual } from '../comum/decorators/usuario-atual.decorator';
import { PaginacaoDto } from '../comum/dto/paginacao.dto';
import type { UsuarioToken } from '../comum/tipos/usuario-token.interface';
import { Produto } from '../produtos/produto.entity';
import { AdicionarDesejoDto } from './dto/adicionar-desejo.dto';
import { ListaDesejosService } from './lista-desejos.service';

@ApiTags('Lista de desejos')
@Controller('lista-desejos')
export class ListaDesejosController {
  constructor(private readonly listaDesejosService: ListaDesejosService) {}

  @Get()
  @AcessoAutenticado()
  @ApiOperation({ summary: 'Listar minha lista de desejos' })
  @ApiSucesso(Produto, { paginada: true })
  @ApiErros(400)
  listar(
    @UsuarioAtual() usuario: UsuarioToken,
    @Query() paginacao: PaginacaoDto,
  ) {
    return this.listaDesejosService.listar(usuario, paginacao);
  }

  @Post()
  @AcessoAutenticado()
  @ApiOperation({ summary: 'Adicionar produto à minha lista de desejos' })
  @ApiSucesso(Produto, {
    status: 201,
    descricao: 'Produto adicionado (devolve o produto)',
  })
  @ApiErros(
    400,
    { status: 404, mensagem: 'Produto 999 não encontrado ou indisponível.' },
    { status: 409, mensagem: 'Este produto já está na sua lista de desejos.' },
  )
  adicionar(
    @UsuarioAtual() usuario: UsuarioToken,
    @Body() dto: AdicionarDesejoDto,
  ) {
    return this.listaDesejosService.adicionar(usuario, dto.produtoId);
  }

  @Delete(':produtoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AcessoAutenticado()
  @ApiOperation({ summary: 'Remover produto da minha lista de desejos' })
  @ApiParam({ name: 'produtoId', example: 3 })
  @ApiSemConteudo()
  @ApiErros(400, {
    status: 404,
    mensagem: 'Este produto não está na sua lista de desejos.',
  })
  remover(
    @UsuarioAtual() usuario: UsuarioToken,
    @Param('produtoId', ParseIntPipe) produtoId: number,
  ) {
    return this.listaDesejosService.remover(usuario, produtoId);
  }
}

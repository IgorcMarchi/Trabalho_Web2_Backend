import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  AcessoAdmin,
  AcessoAutenticado,
} from '../comum/decorators/acesso.decorator';
import {
  ApiErros,
  ApiSucesso,
} from '../comum/decorators/api-respostas.decorator';
import { UsuarioAtual } from '../comum/decorators/usuario-atual.decorator';
import { PaginacaoDto } from '../comum/dto/paginacao.dto';
import type { UsuarioToken } from '../comum/tipos/usuario-token.interface';
import {
  AtualizarStatusPedidoDto,
  CriarPedidoDto,
  ListarPedidosDto,
} from './dto/pedido.dto';
import { Pedido } from './pedido.entity';
import { PedidosService } from './pedidos.service';

@ApiTags('Pedidos')
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post()
  @AcessoAutenticado()
  @ApiOperation({
    summary: 'Finalizar compra (criar pedido)',
    description:
      'Envie só produtoId e quantidade. O servidor confere se cada produto existe e está ativo, ' +
      'baixa o estoque e calcula preços e total com os dados do banco, tudo numa transação. ' +
      'O cliente do pedido é o dono do token.',
  })
  @ApiSucesso(Pedido, { status: 201, descricao: 'Pedido criado' })
  @ApiErros(
    400,
    { status: 404, mensagem: 'Produto 999 não encontrado ou indisponível.' },
    {
      status: 409,
      codigo: 'SEM_ESTOQUE',
      mensagem:
        'Estoque insuficiente para "Mochila Fjallraven": pedido 5, disponível 2.',
    },
  )
  criar(@Body() dto: CriarPedidoDto, @UsuarioAtual() usuario: UsuarioToken) {
    return this.pedidosService.criar(dto, usuario);
  }

  // rota fixa declarada ANTES de ":id"
  @Get('meus')
  @AcessoAutenticado()
  @ApiOperation({
    summary: 'Meus pedidos',
    description: 'Somente os pedidos do dono do token, mais novos primeiro.',
  })
  @ApiSucesso(Pedido, { paginada: true })
  @ApiErros(400)
  listarMeus(
    @UsuarioAtual() usuario: UsuarioToken,
    @Query() paginacao: PaginacaoDto,
  ) {
    return this.pedidosService.listarMeus(usuario, paginacao);
  }

  @Get()
  @AcessoAdmin()
  @ApiOperation({
    summary: 'Listar todos os pedidos [ADMIN]',
    description: 'Busca por cliente, e-mail ou número e filtro por status.',
  })
  @ApiSucesso(Pedido, { paginada: true })
  @ApiErros(400)
  listarTodos(@Query() filtros: ListarPedidosDto) {
    return this.pedidosService.listarTodos(filtros);
  }

  @Get(':id')
  @AcessoAutenticado()
  @ApiOperation({
    summary: 'Consultar um pedido',
    description:
      'O cliente só consegue abrir os próprios pedidos; pedido de outra pessoa responde 404. O ADMIN abre qualquer um.',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiSucesso(Pedido)
  @ApiErros(400, { status: 404, mensagem: 'Pedido 7 não encontrado.' })
  buscar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: UsuarioToken,
  ) {
    return this.pedidosService.buscar(id, usuario);
  }

  @Patch(':id/status')
  @AcessoAdmin()
  @ApiOperation({
    summary: 'Avançar ou cancelar um pedido [ADMIN]',
    description:
      'Aceita só o próximo status da esteira (AGUARDANDO PAGAMENTO -> PAGAMENTO APROVADO -> EM PREPARAÇÃO -> ENVIADO -> ENTREGUE) ' +
      'ou CANCELADO. Cancelar devolve as unidades ao estoque.',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiSucesso(Pedido)
  @ApiErros(400, 404, {
    status: 422,
    mensagem:
      'Transição de status inválida: AGUARDANDO PAGAMENTO -> ENVIADO. O próximo status é PAGAMENTO APROVADO.',
  })
  atualizarStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarStatusPedidoDto,
  ) {
    return this.pedidosService.atualizarStatus(id, dto.status);
  }
}

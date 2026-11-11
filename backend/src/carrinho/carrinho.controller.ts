import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AcessoPublico } from '../comum/decorators/acesso.decorator';
import {
  ApiErros,
  ApiSucesso,
} from '../comum/decorators/api-respostas.decorator';
import { CarrinhoService } from './carrinho.service';
import { CalcularCarrinhoDto, CarrinhoCalculadoDto } from './dto/carrinho.dto';

@ApiTags('Carrinho')
@Controller('carrinho')
export class CarrinhoController {
  constructor(private readonly carrinhoService: CarrinhoService) {}

  @Post('calcular')
  @HttpCode(HttpStatus.OK)
  @AcessoPublico()
  @ApiOperation({
    summary: 'Calcular o carrinho [Público]',
    description:
      'Recebe só produtoId e quantidade e devolve preços, subtotais e total calculados com os dados do banco, ' +
      'além de avisar itens esgotados ou indisponíveis. Não grava nada (é uma simulação; a compra é o POST /pedidos).',
  })
  @ApiSucesso(CarrinhoCalculadoDto)
  @ApiErros(400)
  calcular(@Body() dto: CalcularCarrinhoDto) {
    return this.carrinhoService.calcular(dto.itens);
  }
}

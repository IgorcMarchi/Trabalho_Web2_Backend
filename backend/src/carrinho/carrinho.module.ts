import { Module } from '@nestjs/common';
import { ProdutosModule } from '../produtos/produtos.module';
import { CarrinhoController } from './carrinho.controller';
import { CarrinhoService } from './carrinho.service';

@Module({
  imports: [ProdutosModule],
  controllers: [CarrinhoController],
  providers: [CarrinhoService],
})
export class CarrinhoModule {}

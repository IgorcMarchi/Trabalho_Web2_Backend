import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProdutosModule } from '../produtos/produtos.module';
import { ItemPedido } from './item-pedido.entity';
import { Pedido } from './pedido.entity';
import { PedidosController } from './pedidos.controller';
import { PedidosRepository } from './pedidos.repository';
import { PedidosService } from './pedidos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido, ItemPedido]), ProdutosModule],
  controllers: [PedidosController],
  providers: [PedidosService, PedidosRepository],
})
export class PedidosModule {}

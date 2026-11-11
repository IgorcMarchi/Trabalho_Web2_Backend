import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriasModule } from '../categorias/categorias.module';
import { Produto } from './produto.entity';
import { ProdutosController } from './produtos.controller';
import { ProdutosRepository } from './produtos.repository';
import { ProdutosService } from './produtos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Produto]), CategoriasModule],
  controllers: [ProdutosController],
  providers: [ProdutosService, ProdutosRepository],
  // pedidos, carrinho, promoções e avaliações pedem ao ProdutosService
  // (nunca mexem direto no repository dos produtos)
  exports: [ProdutosService],
})
export class ProdutosModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Produto } from '../produtos/produto.entity';
import { ProdutosModule } from '../produtos/produtos.module';
import { Usuario } from '../usuarios/usuario.entity';
import { ListaDesejosController } from './lista-desejos.controller';
import { ListaDesejosRepository } from './lista-desejos.repository';
import { ListaDesejosService } from './lista-desejos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Produto]), ProdutosModule],
  controllers: [ListaDesejosController],
  providers: [ListaDesejosService, ListaDesejosRepository],
})
export class ListaDesejosModule {}

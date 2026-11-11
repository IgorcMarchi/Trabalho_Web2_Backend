import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Produto } from '../produtos/produto.entity';
import { Categoria } from './categoria.entity';
import { CategoriasController } from './categorias.controller';
import { CategoriasRepository } from './categorias.repository';
import { CategoriasService } from './categorias.service';

@Module({
  imports: [TypeOrmModule.forFeature([Categoria, Produto])],
  controllers: [CategoriasController],
  providers: [CategoriasService, CategoriasRepository],
  exports: [CategoriasService],
})
export class CategoriasModule {}

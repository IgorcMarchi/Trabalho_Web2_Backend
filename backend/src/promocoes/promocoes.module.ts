import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriasModule } from '../categorias/categorias.module';
import { ProdutosModule } from '../produtos/produtos.module';
import { Promocao } from './promocao.entity';
import { PromocoesController } from './promocoes.controller';
import { PromocoesRepository } from './promocoes.repository';
import { PromocoesService } from './promocoes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Promocao]),
    ProdutosModule,
    CategoriasModule,
  ],
  controllers: [PromocoesController],
  providers: [PromocoesService, PromocoesRepository],
})
export class PromocoesModule {}

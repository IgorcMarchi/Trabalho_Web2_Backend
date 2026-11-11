import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProdutosModule } from '../produtos/produtos.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { Avaliacao } from './avaliacao.entity';
import { AvaliacoesController } from './avaliacoes.controller';
import { AvaliacoesRepository } from './avaliacoes.repository';
import { AvaliacoesService } from './avaliacoes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Avaliacao]),
    ProdutosModule,
    UsuariosModule,
  ],
  controllers: [AvaliacoesController],
  providers: [AvaliacoesService, AvaliacoesRepository],
})
export class AvaliacoesModule {}

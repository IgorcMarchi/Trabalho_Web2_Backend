import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AvaliacoesModule } from './avaliacoes/avaliacoes.module';
import { CarrinhoModule } from './carrinho/carrinho.module';
import { CategoriasModule } from './categorias/categorias.module';
import { LoggerMiddleware } from './comum/middlewares/logger.middleware';
import { validarAmbiente } from './config/validar-ambiente';
import { criarOpcoesBanco } from './database/opcoes-banco';
import { FeedbackModule } from './feedback/feedback.module';
import { ListaDesejosModule } from './lista-desejos/lista-desejos.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { ProdutosModule } from './produtos/produtos.module';
import { PromocoesModule } from './promocoes/promocoes.module';
import { RelatoriosModule } from './relatorios/relatorios.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    // lê o .env uma vez e deixa o ConfigService disponível em todo lugar
    ConfigModule.forRoot({ isGlobal: true, validate: validarAmbiente }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: criarOpcoesBanco,
    }),
    // um módulo por assunto
    AuthModule,
    UsuariosModule,
    CategoriasModule,
    ProdutosModule,
    CarrinhoModule,
    PedidosModule,
    ListaDesejosModule,
    PromocoesModule,
    AvaliacoesModule,
    FeedbackModule,
    RelatoriosModule,
  ],
})
export class AppModule implements NestModule {
  // o log vale para toda requisição, de qualquer rota
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}

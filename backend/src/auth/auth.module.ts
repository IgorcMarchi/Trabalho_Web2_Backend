import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { PapeisGuard } from './papeis.guard';

@Module({
  imports: [
    UsuariosModule,
    // o segredo vem do .env (nunca do código) e o token vale 1 hora
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>(
            'JWT_EXPIRES_IN',
            '1h',
          ) as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // A ordem importa: primeiro "quem é você?" (401),
    // depois "o que você pode?" (403).
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PapeisGuard },
  ],
})
export class AuthModule {}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AcessoAutenticado,
  AcessoPublico,
} from '../comum/decorators/acesso.decorator';
import {
  ApiErros,
  ApiSucesso,
} from '../comum/decorators/api-respostas.decorator';
import { UsuarioAtual } from '../comum/decorators/usuario-atual.decorator';
import type { UsuarioToken } from '../comum/tipos/usuario-token.interface';
import { Usuario } from '../usuarios/usuario.entity';
import { AuthService } from './auth.service';
import { LoginRespostaDto } from './dto/login-resposta.dto';
import { LoginDto } from './dto/login.dto';
import { RegistroDto } from './dto/registro.dto';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  @AcessoPublico()
  @ApiOperation({
    summary: 'Criar conta de cliente [Público]',
    description:
      'Cria sempre uma conta CLIENTE e já devolve o token (cadastrou, entrou). ' +
      'Não existe campo "papel": enviar "papel": "ADMIN" resulta em 400.',
  })
  @ApiSucesso(LoginRespostaDto, { status: 201, descricao: 'Conta criada' })
  @ApiErros(400, { status: 409, mensagem: 'Este e-mail já está cadastrado.' })
  registrar(@Body() dto: RegistroDto) {
    return this.authService.registrar(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @AcessoPublico()
  @ApiOperation({
    summary: 'Entrar [Público]',
    description:
      'Confere e-mail e senha (bcrypt) e devolve um JWT válido por 1 hora. ' +
      'Copie o "token" da resposta e use no botão Authorize.',
  })
  @ApiSucesso(LoginRespostaDto, { descricao: 'Login realizado' })
  @ApiErros(
    400,
    { status: 401, mensagem: 'E-mail ou senha inválidos.' },
    {
      status: 403,
      mensagem: 'Esta conta está desativada. Fale com o administrador.',
    },
  )
  entrar(@Body() dto: LoginDto) {
    return this.authService.entrar(dto);
  }

  @Get('eu')
  @AcessoAutenticado()
  @ApiOperation({
    summary: 'Dados do usuário autenticado',
    description:
      'Identifica quem é o dono do token e devolve os próprios dados (sem senha).',
  })
  @ApiSucesso(Usuario)
  eu(@UsuarioAtual() usuario: UsuarioToken) {
    return this.authService.eu(usuario);
  }
}

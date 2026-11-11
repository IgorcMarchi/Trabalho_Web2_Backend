import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { UsuarioToken } from '../comum/tipos/usuario-token.interface';
import { Usuario } from '../usuarios/usuario.entity';
import { RODADAS_BCRYPT, UsuariosService } from '../usuarios/usuarios.service';
import { LoginRespostaDto } from './dto/login-resposta.dto';
import { LoginDto } from './dto/login.dto';
import { RegistroDto } from './dto/registro.dto';

// mensagem genérica de propósito: não conta se o e-mail existe
const CREDENCIAIS_INVALIDAS = 'E-mail ou senha inválidos.';

@Injectable()
export class AuthService {
  // Hash de uma senha qualquer. Quando o e-mail não existe, comparamos
  // com ele mesmo assim, para o login demorar o mesmo tempo nos dois
  // casos (quem mede o tempo não descobre quais e-mails estão cadastrados).
  private readonly hashFalso = bcrypt.hashSync(
    'senha-que-ninguem-usa',
    RODADAS_BCRYPT,
  );

  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  // cadastro já devolve o token, igual a primeira etapa (cadastrou, entrou)
  async registrar(dto: RegistroDto): Promise<LoginRespostaDto> {
    const usuario = await this.usuariosService.criarCliente(dto);
    return this.gerarResposta(usuario);
  }

  async entrar({ email, senha }: LoginDto): Promise<LoginRespostaDto> {
    const usuario = await this.usuariosService.buscarParaLogin(email);

    const senhaConfere = await bcrypt.compare(
      senha,
      usuario ? usuario.senhaHash : this.hashFalso,
    );

    if (!usuario || !senhaConfere) {
      throw new UnauthorizedException(CREDENCIAIS_INVALIDAS);
    }

    // A conta ativa é conferida DEPOIS da senha: assim só quem sabe a
    // senha descobre que a conta foi desativada.
    if (!usuario.ativo) {
      throw new ForbiddenException(
        'Esta conta está desativada. Fale com o administrador.',
      );
    }

    // devolve o usuário sem o hash
    const semSenha = await this.usuariosService.buscarPorId(usuario.id);
    return this.gerarResposta(semSenha);
  }

  eu(usuario: UsuarioToken): Promise<Usuario> {
    return this.usuariosService.buscarPorId(usuario.sub);
  }

  private async gerarResposta(usuario: Usuario): Promise<LoginRespostaDto> {
    // payload mínimo: quem é, e-mail e papel. Nada de senha ou dados pessoais.
    const payload: UsuarioToken = {
      sub: usuario.id,
      email: usuario.email,
      papel: usuario.papel,
    };

    const token = await this.jwtService.signAsync(payload);
    const { exp } = this.jwtService.decode<{ exp: number }>(token);

    return { token, expiraEm: new Date(exp * 1000).toISOString(), usuario };
  }
}

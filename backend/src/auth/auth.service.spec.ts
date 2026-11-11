import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Papel } from '../comum/tipos/papel.enum';
import { UsuariosService } from '../usuarios/usuarios.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let hashDaSenha: string;

  const usuariosService = {
    buscarParaLogin: jest.fn(),
    buscarPorId: jest.fn(),
    criarCliente: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('token.jwt.assinado'),
    decode: jest.fn().mockReturnValue({ exp: 1_800_000_000 }),
  };

  beforeAll(async () => {
    hashDaSenha = await bcrypt.hash('senha123', 4);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const modulo = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsuariosService, useValue: usuariosService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();
    service = modulo.get(AuthService);
  });

  const usuarioAna = {
    id: 2,
    nome: 'Ana',
    email: 'ana@email.com',
    papel: Papel.CLIENTE,
    ativo: true,
  };

  it('login certo devolve token com payload mínimo e usuário sem hash', async () => {
    usuariosService.buscarParaLogin.mockResolvedValue({
      ...usuarioAna,
      senhaHash: hashDaSenha,
    });
    usuariosService.buscarPorId.mockResolvedValue(usuarioAna);

    const resposta = await service.entrar({
      email: 'ana@email.com',
      senha: 'senha123',
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 2,
      email: 'ana@email.com',
      papel: 'CLIENTE',
    });
    expect(resposta.token).toBe('token.jwt.assinado');
    expect(resposta.usuario).not.toHaveProperty('senhaHash');
  });

  it('senha errada e e-mail inexistente recebem a mesma mensagem (401)', async () => {
    usuariosService.buscarParaLogin.mockResolvedValueOnce({
      ...usuarioAna,
      senhaHash: hashDaSenha,
    });
    await expect(
      service.entrar({ email: 'ana@email.com', senha: 'errada' }),
    ).rejects.toThrow(new UnauthorizedException('E-mail ou senha inválidos.'));

    usuariosService.buscarParaLogin.mockResolvedValueOnce(null);
    await expect(
      service.entrar({ email: 'ninguem@email.com', senha: 'x' }),
    ).rejects.toThrow(new UnauthorizedException('E-mail ou senha inválidos.'));
  });

  it('conta desativada com a senha certa -> 403', async () => {
    usuariosService.buscarParaLogin.mockResolvedValue({
      ...usuarioAna,
      ativo: false,
      senhaHash: hashDaSenha,
    });
    await expect(
      service.entrar({ email: 'ana@email.com', senha: 'senha123' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('cadastro com e-mail repetido repassa o 409 do UsuariosService', async () => {
    usuariosService.criarCliente.mockRejectedValue(
      new ConflictException('Este e-mail já está cadastrado.'),
    );
    await expect(
      service.registrar({
        nome: 'Ana',
        email: 'ana@email.com',
        senha: 'senha123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

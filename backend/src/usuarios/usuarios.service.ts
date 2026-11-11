import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  calcularSalto,
  montarPagina,
  Pagina,
} from '../comum/dto/paginacao.dto';
import { Papel } from '../comum/tipos/papel.enum';
import type { UsuarioToken } from '../comum/tipos/usuario-token.interface';
import { ListarUsuariosDto } from './dto/listar-usuarios.dto';
import { Usuario } from './usuario.entity';
import { UsuariosRepository } from './usuarios.repository';

// custo do bcrypt (2^10 rodadas): lento o bastante para atrapalhar
// quem tenta adivinhar senhas, rápido o bastante para o login
export const RODADAS_BCRYPT = 10;

export interface NovoCliente {
  nome: string;
  email: string;
  senha: string;
}

@Injectable()
export class UsuariosService {
  constructor(private readonly usuariosRepository: UsuariosRepository) {}

  // Cadastro público: o papel é SEMPRE CLIENTE, decidido aqui no servidor.
  async criarCliente({ nome, email, senha }: NovoCliente): Promise<Usuario> {
    const jaExiste = await this.usuariosRepository.buscarPorEmail(email);
    if (jaExiste) {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }

    const senhaHash = await bcrypt.hash(senha, RODADAS_BCRYPT);
    const criado = await this.usuariosRepository.criar({
      nome,
      email,
      senhaHash,
      papel: Papel.CLIENTE,
      ativo: true,
    });

    // busca de novo para devolver sem o hash (select: false)
    return this.buscarPorId(criado.id);
  }

  async buscarPorId(id: number): Promise<Usuario> {
    const usuario = await this.usuariosRepository.buscarPorId(id);
    if (!usuario) {
      throw new NotFoundException(`Usuário ${id} não encontrado.`);
    }
    return usuario;
  }

  // usado só pelo AuthService (precisa do hash para comparar a senha)
  buscarParaLogin(email: string): Promise<Usuario | null> {
    return this.usuariosRepository.buscarPorEmailComSenha(email);
  }

  async listar(filtros: ListarUsuariosDto): Promise<Pagina<Usuario>> {
    const [itens, total] = await this.usuariosRepository.listar({
      papel: filtros.papel,
      busca: filtros.busca,
      ...calcularSalto(filtros),
    });
    return montarPagina(itens, total, filtros);
  }

  async alterarAtivo(
    id: number,
    ativo: boolean,
    solicitante: UsuarioToken,
  ): Promise<Usuario> {
    // regra: o administrador não pode se trancar para fora do sistema
    if (id === solicitante.sub && !ativo) {
      throw new UnprocessableEntityException(
        'Você não pode desativar a própria conta.',
      );
    }

    const usuario = await this.buscarPorId(id);
    usuario.ativo = ativo;
    return this.usuariosRepository.salvar(usuario);
  }
}

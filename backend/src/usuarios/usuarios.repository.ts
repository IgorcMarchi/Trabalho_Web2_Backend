import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Papel } from '../comum/tipos/papel.enum';
import { Usuario } from './usuario.entity';

export interface FiltrosUsuarios {
  papel?: Papel;
  busca?: string;
  skip: number;
  take: number;
}

// Só guarda e busca. Não decide nada: devolve null quando não acha,
// e o service é quem transforma isso em 404.
@Injectable()
export class UsuariosRepository {
  constructor(
    @InjectRepository(Usuario)
    private readonly repositorio: Repository<Usuario>,
  ) {}

  buscarPorId(id: number): Promise<Usuario | null> {
    return this.repositorio.findOneBy({ id });
  }

  buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.repositorio.findOneBy({ email });
  }

  // O hash tem select: false. Só o login precisa dele, por isso o
  // addSelect explícito fica isolado neste método.
  buscarPorEmailComSenha(email: string): Promise<Usuario | null> {
    return this.repositorio
      .createQueryBuilder('usuario')
      .addSelect('usuario.senhaHash')
      .where('usuario.email = :email', { email })
      .getOne();
  }

  criar(dados: Partial<Usuario>): Promise<Usuario> {
    return this.repositorio.save(this.repositorio.create(dados));
  }

  salvar(usuario: Usuario): Promise<Usuario> {
    return this.repositorio.save(usuario);
  }

  listar({
    papel,
    busca,
    skip,
    take,
  }: FiltrosUsuarios): Promise<[Usuario[], number]> {
    const base: FindOptionsWhere<Usuario> = papel ? { papel } : {};

    // busca por nome OU e-mail (um array no where vira OR)
    const where = busca
      ? [
          { ...base, nome: ILike(`%${busca}%`) },
          { ...base, email: ILike(`%${busca}%`) },
        ]
      : base;

    return this.repositorio.findAndCount({
      where,
      order: { criadoEm: 'DESC', id: 'DESC' },
      skip,
      take,
    });
  }
}

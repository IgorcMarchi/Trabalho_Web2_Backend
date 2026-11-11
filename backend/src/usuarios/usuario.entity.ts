import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Papel } from '../comum/tipos/papel.enum';
import { Pedido } from '../pedidos/pedido.entity';
import { Produto } from '../produtos/produto.entity';

@Entity('usuarios')
export class Usuario {
  @ApiProperty({ example: 2 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Ana Souza' })
  @Column({ length: 120 })
  nome: string;

  @ApiProperty({ example: 'ana@email.com' })
  @Column({ length: 160, unique: true })
  email: string;

  // Só o hash do bcrypt. select: false = nunca vem nas consultas,
  // a não ser que o repository peça explicitamente (só o login pede).
  @ApiHideProperty()
  @Column({ name: 'senha_hash', select: false })
  senhaHash: string;

  @ApiProperty({ enum: Papel, example: Papel.CLIENTE })
  @Column({ type: 'simple-enum', enum: Papel, default: Papel.CLIENTE })
  papel: Papel;

  @ApiProperty({
    example: true,
    description: 'Conta desativada não consegue entrar',
  })
  @Column({ default: true })
  ativo: boolean;

  // N:N com produtos. A tabela intermediária lista_desejos guarda só
  // os dois ids (usuario_id, produto_id).
  @ApiHideProperty()
  @ManyToMany(() => Produto)
  @JoinTable({
    name: 'lista_desejos',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'produto_id', referencedColumnName: 'id' },
  })
  listaDesejos: Produto[];

  @ApiHideProperty()
  @OneToMany(() => Pedido, (pedido) => pedido.usuario)
  pedidos: Pedido[];

  @ApiProperty({ example: '2026-11-11T12:00:00.000Z' })
  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @ApiProperty({ example: '2026-11-11T12:00:00.000Z' })
  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}

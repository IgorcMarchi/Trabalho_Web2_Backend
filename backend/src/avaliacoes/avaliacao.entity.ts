import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Produto } from '../produtos/produto.entity';
import { Usuario } from '../usuarios/usuario.entity';

// Avaliação de um produto (1 produto tem N avaliações)
@Entity('avaliacoes')
export class Avaliacao {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: () => Produto })
  @ManyToOne(() => Produto, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'produto_id' })
  produto: Relation<Produto>;

  @ApiProperty({ example: 1 })
  @Column({ name: 'produto_id', type: 'integer' })
  produtoId: number;

  // quem escreveu. As avaliações iniciais (do seed) não têm usuário.
  @ApiHideProperty()
  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario> | null;

  @ApiHideProperty()
  @Column({ name: 'usuario_id', type: 'integer', nullable: true })
  usuarioId: number | null;

  @ApiProperty({ example: 'Ana Souza' })
  @Column({ name: 'autor_nome', length: 120 })
  autorNome: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @Column('int')
  nota: number;

  @ApiProperty({ example: 'Mochila muito boa, cabe o notebook direitinho.' })
  @Column({ length: 1000 })
  comentario: string;

  @ApiProperty({ example: '2026-11-11T12:00:00.000Z' })
  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;
}

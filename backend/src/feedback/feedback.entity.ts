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
import { Usuario } from '../usuarios/usuario.entity';

// Avaliação do site em geral (página /feedback)
@Entity('feedbacks')
export class Feedback {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiHideProperty()
  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario> | null;

  @ApiHideProperty()
  @Column({ name: 'usuario_id', type: 'integer', nullable: true })
  usuarioId: number | null;

  @ApiProperty({ example: 'Thiago Moreira' })
  @Column({ name: 'autor_nome', length: 120 })
  autorNome: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @Column('int')
  nota: number;

  @ApiProperty({ example: 'Site simples e fácil de usar.' })
  @Column({ length: 1000 })
  comentario: string;

  @ApiProperty({ example: '2026-11-11T12:00:00.000Z' })
  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;
}

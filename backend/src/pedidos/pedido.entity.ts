import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { transformadorDecimal } from '../comum/transformadores/decimal.transformer';
import { Usuario } from '../usuarios/usuario.entity';
import { ItemPedido } from './item-pedido.entity';
import { FormaPagamento, StatusPagamento, StatusPedido } from './pedido.enums';

@Entity('pedidos')
export class Pedido {
  @ApiProperty({ example: 1, description: 'Número do pedido' })
  @PrimaryGeneratedColumn()
  id: number;

  // N:1 — cada pedido pertence a um usuário (FK no lado N)
  @ApiProperty({ type: () => Usuario })
  @ManyToOne(() => Usuario, (usuario) => usuario.pedidos, { nullable: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;

  @ApiProperty({ example: 2 })
  @Column({ name: 'usuario_id', type: 'integer' })
  usuarioId: number;

  @ApiProperty({ example: 'Ana Souza', description: 'Nome de quem recebe' })
  @Column({ name: 'cliente_nome', length: 120 })
  clienteNome: string;

  @ApiProperty({ example: '(45) 99999-0000' })
  @Column({ length: 20 })
  telefone: string;

  @ApiProperty({ example: '85892-000' })
  @Column({ length: 9 })
  cep: string;

  @ApiProperty({ example: 'Rua das Flores, 100' })
  @Column({ length: 200 })
  endereco: string;

  @ApiProperty({ example: 'Santa Helena' })
  @Column({ length: 100 })
  cidade: string;

  @ApiProperty({ enum: FormaPagamento, example: FormaPagamento.PIX })
  @Column({
    name: 'forma_pagamento',
    type: 'simple-enum',
    enum: FormaPagamento,
  })
  formaPagamento: FormaPagamento;

  @ApiProperty({
    enum: StatusPedido,
    example: StatusPedido.AGUARDANDO_PAGAMENTO,
  })
  @Column({
    type: 'simple-enum',
    enum: StatusPedido,
    default: StatusPedido.AGUARDANDO_PAGAMENTO,
  })
  status: StatusPedido;

  @ApiProperty({ enum: StatusPagamento, example: StatusPagamento.PENDENTE })
  @Column({
    name: 'status_pagamento',
    type: 'simple-enum',
    enum: StatusPagamento,
    default: StatusPagamento.PENDENTE,
  })
  statusPagamento: StatusPagamento;

  // calculado no servidor a partir dos preços do banco
  @ApiProperty({ example: 175.9 })
  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: transformadorDecimal,
  })
  total: number;

  // cascade insert: salvar o pedido já salva os itens junto
  @ApiProperty({ type: () => [ItemPedido] })
  @OneToMany(() => ItemPedido, (item) => item.pedido, { cascade: ['insert'] })
  itens: ItemPedido[];

  @ApiProperty({ example: '2026-11-11T12:00:00.000Z' })
  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @ApiProperty({ example: '2026-11-11T12:00:00.000Z' })
  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}

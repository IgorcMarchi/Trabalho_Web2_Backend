import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Categoria } from '../categorias/categoria.entity';
import { transformadorDecimal } from '../comum/transformadores/decimal.transformer';
import { StatusProduto } from './status-produto.enum';

@Entity('produtos')
export class Produto {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Mochila Fjallraven Foldsack No. 1' })
  @Column({ length: 200 })
  nome: string;

  @ApiProperty({
    example: 'Mochila para o dia a dia, cabe notebook de até 15 polegadas.',
  })
  @Column('text')
  descricao: string;

  // dinheiro sempre em decimal(10,2), nunca float
  @ApiProperty({ example: 109.95, description: 'Preço normal (R$)' })
  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: transformadorDecimal,
  })
  preco: number;

  @ApiProperty({
    example: 87.96,
    nullable: true,
    type: Number,
    description:
      'Preço com desconto. null = sem promoção. É o preço cobrado no checkout.',
  })
  @Column('decimal', {
    name: 'preco_promocional',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: transformadorDecimal,
  })
  precoPromocional: number | null;

  @ApiProperty({
    example: 'https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_t.png',
  })
  @Column({ length: 500 })
  imagem: string;

  @ApiProperty({ enum: StatusProduto, example: StatusProduto.ATIVO })
  @Column({
    type: 'simple-enum',
    enum: StatusProduto,
    default: StatusProduto.ATIVO,
  })
  status: StatusProduto;

  @ApiProperty({ example: 30, description: 'Unidades disponíveis' })
  @Column('int', { default: 0 })
  estoque: number;

  // N:1 — a FK categoria_id fica aqui, no lado N.
  // SET NULL: só acontece com produto excluído (soft delete), porque o
  // service não deixa apagar categoria que ainda tem produto.
  @ApiProperty({ type: () => Categoria, nullable: true })
  @ManyToOne(() => Categoria, (categoria) => categoria.produtos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'categoria_id' })
  categoria: Relation<Categoria> | null;

  @ApiProperty({ example: 1, nullable: true, type: Number })
  @Column({ name: 'categoria_id', type: 'integer', nullable: true })
  categoriaId: number | null;

  @ApiProperty({ example: '2026-11-11T12:00:00.000Z' })
  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @ApiProperty({ example: '2026-11-11T12:00:00.000Z' })
  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;

  // Soft delete: o produto some da loja e do painel, mas continua no
  // banco porque os pedidos antigos apontam para ele (histórico).
  @ApiHideProperty()
  @DeleteDateColumn({ name: 'excluido_em' })
  excluidoEm: Date | null;
}

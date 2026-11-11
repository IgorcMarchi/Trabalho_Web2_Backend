import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { transformadorDecimal } from '../comum/transformadores/decimal.transformer';
import { Produto } from '../produtos/produto.entity';
import { Pedido } from './pedido.entity';

// Entidade intermediária entre Pedido e Produto (N:N com dados extras).
// Ela "fotografa" nome, imagem, categoria e preços no momento da compra:
// se o produto mudar de preço ou de nome depois, o histórico não muda.
@Entity('itens_pedido')
export class ItemPedido {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiHideProperty()
  @ManyToOne(() => Pedido, (pedido) => pedido.itens, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pedido_id' })
  pedido: Relation<Pedido>;

  @ApiHideProperty()
  @ManyToOne(() => Produto, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'produto_id' })
  produto: Relation<Produto> | null;

  @ApiProperty({ example: 1, nullable: true, type: Number })
  @Column({ name: 'produto_id', type: 'integer', nullable: true })
  produtoId: number | null;

  @ApiProperty({ example: 'Mochila Fjallraven Foldsack No. 1' })
  @Column({ name: 'nome_produto', length: 200 })
  nomeProduto: string;

  @ApiProperty({
    example: 'https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_t.png',
  })
  @Column({ length: 500 })
  imagem: string;

  // cópia simples (sem FK): o relatório agrupa pela categoria da época da venda
  @ApiProperty({ example: 4, nullable: true, type: Number })
  @Column({ name: 'categoria_id', type: 'integer', nullable: true })
  categoriaId: number | null;

  @ApiProperty({ example: 'Roupas masculinas', nullable: true, type: String })
  @Column({
    name: 'categoria_nome',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  categoriaNome: string | null;

  @ApiProperty({ example: 2 })
  @Column('int')
  quantidade: number;

  @ApiProperty({
    example: 109.95,
    description: 'Preço normal no momento da compra',
  })
  @Column('decimal', {
    name: 'preco_original',
    precision: 10,
    scale: 2,
    transformer: transformadorDecimal,
  })
  precoOriginal: number;

  @ApiProperty({
    example: 87.96,
    description: 'Preço cobrado (com promoção, se havia)',
  })
  @Column('decimal', {
    name: 'preco_unitario',
    precision: 10,
    scale: 2,
    transformer: transformadorDecimal,
  })
  precoUnitario: number;

  @ApiProperty({ example: 175.92 })
  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: transformadorDecimal,
  })
  subtotal: number;
}

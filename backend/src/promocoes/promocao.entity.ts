import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Categoria } from '../categorias/categoria.entity';
import { transformadorDecimal } from '../comum/transformadores/decimal.transformer';
import { Produto } from '../produtos/produto.entity';
import { AlvoPromocao, TipoDesconto } from './promocao.enums';

@Entity('promocoes')
export class Promocao {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Semana do consumidor' })
  @Column({ length: 120 })
  nome: string;

  @ApiProperty({ enum: TipoDesconto, example: TipoDesconto.PORCENTAGEM })
  @Column({ type: 'simple-enum', enum: TipoDesconto })
  tipo: TipoDesconto;

  @ApiProperty({
    example: 15,
    description: 'Porcentagem (0-100) ou valor em R$',
  })
  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: transformadorDecimal,
  })
  valor: number;

  @ApiProperty({ example: '2026-11-01', description: 'Formato AAAA-MM-DD' })
  @Column({ name: 'data_inicio', type: 'date' })
  dataInicio: string;

  @ApiProperty({ example: '2026-11-30', description: 'Formato AAAA-MM-DD' })
  @Column({ name: 'data_fim', type: 'date' })
  dataFim: string;

  @ApiProperty({ enum: AlvoPromocao, example: AlvoPromocao.CATEGORIA })
  @Column({ type: 'simple-enum', enum: AlvoPromocao })
  alvo: AlvoPromocao;

  // Uma das duas relações é preenchida, conforme o alvo
  @ApiProperty({ type: () => Categoria, nullable: true })
  @ManyToOne(() => Categoria, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoria_id' })
  categoria: Relation<Categoria> | null;

  @ApiProperty({ example: 1, nullable: true, type: Number })
  @Column({ name: 'categoria_id', type: 'integer', nullable: true })
  categoriaId: number | null;

  @ApiProperty({ type: () => Produto, nullable: true })
  @ManyToOne(() => Produto, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'produto_id' })
  produto: Relation<Produto> | null;

  @ApiProperty({ example: null, nullable: true, type: Number })
  @Column({ name: 'produto_id', type: 'integer', nullable: true })
  produtoId: number | null;

  @ApiProperty({ example: true })
  @Column({ default: true })
  ativa: boolean;

  @ApiProperty({ example: '2026-11-11T12:00:00.000Z' })
  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @ApiProperty({ example: '2026-11-11T12:00:00.000Z' })
  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}

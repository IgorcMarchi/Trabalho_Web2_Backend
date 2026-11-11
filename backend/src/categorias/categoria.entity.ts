import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Produto } from '../produtos/produto.entity';

@Entity('categorias')
export class Categoria {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Eletrônicos' })
  @Column({ length: 80, unique: true })
  nome: string;

  @ApiProperty({
    example: true,
    description: 'Categoria inativa some dos filtros da loja',
  })
  @Column({ default: true })
  ativa: boolean;

  // 1:N — a chave estrangeira fica no lado N (produtos.categoria_id)
  @ApiHideProperty()
  @OneToMany(() => Produto, (produto) => produto.categoria)
  produtos: Produto[];

  @ApiProperty({ example: '2026-11-11T12:00:00.000Z' })
  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @ApiProperty({ example: '2026-11-11T12:00:00.000Z' })
  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}

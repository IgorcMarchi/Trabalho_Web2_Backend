import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Categoria } from './categoria.entity';
import { CategoriasRepository } from './categorias.repository';
import {
  AtualizarCategoriaDto,
  CategoriaRespostaDto,
  CriarCategoriaDto,
} from './dto/categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(private readonly categoriasRepository: CategoriasRepository) {}

  async listar(ativa?: boolean): Promise<CategoriaRespostaDto[]> {
    const [categorias, contagem] = await Promise.all([
      this.categoriasRepository.listar(ativa),
      this.categoriasRepository.contarProdutosPorCategoria(),
    ]);

    return categorias.map((categoria) => ({
      ...categoria,
      quantidadeProdutos: contagem.get(categoria.id) ?? 0,
    }));
  }

  async buscar(id: number): Promise<CategoriaRespostaDto> {
    const categoria = await this.buscarEntidade(id);
    const quantidadeProdutos =
      await this.categoriasRepository.contarProdutos(id);
    return { ...categoria, quantidadeProdutos };
  }

  // usado também pelo ProdutosService e pelo PromocoesService
  async buscarEntidade(id: number): Promise<Categoria> {
    const categoria = await this.categoriasRepository.buscarPorId(id);
    if (!categoria) {
      throw new NotFoundException(`Categoria ${id} não encontrada.`);
    }
    return categoria;
  }

  async criar(dto: CriarCategoriaDto): Promise<CategoriaRespostaDto> {
    await this.garantirNomeLivre(dto.nome);
    const categoria = await this.categoriasRepository.criar({
      nome: dto.nome,
      ativa: dto.ativa ?? true,
    });
    return { ...categoria, quantidadeProdutos: 0 };
  }

  // Renomear não precisa mexer nos produtos: eles apontam para o id da
  // categoria (FK), não para o nome como acontecia no localStorage.
  async atualizar(
    id: number,
    dto: AtualizarCategoriaDto,
  ): Promise<CategoriaRespostaDto> {
    const categoria = await this.buscarEntidade(id);

    if (
      dto.nome !== undefined &&
      dto.nome.toLowerCase() !== categoria.nome.toLowerCase()
    ) {
      await this.garantirNomeLivre(dto.nome, id);
    }

    Object.assign(categoria, dto);
    await this.categoriasRepository.salvar(categoria);
    return this.buscar(id);
  }

  async remover(id: number): Promise<void> {
    await this.buscarEntidade(id);

    // não deixa os produtos ficarem órfãos
    const quantidade = await this.categoriasRepository.contarProdutos(id);
    if (quantidade > 0) {
      throw new ConflictException(
        `Essa categoria ainda tem ${quantidade} produto(s). Mova ou exclua os produtos primeiro.`,
      );
    }

    await this.categoriasRepository.remover(id);
  }

  private async garantirNomeLivre(nome: string, idAtual?: number) {
    const existente = await this.categoriasRepository.buscarPorNome(nome);
    if (existente && existente.id !== idAtual) {
      throw new ConflictException('Já existe uma categoria com esse nome.');
    }
  }
}

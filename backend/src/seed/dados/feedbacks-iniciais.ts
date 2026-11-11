// Avaliações que a primeira etapa já trazia prontas (dados/feedbacks.js
// do front-end), para a loja não começar vazia. A chave é o idOriginal do
// produto (o id que ele tinha na Fake Store API).

export interface AvaliacaoInicial {
  nome: string;
  nota: number;
  comentario: string;
}

export const AVALIACOES_INICIAIS: Record<number, AvaliacaoInicial[]> = {
  1: [
    {
      nome: 'Ana Souza',
      nota: 5,
      comentario: 'Mochila muito boa, cabe o notebook direitinho.',
    },
    {
      nome: 'Carlos Lima',
      nota: 4,
      comentario: 'Gostei, só achei o tecido um pouco fino.',
    },
  ],
  2: [
    {
      nome: 'Mariana Alves',
      nota: 4,
      comentario: 'Camiseta confortável, mas veio meio grande.',
    },
  ],
  3: [
    {
      nome: 'Pedro Rocha',
      nota: 5,
      comentario: 'Chegou rápido e é bem resistente.',
    },
    {
      nome: 'Juliana Dias',
      nota: 3,
      comentario: 'Normal, nada demais pelo preço.',
    },
  ],
  4: [
    { nome: 'Rafael Souza', nota: 4, comentario: 'Boa qualidade, recomendo.' },
  ],
  5: [
    {
      nome: 'Beatriz Nunes',
      nota: 5,
      comentario: 'Linda, melhor do que nas fotos.',
    },
    {
      nome: 'Lucas Martins',
      nota: 5,
      comentario: 'Comprei de presente e minha mãe amou.',
    },
  ],
  6: [
    {
      nome: 'Fernanda Castro',
      nota: 3,
      comentario: 'Bonita, mas bem pequena.',
    },
  ],
  8: [
    {
      nome: 'Gabriel Pinto',
      nota: 4,
      comentario: 'Chegou certinho, bom custo benefício.',
    },
  ],
  10: [
    {
      nome: 'Camila Ferreira',
      nota: 5,
      comentario: 'Muito rápido, vale cada centavo.',
    },
  ],
};

export const FEEDBACKS_SITE_INICIAIS: AvaliacaoInicial[] = [
  {
    nome: 'Thiago Moreira',
    nota: 5,
    comentario: 'Site simples e fácil de usar.',
  },
  {
    nome: 'Larissa Gomes',
    nota: 4,
    comentario: 'Achei os produtos rápido, só senti falta de mais filtros.',
  },
];

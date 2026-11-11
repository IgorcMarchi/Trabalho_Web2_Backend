import { ValueTransformer } from 'typeorm';

// Colunas decimal (dinheiro) sempre saem do banco como number,
// nunca como texto. Assim o front recebe 19.9 e não "19.90".
export const transformadorDecimal: ValueTransformer = {
  to: (valor?: number | null) => valor,
  from: (valor?: string | number | null) =>
    valor === null || valor === undefined ? null : Number(valor),
};

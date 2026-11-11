import { SetMetadata } from '@nestjs/common';
import { Papel } from '../tipos/papel.enum';

export const PAPEIS = 'papeis';

// Lido pelo PapeisGuard: quem não tiver um destes papéis recebe 403.
export const Papeis = (...papeis: Papel[]) => SetMetadata(PAPEIS, papeis);

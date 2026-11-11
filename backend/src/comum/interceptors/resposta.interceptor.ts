import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

export interface RespostaSucesso<T> {
  sucesso: true;
  dados: T;
}

// Embrulha toda resposta de sucesso em { sucesso: true, dados }.
// Os controllers e services só devolvem os dados; o formato fica
// num lugar só. (Respostas 204 continuam sem corpo.)
@Injectable()
export class RespostaInterceptor<T> implements NestInterceptor<
  T,
  RespostaSucesso<T>
> {
  intercept(
    _contexto: ExecutionContext,
    proximo: CallHandler<T>,
  ): Observable<RespostaSucesso<T>> {
    return proximo.handle().pipe(
      map((dados) => ({
        sucesso: true as const,
        dados: dados ?? (null as T),
      })),
    );
  }
}

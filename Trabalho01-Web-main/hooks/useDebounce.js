"use client";

import { useEffect, useState } from "react";

// Devolve o valor só depois que ele parar de mudar por "atraso" ms.
// Na busca, assim não vai uma requisição para a API a cada letra digitada.
export function useDebounce(valor, atraso = 350) {
  const [valorAtrasado, setValorAtrasado] = useState(valor);

  useEffect(() => {
    const timer = setTimeout(() => setValorAtrasado(valor), atraso);

    // a pessoa digitou de novo antes do tempo: cancela o timer anterior
    return () => clearTimeout(timer);
  }, [valor, atraso]);

  return valorAtrasado;
}

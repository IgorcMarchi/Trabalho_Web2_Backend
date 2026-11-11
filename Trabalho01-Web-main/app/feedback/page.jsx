"use client";

import ListaFeedbacks from "../../components/ListaFeedbacks";
import FormFeedback from "../../components/FormFeedback";
import Carregando from "../../components/Carregando";
import MensagemErro from "../../components/MensagemErro";
import { useRequisicao } from "../../hooks/useRequisicao";
import { criarFeedback, listarFeedbacks } from "../../lib/avaliacoes";

// Feedback do site (rota /feedback)
export default function Feedback() {
  const { dados, erro, recarregar } = useRequisicao(() => listarFeedbacks(), []);

  async function enviar(feedback) {
    await criarFeedback(feedback);
    recarregar();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-300 mb-2">
        Feedback do site
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Conte o que você achou da nossa loja. Sua opinião ajuda a melhorar.
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          {erro ? (
            <MensagemErro texto={erro} aoTentarDeNovo={recarregar} />
          ) : !dados ? (
            <Carregando texto="Carregando avaliações..." />
          ) : (
            <ListaFeedbacks lista={dados.itens} total={dados.meta.total} />
          )}
        </div>

        <div className="w-full lg:w-96">
          <FormFeedback aoEnviar={enviar} />
        </div>
      </div>
    </div>
  );
}

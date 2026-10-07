"use client";

import ListaFeedbacks from "../../components/ListaFeedbacks";
import FormFeedback from "../../components/FormFeedback";
import { useFeedback } from "../../contexto/FeedbackContext";

// Feedback do site (rota /feedback)
export default function Feedback() {
  const { feedbacksSite, adicionarFeedbackSite } = useFeedback();

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
          <ListaFeedbacks lista={feedbacksSite} />
        </div>

        <div className="w-full lg:w-96">
          <FormFeedback aoEnviar={adicionarFeedbackSite} />
        </div>
      </div>
    </div>
  );
}

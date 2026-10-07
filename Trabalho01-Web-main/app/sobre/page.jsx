// Página institucional (rota /sobre).
// A TecShop é uma empresa fictícia, criada para o trabalho.
export default function Sobre() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-300 mb-4">
        Sobre a TecShop
      </h1>

      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <p className="mb-3">
          A TecShop é uma loja virtual de Santa Helena, no Paraná. Começamos em
          2021 vendendo eletrônicos e hoje também trabalhamos com joias e
          roupas, sempre com preço justo e entrega para todo o Brasil.
        </p>
        <p>
          Nossa missão é deixar a compra pela internet simples: achar o
          produto, saber quanto vai pagar e acompanhar o pedido até ele chegar.
        </p>

        <h2 className="text-xl font-bold text-blue-800 dark:text-blue-300 mt-6 mb-2">
          Contato
        </h2>
        <ul className="text-gray-700 dark:text-gray-300">
          <li>E-mail: contato@tecshop.com</li>
          <li>Telefone: (45) 4002-8922</li>
          <li>Atendimento: segunda a sexta, das 8h às 18h</li>
        </ul>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
        Empresa fictícia criada para o Trabalho 01 de Projeto e Desenvolvimento
        de Sistemas Web.
      </p>
    </div>
  );
}
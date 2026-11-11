// Mensagem que aparece quando a busca na API dá errado.
// Recebe o texto por props pra poder reaproveitar em telas diferentes.
// Se receber aoTentarDeNovo, mostra o botão "Tentar de novo".
function MensagemErro({ texto, aoTentarDeNovo }) {
  return (
    <div className="bg-red-100 border-2 border-red-300 text-red-700 rounded-lg p-4 text-center">
      <p className="font-bold">Ops, deu algum problema</p>
      <p className="text-sm mt-1">{texto}</p>
      {aoTentarDeNovo && (
        <button
          onClick={aoTentarDeNovo}
          className="mt-3 bg-red-700 text-white rounded px-4 py-2 text-sm font-bold hover:bg-red-800"
        >
          Tentar de novo
        </button>
      )}
    </div>
  );
}

export default MensagemErro;

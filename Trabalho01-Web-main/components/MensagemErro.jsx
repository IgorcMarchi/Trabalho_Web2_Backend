// Mensagem que aparece quando a busca na API dá errado.
// Recebe o texto por props pra poder reaproveitar em telas diferentes.
function MensagemErro({ texto }) {
  return (
    <div className="bg-red-100 border-2 border-red-300 text-red-700 rounded-lg p-4 text-center">
      <p className="font-bold">Ops, deu algum problema</p>
      <p className="text-sm mt-1">{texto}</p>
    </div>
  );
}

export default MensagemErro;

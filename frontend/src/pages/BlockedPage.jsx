import React from 'react';
import { useNavigate } from 'react-router-dom';

const BlockedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Acesso Bloqueado</h1>
        <p className="text-gray-300 max-w-md mb-6">
          Sua assinatura não está ativa. Por favor, verifique o status do seu pagamento na Kiwify para liberar o acesso.
        </p>
        <button onClick={() => navigate('/login')} className="bg-pink-600 hover:bg-pink-700 px-6 py-3 rounded-lg font-semibold">
          Ir para o Login
        </button>
      </div>
    </div>
  );
};

export default BlockedPage;

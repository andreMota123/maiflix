import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-pink-500">Maiflix</h1>
          <button onClick={logout} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-semibold">
            Sair
          </button>
        </header>
        <main>
          <h2 className="text-2xl font-semibold mb-4">Bem-vindo(a) à sua área de assinante!</h2>
          <p className="text-gray-300">
            Aqui você encontrará todos os arquivos, aulas e a comunidade. Este é o seu dashboard.
          </p>
          {/* Adicione o conteúdo da sua plataforma aqui */}
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;

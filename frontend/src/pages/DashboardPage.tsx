import React from 'react';
import { useAuthStore } from '@/store/authStore';

export const DashboardPage: React.FC = () => {
  const { user, tenant } = useAuthStore();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-primary">
              <span className="text-4xl">🚗</span>
            </div>
            <div className="stat-title">Veículos em Estoque</div>
            <div className="stat-value text-primary">0</div>
            <div className="stat-desc">Disponíveis para venda</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-secondary">
              <span className="text-4xl">👥</span>
            </div>
            <div className="stat-title">Leads Ativos</div>
            <div className="stat-value text-secondary">0</div>
            <div className="stat-desc">Este mês</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-accent">
              <span className="text-4xl">💰</span>
            </div>
            <div className="stat-title">Vendas</div>
            <div className="stat-value text-accent">0</div>
            <div className="stat-desc">Este mês</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-success">
              <span className="text-4xl">📈</span>
            </div>
            <div className="stat-title">Faturamento</div>
            <div className="stat-value text-success">R$ 0</div>
            <div className="stat-desc">Este mês</div>
          </div>
        </div>
      </div>

      <div className="alert alert-info">
        <span>
          Bem-vindo(a), <strong>{user?.name}</strong>! Você está logado como{' '}
          <strong>{user?.role}</strong> na loja <strong>{tenant?.name}</strong>.
        </span>
      </div>
    </div>
  );
};

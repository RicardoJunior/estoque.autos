import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DashboardData } from '../types';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

const FinancialDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  useEffect(() => {
    // Only owner and manager can access
    if (user && user.role !== 'owner' && user.role !== 'manager') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = selectedMonth ? { month: selectedMonth } : {};
      const response = await api.get('/financial/dashboard', { params });
      setData(response.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getDaysInStock = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="loading loading-spinner loading-lg text-[#D4AF37]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-white min-h-screen animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-serif mb-2 bg-gradient-to-r from-[#D4AF37] to-[#C0C0C0] bg-clip-text text-transparent">
          Dashboard Financeiro
        </h1>
        <p className="text-slate-600">
          Período: {new Date(data.period.start).toLocaleDateString('pt-BR')} até{' '}
          {new Date(data.period.end).toLocaleDateString('pt-BR')}
        </p>
      </div>

      {/* Month Selector */}
      <div className="mb-6">
        <label className="label">
          <span className="label-text font-medium">Selecionar Período</span>
        </label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="input input-bordered w-full max-w-xs"
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Revenue */}
        <div className="card bg-white shadow-md hover:shadow-xl transition-shadow">
          <div className="card-body">
            <h3 className="text-sm font-medium text-slate-600">Faturamento do Mês</h3>
            <p className="text-3xl font-bold text-[#D4AF37]">{formatCurrency(data.kpis.revenue)}</p>
            <p className="text-sm text-slate-500">{data.kpis.salesCount} vendas</p>
          </div>
        </div>

        {/* Gross Margin */}
        <div className="card bg-white shadow-md hover:shadow-xl transition-shadow">
          <div className="card-body">
            <h3 className="text-sm font-medium text-slate-600">Margem Bruta do Mês</h3>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(data.kpis.grossMargin)}
            </p>
            <p className="text-sm text-slate-500">
              {formatPercentage(data.kpis.averageMarginPercentage)} em média
            </p>
          </div>
        </div>

        {/* Inventory Value */}
        <div className="card bg-white shadow-md hover:shadow-xl transition-shadow">
          <div className="card-body">
            <h3 className="text-sm font-medium text-slate-600">Valor do Estoque</h3>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(data.kpis.inventorySaleValue)}
            </p>
            <p className="text-sm text-slate-500">
              {data.kpis.inventoryCount} veículos (custo:{' '}
              {formatCurrency(data.kpis.inventoryCostValue)})
            </p>
          </div>
        </div>

        {/* Average Ticket */}
        <div className="card bg-white shadow-md hover:shadow-xl transition-shadow">
          <div className="card-body">
            <h3 className="text-sm font-medium text-slate-600">Ticket Médio</h3>
            <p className="text-3xl font-bold text-purple-600">
              {formatCurrency(data.kpis.averageTicket)}
            </p>
            <p className="text-sm text-slate-500">
              Taxa conversão: {formatPercentage(data.kpis.conversionRate)}
            </p>
          </div>
        </div>

        {/* Active Leads */}
        <div className="card bg-white shadow-md hover:shadow-xl transition-shadow">
          <div className="card-body">
            <h3 className="text-sm font-medium text-slate-600">Leads Ativos</h3>
            <p className="text-3xl font-bold text-orange-600">{data.kpis.activeLeadsCount}</p>
            <p className="text-sm text-slate-500">Em atendimento ou negociação</p>
          </div>
        </div>
      </div>

      {/* Monthly Evolution Chart */}
      <div className="card bg-white shadow-md mb-8">
        <div className="card-body">
          <h2 className="card-title font-serif text-2xl mb-4">Evolução Mensal (12 meses)</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Faturamento</th>
                  <th>Margem</th>
                  <th>Vendas</th>
                </tr>
              </thead>
              <tbody>
                {data.monthlyEvolution.map((month) => (
                  <tr key={month.month}>
                    <td className="font-medium">
                      {new Date(month.month + '-01').toLocaleDateString('pt-BR', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td>{formatCurrency(month.revenue)}</td>
                    <td className="text-green-600 font-medium">{formatCurrency(month.margin)}</td>
                    <td>{month.salesCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Vehicles */}
        <div className="card bg-white shadow-md">
          <div className="card-body">
            <h2 className="card-title font-serif text-2xl mb-4">Top 5 Veículos por Margem</h2>
            {data.topVehicles.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Nenhuma venda no período</p>
            ) : (
              <div className="space-y-4">
                {data.topVehicles.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:border-[#D4AF37] transition-colors"
                  >
                    {sale.vehicles.photos && sale.vehicles.photos.length > 0 ? (
                      <img
                        src={sale.vehicles.photos[0].url}
                        alt={`${sale.vehicles.brand} ${sale.vehicles.model}`}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-slate-200 rounded flex items-center justify-center">
                        <span className="text-2xl">🚗</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">
                        {sale.vehicles.brand} {sale.vehicles.model} {sale.vehicles.version}
                      </p>
                      <p className="text-sm text-slate-600">{sale.vehicles.year_model}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">Margem</p>
                      <p className="font-bold text-green-600">
                        {formatCurrency(sale.gross_margin)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stale Vehicles */}
        <div className="card bg-white shadow-md">
          <div className="card-body">
            <h2 className="card-title font-serif text-2xl mb-4">Veículos Parados (+ de 60 dias)</h2>
            {data.staleVehicles.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Nenhum veículo parado</p>
            ) : (
              <div className="space-y-4">
                {data.staleVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center gap-4 p-4 border border-red-200 rounded-lg hover:border-red-400 transition-colors cursor-pointer"
                    onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                  >
                    {vehicle.photos && vehicle.photos.length > 0 ? (
                      <img
                        src={vehicle.photos[0].url}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-slate-200 rounded flex items-center justify-center">
                        <span className="text-2xl">🚗</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">
                        {vehicle.brand} {vehicle.model} {vehicle.version}
                      </p>
                      <p className="text-sm text-slate-600">{vehicle.year_model}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-red-600 font-medium">
                        {getDaysInStock(vehicle.created_at)} dias
                      </p>
                      <p className="text-sm text-slate-600">{formatCurrency(vehicle.sale_price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboardPage;

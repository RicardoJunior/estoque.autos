import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import type { SellerDashboardData } from '@/types';

export default function SellerDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<SellerDashboardData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchDashboard();
  }, [selectedMonth]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get<SellerDashboardData>(
        `/seller/dashboard?month=${selectedMonth}`
      );
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching seller dashboard:', error);
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

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800 border-blue-300',
      in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      negotiating: 'bg-purple-100 text-purple-800 border-purple-300',
      converted: 'bg-green-100 text-green-800 border-green-300',
      lost: 'bg-red-100 text-red-800 border-red-300',
    };

    const statusLabels: Record<string, string> = {
      new: 'Novo',
      in_progress: 'Em Atendimento',
      negotiating: 'Negociando',
      converted: 'Convertido',
      lost: 'Perdido',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}
      >
        {statusLabels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg text-[#D4AF37]"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Erro ao carregar dashboard</p>
      </div>
    );
  }

  const { currentPeriod, allTime } = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-6 animate-fade-in">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 font-playfair mb-2">Meu Dashboard</h1>
            <p className="text-gray-600 font-outfit">Acompanhe seus leads, vendas e comissões</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-outfit">
              Período
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent font-outfit"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Current Period KPIs */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-playfair mb-4">Período Atual</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Leads */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 font-outfit">Total de Leads</h3>
                <span className="text-2xl">📋</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 font-playfair">
                {currentPeriod.leads.total}
              </p>
              <div className="mt-2 text-sm text-gray-500 font-outfit">
                Taxa de conversão: {currentPeriod.leads.conversionRate.toFixed(1)}%
              </div>
            </div>

            {/* Sales Count */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 font-outfit">Vendas</h3>
                <span className="text-2xl">🚗</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 font-playfair">
                {currentPeriod.sales.total}
              </p>
              <div className="mt-2 text-sm text-gray-500 font-outfit">
                Ticket médio: {formatCurrency(currentPeriod.sales.averageTicket)}
              </div>
            </div>

            {/* Revenue */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md p-6 border border-green-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-green-800 font-outfit">Faturamento</h3>
                <span className="text-2xl">💰</span>
              </div>
              <p className="text-3xl font-bold text-green-900 font-playfair">
                {formatCurrency(currentPeriod.sales.revenue)}
              </p>
              <div className="mt-2 text-sm text-green-700 font-outfit">
                Margem: {formatCurrency(currentPeriod.sales.margin)}
              </div>
            </div>

            {/* Commission */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow-md p-6 border border-amber-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-amber-800 font-outfit">Comissão</h3>
                <span className="text-2xl">🎯</span>
              </div>
              <p className="text-3xl font-bold text-amber-900 font-playfair">
                {formatCurrency(currentPeriod.sales.commission)}
              </p>
              <div className="mt-2 text-sm text-amber-700 font-outfit">Período selecionado</div>
            </div>
          </div>
        </div>

        {/* Lead Status Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 font-playfair mb-4">Status dos Leads</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 font-playfair">
                {currentPeriod.leads.new}
              </p>
              <p className="text-sm text-gray-600 font-outfit">Novos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600 font-playfair">
                {currentPeriod.leads.inProgress}
              </p>
              <p className="text-sm text-gray-600 font-outfit">Em Atendimento</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600 font-playfair">
                {currentPeriod.leads.negotiating}
              </p>
              <p className="text-sm text-gray-600 font-outfit">Negociando</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 font-playfair">
                {currentPeriod.leads.converted}
              </p>
              <p className="text-sm text-gray-600 font-outfit">Convertidos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600 font-playfair">
                {currentPeriod.leads.lost}
              </p>
              <p className="text-sm text-gray-600 font-outfit">Perdidos</p>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Leads */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 font-playfair mb-4">Leads Recentes</h2>
            {currentPeriod.recentLeads.length === 0 ? (
              <p className="text-gray-500 text-center py-8 font-outfit">Nenhum lead encontrado</p>
            ) : (
              <div className="space-y-4">
                {currentPeriod.recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 font-outfit">{lead.name}</p>
                      <p className="text-sm text-gray-600 font-outfit">
                        {lead.vehicle
                          ? `${lead.vehicle.brand} ${lead.vehicle.model} ${lead.vehicle.year_model}`
                          : 'Veículo não especificado'}
                      </p>
                      <p className="text-xs text-gray-500 font-outfit mt-1">
                        {getTimeAgo(lead.created_at)}
                      </p>
                    </div>
                    <div>{getStatusBadge(lead.status)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Sales */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 font-playfair mb-4">Vendas Recentes</h2>
            {currentPeriod.recentSales.length === 0 ? (
              <p className="text-gray-500 text-center py-8 font-outfit">Nenhuma venda encontrada</p>
            ) : (
              <div className="space-y-4">
                {currentPeriod.recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 font-outfit">
                        {sale.vehicle
                          ? `${sale.vehicle.brand} ${sale.vehicle.model} ${sale.vehicle.version || ''} ${sale.vehicle.year_model}`
                          : 'Veículo não especificado'}
                      </p>
                      <p className="text-sm text-gray-600 font-outfit">
                        Valor: {formatCurrency(sale.final_price)}
                      </p>
                      <p className="text-xs text-gray-500 font-outfit mt-1">
                        {formatDate(sale.sold_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-700 font-outfit">Comissão</p>
                      <p className="text-lg font-bold text-green-800 font-playfair">
                        {formatCurrency(sale.commission_value || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* All Time Statistics */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow-md p-6 border border-slate-700">
          <h2 className="text-2xl font-bold text-white font-playfair mb-6">Estatísticas Gerais</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#D4AF37] font-playfair">
                {allTime.totalSales}
              </p>
              <p className="text-sm text-gray-300 font-outfit mt-1">Vendas Totais</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#D4AF37] font-playfair">
                {formatCurrency(allTime.totalRevenue)}
              </p>
              <p className="text-sm text-gray-300 font-outfit mt-1">Faturamento Total</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#D4AF37] font-playfair">
                {formatCurrency(allTime.totalCommission)}
              </p>
              <p className="text-sm text-gray-300 font-outfit mt-1">Comissões Totais</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#D4AF37] font-playfair">
                {allTime.totalLeads}
              </p>
              <p className="text-sm text-gray-300 font-outfit mt-1">Leads Totais</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#D4AF37] font-playfair">
                {allTime.conversionRate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-300 font-outfit mt-1">Taxa de Conversão</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

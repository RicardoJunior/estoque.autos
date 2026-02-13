import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/services/api';
import type { MarginReportData } from '@/types';

const MarginReportPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [reportData, setReportData] = useState<MarginReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sortBy, setSortBy] = useState<
    'gross_margin' | 'margin_percentage' | 'sold_at' | 'final_price'
  >('gross_margin');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Check role-based access
  useEffect(() => {
    if (user && user.role !== 'owner' && user.role !== 'manager') {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch margin report data
  const fetchMarginReport = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/financial/margin-report', {
        params: {
          start_date: startDate,
          end_date: endDate,
          sort_by: sortBy,
          sort_order: sortOrder,
        },
      });
      setReportData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar relatório de margem');
      console.error('Error fetching margin report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarginReport();
  }, [startDate, endDate, sortBy, sortOrder]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getMarginColor = (marginPercentage: number) => {
    if (marginPercentage >= 15) return 'text-green-600';
    if (marginPercentage >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-['Playfair_Display'] font-bold bg-gradient-to-r from-amber-600 to-amber-400 bg-clip-text text-transparent mb-2">
            Relatório de Margem
          </h1>
          <p className="text-slate-600 font-['Outfit']">
            Análise detalhada de margem por veículo vendido
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-error mb-6">
            <span>{error}</span>
          </div>
        )}

        {/* Filters */}
        <div className="card bg-white shadow-lg mb-6">
          <div className="card-body">
            <h2 className="card-title font-['Playfair_Display'] text-2xl mb-4">Filtros</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-['Outfit'] font-semibold">Data Início</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered font-['Outfit']"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-['Outfit'] font-semibold">Data Fim</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered font-['Outfit']"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-['Outfit'] font-semibold">Ordenar Por</span>
                </label>
                <select
                  className="select select-bordered font-['Outfit']"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="gross_margin">Margem Bruta</option>
                  <option value="margin_percentage">% Margem</option>
                  <option value="sold_at">Data da Venda</option>
                  <option value="final_price">Valor da Venda</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-['Outfit'] font-semibold">Ordem</span>
                </label>
                <select
                  className="select select-bordered font-['Outfit']"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                >
                  <option value="desc">Maior para Menor</option>
                  <option value="asc">Menor para Maior</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {reportData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                <div className="card-body">
                  <h3 className="font-['Outfit'] text-sm opacity-90">Total de Vendas</h3>
                  <p className="text-3xl font-['Playfair_Display'] font-bold">
                    {reportData.summary.total_sales}
                  </p>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                <div className="card-body">
                  <h3 className="font-['Outfit'] text-sm opacity-90">Receita Total</h3>
                  <p className="text-3xl font-['Playfair_Display'] font-bold">
                    {formatCurrency(reportData.summary.total_revenue)}
                  </p>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg">
                <div className="card-body">
                  <h3 className="font-['Outfit'] text-sm opacity-90">Margem Total</h3>
                  <p className="text-3xl font-['Playfair_Display'] font-bold">
                    {formatCurrency(reportData.summary.total_margin)}
                  </p>
                  <p className="text-sm opacity-90">
                    {reportData.summary.average_margin_percentage.toFixed(2)}% média
                  </p>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                <div className="card-body">
                  <h3 className="font-['Outfit'] text-sm opacity-90">Margem Média</h3>
                  <p className="text-3xl font-['Playfair_Display'] font-bold">
                    {formatCurrency(reportData.summary.average_margin)}
                  </p>
                </div>
              </div>
            </div>

            {/* Best and Worst Margins */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {reportData.summary.best_margin && (
                <div className="card bg-white shadow-lg border-2 border-green-500">
                  <div className="card-body">
                    <h3 className="card-title font-['Playfair_Display'] text-green-600">
                      🏆 Melhor Margem
                    </h3>
                    <p className="font-['Outfit'] text-lg font-semibold">
                      {reportData.summary.best_margin.vehicle}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(reportData.summary.best_margin.margin)}
                      </span>
                      <span className="badge badge-lg badge-success">
                        {reportData.summary.best_margin.percentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {reportData.summary.worst_margin && (
                <div className="card bg-white shadow-lg border-2 border-red-500">
                  <div className="card-body">
                    <h3 className="card-title font-['Playfair_Display'] text-red-600">
                      📉 Menor Margem
                    </h3>
                    <p className="font-['Outfit'] text-lg font-semibold">
                      {reportData.summary.worst_margin.vehicle}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-2xl font-bold text-red-600">
                        {formatCurrency(reportData.summary.worst_margin.margin)}
                      </span>
                      <span className="badge badge-lg badge-error">
                        {reportData.summary.worst_margin.percentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sales Table */}
            <div className="card bg-white shadow-lg">
              <div className="card-body">
                <h2 className="card-title font-['Playfair_Display'] text-2xl mb-4">
                  Detalhamento por Veículo
                </h2>

                {reportData.sales.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-400 font-['Outfit'] text-lg">
                      Nenhuma venda encontrada no período selecionado
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table table-zebra">
                      <thead>
                        <tr className="font-['Outfit']">
                          <th>Veículo</th>
                          <th>Vendedor</th>
                          <th>Data</th>
                          <th className="text-right">Custo Total</th>
                          <th className="text-right">Valor Venda</th>
                          <th className="text-right">Margem Bruta</th>
                          <th className="text-right">% Margem</th>
                        </tr>
                      </thead>
                      <tbody className="font-['Outfit']">
                        {reportData.sales.map((sale) => (
                          <tr key={sale.id} className="hover">
                            <td>
                              <div className="flex items-center gap-3">
                                {sale.vehicle?.photo ? (
                                  <img
                                    src={sale.vehicle.photo}
                                    alt={`${sale.vehicle.brand} ${sale.vehicle.model}`}
                                    className="w-16 h-12 object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-16 h-12 bg-slate-200 rounded flex items-center justify-center">
                                    <span className="text-slate-400 text-xs">Sem foto</span>
                                  </div>
                                )}
                                <div>
                                  <div className="font-semibold">
                                    {sale.vehicle?.brand} {sale.vehicle?.model}
                                  </div>
                                  <div className="text-sm text-slate-500">
                                    {sale.vehicle?.version} - {sale.vehicle?.year_model}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="text-sm">{sale.seller?.name || 'N/A'}</div>
                            </td>
                            <td>{formatDate(sale.sold_at)}</td>
                            <td className="text-right">{formatCurrency(sale.total_cost)}</td>
                            <td className="text-right font-semibold">
                              {formatCurrency(sale.final_price)}
                            </td>
                            <td className="text-right">
                              <span
                                className={`font-bold ${sale.gross_margin >= 0 ? 'text-green-600' : 'text-red-600'}`}
                              >
                                {formatCurrency(sale.gross_margin)}
                              </span>
                            </td>
                            <td className="text-right">
                              <span
                                className={`font-bold ${getMarginColor(sale.margin_percentage)}`}
                              >
                                {sale.margin_percentage.toFixed(2)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MarginReportPage;

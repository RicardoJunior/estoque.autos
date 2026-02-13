import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TurnoverReportData } from '../types';
import { api } from '../services/api';

export default function TurnoverReportPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<TurnoverReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [minDays, setMinDays] = useState<number | ''>('');

  const [activeTab, setActiveTab] = useState<'sold' | 'current'>('current');

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (minDays !== '') params.append('min_days', minDays.toString());

      const response = await api.get(`/financial/turnover-report?${params.toString()}`);
      setReportData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load turnover report');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    fetchReport();
  };

  const getDaysColor = (days: number) => {
    if (days > 90) return 'text-red-600';
    if (days > 60) return 'text-amber-600';
    if (days > 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getDaysBadgeClass = (days: number) => {
    if (days > 90) return 'badge badge-error';
    if (days > 60) return 'badge badge-warning';
    if (days > 30) return 'badge badge-info';
    return 'badge badge-success';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-8">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!reportData) return null;

  const currentVehicles = reportData.current_inventory;
  const soldVehicles = reportData.sold_vehicles;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-4 md:p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-playfair text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent mb-2">
          Relatório de Giro
        </h1>
        <p className="font-outfit text-slate-600">
          Análise do tempo de permanência dos veículos no estoque
        </p>
      </div>

      {/* Filters */}
      <div className="card bg-white shadow-lg mb-8">
        <div className="card-body">
          <h2 className="card-title font-playfair text-xl mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-outfit">Data Inicial</span>
              </label>
              <input
                type="date"
                className="input input-bordered font-outfit"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-outfit">Data Final</span>
              </label>
              <input
                type="date"
                className="input input-bordered font-outfit"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-outfit">Dias Mínimos</span>
              </label>
              <input
                type="number"
                min="0"
                className="input input-bordered font-outfit"
                placeholder="Todos"
                value={minDays}
                onChange={(e) => setMinDays(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text opacity-0">Action</span>
              </label>
              <button onClick={handleApplyFilters} className="btn btn-primary font-outfit">
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
          <div className="card-body">
            <h3 className="font-outfit text-sm opacity-90">Tempo Médio de Venda</h3>
            <p className="font-playfair text-3xl font-bold">
              {reportData.summary.average_days_to_sell} dias
            </p>
            <p className="font-outfit text-xs opacity-75">
              Vendidos: {reportData.summary.total_sold_in_period}
            </p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
          <div className="card-body">
            <h3 className="font-outfit text-sm opacity-90">Taxa de Giro</h3>
            <p className="font-playfair text-3xl font-bold">{reportData.summary.turnover_rate}</p>
            <p className="font-outfit text-xs opacity-75">Veículos vendidos/mês</p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg">
          <div className="card-body">
            <h3 className="font-outfit text-sm opacity-90">Veículos Parados</h3>
            <p className="font-playfair text-3xl font-bold">
              {reportData.summary.stale_vehicles_count}
            </p>
            <p className="font-outfit text-xs opacity-75">&gt; 60 dias em estoque</p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
          <div className="card-body">
            <h3 className="font-outfit text-sm opacity-90">Veículos Críticos</h3>
            <p className="font-playfair text-3xl font-bold">
              {reportData.summary.critical_vehicles_count}
            </p>
            <p className="font-outfit text-xs opacity-75">&gt; 90 dias em estoque</p>
          </div>
        </div>
      </div>

      {/* Best/Worst Sale Times */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {reportData.summary.fastest_sale && (
          <div className="card bg-white shadow-lg border-2 border-green-500">
            <div className="card-body">
              <h3 className="card-title font-playfair text-green-600">Venda Mais Rápida</h3>
              <p className="font-outfit text-lg">{reportData.summary.fastest_sale.vehicle}</p>
              <p className="font-playfair text-2xl font-bold text-green-600">
                {reportData.summary.fastest_sale.days} dias
              </p>
            </div>
          </div>
        )}

        {reportData.summary.slowest_sale && (
          <div className="card bg-white shadow-lg border-2 border-red-500">
            <div className="card-body">
              <h3 className="card-title font-playfair text-red-600">Venda Mais Lenta</h3>
              <p className="font-outfit text-lg">{reportData.summary.slowest_sale.vehicle}</p>
              <p className="font-playfair text-2xl font-bold text-red-600">
                {reportData.summary.slowest_sale.days} dias
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-white shadow-lg mb-6 p-2">
        <button
          className={`tab tab-lg font-outfit ${activeTab === 'current' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('current')}
        >
          Estoque Atual ({currentVehicles.length})
        </button>
        <button
          className={`tab tab-lg font-outfit ${activeTab === 'sold' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('sold')}
        >
          Vendidos no Período ({soldVehicles.length})
        </button>
      </div>

      {/* Vehicle Lists */}
      {activeTab === 'current' && (
        <div className="card bg-white shadow-lg">
          <div className="card-body">
            <h2 className="card-title font-playfair text-2xl mb-4">Veículos em Estoque</h2>
            {currentVehicles.length === 0 ? (
              <p className="text-center py-8 font-outfit text-slate-500">
                Nenhum veículo no estoque no momento
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr className="font-outfit">
                      <th>Veículo</th>
                      <th>Entrada</th>
                      <th>Dias em Estoque</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody className="font-outfit">
                    {currentVehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="hover">
                        <td>
                          <div className="flex items-center space-x-3">
                            <div className="avatar">
                              <div className="w-12 h-12 rounded">
                                {vehicle.photo ? (
                                  <img src={vehicle.photo} alt={vehicle.brand} />
                                ) : (
                                  <div className="bg-slate-200 w-full h-full flex items-center justify-center">
                                    <span className="text-slate-400">📷</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold">
                                {vehicle.brand} {vehicle.model}
                              </div>
                              <div className="text-sm text-slate-500">
                                {vehicle.version} - {vehicle.year_model}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{new Date(vehicle.created_at).toLocaleDateString('pt-BR')}</td>
                        <td>
                          <span className={getDaysBadgeClass(vehicle.days_in_stock)}>
                            {vehicle.days_in_stock} dias
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              vehicle.status === 'available' ? 'badge-success' : 'badge-warning'
                            }`}
                          >
                            {vehicle.status === 'available' ? 'Disponível' : 'Reservado'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                            className="btn btn-sm btn-ghost"
                          >
                            Ver Detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'sold' && (
        <div className="card bg-white shadow-lg">
          <div className="card-body">
            <h2 className="card-title font-playfair text-2xl mb-4">Veículos Vendidos</h2>
            {soldVehicles.length === 0 ? (
              <p className="text-center py-8 font-outfit text-slate-500">
                Nenhum veículo vendido no período selecionado
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr className="font-outfit">
                      <th>Veículo</th>
                      <th>Entrada</th>
                      <th>Venda</th>
                      <th>Dias em Estoque</th>
                      <th>Valor Final</th>
                      <th>Margem</th>
                    </tr>
                  </thead>
                  <tbody className="font-outfit">
                    {soldVehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="hover">
                        <td>
                          <div className="flex items-center space-x-3">
                            <div className="avatar">
                              <div className="w-12 h-12 rounded">
                                {vehicle.photo ? (
                                  <img src={vehicle.photo} alt={vehicle.brand} />
                                ) : (
                                  <div className="bg-slate-200 w-full h-full flex items-center justify-center">
                                    <span className="text-slate-400">📷</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold">
                                {vehicle.brand} {vehicle.model}
                              </div>
                              <div className="text-sm text-slate-500">
                                {vehicle.version} - {vehicle.year_model}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{new Date(vehicle.created_at).toLocaleDateString('pt-BR')}</td>
                        <td>
                          {vehicle.sold_at
                            ? new Date(vehicle.sold_at).toLocaleDateString('pt-BR')
                            : '-'}
                        </td>
                        <td>
                          <span className={`font-semibold ${getDaysColor(vehicle.days_in_stock)}`}>
                            {vehicle.days_in_stock} dias
                          </span>
                        </td>
                        <td>
                          {vehicle.final_price !== null
                            ? vehicle.final_price.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })
                            : '-'}
                        </td>
                        <td>
                          {vehicle.gross_margin !== null ? (
                            <span
                              className={`font-semibold ${
                                vehicle.gross_margin > 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {vehicle.gross_margin.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

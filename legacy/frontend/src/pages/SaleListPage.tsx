import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { Sale } from '../types';

interface SaleWithRelations extends Sale {
  vehicle: {
    id: string;
    brand: string;
    model: string;
    version: string;
    year_model: number;
    photos: Array<{ url: string; order: number; is_primary: boolean }>;
  };
  seller: {
    id: string;
    name: string;
    email: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function SaleListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [sales, setSales] = useState<SaleWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'sold_at' | 'final_price' | 'gross_margin'>('sold_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchSales();
  }, [pagination.page, startDate, endDate, sortBy, sortOrder]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (searchTerm) params.append('search', searchTerm);

      const response = await api.get(`/api/sales?${params.toString()}`);
      setSales(response.data.sales);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    fetchSales();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  const getMarginPercentage = (sale: SaleWithRelations) => {
    if (!sale.vehicle) return 0;
    const purchasePrice = (sale.vehicle as any).purchase_price || 0;
    if (purchasePrice === 0) return 0;
    const grossMargin = sale.gross_margin ?? 0;
    return (grossMargin / purchasePrice) * 100;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'À Vista',
      financing: 'Financiamento',
      consortium: 'Consórcio',
      trade_and_cash: 'Troca + Volta',
    };
    return labels[method] || method;
  };

  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1
              className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Vendas Realizadas
            </h1>
            <p className="text-slate-600 mt-2">
              {pagination.total} venda{pagination.total !== 1 ? 's' : ''} registrada
              {pagination.total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Buscar Comprador
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Nome ou documento..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Data Inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Data Final</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Ordenar por</label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                >
                  <option value="sold_at">Data</option>
                  <option value="final_price">Valor</option>
                  {isOwnerOrManager && <option value="gross_margin">Margem</option>}
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-all"
                  title={sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:shadow-lg transition-all duration-300"
            >
              Buscar
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        ) : sales.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-slate-200">
            <div className="text-6xl mb-4">📊</div>
            <h3
              className="text-2xl font-bold text-slate-800 mb-2"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Nenhuma venda encontrada
            </h3>
            <p className="text-slate-600">As vendas registradas aparecerão aqui.</p>
          </div>
        ) : (
          /* Sales Table */
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Veículo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Comprador
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Vendedor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Valor Final
                    </th>
                    {isOwnerOrManager && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Margem
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Pagamento
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sales.map((sale) => {
                    const primaryPhoto = sale.vehicle?.photos?.find((p) => p.is_primary);
                    const photoUrl = primaryPhoto?.url || sale.vehicle?.photos?.[0]?.url || '';
                    const marginPercent = getMarginPercentage(sale);

                    return (
                      <tr
                        key={sale.id}
                        onClick={() => navigate(`/sales/${sale.id}`)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors duration-150"
                      >
                        {/* Vehicle */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {photoUrl && (
                              <img
                                src={photoUrl}
                                alt={`${sale.vehicle.brand} ${sale.vehicle.model}`}
                                className="w-16 h-12 object-cover rounded-lg"
                              />
                            )}
                            <div>
                              <div className="font-semibold text-slate-800">
                                {sale.vehicle.brand} {sale.vehicle.model}
                              </div>
                              <div className="text-sm text-slate-600">
                                {sale.vehicle.version} • {sale.vehicle.year_model}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Buyer */}
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{sale.buyer_name}</div>
                          <div className="text-sm text-slate-600">{sale.buyer_document}</div>
                        </td>

                        {/* Seller */}
                        <td className="px-6 py-4">
                          <div className="text-slate-800">{sale.seller.name}</div>
                        </td>

                        {/* Final Price */}
                        <td className="px-6 py-4">
                          <div className="font-semibold text-lg text-amber-700">
                            {formatCurrency(sale.final_price)}
                          </div>
                          {sale.trade_value && sale.trade_value > 0 && (
                            <div className="text-xs text-slate-600">
                              Troca: {formatCurrency(sale.trade_value)}
                            </div>
                          )}
                        </td>

                        {/* Margin (Owner/Manager only) */}
                        {isOwnerOrManager && (
                          <td className="px-6 py-4">
                            <div
                              className={`font-semibold ${(sale.gross_margin ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {formatCurrency(sale.gross_margin ?? 0)}
                            </div>
                            <div
                              className={`text-xs ${marginPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {marginPercent.toFixed(1)}%
                            </div>
                          </td>
                        )}

                        {/* Payment Method */}
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            {getPaymentMethodLabel(sale.payment_method)}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4">
                          <div className="text-slate-800">{formatDate(sale.sold_at)}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                <div className="text-sm text-slate-600">
                  Página {pagination.page} de {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

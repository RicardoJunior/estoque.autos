import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Lead, LeadStatus, LeadChannel, User, Vehicle } from '../types';
import { api } from '../services/api';
import { useRealtimeLeads } from '../hooks/useRealtimeLeads';

interface LeadWithRelations extends Lead {
  vehicle?: Pick<
    Vehicle,
    'id' | 'brand' | 'model' | 'version' | 'year_model' | 'photos' | 'sale_price'
  >;
  assigned_user?: Pick<User, 'id' | 'name' | 'email'>;
  interactions?: { count: number }[];
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  in_progress: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  negotiating: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  converted: 'bg-green-500/10 text-green-600 border-green-500/20',
  lost: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Novo',
  in_progress: 'Em Atendimento',
  negotiating: 'Negociando',
  converted: 'Convertido',
  lost: 'Perdido',
};

const CHANNEL_LABELS: Record<LeadChannel, string> = {
  landing_page: 'Landing Page',
  webmotors: 'Webmotors',
  olx: 'OLX',
  icarros: 'iCarros',
  mercado_livre: 'Mercado Livre',
  manual: 'Manual',
};

export default function LeadListPage() {
  const navigate = useNavigate();

  const [leads, setLeads] = useState<LeadWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('');
  const [channelFilter, setChannelFilter] = useState<LeadChannel | ''>('');
  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (statusFilter) params.status = statusFilter;
      if (channelFilter) params.channel = channelFilter;
      if (search) params.search = search;

      const response = await api.get('/leads', { params });
      setLeads(response.data.leads);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, channelFilter, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Handle real-time new leads
  const handleNewLead = useCallback(() => {
    // Refresh leads list when new lead arrives
    fetchLeads();
  }, [fetchLeads]);

  // Subscribe to real-time lead updates
  useRealtimeLeads(handleNewLead);

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return formatDate(date);
  };

  const handleRowClick = (leadId: string) => {
    navigate(`/leads/${leadId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8 animate-fade-in">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1
            className="text-4xl md:text-5xl font-serif font-bold text-slate-900 tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Leads
          </h1>
          <div className="text-sm text-slate-500" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {pagination.total} {pagination.total === 1 ? 'lead' : 'leads'}
          </div>
        </div>
        <p className="text-slate-600 font-light" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Gerencie todos os contatos e propostas de interesse
        </p>
      </div>

      {/* Filters Bar */}
      <div className="max-w-[1600px] mx-auto mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label
                className="block text-xs font-medium text-slate-700 mb-2 uppercase tracking-wider"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Buscar
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome, e-mail ou telefone..."
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              />
            </div>

            {/* Status Filter */}
            <div>
              <label
                className="block text-xs font-medium text-slate-700 mb-2 uppercase tracking-wider"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as LeadStatus | '')}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                <option value="">Todos</option>
                <option value="new">Novo</option>
                <option value="in_progress">Em Atendimento</option>
                <option value="negotiating">Negociando</option>
                <option value="converted">Convertido</option>
                <option value="lost">Perdido</option>
              </select>
            </div>

            {/* Channel Filter */}
            <div>
              <label
                className="block text-xs font-medium text-slate-700 mb-2 uppercase tracking-wider"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Canal
              </label>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value as LeadChannel | '')}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                <option value="">Todos</option>
                <option value="landing_page">Landing Page</option>
                <option value="webmotors">Webmotors</option>
                <option value="olx">OLX</option>
                <option value="icarros">iCarros</option>
                <option value="mercado_livre">Mercado Livre</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-4">
            <span
              className="text-xs font-medium text-slate-700 uppercase tracking-wider"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Ordenar por:
            </span>
            <div className="flex gap-2">
              {(['created_at', 'name', 'status'] as const).map((sort) => (
                <button
                  key={sort}
                  onClick={() => {
                    if (sortBy === sort) {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy(sort);
                      setSortOrder('desc');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    sortBy === sort
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {sort === 'created_at' ? 'Data' : sort === 'name' ? 'Nome' : 'Status'}
                  {sortBy === sort && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-[1600px] mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📭</div>
              <h3
                className="text-xl font-semibold text-slate-900 mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Nenhum lead encontrado
              </h3>
              <p className="text-slate-600" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {search || statusFilter || channelFilter
                  ? 'Tente ajustar os filtros para ver mais resultados'
                  : 'Os leads aparecerão aqui quando forem gerados pela landing page'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th
                        className="text-left px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        Lead
                      </th>
                      <th
                        className="text-left px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        Veículo
                      </th>
                      <th
                        className="text-left px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        Canal
                      </th>
                      <th
                        className="text-left px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        Status
                      </th>
                      <th
                        className="text-left px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        Proposta
                      </th>
                      <th
                        className="text-left px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        Vendedor
                      </th>
                      <th
                        className="text-left px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        Criado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {leads.map((lead, index) => (
                      <tr
                        key={lead.id}
                        onClick={() => handleRowClick(lead.id)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-all group"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        {/* Lead Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div
                              className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-white font-semibold shadow-md"
                              style={{ fontFamily: "'Outfit', sans-serif" }}
                            >
                              {lead.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div
                                className="font-semibold text-slate-900 group-hover:text-amber-700 transition-colors"
                                style={{ fontFamily: "'Outfit', sans-serif" }}
                              >
                                {lead.name}
                              </div>
                              <div
                                className="text-sm text-slate-600"
                                style={{ fontFamily: "'Outfit', sans-serif" }}
                              >
                                {lead.phone}
                              </div>
                              {lead.email && (
                                <div
                                  className="text-xs text-slate-500"
                                  style={{ fontFamily: "'Outfit', sans-serif" }}
                                >
                                  {lead.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Vehicle */}
                        <td className="px-6 py-4">
                          {lead.vehicle ? (
                            <div>
                              <div
                                className="font-medium text-slate-900"
                                style={{ fontFamily: "'Outfit', sans-serif" }}
                              >
                                {lead.vehicle.brand} {lead.vehicle.model}
                              </div>
                              <div
                                className="text-sm text-slate-600"
                                style={{ fontFamily: "'Outfit', sans-serif" }}
                              >
                                {lead.vehicle.version} • {lead.vehicle.year_model}
                              </div>
                              <div
                                className="text-xs text-amber-700 font-semibold mt-1"
                                style={{ fontFamily: "'Outfit', sans-serif" }}
                              >
                                {formatCurrency(lead.vehicle.sale_price)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Channel */}
                        <td className="px-6 py-4">
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                            style={{ fontFamily: "'Outfit', sans-serif" }}
                          >
                            {CHANNEL_LABELS[lead.channel]}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${STATUS_COLORS[lead.status]}`}
                            style={{ fontFamily: "'Outfit', sans-serif" }}
                          >
                            {STATUS_LABELS[lead.status]}
                          </span>
                        </td>

                        {/* Proposal Value */}
                        <td className="px-6 py-4">
                          <div
                            className="font-semibold text-slate-900"
                            style={{ fontFamily: "'Outfit', sans-serif" }}
                          >
                            {formatCurrency(lead.proposal_value)}
                          </div>
                          {lead.trade_vehicle && (
                            <div
                              className="text-xs text-slate-500 mt-1"
                              style={{ fontFamily: "'Outfit', sans-serif" }}
                            >
                              + Troca: {lead.trade_vehicle}
                            </div>
                          )}
                        </td>

                        {/* Assigned User */}
                        <td className="px-6 py-4">
                          {lead.assigned_user ? (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold shadow">
                                {lead.assigned_user.name.charAt(0).toUpperCase()}
                              </div>
                              <span
                                className="text-sm text-slate-700"
                                style={{ fontFamily: "'Outfit', sans-serif" }}
                              >
                                {lead.assigned_user.name.split(' ')[0]}
                              </span>
                            </div>
                          ) : (
                            <span
                              className="text-slate-400 text-sm"
                              style={{ fontFamily: "'Outfit', sans-serif" }}
                            >
                              Não atribuído
                            </span>
                          )}
                        </td>

                        {/* Created */}
                        <td className="px-6 py-4">
                          <div
                            className="text-sm text-slate-700"
                            style={{ fontFamily: "'Outfit', sans-serif" }}
                          >
                            {getTimeAgo(lead.created_at)}
                          </div>
                          {lead.status === 'new' && (
                            <div className="inline-flex items-center gap-1 mt-1">
                              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                              <span
                                className="text-xs text-blue-600 font-medium"
                                style={{ fontFamily: "'Outfit', sans-serif" }}
                              >
                                Novo
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="border-t border-slate-200 px-6 py-4 bg-slate-50/30">
                  <div className="flex items-center justify-between">
                    <div
                      className="text-sm text-slate-600"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      Página {pagination.page} de {pagination.totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        ← Anterior
                      </button>
                      <button
                        onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        Próxima →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

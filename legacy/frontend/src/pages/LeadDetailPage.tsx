import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Lead, LeadStatus, LeadChannel, User, Vehicle } from '../types';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface LeadInteraction {
  id: string;
  lead_id: string;
  user_id: string;
  type: 'note' | 'call' | 'visit' | 'proposal';
  content: string;
  created_at: string;
  user?: Pick<User, 'id' | 'name' | 'email'>;
}

interface LeadDetailData extends Lead {
  vehicle?: Pick<
    Vehicle,
    'id' | 'brand' | 'model' | 'version' | 'year_model' | 'photos' | 'sale_price' | 'status'
  >;
  assigned_user?: Pick<User, 'id' | 'name' | 'email'>;
  interactions?: LeadInteraction[];
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

const TYPE_LABELS: Record<string, string> = {
  proposal: 'Proposta',
  whatsapp: 'WhatsApp',
  phone: 'Telefone',
};

const INTERACTION_TYPE_LABELS: Record<string, string> = {
  note: 'Nota',
  call: 'Ligação',
  visit: 'Visita',
  proposal: 'Proposta',
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [lead, setLead] = useState<LeadDetailData | null>(null);
  const [users, setUsers] = useState<Pick<User, 'id' | 'name' | 'email'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>('new');
  const [lostReason, setLostReason] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [interactionType, setInteractionType] = useState<'note' | 'call' | 'visit' | 'proposal'>(
    'note'
  );
  const [interactionContent, setInteractionContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLead();
      fetchUsers();
    }
  }, [id]);

  const fetchLead = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/leads/${id}`);
      setLead(response.data.lead);
      setSelectedStatus(response.data.lead.status);
    } catch (error) {
      console.error('Error fetching lead:', error);
      navigate('/leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Assuming there's a users endpoint - if not, we'll need to create one
      const response = await api.get('/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleStatusChange = async () => {
    if (!lead) return;

    if (selectedStatus === 'lost' && !lostReason.trim()) {
      alert('Por favor, informe o motivo da perda');
      return;
    }

    try {
      setSaving(true);
      await api.patch(`/leads/${lead.id}/status`, {
        status: selectedStatus,
        lost_reason: selectedStatus === 'lost' ? lostReason : undefined,
      });
      await fetchLead();
      setShowStatusModal(false);
      setLostReason('');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erro ao atualizar status');
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async () => {
    if (!lead || !selectedUserId) return;

    try {
      setSaving(true);
      await api.patch(`/leads/${lead.id}/assign`, {
        user_id: selectedUserId,
      });
      await fetchLead();
      setShowAssignModal(false);
    } catch (error) {
      console.error('Error assigning lead:', error);
      alert('Erro ao atribuir lead');
    } finally {
      setSaving(false);
    }
  };

  const handleAddInteraction = async () => {
    if (!lead || !interactionContent.trim()) return;

    try {
      setSaving(true);
      await api.post(`/leads/${lead.id}/interactions`, {
        type: interactionType,
        content: interactionContent,
      });
      await fetchLead();
      setShowInteractionModal(false);
      setInteractionContent('');
      setInteractionType('note');
    } catch (error) {
      console.error('Error adding interaction:', error);
      alert('Erro ao adicionar interação');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Lead não encontrado</h2>
          <button
            onClick={() => navigate('/leads')}
            className="mt-4 px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
          >
            Voltar para Leads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-6 animate-fade-in">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <button
          onClick={() => navigate('/leads')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Voltar para Leads
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-['Playfair_Display'] font-bold text-gray-900 mb-2">
              {lead.name}
            </h1>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[lead.status]}`}
              >
                {STATUS_LABELS[lead.status]}
              </span>
              <span className="text-gray-500">{getTimeAgo(lead.created_at)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowStatusModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-lg hover:from-amber-500 hover:to-amber-700 transition-all shadow-md"
            >
              Alterar Status
            </button>
            {isOwnerOrManager && (
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-800 text-white rounded-lg hover:from-gray-700 hover:to-gray-900 transition-all shadow-md"
              >
                Atribuir
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Lead Info & Vehicle */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lead Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-['Playfair_Display'] font-bold text-gray-900 mb-6">
              Informações do Lead
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600">Nome</label>
                <p className="text-lg font-semibold text-gray-900">{lead.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Telefone</label>
                <p className="text-lg font-semibold text-gray-900">
                  <a href={`tel:${lead.phone}`} className="hover:text-amber-600 transition-colors">
                    {lead.phone}
                  </a>
                </p>
              </div>

              {lead.email && (
                <div>
                  <label className="text-sm font-medium text-gray-600">E-mail</label>
                  <p className="text-lg font-semibold text-gray-900">
                    <a
                      href={`mailto:${lead.email}`}
                      className="hover:text-amber-600 transition-colors"
                    >
                      {lead.email}
                    </a>
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-600">Tipo de Contato</label>
                <p className="text-lg font-semibold text-gray-900">{TYPE_LABELS[lead.type]}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Canal de Origem</label>
                <p className="text-lg font-semibold text-gray-900">
                  {CHANNEL_LABELS[lead.channel]}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Data de Criação</label>
                <p className="text-lg font-semibold text-gray-900">{formatDate(lead.created_at)}</p>
              </div>

              {lead.proposal_value && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Valor da Proposta</label>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(lead.proposal_value)}
                  </p>
                </div>
              )}

              {lead.trade_vehicle && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Veículo de Troca</label>
                  <p className="text-lg font-semibold text-gray-900">{lead.trade_vehicle}</p>
                </div>
              )}

              {lead.device && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Dispositivo</label>
                  <p className="text-lg font-semibold text-gray-900 capitalize">{lead.device}</p>
                </div>
              )}

              {lead.utm_source && (
                <div>
                  <label className="text-sm font-medium text-gray-600">UTM Source</label>
                  <p className="text-lg font-semibold text-gray-900">{lead.utm_source}</p>
                </div>
              )}

              {lead.lost_reason && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600">Motivo da Perda</label>
                  <p className="text-lg font-semibold text-red-600">{lead.lost_reason}</p>
                </div>
              )}
            </div>

            {/* WhatsApp Button */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <a
                href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Enviar WhatsApp
              </a>
            </div>
          </div>

          {/* Vehicle Information */}
          {lead.vehicle && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-['Playfair_Display'] font-bold text-gray-900 mb-6">
                Veículo de Interesse
              </h2>

              <div className="flex gap-6">
                {lead.vehicle.photos && lead.vehicle.photos.length > 0 && (
                  <div className="flex-shrink-0">
                    <img
                      src={lead.vehicle.photos[0].url}
                      alt={`${lead.vehicle.brand} ${lead.vehicle.model}`}
                      className="w-48 h-32 object-cover rounded-lg"
                    />
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {lead.vehicle.brand} {lead.vehicle.model}
                  </h3>
                  {lead.vehicle.version && (
                    <p className="text-gray-600 mb-2">{lead.vehicle.version}</p>
                  )}
                  <p className="text-gray-600 mb-4">Ano {lead.vehicle.year_model}</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(lead.vehicle.sale_price)}
                  </p>
                  <button
                    onClick={() => navigate(`/vehicles/${lead.vehicle?.id}`)}
                    className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Ver Detalhes do Veículo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Timeline of Interactions */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-['Playfair_Display'] font-bold text-gray-900">
                Histórico de Interações
              </h2>
              <button
                onClick={() => setShowInteractionModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-lg hover:from-amber-500 hover:to-amber-700 transition-all shadow-md"
              >
                + Nova Interação
              </button>
            </div>

            <div className="space-y-4">
              {lead.interactions && lead.interactions.length > 0 ? (
                lead.interactions.map((interaction) => (
                  <div
                    key={interaction.id}
                    className="border-l-4 border-amber-400 pl-4 py-3 bg-gray-50 rounded-r-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                          {INTERACTION_TYPE_LABELS[interaction.type]}
                        </span>
                        <span className="text-sm text-gray-600">
                          {interaction.user?.name || 'Usuário'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(interaction.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-800">{interaction.content}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhuma interação registrada ainda</p>
                  <p className="text-sm mt-2">
                    Clique em "Nova Interação" para adicionar notas, ligações ou visitas
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Assigned User */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Vendedor Responsável</h3>
            {lead.assigned_user ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg">
                  {lead.assigned_user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{lead.assigned_user.name}</p>
                  <p className="text-sm text-gray-600">{lead.assigned_user.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Não atribuído</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ações Rápidas</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowStatusModal(true)}
                className="w-full px-4 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-left"
              >
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Alterar Status
                </div>
              </button>

              <button
                onClick={() => setShowInteractionModal(true)}
                className="w-full px-4 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-left"
              >
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Adicionar Nota
                </div>
              </button>

              <a
                href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-left block"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  Enviar WhatsApp
                </div>
              </a>

              <a
                href={`tel:${lead.phone}`}
                className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-left block"
              >
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  Ligar Agora
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-2xl font-['Playfair_Display'] font-bold text-gray-900 mb-6">
              Alterar Status
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Novo Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as LeadStatus)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="new">Novo</option>
                  <option value="in_progress">Em Atendimento</option>
                  <option value="negotiating">Negociando</option>
                  <option value="converted">Convertido</option>
                  <option value="lost">Perdido</option>
                </select>
              </div>

              {selectedStatus === 'lost' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo da Perda *
                  </label>
                  <textarea
                    value={lostReason}
                    onChange={(e) => setLostReason(e.target.value)}
                    placeholder="Ex: Preço, financiamento não aprovado, comprou outro veículo..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedStatus(lead.status);
                  setLostReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleStatusChange}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-lg hover:from-amber-500 hover:to-amber-700 transition-all disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-2xl font-['Playfair_Display'] font-bold text-gray-900 mb-6">
              Atribuir Lead
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione o Vendedor
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedUserId('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleAssign}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-lg hover:from-amber-500 hover:to-amber-700 transition-all disabled:opacity-50"
                disabled={saving || !selectedUserId}
              >
                {saving ? 'Salvando...' : 'Atribuir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Interaction Modal */}
      {showInteractionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-2xl font-['Playfair_Display'] font-bold text-gray-900 mb-6">
              Nova Interação
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Interação
                </label>
                <select
                  value={interactionType}
                  onChange={(e) => setInteractionType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="note">Nota</option>
                  <option value="call">Ligação</option>
                  <option value="visit">Visita</option>
                  <option value="proposal">Proposta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea
                  value={interactionContent}
                  onChange={(e) => setInteractionContent(e.target.value)}
                  placeholder="Descreva o que aconteceu nesta interação..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowInteractionModal(false);
                  setInteractionContent('');
                  setInteractionType('note');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleAddInteraction}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-lg hover:from-amber-500 hover:to-amber-700 transition-all disabled:opacity-50"
                disabled={saving || !interactionContent.trim()}
              >
                {saving ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

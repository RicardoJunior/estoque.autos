import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

interface SaleDetail {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  lead_id?: string;
  seller_id: string;
  buyer_name: string;
  buyer_document: string;
  buyer_phone: string;
  buyer_email?: string;
  final_price: number;
  payment_method: string;
  trade_value?: number;
  commission_value?: number;
  gross_margin: number;
  notes?: string;
  sold_at: string;
  created_at: string;
  vehicle?: {
    id: string;
    brand: string;
    model: string;
    version?: string;
    year_fab: number;
    year_model: number;
    mileage: number;
    purchase_price: number;
    photos?: Array<{ url: string; order: number; is_primary: boolean }>;
  };
  seller?: {
    id: string;
    name: string;
    email: string;
  };
  lead?: {
    id: string;
    name: string;
    channel: string;
  };
}

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSaleDetail();
  }, [id]);

  const fetchSaleDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sales/${id}`);
      setSale(response.data.sale);
    } catch (err) {
      setError('Erro ao carregar detalhes da venda');
      console.error('Error fetching sale detail:', err);
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="alert alert-error">
            <span>{error || 'Venda não encontrada'}</span>
          </div>
          <button onClick={() => navigate('/sales')} className="btn btn-outline mt-4">
            ← Voltar para Vendas
          </button>
        </div>
      </div>
    );
  }

  const marginPercentage = sale.vehicle?.purchase_price
    ? (sale.gross_margin / sale.vehicle.purchase_price) * 100
    : 0;

  return (
    <div
      className="min-h-screen p-6 animate-fade-in"
      style={{
        background: 'linear-gradient(to bottom, rgb(248, 250, 252), rgb(255, 255, 255))',
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button onClick={() => navigate('/sales')} className="btn btn-ghost btn-sm mb-2">
              ← Voltar para Vendas
            </button>
            <h1 className="text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
              Detalhes da Venda
            </h1>
            <p className="text-slate-600 mt-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Informações completas da transação
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500">Data da Venda</div>
            <div className="text-xl font-semibold">{formatDate(sale.sold_at)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Card */}
            <div className="card bg-white shadow-xl">
              <div className="card-body">
                <h2
                  className="card-title text-2xl mb-4"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    background: 'linear-gradient(135deg, #d4af37 0%, #c0c0c0 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  🚗 Veículo Vendido
                </h2>

                <div className="flex items-start gap-4">
                  {sale.vehicle?.photos && sale.vehicle.photos.length > 0 && (
                    <img
                      src={sale.vehicle.photos[0].url}
                      alt={`${sale.vehicle.brand} ${sale.vehicle.model}`}
                      className="w-32 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">
                      {sale.vehicle?.brand} {sale.vehicle?.model}
                    </h3>
                    {sale.vehicle?.version && (
                      <p className="text-slate-600 mb-2">{sale.vehicle.version}</p>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-semibold">Ano:</span> {sale.vehicle?.year_fab}/
                        {sale.vehicle?.year_model}
                      </div>
                      <div>
                        <span className="font-semibold">KM:</span>{' '}
                        {sale.vehicle?.mileage.toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <Link
                      to={`/vehicles/${sale.vehicle_id}`}
                      className="btn btn-sm btn-outline mt-3"
                    >
                      Ver Detalhes do Veículo →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Buyer Card */}
            <div className="card bg-white shadow-xl">
              <div className="card-body">
                <h2
                  className="card-title text-2xl mb-4"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    background: 'linear-gradient(135deg, #d4af37 0%, #c0c0c0 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  👤 Comprador
                </h2>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-slate-500">Nome</div>
                    <div className="font-semibold text-lg">{sale.buyer_name}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-slate-500">Documento</div>
                      <div className="font-mono">{sale.buyer_document}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Telefone</div>
                      <div>
                        <a href={`tel:${sale.buyer_phone}`} className="link link-primary">
                          {sale.buyer_phone}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">E-mail</div>
                    <div>
                      <a href={`mailto:${sale.buyer_email}`} className="link link-primary">
                        {sale.buyer_email}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="card bg-white shadow-xl">
              <div className="card-body">
                <h2
                  className="card-title text-2xl mb-4"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    background: 'linear-gradient(135deg, #d4af37 0%, #c0c0c0 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  💳 Detalhes da Transação
                </h2>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-slate-500">Forma de Pagamento</div>
                      <div className="badge badge-lg badge-outline">
                        {getPaymentMethodLabel(sale.payment_method)}
                      </div>
                    </div>
                    {sale.trade_value && sale.trade_value > 0 && (
                      <div>
                        <div className="text-sm text-slate-500">Valor da Troca</div>
                        <div className="font-semibold text-amber-600">
                          {formatCurrency(sale.trade_value)}
                        </div>
                      </div>
                    )}
                  </div>

                  {sale.notes && (
                    <div>
                      <div className="text-sm text-slate-500">Observações</div>
                      <div className="p-3 bg-slate-50 rounded-lg mt-1 whitespace-pre-line">
                        {sale.notes}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-sm text-slate-500">Registrado em</div>
                    <div className="text-sm">{formatDateTime(sale.created_at)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Financial Info */}
          <div className="space-y-6">
            {/* Seller Card */}
            <div className="card bg-white shadow-xl">
              <div className="card-body">
                <h3 className="font-semibold text-lg mb-3">🎯 Vendedor</h3>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{
                      background: 'linear-gradient(135deg, #d4af37 0%, #c0c0c0 100%)',
                    }}
                  >
                    {sale.seller?.name?.charAt(0) || 'V'}
                  </div>
                  <div>
                    <div className="font-semibold">{sale.seller?.name}</div>
                    <div className="text-sm text-slate-500">{sale.seller?.email}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div
              className="card shadow-xl text-white"
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
              }}
            >
              <div className="card-body">
                <h3 className="font-semibold text-lg mb-4">💰 Resumo Financeiro</h3>

                <div className="space-y-4">
                  <div>
                    <div className="text-sm opacity-80">Preço de Venda</div>
                    <div className="text-3xl font-bold">{formatCurrency(sale.final_price)}</div>
                  </div>

                  <div className="divider my-2"></div>

                  <div>
                    <div className="text-sm opacity-80">Margem Bruta</div>
                    <div
                      className={`text-2xl font-bold ${sale.gross_margin >= 0 ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {formatCurrency(sale.gross_margin)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm opacity-80">Margem %</div>
                    <div
                      className={`text-xl font-semibold ${marginPercentage >= 15 ? 'text-green-400' : marginPercentage >= 10 ? 'text-yellow-400' : 'text-red-400'}`}
                    >
                      {marginPercentage.toFixed(1)}%
                    </div>
                  </div>

                  {sale.commission_value && sale.commission_value > 0 && (
                    <>
                      <div className="divider my-2"></div>
                      <div>
                        <div className="text-sm opacity-80">Comissão</div>
                        <div className="text-xl font-semibold text-amber-400">
                          {formatCurrency(sale.commission_value)}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Lead Origin */}
            {sale.lead && (
              <div className="card bg-white shadow-xl">
                <div className="card-body">
                  <h3 className="font-semibold text-lg mb-3">📞 Lead de Origem</h3>
                  <div className="space-y-2">
                    <div>
                      <div className="text-sm text-slate-500">Nome</div>
                      <div className="font-semibold">{sale.lead.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Canal</div>
                      <div className="badge badge-outline capitalize">{sale.lead.channel}</div>
                    </div>
                    <Link
                      to={`/leads/${sale.lead_id}`}
                      className="btn btn-sm btn-outline w-full mt-2"
                    >
                      Ver Lead →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

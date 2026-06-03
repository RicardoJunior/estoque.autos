import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { Vehicle, User, Lead } from '../types';

// Validation schema matching backend
const saleFormSchema = z.object({
  vehicle_id: z.string().uuid(),
  lead_id: z.string().uuid().optional().nullable(),
  seller_id: z.string().uuid({ message: 'Selecione um vendedor' }),
  buyer_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255),
  buyer_document: z.string().min(11, 'CPF/CNPJ inválido').max(18),
  buyer_phone: z.string().min(10, 'Telefone inválido').max(20),
  buyer_email: z.string().email('E-mail inválido').max(255),
  final_price: z.number().positive('Valor deve ser positivo'),
  payment_method: z.enum(['cash', 'financing', 'consortium', 'trade_and_cash'], {
    errorMap: () => ({ message: 'Selecione uma forma de pagamento' }),
  }),
  trade_value: z.number().nonnegative().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  sold_at: z.string().optional(),
});

type SaleFormData = z.infer<typeof saleFormSchema>;

export default function SaleFormPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      vehicle_id: vehicleId,
      seller_id: user?.id, // Default to current user
      payment_method: 'cash',
      sold_at: new Date().toISOString().split('T')[0], // Today's date
    },
  });

  const paymentMethod = watch('payment_method');
  const finalPrice = watch('final_price');
  const tradeValue = watch('trade_value');

  // Fetch vehicle, users, and leads
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch vehicle
        const vehicleResponse = await api.get(`/vehicles/${vehicleId}`);
        setVehicle(vehicleResponse.data.vehicle);
        setValue('final_price', vehicleResponse.data.vehicle.sale_price);

        // Fetch users (sellers)
        const usersResponse = await api.get('/users');
        setUsers(usersResponse.data.users.filter((u: User) => u.is_active));

        // Fetch leads for this vehicle
        const leadsResponse = await api.get(
          `/leads?vehicle_id=${vehicleId}&status=negotiating,in_progress`
        );
        setLeads(leadsResponse.data.leads);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.error || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    if (vehicleId) {
      fetchData();
    }
  }, [vehicleId, setValue]);

  const onSubmit = async (data: SaleFormData) => {
    try {
      setSaving(true);
      setError(null);

      // Convert sold_at to ISO string if present
      const saleData = {
        ...data,
        sold_at: data.sold_at ? new Date(data.sold_at).toISOString() : undefined,
        lead_id: data.lead_id || null,
        trade_value: data.trade_value || null,
        notes: data.notes || null,
      };

      await api.post('/sales', saleData);

      // Redirect to sales list
      navigate('/sales');
    } catch (err: any) {
      console.error('Error creating sale:', err);
      setError(err.response?.data?.error || 'Erro ao registrar venda');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-error">
          <span>Veículo não encontrado</span>
        </div>
      </div>
    );
  }

  // Calculate margin
  const totalExpenses = vehicle.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const grossMargin = finalPrice - (vehicle.purchase_price || 0) - totalExpenses;
  const marginPercent = vehicle.purchase_price
    ? ((grossMargin / vehicle.purchase_price) * 100).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-8 animate-fade-in">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-['Playfair_Display'] text-4xl font-bold text-slate-900 mb-2">
            Registrar Venda
          </h1>
          <p className="text-slate-600">Preencha os dados da transação para finalizar a venda</p>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Vehicle Summary */}
        <div className="card bg-white shadow-lg mb-6 border border-slate-200">
          <div className="card-body">
            <h2 className="card-title text-slate-900 mb-4">Veículo</h2>
            <div className="flex gap-4">
              {vehicle.photos && vehicle.photos.length > 0 && (
                <img
                  src={vehicle.photos.find((p) => p.is_primary)?.url || vehicle.photos[0].url}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="w-32 h-24 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <p className="font-bold text-lg text-slate-900">
                  {vehicle.brand} {vehicle.model} {vehicle.version}
                </p>
                <p className="text-slate-600">
                  {vehicle.year_model} • {vehicle.mileage.toLocaleString('pt-BR')} km
                </p>
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-yellow-500 mt-2">
                  R$ {vehicle.sale_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sale Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="card bg-white shadow-lg border border-slate-200">
            <div className="card-body">
              {/* Seller & Lead */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Vendedor Responsável *</span>
                  </label>
                  <select
                    {...register('seller_id')}
                    className={`select select-bordered ${errors.seller_id ? 'select-error' : ''}`}
                  >
                    <option value="">Selecione um vendedor</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} (
                        {u.role === 'owner'
                          ? 'Proprietário'
                          : u.role === 'manager'
                            ? 'Gerente'
                            : 'Vendedor'}
                        )
                      </option>
                    ))}
                  </select>
                  {errors.seller_id && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.seller_id.message}</span>
                    </label>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Lead de Origem (Opcional)</span>
                  </label>
                  <select {...register('lead_id')} className="select select-bordered">
                    <option value="">Nenhum lead vinculado</option>
                    {leads.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.name} - {lead.phone}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Buyer Information */}
              <h3 className="font-['Playfair_Display'] text-2xl font-bold text-slate-900 mb-4">
                Dados do Comprador
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Nome Completo *</span>
                  </label>
                  <input
                    type="text"
                    {...register('buyer_name')}
                    className={`input input-bordered ${errors.buyer_name ? 'input-error' : ''}`}
                    placeholder="Nome do comprador"
                  />
                  {errors.buyer_name && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.buyer_name.message}</span>
                    </label>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">CPF/CNPJ *</span>
                  </label>
                  <input
                    type="text"
                    {...register('buyer_document')}
                    className={`input input-bordered ${errors.buyer_document ? 'input-error' : ''}`}
                    placeholder="000.000.000-00"
                  />
                  {errors.buyer_document && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.buyer_document.message}
                      </span>
                    </label>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Telefone *</span>
                  </label>
                  <input
                    type="tel"
                    {...register('buyer_phone')}
                    className={`input input-bordered ${errors.buyer_phone ? 'input-error' : ''}`}
                    placeholder="(11) 99999-9999"
                  />
                  {errors.buyer_phone && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.buyer_phone.message}
                      </span>
                    </label>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">E-mail *</span>
                  </label>
                  <input
                    type="email"
                    {...register('buyer_email')}
                    className={`input input-bordered ${errors.buyer_email ? 'input-error' : ''}`}
                    placeholder="comprador@email.com"
                  />
                  {errors.buyer_email && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.buyer_email.message}
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* Transaction Details */}
              <h3 className="font-['Playfair_Display'] text-2xl font-bold text-slate-900 mb-4">
                Dados da Transação
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Valor Final da Venda *</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('final_price', { valueAsNumber: true })}
                    className={`input input-bordered ${errors.final_price ? 'input-error' : ''}`}
                    placeholder="0.00"
                  />
                  {errors.final_price && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.final_price.message}
                      </span>
                    </label>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Forma de Pagamento *</span>
                  </label>
                  <select
                    {...register('payment_method')}
                    className={`select select-bordered ${errors.payment_method ? 'select-error' : ''}`}
                  >
                    <option value="cash">À Vista</option>
                    <option value="financing">Financiamento</option>
                    <option value="consortium">Consórcio</option>
                    <option value="trade_and_cash">Troca + Volta</option>
                  </select>
                  {errors.payment_method && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.payment_method.message}
                      </span>
                    </label>
                  )}
                </div>

                {paymentMethod === 'trade_and_cash' && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Valor da Troca</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('trade_value', { valueAsNumber: true })}
                      className="input input-bordered"
                      placeholder="0.00"
                    />
                  </div>
                )}

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Data da Venda</span>
                  </label>
                  <input type="date" {...register('sold_at')} className="input input-bordered" />
                </div>
              </div>

              <div className="form-control mb-6">
                <label className="label">
                  <span className="label-text font-semibold">Observações</span>
                </label>
                <textarea
                  {...register('notes')}
                  className="textarea textarea-bordered h-24"
                  placeholder="Informações adicionais sobre a venda..."
                ></textarea>
              </div>

              {/* Margin Display */}
              {user?.role !== 'seller' && (
                <div className="card bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-300 mb-6">
                  <div className="card-body">
                    <h4 className="font-bold text-slate-900 mb-2">Análise Financeira</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Valor de Compra</p>
                        <p className="font-bold text-slate-900">
                          R${' '}
                          {(vehicle.purchase_price || 0).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Despesas</p>
                        <p className="font-bold text-slate-900">
                          R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Margem Bruta</p>
                        <p
                          className={`font-bold ${
                            grossMargin >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          R$ {grossMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Margem %</p>
                        <p
                          className={`font-bold ${
                            grossMargin >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {marginPercent}%
                        </p>
                      </div>
                    </div>
                    {paymentMethod === 'trade_and_cash' && tradeValue && (
                      <div className="mt-4 pt-4 border-t border-slate-300">
                        <p className="text-sm text-slate-600">
                          Valor Líquido (após troca): R${' '}
                          {(finalPrice - tradeValue).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="btn btn-outline"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn bg-gradient-to-r from-amber-600 to-yellow-500 text-white hover:from-amber-700 hover:to-yellow-600 border-0"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Salvando...
                    </>
                  ) : (
                    'Registrar Venda'
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

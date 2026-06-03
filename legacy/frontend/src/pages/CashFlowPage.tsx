import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import type { CashFlowEntry, CashFlowSummary, CashFlowType } from '../types';

// Form validation schema
const cashFlowSchema = z.object({
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Categoria é obrigatória').max(100),
  description: z.string().min(1, 'Descrição é obrigatória').max(500),
  amount: z.number().positive('Valor deve ser maior que zero'),
  entry_date: z.string().optional(),
});

type CashFlowFormData = z.infer<typeof cashFlowSchema>;

// Common expense categories
const EXPENSE_CATEGORIES = [
  'Aluguel',
  'Salários',
  'Marketing',
  'Manutenção',
  'Energia',
  'Água',
  'Internet',
  'Telefone',
  'Impostos',
  'Seguros',
  'Combustível',
  'Despesas Administrativas',
  'Outros',
];

// Common income categories
const INCOME_CATEGORIES = ['Serviços', 'Consultoria', 'Comissões', 'Outros'];

export default function CashFlowPage() {
  const [entries, setEntries] = useState<CashFlowEntry[]>([]);
  const [summary, setSummary] = useState<CashFlowSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<CashFlowType | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CashFlowFormData>({
    resolver: zodResolver(cashFlowSchema),
    defaultValues: {
      type: 'expense',
      entry_date: new Date().toISOString().split('T')[0],
    },
  });

  const watchType = watch('type');

  const fetchEntries = useCallback(async () => {
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: 20,
      };

      if (filterType !== 'all') {
        params.type = filterType;
      }

      if (filterCategory) {
        params.category = filterCategory;
      }

      if (startDate) {
        params.start_date = startDate;
      }

      if (endDate) {
        params.end_date = endDate;
      }

      const response = await api.get('/cash-flow', { params });
      setEntries(response.data.entries);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching cash flow entries:', error);
    }
  }, [currentPage, filterType, filterCategory, startDate, endDate]);

  const fetchSummary = useCallback(async () => {
    try {
      const params: Record<string, string> = {};

      if (startDate) {
        params.start_date = startDate;
      }

      if (endDate) {
        params.end_date = endDate;
      }

      const response = await api.get('/cash-flow/summary', { params });
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Error fetching cash flow summary:', error);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchEntries(), fetchSummary()]);
      setLoading(false);
    };

    loadData();
  }, [fetchEntries, fetchSummary]);

  const onSubmit = async (data: CashFlowFormData) => {
    try {
      setSaving(true);
      await api.post('/cash-flow', data);
      reset();
      setShowForm(false);
      await Promise.all([fetchEntries(), fetchSummary()]);
    } catch (error) {
      console.error('Error creating cash flow entry:', error);
      alert('Erro ao criar lançamento');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/cash-flow/${id}`);
      setDeleteId(null);
      await Promise.all([fetchEntries(), fetchSummary()]);
    } catch (error) {
      console.error('Error deleting cash flow entry:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } };
        if (axiosError.response?.data?.error) {
          alert(axiosError.response.data.error);
        } else {
          alert('Erro ao deletar lançamento');
        }
      } else {
        alert('Erro ao deletar lançamento');
      }
    }
  };

  const categories = watchType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-4 md:p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 font-['Playfair_Display']">
              Fluxo de Caixa
            </h1>
            <p className="text-slate-600 mt-2">
              Gerencie lançamentos manuais de receitas e despesas
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary bg-gradient-to-r from-amber-500 to-amber-600 border-none text-white hover:from-amber-600 hover:to-amber-700"
          >
            {showForm ? '✕ Cancelar' : '+ Novo Lançamento'}
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="card bg-green-50 border border-green-200">
              <div className="card-body">
                <h3 className="text-sm text-green-700 font-semibold">Total de Receitas</h3>
                <p className="text-3xl font-bold text-green-800">
                  {summary.totalIncome.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </p>
              </div>
            </div>
            <div className="card bg-red-50 border border-red-200">
              <div className="card-body">
                <h3 className="text-sm text-red-700 font-semibold">Total de Despesas</h3>
                <p className="text-3xl font-bold text-red-800">
                  {summary.totalExpenses.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </p>
              </div>
            </div>
            <div
              className={`card ${summary.balance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'} border`}
            >
              <div className="card-body">
                <h3
                  className={`text-sm font-semibold ${summary.balance >= 0 ? 'text-blue-700' : 'text-amber-700'}`}
                >
                  Saldo do Período
                </h3>
                <p
                  className={`text-3xl font-bold ${summary.balance >= 0 ? 'text-blue-800' : 'text-amber-800'}`}
                >
                  {summary.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="card bg-white shadow-lg mb-8 animate-fade-in">
            <div className="card-body">
              <h2 className="text-2xl font-bold text-slate-800 mb-4 font-['Playfair_Display']">
                Novo Lançamento Manual
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Tipo *</span>
                    </label>
                    <select {...register('type')} className="select select-bordered">
                      <option value="expense">Despesa</option>
                      <option value="income">Receita</option>
                    </select>
                    {errors.type && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.type.message}</span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Categoria *</span>
                    </label>
                    <select {...register('category')} className="select select-bordered">
                      <option value="">Selecione...</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.category.message}</span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Valor *</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('amount', { valueAsNumber: true })}
                      className="input input-bordered"
                      placeholder="0,00"
                    />
                    {errors.amount && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.amount.message}</span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Data do Lançamento</span>
                    </label>
                    <input
                      type="date"
                      {...register('entry_date')}
                      className="input input-bordered"
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Descrição *</span>
                  </label>
                  <textarea
                    {...register('description')}
                    className="textarea textarea-bordered h-24"
                    placeholder="Descreva o lançamento..."
                  />
                  {errors.description && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.description.message}
                      </span>
                    </label>
                  )}
                </div>

                <div className="flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      reset();
                      setShowForm(false);
                    }}
                    className="btn btn-ghost"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary bg-gradient-to-r from-amber-500 to-amber-600 border-none text-white"
                  >
                    {saving ? 'Salvando...' : 'Salvar Lançamento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card bg-white shadow-lg mb-8">
          <div className="card-body">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Tipo</span>
                </label>
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value as CashFlowType | 'all');
                    setCurrentPage(1);
                  }}
                  className="select select-bordered select-sm"
                >
                  <option value="all">Todos</option>
                  <option value="income">Receitas</option>
                  <option value="expense">Despesas</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Data Inicial</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="input input-bordered input-sm"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Data Final</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="input input-bordered input-sm"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilterType('all');
                    setFilterCategory('');
                    setStartDate('');
                    setEndDate('');
                    setCurrentPage(1);
                  }}
                  className="btn btn-sm btn-ghost"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Entries Table */}
        <div className="card bg-white shadow-lg">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Lançamentos ({entries.length})</h3>
            </div>

            {entries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 text-lg">Nenhum lançamento encontrado.</p>
                <p className="text-slate-400 text-sm mt-2">
                  Crie um novo lançamento para começar a controlar seu fluxo de caixa.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Tipo</th>
                      <th>Categoria</th>
                      <th>Descrição</th>
                      <th className="text-right">Valor</th>
                      <th>Criado por</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover">
                        <td>{new Date(entry.entry_date).toLocaleDateString('pt-BR')}</td>
                        <td>
                          <span
                            className={`badge ${
                              entry.type === 'income' ? 'badge-success' : 'badge-error'
                            }`}
                          >
                            {entry.type === 'income' ? 'Receita' : 'Despesa'}
                          </span>
                        </td>
                        <td>{entry.category}</td>
                        <td className="max-w-xs truncate">{entry.description}</td>
                        <td className="text-right font-semibold">
                          <span
                            className={entry.type === 'income' ? 'text-green-600' : 'text-red-600'}
                          >
                            {entry.type === 'income' ? '+' : '-'}
                            {entry.amount.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </span>
                        </td>
                        <td>{entry.created_by_user?.name || '-'}</td>
                        <td>
                          {entry.reference_type === 'manual' && (
                            <button
                              onClick={() => setDeleteId(entry.id)}
                              className="btn btn-ghost btn-sm text-error"
                            >
                              🗑️
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-sm"
                >
                  Anterior
                </button>
                <span className="flex items-center px-4 text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="btn btn-sm"
                >
                  Próxima
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg">Confirmar Exclusão</h3>
              <p className="py-4">Tem certeza que deseja deletar este lançamento?</p>
              <p className="text-sm text-slate-500 mb-4">Esta ação não pode ser desfeita.</p>
              <div className="modal-action">
                <button onClick={() => setDeleteId(null)} className="btn btn-ghost">
                  Cancelar
                </button>
                <button onClick={() => handleDelete(deleteId)} className="btn btn-error text-white">
                  Deletar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

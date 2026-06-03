import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types';

export const CommissionConfigPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await api.get('/users');
        setUsers(response.data.users);
      } catch (error: any) {
        console.error('Error fetching users:', error);
        setMessage({ type: 'error', text: 'Erro ao carregar usuários' });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleCommissionChange = (userId: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) return;

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, commission_percentage: numValue } : u))
    );
  };

  const handleSaveCommission = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    try {
      setSaving(userId);
      setMessage(null);

      await api.patch(`/users/${userId}/commission`, {
        commission_percentage: user.commission_percentage || 0,
      });

      setMessage({ type: 'success', text: `Comissão de ${user.name} atualizada com sucesso!` });

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error updating commission:', error);
      setMessage({ type: 'error', text: 'Erro ao atualizar comissão' });
    } finally {
      setSaving(null);
    }
  };

  // Only owner/manager can access
  if (currentUser?.role !== 'owner' && currentUser?.role !== 'manager') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="font-serif text-2xl text-slate-800 mb-2">Acesso Restrito</h2>
          <p className="text-slate-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-amber-600"></div>
          <p className="mt-4 text-slate-600">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-6 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-slate-800 mb-2">Configuração de Comissões</h1>
          <p className="text-slate-600">
            Defina a porcentagem de comissão sobre a margem bruta de cada vendedor
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <div className="text-2xl">ℹ️</div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Como funciona a comissão</h3>
              <ul className="text-blue-800 space-y-1 text-sm">
                <li>
                  • A comissão é calculada sobre a <strong>margem bruta</strong> da venda
                </li>
                <li>• Margem bruta = Valor de venda - Valor de compra - Despesas</li>
                <li>• Exemplo: Margem de R$ 10.000 com 10% de comissão = R$ 1.000</li>
                <li>• A comissão é calculada automaticamente ao registrar a venda</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                <tr>
                  <th className="font-serif text-lg">Usuário</th>
                  <th className="font-serif text-lg">Função</th>
                  <th className="font-serif text-lg">Status</th>
                  <th className="font-serif text-lg">Comissão (%)</th>
                  <th className="font-serif text-lg">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-500">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-full w-10">
                              <span className="text-sm font-semibold">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{user.name}</div>
                            <div className="text-sm text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            user.role === 'owner'
                              ? 'badge-primary'
                              : user.role === 'manager'
                                ? 'badge-secondary'
                                : 'badge-accent'
                          }`}
                        >
                          {user.role === 'owner'
                            ? 'Proprietário'
                            : user.role === 'manager'
                              ? 'Gerente'
                              : 'Vendedor'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${user.is_active ? 'badge-success' : 'badge-error'}`}
                        >
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={user.commission_percentage || 0}
                          onChange={(e) => handleCommissionChange(user.id, e.target.value)}
                          className="input input-bordered w-24 text-center"
                          disabled={!user.is_active || saving === user.id}
                        />
                      </td>
                      <td>
                        <button
                          onClick={() => handleSaveCommission(user.id)}
                          disabled={!user.is_active || saving === user.id}
                          className="btn btn-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0"
                        >
                          {saving === user.id ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            'Salvar'
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 flex justify-end">
          <button onClick={() => navigate('/users')} className="btn btn-outline btn-wide">
            Voltar para Usuários
          </button>
        </div>
      </div>
    </div>
  );
};

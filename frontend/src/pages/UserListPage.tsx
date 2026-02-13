import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@/types';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

export const UserListPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    if (!confirm('Tem certeza que deseja alterar o status deste usuário?')) {
      return;
    }

    try {
      await api.patch(`/users/${userId}/toggle-status`);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Erro ao alterar status do usuário');
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white';
      case 'manager':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case 'seller':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Proprietário';
      case 'manager':
        return 'Gerente';
      case 'seller':
        return 'Vendedor';
      default:
        return role;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Gerenciar Usuários
            </h1>
            <p className="text-slate-600 mt-2">Gerencie vendedores e gerentes da sua loja</p>
          </div>
          {(currentUser?.role === 'owner' || currentUser?.role === 'manager') && (
            <button
              onClick={() => navigate('/users/new')}
              className="btn btn-primary bg-gradient-to-r from-yellow-500 to-yellow-600 border-none text-white hover:from-yellow-600 hover:to-yellow-700"
            >
              + Novo Usuário
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="label">
                <span className="label-text font-medium">Buscar</span>
              </label>
              <input
                type="text"
                placeholder="Nome ou e-mail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-bordered w-full"
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text font-medium">Perfil</span>
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="all">Todos</option>
                <option value="owner">Proprietário</option>
                <option value="manager">Gerente</option>
                <option value="seller">Vendedor</option>
              </select>
            </div>

            <div>
              <label className="label">
                <span className="label-text font-medium">Status</span>
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="all">Todos</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>
        </div>

        {/* User Count */}
        <div className="mb-4">
          <p className="text-slate-600">
            {filteredUsers.length}{' '}
            {filteredUsers.length === 1 ? 'usuário encontrado' : 'usuários encontrados'}
          </p>
        </div>

        {/* Users Grid */}
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Nenhum usuário encontrado</h3>
            <p className="text-slate-500">
              {searchQuery || filterRole !== 'all' || filterStatus !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece adicionando um novo usuário'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300 border border-transparent hover:border-yellow-200"
              >
                {/* User Avatar */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-xl">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(user.name)
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-slate-800">{user.name}</h3>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Role and Status */}
                <div className="flex gap-2 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}
                  >
                    {getRoleLabel(user.role)}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.is_active
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-red-100 text-red-700 border border-red-300'
                    }`}
                  >
                    {user.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                {/* User Info */}
                {user.phone && (
                  <div className="mb-4">
                    <p className="text-sm text-slate-600">📱 {user.phone}</p>
                  </div>
                )}

                <div className="text-xs text-slate-400 mb-4">
                  Cadastrado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </div>

                {/* Actions */}
                {(currentUser?.role === 'owner' || currentUser?.role === 'manager') &&
                  user.id !== currentUser?.id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/users/${user.id}/edit`)}
                        className="btn btn-sm btn-outline flex-1"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        className={`btn btn-sm flex-1 ${
                          user.is_active ? 'btn-error btn-outline' : 'btn-success btn-outline'
                        }`}
                      >
                        {user.is_active ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/services/api';
import type { User } from '@/types';

const userSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional(),
  role: z.enum(['owner', 'manager', 'seller'], {
    errorMap: () => ({ message: 'Selecione um perfil válido' }),
  }),
});

type UserFormData = z.infer<typeof userSchema>;

export const UserFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  useEffect(() => {
    if (isEditMode) {
      fetchUser();
    }
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ user: User }>(`/users/${id}`);
      const user = response.data.user;
      reset({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      alert('Erro ao carregar usuário');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: UserFormData) => {
    try {
      setSaving(true);

      if (isEditMode) {
        // Update user (exclude email)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { email, ...updateData } = data;
        await api.put(`/users/${id}`, updateData);
        alert('Usuário atualizado com sucesso!');
      } else {
        // Create user
        await api.post('/users', data);
        alert('Usuário criado com sucesso! Um e-mail de convite foi enviado.');
      }

      navigate('/users');
    } catch (error) {
      console.error('Error saving user:', error);
      const errorMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Erro ao salvar usuário';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
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
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/users')}
            className="text-slate-600 hover:text-slate-800 mb-4 flex items-center gap-2"
          >
            ← Voltar
          </button>
          <h1 className="font-serif text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            {isEditMode ? 'Editar Usuário' : 'Novo Usuário'}
          </h1>
          <p className="text-slate-600 mt-2">
            {isEditMode
              ? 'Atualize as informações do usuário'
              : 'Preencha os dados para convidar um novo usuário'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm p-8">
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="label">
                <span className="label-text font-medium">Nome Completo *</span>
              </label>
              <input
                type="text"
                {...register('name')}
                className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                placeholder="Ex: João Silva"
              />
              {errors.name && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.name.message}</span>
                </label>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="label">
                <span className="label-text font-medium">E-mail *</span>
              </label>
              <input
                type="email"
                {...register('email')}
                disabled={isEditMode}
                className={`input input-bordered w-full ${errors.email ? 'input-error' : ''} ${
                  isEditMode ? 'bg-slate-100 cursor-not-allowed' : ''
                }`}
                placeholder="Ex: joao@exemplo.com"
              />
              {errors.email && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.email.message}</span>
                </label>
              )}
              {isEditMode && (
                <label className="label">
                  <span className="label-text-alt text-slate-500">
                    O e-mail não pode ser alterado
                  </span>
                </label>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="label">
                <span className="label-text font-medium">Telefone</span>
              </label>
              <input
                type="tel"
                {...register('phone')}
                className={`input input-bordered w-full ${errors.phone ? 'input-error' : ''}`}
                placeholder="Ex: (11) 98765-4321"
              />
              {errors.phone && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.phone.message}</span>
                </label>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="label">
                <span className="label-text font-medium">Perfil de Acesso *</span>
              </label>
              <select
                {...register('role')}
                className={`select select-bordered w-full ${errors.role ? 'select-error' : ''}`}
              >
                <option value="">Selecione um perfil</option>
                <option value="owner">Proprietário - Acesso total ao sistema</option>
                <option value="manager">
                  Gerente - Acesso total exceto configurações críticas
                </option>
                <option value="seller">
                  Vendedor - Acesso aos próprios leads e estoque (visualização)
                </option>
              </select>
              {errors.role && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.role.message}</span>
                </label>
              )}
              <label className="label">
                <span className="label-text-alt text-slate-500">
                  Defina o nível de permissões do usuário no sistema
                </span>
              </label>
            </div>

            {/* Info Box */}
            {!isEditMode && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>📧 Convite automático:</strong> Após criar o usuário, um e-mail será
                  enviado automaticamente com instruções para definir a senha e acessar o sistema.
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/users')}
                className="btn btn-outline flex-1"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary bg-gradient-to-r from-yellow-500 to-yellow-600 border-none text-white hover:from-yellow-600 hover:to-yellow-700 flex-1"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Salvando...
                  </>
                ) : (
                  <>{isEditMode ? 'Salvar Alterações' : 'Criar Usuário'}</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

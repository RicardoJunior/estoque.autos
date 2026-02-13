import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import type { Tenant } from '../types';
import { useAuthStore } from '../store/authStore';

const storeTextsSchema = z.object({
  slogan: z.string().max(200).optional(),
  about: z.string().max(1000).optional(),
  footer_text: z.string().max(500).optional(),
});

type StoreTextsFormData = z.infer<typeof storeTextsSchema>;

export function StoreTextsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<StoreTextsFormData>({
    resolver: zodResolver(storeTextsSchema),
  });

  useEffect(() => {
    // Only owner and manager can access this page
    if (user && user.role !== 'owner' && user.role !== 'manager') {
      navigate('/dashboard');
      return;
    }

    fetchTenantSettings();
  }, [user, navigate]);

  const fetchTenantSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tenant/settings');
      const tenantData = response.data.tenant as Tenant;
      setTenant(tenantData);

      // Extract texts from settings
      const settings = (tenantData.settings as Record<string, unknown>) || {};
      reset({
        slogan: (settings.slogan as string) || '',
        about: (settings.about as string) || '',
        footer_text: (settings.footer_text as string) || '',
      });
    } catch (err) {
      setError('Erro ao carregar configurações da loja');
      console.error('Error fetching tenant settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: StoreTextsFormData) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Merge with existing settings
      const existingSettings = (tenant?.settings as Record<string, unknown>) || {};
      const updatedSettings = {
        ...existingSettings,
        slogan: data.slogan || '',
        about: data.about || '',
        footer_text: data.footer_text || '',
      };

      await api.patch('/tenant/settings', {
        settings: updatedSettings,
      });

      setSuccessMessage('Textos atualizados com sucesso!');
      fetchTenantSettings();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Erro ao salvar alterações');
      console.error('Error saving store texts:', err);
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
    <div
      className="min-h-screen p-6 animate-fade-in"
      style={{
        background: 'linear-gradient(to bottom, rgb(248, 250, 252), rgb(255, 255, 255))',
      }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-4xl font-bold mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Textos da Loja
          </h1>
          <p className="text-slate-600" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Personalize os textos exibidos na sua landing page pública
          </p>
        </div>

        {error && (
          <div className="alert alert-error mb-6 shadow-lg">
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success mb-6 shadow-lg">
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor Section */}
            <div className="space-y-6">
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
                    ✏️ Editar Textos
                  </h2>

                  {/* Slogan */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Slogan / Frase de Destaque</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Os melhores veículos da região"
                      className={`input input-bordered w-full ${errors.slogan ? 'input-error' : ''}`}
                      {...register('slogan')}
                    />
                    <label className="label">
                      <span className="label-text-alt text-slate-500">
                        Aparece no topo da landing page (máximo 200 caracteres)
                      </span>
                    </label>
                    {errors.slogan && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.slogan.message}</span>
                      </label>
                    )}
                  </div>

                  {/* About */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Sobre a Loja</span>
                    </label>
                    <textarea
                      placeholder="Conte a história da sua loja, seus diferenciais, anos de experiência..."
                      className={`textarea textarea-bordered w-full h-32 ${errors.about ? 'textarea-error' : ''}`}
                      {...register('about')}
                    />
                    <label className="label">
                      <span className="label-text-alt text-slate-500">
                        Aparece na seção "Sobre" da landing page (máximo 1000 caracteres)
                      </span>
                    </label>
                    {errors.about && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.about.message}</span>
                      </label>
                    )}
                  </div>

                  {/* Footer Text */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Texto do Rodapé</span>
                    </label>
                    <textarea
                      placeholder="Informações adicionais, avisos legais, horário de atendimento..."
                      className={`textarea textarea-bordered w-full h-24 ${errors.footer_text ? 'textarea-error' : ''}`}
                      {...register('footer_text')}
                    />
                    <label className="label">
                      <span className="label-text-alt text-slate-500">
                        Aparece no rodapé da landing page (máximo 500 caracteres)
                      </span>
                    </label>
                    {errors.footer_text && (
                      <label className="label">
                        <span className="label-text-alt text-error">
                          {errors.footer_text.message}
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview & Tips Section */}
            <div className="space-y-6">
              {/* Tips Card */}
              <div className="card bg-gradient-to-br from-amber-50 to-white shadow-xl border border-amber-200">
                <div className="card-body">
                  <h3
                    className="card-title text-xl mb-3"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    💡 Dicas
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600">•</span>
                      <span>
                        <strong>Slogan:</strong> Seja conciso e impactante. Destaque seu principal
                        diferencial em poucas palavras.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600">•</span>
                      <span>
                        <strong>Sobre:</strong> Conte sua história, anos de experiência, valores e
                        por que os clientes devem escolher você.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600">•</span>
                      <span>
                        <strong>Rodapé:</strong> Informações adicionais como horários especiais,
                        políticas de troca ou avisos importantes.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600">•</span>
                      <span>
                        Mantenha os textos atualizados com promoções e novidades sazonais.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Store URL Card */}
              <div className="card bg-white shadow-xl">
                <div className="card-body">
                  <h3
                    className="card-title text-xl mb-3"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    🌐 Sua Landing Page
                  </h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Os textos editados aparecerão na sua landing page pública:
                  </p>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <a
                      href={`https://app.estoque.autos.com.br/${tenant?.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-mono text-sm break-all"
                    >
                      app.estoque.autos.com.br/{tenant?.slug}
                    </a>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="card bg-white shadow-xl">
                <div className="card-body">
                  <div className="flex flex-col gap-3">
                    <button
                      type="submit"
                      disabled={!isDirty || saving}
                      className="btn btn-primary"
                      style={{
                        background: isDirty
                          ? 'linear-gradient(135deg, #d4af37 0%, #c0c0c0 100%)'
                          : undefined,
                      }}
                    >
                      {saving ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Salvando...
                        </>
                      ) : (
                        <>💾 Salvar Alterações</>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => fetchTenantSettings()}
                      className="btn btn-outline"
                      disabled={saving}
                    >
                      🔄 Descartar Alterações
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

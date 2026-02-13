import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import type { Tenant } from '../types';

interface ColorState {
  primary: string;
  secondary: string;
  accent: string;
}

export default function ColorCustomizationPage() {
  const { user } = useAuthStore();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [colors, setColors] = useState<ColorState>({
    primary: '#d4af37',
    secondary: '#c0c0c0',
    accent: '#b8860b',
  });
  const [originalColors, setOriginalColors] = useState<ColorState>({
    primary: '#d4af37',
    secondary: '#c0c0c0',
    accent: '#b8860b',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Check permissions
  const canEdit = user?.role === 'owner' || user?.role === 'manager';

  useEffect(() => {
    fetchTenantSettings();
  }, []);

  // Apply colors to CSS variables for preview
  useEffect(() => {
    if (previewMode) {
      document.documentElement.style.setProperty('--color-primary', colors.primary);
      document.documentElement.style.setProperty('--color-secondary', colors.secondary);
      document.documentElement.style.setProperty('--color-accent', colors.accent);
    } else if (tenant?.colors) {
      document.documentElement.style.setProperty(
        '--color-primary',
        tenant.colors.primary || '#d4af37'
      );
      document.documentElement.style.setProperty(
        '--color-secondary',
        tenant.colors.secondary || '#c0c0c0'
      );
      document.documentElement.style.setProperty(
        '--color-accent',
        tenant.colors.accent || '#b8860b'
      );
    }
  }, [previewMode, colors, tenant]);

  const fetchTenantSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/tenant/settings');
      const tenantData = response.data.tenant;
      setTenant(tenantData);

      if (tenantData.colors) {
        setColors(tenantData.colors);
        setOriginalColors(tenantData.colors);
      }
    } catch (error) {
      console.error('Error fetching tenant settings:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar configurações' });
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (colorKey: keyof ColorState, value: string) => {
    setColors((prev) => ({ ...prev, [colorKey]: value }));
  };

  const handleSave = async () => {
    if (!canEdit) {
      setMessage({ type: 'error', text: 'Você não tem permissão para editar' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const response = await api.patch('/api/tenant/settings', { colors });
      setTenant(response.data.tenant);
      setOriginalColors(colors);
      setPreviewMode(false);
      setMessage({ type: 'success', text: 'Cores atualizadas com sucesso!' });

      // Update CSS variables with saved colors
      document.documentElement.style.setProperty('--color-primary', colors.primary);
      document.documentElement.style.setProperty('--color-secondary', colors.secondary);
      document.documentElement.style.setProperty('--color-accent', colors.accent);
    } catch (error: any) {
      console.error('Error updating colors:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Erro ao salvar cores',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setColors(originalColors);
    setPreviewMode(false);
    setMessage(null);
  };

  const handlePreview = () => {
    setPreviewMode(true);
  };

  const hasChanges =
    colors.primary !== originalColors.primary ||
    colors.secondary !== originalColors.secondary ||
    colors.accent !== originalColors.accent;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="p-8">
        <div className="alert alert-warning">
          <span>Você não tem permissão para acessar esta página.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-serif mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
          Personalização de Cores
        </h1>
        <p className="text-gray-600">
          Personalize a paleta de cores da sua landing page para combinar com a identidade da sua
          loja
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-6`}
        >
          <span>{message.text}</span>
        </div>
      )}

      {/* Preview Mode Banner */}
      {previewMode && (
        <div className="alert alert-info mb-6">
          <div className="flex items-center justify-between w-full">
            <span>Modo de visualização ativo - As cores abaixo mostram a prévia</span>
            <button
              type="button"
              onClick={() => setPreviewMode(false)}
              className="btn btn-sm btn-ghost"
            >
              Sair da Prévia
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Color Pickers Section */}
        <div className="card bg-white shadow-xl">
          <div className="card-body">
            <h2
              className="card-title text-2xl mb-6"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Paleta de Cores
            </h2>

            <div className="space-y-6">
              {/* Primary Color */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-lg">Cor Primária</span>
                  <span className="label-text-alt text-sm text-gray-500">Principais destaques</span>
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={colors.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="w-20 h-20 rounded-lg border-2 border-gray-300 cursor-pointer"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={colors.primary}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      className="input input-bordered w-full font-mono"
                      placeholder="#d4af37"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Usada em botões principais, títulos e elementos de destaque
                    </p>
                  </div>
                </div>
              </div>

              {/* Secondary Color */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-lg">Cor Secundária</span>
                  <span className="label-text-alt text-sm text-gray-500">Elementos de suporte</span>
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={colors.secondary}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    className="w-20 h-20 rounded-lg border-2 border-gray-300 cursor-pointer"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={colors.secondary}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      className="input input-bordered w-full font-mono"
                      placeholder="#c0c0c0"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Usada em fundos, bordas e elementos secundários
                    </p>
                  </div>
                </div>
              </div>

              {/* Accent Color */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-lg">Cor de Destaque</span>
                  <span className="label-text-alt text-sm text-gray-500">Call-to-actions</span>
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={colors.accent}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    className="w-20 h-20 rounded-lg border-2 border-gray-300 cursor-pointer"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={colors.accent}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      className="input input-bordered w-full font-mono"
                      placeholder="#b8860b"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Usada em badges, links e elementos de call-to-action
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="card-actions justify-end mt-8 gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="btn btn-ghost"
                disabled={!hasChanges || saving}
              >
                Resetar
              </button>
              <button
                type="button"
                onClick={handlePreview}
                className="btn btn-outline"
                disabled={!hasChanges || saving}
              >
                Visualizar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn"
                style={{
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                  color: '#fff',
                }}
                disabled={!hasChanges || saving}
              >
                {saving ? 'Salvando...' : 'Salvar Cores'}
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview Section */}
        <div className="card bg-white shadow-xl">
          <div className="card-body">
            <h2
              className="card-title text-2xl mb-6"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Prévia ao Vivo
            </h2>

            <div className="space-y-4">
              {/* Preview Card */}
              <div
                className="p-6 rounded-lg border-2 transition-colors"
                style={{
                  borderColor: previewMode ? colors.primary : tenant?.colors?.primary || '#d4af37',
                }}
              >
                <h3
                  className="text-2xl font-bold mb-3"
                  style={{
                    color: previewMode ? colors.primary : tenant?.colors?.primary || '#d4af37',
                    fontFamily: 'Playfair Display, serif',
                  }}
                >
                  Título de Exemplo
                </h3>
                <p className="text-gray-700 mb-4">
                  Este é um exemplo de como o texto aparecerá na sua landing page com as cores
                  selecionadas.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    className="btn btn-sm text-white"
                    style={{
                      backgroundColor: previewMode
                        ? colors.primary
                        : tenant?.colors?.primary || '#d4af37',
                      borderColor: previewMode
                        ? colors.primary
                        : tenant?.colors?.primary || '#d4af37',
                    }}
                  >
                    Botão Primário
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    style={{
                      borderColor: previewMode
                        ? colors.secondary
                        : tenant?.colors?.secondary || '#c0c0c0',
                      color: previewMode
                        ? colors.secondary
                        : tenant?.colors?.secondary || '#c0c0c0',
                    }}
                  >
                    Botão Secundário
                  </button>
                  <span
                    className="badge badge-lg"
                    style={{
                      backgroundColor: previewMode
                        ? colors.accent
                        : tenant?.colors?.accent || '#b8860b',
                      borderColor: previewMode
                        ? colors.accent
                        : tenant?.colors?.accent || '#b8860b',
                      color: '#fff',
                    }}
                  >
                    Destaque
                  </span>
                </div>
              </div>

              {/* Color Swatches */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div
                    className="w-full h-24 rounded-lg shadow-md mb-2"
                    style={{
                      backgroundColor: previewMode
                        ? colors.primary
                        : tenant?.colors?.primary || '#d4af37',
                    }}
                  ></div>
                  <p className="text-sm text-center font-semibold">Primária</p>
                  <p className="text-xs text-center text-gray-500 font-mono">
                    {previewMode ? colors.primary : tenant?.colors?.primary || '#d4af37'}
                  </p>
                </div>
                <div>
                  <div
                    className="w-full h-24 rounded-lg shadow-md mb-2"
                    style={{
                      backgroundColor: previewMode
                        ? colors.secondary
                        : tenant?.colors?.secondary || '#c0c0c0',
                    }}
                  ></div>
                  <p className="text-sm text-center font-semibold">Secundária</p>
                  <p className="text-xs text-center text-gray-500 font-mono">
                    {previewMode ? colors.secondary : tenant?.colors?.secondary || '#c0c0c0'}
                  </p>
                </div>
                <div>
                  <div
                    className="w-full h-24 rounded-lg shadow-md mb-2"
                    style={{
                      backgroundColor: previewMode
                        ? colors.accent
                        : tenant?.colors?.accent || '#b8860b',
                    }}
                  ></div>
                  <p className="text-sm text-center font-semibold">Destaque</p>
                  <p className="text-xs text-center text-gray-500 font-mono">
                    {previewMode ? colors.accent : tenant?.colors?.accent || '#b8860b'}
                  </p>
                </div>
              </div>

              {/* Info Box */}
              <div className="alert alert-info">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="stroke-current shrink-0 w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span className="text-sm">
                  As cores serão aplicadas automaticamente na sua landing page pública após salvar
                </span>
              </div>

              {/* Store URL */}
              {tenant?.slug && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold mb-1">Visualizar Landing Page:</p>
                  <a
                    href={`/${tenant.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline"
                    style={{
                      color: previewMode ? colors.primary : tenant?.colors?.primary || '#d4af37',
                    }}
                  >
                    app.estoque.autos.com.br/{tenant.slug}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-8 card bg-gradient-to-r from-amber-50 to-yellow-50 shadow-lg">
        <div className="card-body">
          <h3 className="card-title text-xl" style={{ fontFamily: 'Playfair Display, serif' }}>
            💡 Dicas para Escolher Cores
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>
              <strong>Identidade Visual:</strong> Use as cores do logo ou identidade da sua loja
              para criar consistência
            </li>
            <li>
              <strong>Contraste:</strong> Certifique-se de que há contraste suficiente entre as
              cores para facilitar a leitura
            </li>
            <li>
              <strong>Psicologia das Cores:</strong> Azul transmite confiança, vermelho urgência,
              verde crescimento, dourado luxo
            </li>
            <li>
              <strong>Teste em Dispositivos:</strong> Visualize as cores em diferentes telas e
              dispositivos antes de finalizar
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

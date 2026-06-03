import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/services/api';
import type { Tenant, Vehicle } from '@/types';
import { ClassicLandingTemplate } from '@/components/templates/ClassicLandingTemplate';
import { ModernLandingTemplate } from '@/components/templates/ModernLandingTemplate';
import { PremiumLandingTemplate } from '@/components/templates/PremiumLandingTemplate';

type TemplateId = 'classic' | 'modern' | 'premium';

interface TemplateOption {
  id: TemplateId;
  name: string;
  description: string;
  preview: string;
}

const templates: TemplateOption[] = [
  {
    id: 'classic',
    name: 'Clássico',
    description:
      'Layout limpo e direto, grid 3 colunas, tons neutros. Ideal para lojas tradicionais que priorizam clareza e funcionalidade.',
    preview: '/previews/classic.jpg',
  },
  {
    id: 'modern',
    name: 'Moderno',
    description:
      'Hero com busca integrada, cards com efeito hover, micro-animações, design arrojado. Para lojas que querem transmitir modernidade e tecnologia.',
    preview: '/previews/modern.jpg',
  },
  {
    id: 'premium',
    name: 'Premium',
    description:
      'Fundo escuro, tipografia elegante, carrossel hero, filtros laterais avançados, efeitos parallax sutis. Para lojas de alto padrão e veículos premium.',
    preview: '/previews/premium.jpg',
  },
];

const TemplateSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('classic');
  const [previewTemplate, setPreviewTemplate] = useState<TemplateId | null>(null);
  const [sampleVehicles, setSampleVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if user has permission (owner or manager only)
  useEffect(() => {
    if (user && user.role !== 'owner' && user.role !== 'manager') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch tenant data
  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch tenant settings
        const tenantResponse = await api.get('/api/tenant/settings');
        const tenantData = tenantResponse.data.tenant;
        setTenant(tenantData);
        setSelectedTemplate(tenantData.template_id || 'classic');

        // Fetch sample vehicles for preview (limit 6)
        try {
          const vehiclesResponse = await api.get('/api/vehicles', {
            params: { limit: 6, status: 'available' },
          });
          setSampleVehicles(vehiclesResponse.data.vehicles || []);
        } catch {
          // If no vehicles, use empty array
          setSampleVehicles([]);
        }
      } catch (err) {
        console.error('Error fetching tenant data:', err);
        const errorMessage =
          err instanceof Error &&
          'response' in err &&
          err.response &&
          typeof err.response === 'object' &&
          'data' in err.response &&
          err.response.data &&
          typeof err.response.data === 'object' &&
          'message' in err.response.data &&
          typeof err.response.data.message === 'string'
            ? err.response.data.message
            : 'Erro ao carregar configurações';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchTenantData();
  }, []);

  const handleSaveTemplate = async () => {
    if (!tenant) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      await api.patch('/api/tenant/settings', {
        template_id: selectedTemplate,
      });

      setSuccessMessage('Template atualizado com sucesso!');

      // Update local tenant state
      setTenant({ ...tenant, template_id: selectedTemplate });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving template:', err);
      const errorMessage =
        err instanceof Error &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data &&
        typeof err.response.data.message === 'string'
          ? err.response.data.message
          : 'Erro ao salvar template';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const openPreview = (templateId: TemplateId) => {
    setPreviewTemplate(templateId);
  };

  const closePreview = () => {
    setPreviewTemplate(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Erro ao carregar configurações</h2>
          <p className="text-gray-600">{error || 'Dados do tenant não encontrados'}</p>
        </div>
      </div>
    );
  }

  // Render preview modal
  const renderPreviewModal = () => {
    if (!previewTemplate) return null;

    const TemplateComponent =
      previewTemplate === 'classic'
        ? ClassicLandingTemplate
        : previewTemplate === 'modern'
          ? ModernLandingTemplate
          : PremiumLandingTemplate;

    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-90 overflow-auto">
        <div className="min-h-screen">
          {/* Close button */}
          <button
            onClick={closePreview}
            className="fixed top-4 right-4 z-50 bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors shadow-lg"
          >
            ✕ Fechar Preview
          </button>

          {/* Template preview */}
          <TemplateComponent store={tenant} vehicles={sampleVehicles} onVehicleClick={() => {}} />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Seletor de Template
          </h1>
          <p className="text-gray-600">
            Escolha o template da sua landing page pública. Você pode visualizar cada opção antes de
            salvar.
          </p>
        </div>

        {/* Success/Error messages */}
        {successMessage && (
          <div className="alert alert-success mb-6 shadow-lg">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error mb-6 shadow-lg">
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

        {/* Current template info */}
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-300 rounded-lg p-4 mb-8">
          <p className="text-sm font-semibold text-amber-900 mb-1">Template Atual</p>
          <p className="text-xl font-bold text-amber-700">
            {templates.find((t) => t.id === (tenant.template_id || 'classic'))?.name}
          </p>
          <p className="text-sm text-amber-600 mt-2">
            URL da sua loja:{' '}
            <a
              href={`/${tenant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-amber-800"
            >
              estoque.autos/{tenant.slug}
            </a>
          </p>
        </div>

        {/* Template cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                selectedTemplate === template.id
                  ? 'ring-4 ring-amber-500 transform scale-105'
                  : 'hover:scale-102'
              }`}
            >
              {/* Template preview image placeholder */}
              <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-2">
                    {template.id === 'classic' && '📄'}
                    {template.id === 'modern' && '🚀'}
                    {template.id === 'premium' && '💎'}
                  </div>
                  <p className="text-gray-600 font-semibold">{template.name}</p>
                </div>
              </div>

              {/* Template info */}
              <div className="p-6">
                <h3
                  className="text-2xl font-bold mb-2"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {template.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">{template.description}</p>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openPreview(template.id)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Ver Preview
                  </button>
                  <button
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`flex-1 font-semibold py-2 px-4 rounded-lg transition-colors ${
                      selectedTemplate === template.id
                        ? 'bg-amber-600 text-white cursor-default'
                        : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                    }`}
                  >
                    {selectedTemplate === template.id ? '✓ Selecionado' : 'Selecionar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveTemplate}
            disabled={saving || selectedTemplate === (tenant.template_id || 'classic')}
            className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all ${
              saving || selectedTemplate === (tenant.template_id || 'classic')
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800 shadow-lg hover:shadow-xl'
            }`}
          >
            {saving ? (
              <>
                <span className="loading loading-spinner loading-sm mr-2"></span>
                Salvando...
              </>
            ) : (
              'Salvar Template Selecionado'
            )}
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {renderPreviewModal()}
    </div>
  );
};

export default TemplateSettingsPage;

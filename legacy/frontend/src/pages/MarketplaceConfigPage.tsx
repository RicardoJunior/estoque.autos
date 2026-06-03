import { useState, useEffect } from 'react';
import type { MarketplaceConfig } from '../types';
import { api } from '../services/api';

interface PlatformInfo {
  name: string;
  platform: string;
  description: string;
  requiredFields: { key: string; label: string; type: string }[];
}

export default function MarketplaceConfigPage() {
  const [configs, setConfigs] = useState<MarketplaceConfig[]>([]);
  const [platforms, setPlatforms] = useState<PlatformInfo[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [configsRes, platformsRes] = await Promise.all([
        api.get<{ configs: MarketplaceConfig[] }>('/marketplace/configs'),
        api.get<{ platforms: PlatformInfo[] }>('/marketplace/platforms'),
      ]);
      setConfigs(configsRes.data.configs);
      setPlatforms(platformsRes.data.platforms);
    } catch (err) {
      setError('Erro ao carregar configurações');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformSelect = (platform: string) => {
    const existingConfig = configs.find((c) => c.platform === platform);
    setSelectedPlatform(platform);

    if (existingConfig) {
      setFormData(existingConfig.credentials || {});
      setIsActive(existingConfig.is_active);
    } else {
      setFormData({});
      setIsActive(true);
    }
    setTestResult(null);
    setSuccess(null);
    setError(null);
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleTestConnection = async () => {
    if (!selectedPlatform) return;

    try {
      setTesting(true);
      setTestResult(null);
      const response = await api.post<{ success: boolean; message: string }>(
        '/marketplace/test-connection',
        {
          platform: selectedPlatform,
          credentials: formData,
        }
      );
      setTestResult(response.data);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.response?.data?.error || 'Erro ao testar conexão',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPlatform) return;

    try {
      setSaving(true);
      setError(null);
      await api.post('/marketplace/configs', {
        platform: selectedPlatform,
        credentials: formData,
        is_active: isActive,
      });
      setSuccess('Configuração salva com sucesso!');
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const selectedPlatformInfo = platforms.find((p) => p.platform === selectedPlatform);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Integrações com Marketplaces
          </h1>
          <p className="text-slate-600" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Configure suas credenciais para publicar veículos nos principais portais automotivos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Platform Selection */}
          <div className="lg:col-span-1">
            <div className="card bg-white shadow-lg rounded-xl border border-slate-200">
              <div className="card-body p-6">
                <h2
                  className="text-xl font-semibold mb-4"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  Plataformas Disponíveis
                </h2>
                <div className="space-y-2">
                  {platforms.map((platform) => {
                    const config = configs.find((c) => c.platform === platform.platform);
                    const isConfigured = !!config;
                    const isActiveConfig = config?.is_active;

                    return (
                      <button
                        key={platform.platform}
                        onClick={() => handlePlatformSelect(platform.platform)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          selectedPlatform === platform.platform
                            ? 'border-amber-500 bg-gradient-to-r from-amber-50 to-yellow-50'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-800">{platform.name}</h3>
                            <p className="text-sm text-slate-500 mt-1">{platform.description}</p>
                          </div>
                          {isConfigured && (
                            <span
                              className={`badge ${
                                isActiveConfig ? 'badge-success' : 'badge-warning'
                              }`}
                            >
                              {isActiveConfig ? 'Ativa' : 'Inativa'}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Form */}
          <div className="lg:col-span-2">
            {selectedPlatform ? (
              <div className="card bg-white shadow-lg rounded-xl border border-slate-200">
                <div className="card-body p-6">
                  <h2
                    className="text-2xl font-semibold mb-4"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                  >
                    Configurar {selectedPlatformInfo?.name}
                  </h2>

                  {error && (
                    <div className="alert alert-error mb-4">
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="alert alert-success mb-4">
                      <span>{success}</span>
                    </div>
                  )}

                  {testResult && (
                    <div
                      className={`alert ${testResult.success ? 'alert-success' : 'alert-error'} mb-4`}
                    >
                      <span>{testResult.message}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    {selectedPlatformInfo?.requiredFields.map((field) => (
                      <div key={field.key} className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">{field.label}</span>
                        </label>
                        <input
                          type={field.type}
                          value={formData[field.key] || ''}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                          className="input input-bordered w-full"
                          placeholder={field.label}
                        />
                      </div>
                    ))}

                    <div className="form-control">
                      <label className="label cursor-pointer justify-start gap-4">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="checkbox checkbox-primary"
                        />
                        <span className="label-text font-medium">Integração ativa</span>
                      </label>
                      <p className="text-sm text-slate-500 mt-1 ml-10">
                        Quando ativa, os veículos serão publicados automaticamente nesta plataforma
                      </p>
                    </div>
                  </div>

                  <div className="divider my-6"></div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleTestConnection}
                      disabled={testing || Object.keys(formData).length === 0}
                      className="btn btn-outline flex-1"
                    >
                      {testing ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Testando...
                        </>
                      ) : (
                        '🔌 Testar Conexão'
                      )}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || Object.keys(formData).length === 0}
                      className="btn bg-gradient-to-r from-amber-600 to-yellow-600 text-white hover:from-amber-700 hover:to-yellow-700 flex-1"
                    >
                      {saving ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Salvando...
                        </>
                      ) : (
                        '💾 Salvar Configuração'
                      )}
                    </button>
                  </div>

                  {/* Info Card */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">💡 Como configurar</h4>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li>Preencha todos os campos obrigatórios com suas credenciais</li>
                      <li>
                        Clique em "Testar Conexão" para verificar se as credenciais estão corretas
                      </li>
                      <li>Ative a integração para começar a publicar veículos automaticamente</li>
                      <li>
                        Você pode ativar/desativar a qualquer momento sem perder as credenciais
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card bg-white shadow-lg rounded-xl border border-slate-200">
                <div className="card-body p-12 text-center">
                  <div className="text-6xl mb-4">🔌</div>
                  <h3
                    className="text-xl font-semibold mb-2"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                  >
                    Selecione uma plataforma
                  </h3>
                  <p className="text-slate-600" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Escolha uma plataforma ao lado para começar a configuração
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

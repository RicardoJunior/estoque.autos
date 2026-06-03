import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/services/api';

interface LogoVersion {
  aspect: string;
  url: string;
  width: number;
  height: number;
}

export default function LogoUploadPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [currentLogo, setCurrentLogo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Crop states for two aspect ratios
  const [squareCrop, setSquareCrop] = useState<Crop>({
    unit: '%',
    width: 50,
    height: 50,
    x: 25,
    y: 25,
  });
  const [wideCrop, setWideCrop] = useState<Crop>({
    unit: '%',
    width: 80,
    height: 45,
    x: 10,
    y: 27.5,
  });
  const [completedSquareCrop, setCompletedSquareCrop] = useState<PixelCrop>();
  const [completedWideCrop, setCompletedWideCrop] = useState<PixelCrop>();
  const [activeAspect, setActiveAspect] = useState<'square' | 'wide'>('square');

  const imgRef = useRef<HTMLImageElement>(null);

  // Check role access
  useEffect(() => {
    if (user && user.role !== 'owner' && user.role !== 'manager') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch current logo
  useEffect(() => {
    const fetchCurrentLogo = async () => {
      try {
        const response = await api.get('/tenant/settings');
        if (response.data.tenant?.logo_url) {
          setCurrentLogo(response.data.tenant.logo_url);
        }
      } catch (error) {
        console.error('Error fetching tenant settings:', error);
      }
    };

    fetchCurrentLogo();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Por favor, selecione uma imagem válida' });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Imagem muito grande. Tamanho máximo: 5MB' });
      return;
    }

    setSelectedFile(file);
    setMessage(null);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;

    // Initialize square crop (1:1 aspect ratio)
    const squareSize = Math.min(width, height) * 0.5;
    setSquareCrop({
      unit: 'px',
      width: squareSize,
      height: squareSize,
      x: (width - squareSize) / 2,
      y: (height - squareSize) / 2,
    });

    // Initialize wide crop (16:9 aspect ratio)
    const wideWidth = width * 0.8;
    const wideHeight = (wideWidth * 9) / 16;
    setWideCrop({
      unit: 'px',
      width: wideWidth,
      height: wideHeight,
      x: (width - wideWidth) / 2,
      y: (height - wideHeight) / 2,
    });
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Selecione uma imagem primeiro' });
      return;
    }

    if (!completedSquareCrop && !completedWideCrop) {
      setMessage({ type: 'error', text: 'Ajuste o recorte antes de fazer upload' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('logo', selectedFile);

      // Send crop data for the active aspect ratio
      const activeCrop = activeAspect === 'square' ? completedSquareCrop : completedWideCrop;
      if (activeCrop) {
        formData.append(
          'crop',
          JSON.stringify({
            x: activeCrop.x,
            y: activeCrop.y,
            width: activeCrop.width,
            height: activeCrop.height,
            aspect: activeAspect,
          })
        );
      }

      const response = await api.post<{
        message: string;
        logos: LogoVersion[];
        primary_logo: string;
      }>('/tenant/logo/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage({ type: 'success', text: response.data.message });
      setCurrentLogo(response.data.primary_logo);

      // Clear form
      setSelectedFile(null);
      setPreviewUrl('');

      // Redirect to settings after 2 seconds
      setTimeout(() => {
        navigate('/landing-page/template');
      }, 2000);
    } catch (error: unknown) {
      console.error('Error uploading logo:', error);
      const errorMessage =
        error instanceof Error &&
        'response' in error &&
        typeof error.response === 'object' &&
        error.response &&
        'data' in error.response &&
        typeof error.response.data === 'object' &&
        error.response.data &&
        'error' in error.response.data
          ? String(error.response.data.error)
          : 'Erro ao fazer upload do logo';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!currentLogo) return;

    if (!confirm('Tem certeza que deseja remover o logo atual?')) {
      return;
    }

    setLoading(true);
    try {
      await api.delete('/tenant/logo');
      setCurrentLogo('');
      setMessage({ type: 'success', text: 'Logo removido com sucesso' });
    } catch (error) {
      console.error('Error deleting logo:', error);
      setMessage({ type: 'error', text: 'Erro ao remover logo' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/landing-page/template')}
          className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          ← Voltar
        </button>
        <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Playfair Display' }}>
          Upload de Logo
        </h1>
        <p className="text-gray-600">
          Faça upload e recorte o logo da sua loja para personalizar a landing page
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Upload and Crop */}
        <div className="space-y-6">
          {/* Current Logo Card */}
          {currentLogo && (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-xl font-semibold mb-4">Logo Atual</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={currentLogo}
                    alt="Logo atual"
                    className="w-20 h-20 object-cover rounded-lg border-2 border-gray-300"
                  />
                  <div>
                    <p className="text-sm text-gray-600">
                      Este logo está sendo usado na sua landing page
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDeleteLogo}
                  disabled={loading}
                  className="btn btn-sm btn-outline btn-error"
                >
                  Remover
                </button>
              </div>
            </div>
          )}

          {/* File Upload Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-xl font-semibold mb-4">Selecionar Imagem</h3>
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="file-input file-input-bordered w-full"
              />
              <p className="text-sm text-gray-600">
                Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB
              </p>
            </div>
          </div>

          {/* Crop Tool */}
          {previewUrl && (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Recortar Imagem</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveAspect('square')}
                    className={`btn btn-sm ${activeAspect === 'square' ? 'btn-primary' : 'btn-outline'}`}
                  >
                    Quadrado (1:1)
                  </button>
                  <button
                    onClick={() => setActiveAspect('wide')}
                    className={`btn btn-sm ${activeAspect === 'wide' ? 'btn-primary' : 'btn-outline'}`}
                  >
                    Largo (16:9)
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <ReactCrop
                  crop={activeAspect === 'square' ? squareCrop : wideCrop}
                  onChange={(c) => (activeAspect === 'square' ? setSquareCrop(c) : setWideCrop(c))}
                  onComplete={(c) =>
                    activeAspect === 'square' ? setCompletedSquareCrop(c) : setCompletedWideCrop(c)
                  }
                  aspect={activeAspect === 'square' ? 1 : 16 / 9}
                >
                  <img
                    ref={imgRef}
                    src={previewUrl}
                    alt="Preview"
                    onLoad={handleImageLoad}
                    className="max-w-full h-auto"
                  />
                </ReactCrop>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <strong>Dica:</strong> O logo será salvo em dois formatos automaticamente:
                <ul className="list-disc list-inside mt-2">
                  <li>
                    <strong>Quadrado (1:1):</strong> Usado no header da landing page
                  </li>
                  <li>
                    <strong>Largo (16:9):</strong> Usado em banners e seções hero
                  </li>
                </ul>
                <p className="mt-2">Ajuste o recorte para cada formato usando os botões acima.</p>
              </div>
            </div>
          )}

          {/* Upload Button */}
          {previewUrl && (
            <button
              onClick={handleUpload}
              disabled={loading}
              className="btn btn-primary w-full"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)',
                border: 'none',
              }}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Fazendo upload...
                </>
              ) : (
                'Fazer Upload'
              )}
            </button>
          )}
        </div>

        {/* Right Column: Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-xl font-semibold mb-4">Preview</h3>

            {!previewUrl && !currentLogo && (
              <div className="text-center py-12 text-gray-400">
                <svg
                  className="mx-auto h-24 w-24 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p>Selecione uma imagem para visualizar</p>
              </div>
            )}

            {/* Preview Square Logo */}
            {(previewUrl || currentLogo) && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3 text-gray-700">Logo Quadrado (Header)</h4>
                  <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
                    <div className="w-32 h-32 bg-white rounded-lg shadow-lg flex items-center justify-center">
                      <img
                        src={previewUrl || currentLogo}
                        alt="Preview quadrado"
                        className="max-w-full max-h-full object-contain p-4"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 text-gray-700">Logo Largo (Banner)</h4>
                  <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
                    <div className="w-full max-w-md h-32 bg-white rounded-lg shadow-lg flex items-center justify-center">
                      <img
                        src={previewUrl || currentLogo}
                        alt="Preview largo"
                        className="max-w-full max-h-full object-contain p-4"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tips Card */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg shadow-md p-6 border border-amber-200">
            <h3 className="text-xl font-semibold mb-4 text-amber-900">
              💡 Dicas para um Logo Perfeito
            </h3>
            <ul className="space-y-3 text-sm text-amber-900">
              <li className="flex gap-2">
                <span className="text-amber-500">✓</span>
                <span>Use imagens com fundo transparente (PNG) para melhor resultado</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500">✓</span>
                <span>Resolução mínima recomendada: 800x800px</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500">✓</span>
                <span>Evite logos com muito texto ou detalhes pequenos</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500">✓</span>
                <span>Certifique-se que o logo fica legível em fundos claros e escuros</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500">✓</span>
                <span>O recorte quadrado será usado como ícone da sua loja</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

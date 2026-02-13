import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { Tenant, Vehicle } from '../types';

interface VehicleDetailData {
  store: Tenant;
  vehicle: Vehicle;
}

interface LeadFormData {
  name: string;
  phone: string;
  email: string;
  proposal_value?: string;
  message: string;
  trade_vehicle?: string;
}

export const PublicVehicleDetailPage: React.FC = () => {
  const { slug, vehicleId } = useParams<{ slug: string; vehicleId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<VehicleDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    phone: '',
    email: '',
    message: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    const fetchVehicleData = async () => {
      if (!slug || !vehicleId) {
        setError('Veículo não encontrado');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await axios.get<VehicleDetailData>(
          `${apiUrl}/api/public/${slug}/vehicles/${vehicleId}`
        );

        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching vehicle data:', err);
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError('Veículo não encontrado');
        } else {
          setError('Erro ao carregar os dados do veículo');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleData();
  }, [slug, vehicleId]);

  const handleWhatsAppClick = () => {
    if (!data || !data.store.whatsapp) return;

    const message = `Olá! Tenho interesse no veículo:\n${data.vehicle.brand} ${data.vehicle.model} ${data.vehicle.version || ''}\nAno: ${data.vehicle.year_model}\nPreço: R$ ${data.vehicle.sale_price.toLocaleString('pt-BR')}`;
    const whatsappNumber = data.store.whatsapp.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    // Log lead creation (WhatsApp type)
    logLead('whatsapp');

    window.open(whatsappUrl, '_blank');
  };

  const handlePhoneClick = () => {
    if (!data) return;

    // Log lead creation (phone type)
    logLead('phone');

    window.location.href = `tel:${data.store.phone}`;
  };

  const logLead = async (type: 'whatsapp' | 'phone' | 'proposal') => {
    if (!data || !slug) return;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await axios.post(`${apiUrl}/api/public/${slug}/leads`, {
        vehicle_id: data.vehicle.id,
        name: formData.name || 'Visitante',
        phone: formData.phone || data.store.phone,
        email: formData.email || '',
        type,
        message: formData.message || '',
      });
    } catch (err) {
      console.error('Error logging lead:', err);
    }
  };

  const handleProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !slug) return;

    setFormSubmitting(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await axios.post(`${apiUrl}/api/public/${slug}/leads`, {
        vehicle_id: data.vehicle.id,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        type: 'proposal',
        proposal_value: formData.proposal_value ? parseFloat(formData.proposal_value) : undefined,
        message: formData.message,
        trade_vehicle: formData.trade_vehicle,
      });

      setFormSuccess(true);
      setTimeout(() => {
        setShowProposalForm(false);
        setFormSuccess(false);
        setFormData({
          name: '',
          phone: '',
          email: '',
          message: '',
        });
      }, 3000);
    } catch (err) {
      console.error('Error submitting proposal:', err);
      alert('Erro ao enviar proposta. Tente novamente.');
    } finally {
      setFormSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center">
          <svg
            className="w-24 h-24 mx-auto text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Veículo não encontrado'}
          </h1>
          <p className="text-gray-600 mb-6">Este veículo não está mais disponível ou não existe.</p>
          <button onClick={() => navigate(`/${slug}`)} className="btn btn-primary">
            Voltar para a loja
          </button>
        </div>
      </div>
    );
  }

  const { store, vehicle } = data;
  const photos = vehicle.photos || [];
  const hasPhotos = photos.length > 0;

  // Apply tenant colors as CSS variables
  const colors = (store.colors as { primary?: string; secondary?: string; accent?: string }) || {};
  const style = {
    '--primary-color': colors.primary || '#1e40af',
    '--secondary-color': colors.secondary || '#64748b',
    '--accent-color': colors.accent || '#d97706',
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-gray-50" style={style}>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(`/${slug}`)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              {store.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="h-12 w-12 object-cover rounded-full"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--accent-color)] flex items-center justify-center text-white font-bold text-xl">
                  {store.name.charAt(0)}
                </div>
              )}
              <span className="text-xl font-bold text-gray-900">{store.name}</span>
            </button>

            <div className="flex items-center gap-4">
              <a
                href={`tel:${store.phone}`}
                onClick={handlePhoneClick}
                className="hidden sm:flex items-center gap-2 text-gray-700 hover:text-[var(--primary-color)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span className="font-medium">{store.phone}</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Photos & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Gallery */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {hasPhotos ? (
                <>
                  {/* Main Image */}
                  <div
                    className="relative aspect-video bg-gray-100 cursor-pointer"
                    onClick={() => setShowLightbox(true)}
                  >
                    <img
                      src={photos[selectedImageIndex].url}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {selectedImageIndex + 1} / {photos.length}
                    </div>
                  </div>

                  {/* Thumbnails */}
                  {photos.length > 1 && (
                    <div className="grid grid-cols-6 gap-2 p-4 bg-gray-50">
                      {photos.map((photo, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`aspect-video rounded overflow-hidden border-2 transition-all ${
                            index === selectedImageIndex
                              ? 'border-[var(--primary-color)] ring-2 ring-[var(--primary-color)]/30'
                              : 'border-transparent hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={photo.url}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <svg
                    className="w-24 h-24 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Vehicle Information */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {vehicle.brand} {vehicle.model}
              </h1>
              {vehicle.version && <p className="text-xl text-gray-600 mb-4">{vehicle.version}</p>}

              {/* Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Ano</div>
                  <div className="text-lg font-bold text-gray-900">
                    {vehicle.year_fab}/{vehicle.year_model}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Quilometragem</div>
                  <div className="text-lg font-bold text-gray-900">
                    {vehicle.mileage.toLocaleString('pt-BR')} km
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Câmbio</div>
                  <div className="text-lg font-bold text-gray-900 capitalize">
                    {vehicle.transmission === 'manual' && 'Manual'}
                    {vehicle.transmission === 'automatic' && 'Automático'}
                    {vehicle.transmission === 'cvt' && 'CVT'}
                    {vehicle.transmission === 'automated' && 'Automatizado'}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Combustível</div>
                  <div className="text-lg font-bold text-gray-900 capitalize">
                    {vehicle.fuel === 'gasoline' && 'Gasolina'}
                    {vehicle.fuel === 'ethanol' && 'Etanol'}
                    {vehicle.fuel === 'flex' && 'Flex'}
                    {vehicle.fuel === 'diesel' && 'Diesel'}
                    {vehicle.fuel === 'electric' && 'Elétrico'}
                    {vehicle.fuel === 'hybrid' && 'Híbrido'}
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Cor:</span>
                  <span className="font-medium text-gray-900">{vehicle.color}</span>
                </div>
                {vehicle.doors && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Portas:</span>
                    <span className="font-medium text-gray-900">{vehicle.doors}</span>
                  </div>
                )}
                {vehicle.power && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Potência:</span>
                    <span className="font-medium text-gray-900">{vehicle.power} cv</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Categoria:</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {vehicle.category === 'car' && 'Carro'}
                    {vehicle.category === 'motorcycle' && 'Moto'}
                    {vehicle.category === 'utility' && 'Utilitário'}
                    {vehicle.category === 'truck' && 'Caminhão'}
                  </span>
                </div>
              </div>

              {/* Description */}
              {vehicle.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Descrição</h3>
                  <p className="text-gray-700 whitespace-pre-line">{vehicle.description}</p>
                </div>
              )}

              {/* Features & Optionals */}
              {vehicle.optionals && Object.keys(vehicle.optionals).length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Opcionais</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(vehicle.optionals).map(
                      ([key, value]) =>
                        value && (
                          <div key={key} className="flex items-center gap-2 text-sm">
                            <svg
                              className="w-5 h-5 text-green-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span className="text-gray-700 capitalize">
                              {key.replace(/_/g, ' ')}
                            </span>
                          </div>
                        )
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Store Information */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Informações da Loja</h3>
              <div className="space-y-3">
                {store.address && (
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-gray-600 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-gray-700">{store.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <a
                    href={`mailto:${store.email}`}
                    className="text-gray-700 hover:text-[var(--primary-color)]"
                  >
                    {store.email}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span className="text-gray-700">{store.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Price & Contact */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Price Card */}
              <div className="bg-gradient-to-br from-[var(--primary-color)] to-[var(--accent-color)] text-white rounded-lg shadow-lg p-6">
                <div className="text-sm opacity-90 mb-2">Preço</div>
                <div className="text-4xl font-bold mb-6">
                  R$ {vehicle.sale_price.toLocaleString('pt-BR')}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => setShowProposalForm(true)}
                    className="w-full bg-white text-[var(--primary-color)] font-bold py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Fazer Proposta
                  </button>

                  <button
                    onClick={handleWhatsAppClick}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </button>

                  <button
                    onClick={handlePhoneClick}
                    className="w-full bg-[var(--secondary-color)] hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg transition-opacity flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    Ligar Agora
                  </button>
                </div>
              </div>

              {/* Safety Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <div className="font-semibold mb-1">Compra Segura</div>
                    <p>Evite golpes! Nunca faça pagamento antes de ver o veículo pessoalmente.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {showLightbox && hasPhotos && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
            }}
            className="absolute left-4 text-white hover:text-gray-300 transition-colors"
          >
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <img
            src={photos[selectedImageIndex].url}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImageIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
            }}
            className="absolute right-4 text-white hover:text-gray-300 transition-colors"
          >
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-lg">
            {selectedImageIndex + 1} / {photos.length}
          </div>
        </div>
      )}

      {/* Proposal Form Modal */}
      {showProposalForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Fazer Proposta</h2>
                <button
                  onClick={() => setShowProposalForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {formSuccess ? (
                <div className="text-center py-8">
                  <svg
                    className="w-16 h-16 mx-auto text-green-600 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Proposta Enviada!</h3>
                  <p className="text-gray-600">Em breve entraremos em contato.</p>
                </div>
              ) : (
                <form onSubmit={handleProposalSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input input-bordered w-full"
                      placeholder="Seu nome"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone/WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input input-bordered w-full"
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input input-bordered w-full"
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor da Proposta (opcional)
                    </label>
                    <input
                      type="number"
                      value={formData.proposal_value || ''}
                      onChange={(e) => setFormData({ ...formData, proposal_value: e.target.value })}
                      className="input input-bordered w-full"
                      placeholder="R$ 0,00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Veículo para Troca (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.trade_vehicle || ''}
                      onChange={(e) => setFormData({ ...formData, trade_vehicle: e.target.value })}
                      className="input input-bordered w-full"
                      placeholder="Ex: Civic 2018"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mensagem *
                    </label>
                    <textarea
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="textarea textarea-bordered w-full"
                      rows={4}
                      placeholder="Sua mensagem..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="btn btn-primary w-full"
                  >
                    {formSubmitting ? 'Enviando...' : 'Enviar Proposta'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Button */}
      <button
        onClick={handleWhatsAppClick}
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 z-40"
        title="WhatsApp"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </button>
    </div>
  );
};

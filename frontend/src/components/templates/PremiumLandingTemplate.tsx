import React, { useState } from 'react';
import type { Vehicle, Tenant } from '../../types';

interface PremiumLandingTemplateProps {
  store: Tenant;
  vehicles: Vehicle[];
  onVehicleClick: (vehicleId: string) => void;
}

export const PremiumLandingTemplate: React.FC<PremiumLandingTemplateProps> = ({
  store,
  vehicles,
  onVehicleClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [fuelFilter, setFuelFilter] = useState<string>('all');
  const [transmissionFilter, setTransmissionFilter] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Filter vehicles based on all criteria
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      searchTerm === '' ||
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.version?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || vehicle.category === categoryFilter;
    const matchesFuel = fuelFilter === 'all' || vehicle.fuel === fuelFilter;
    const matchesTransmission =
      transmissionFilter === 'all' || vehicle.transmission === transmissionFilter;

    let matchesPrice = true;
    if (priceRange === 'under50k') matchesPrice = vehicle.sale_price < 50000;
    else if (priceRange === '50k-100k')
      matchesPrice = vehicle.sale_price >= 50000 && vehicle.sale_price <= 100000;
    else if (priceRange === 'over100k') matchesPrice = vehicle.sale_price > 100000;

    return matchesSearch && matchesCategory && matchesFuel && matchesTransmission && matchesPrice;
  });

  const featuredVehicles = filteredVehicles.filter((v) => v.featured);
  const hasActiveFilters =
    searchTerm !== '' ||
    categoryFilter !== 'all' ||
    fuelFilter !== 'all' ||
    transmissionFilter !== 'all' ||
    priceRange !== 'all';

  const clearAllFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setFuelFilter('all');
    setTransmissionFilter('all');
    setPriceRange('all');
  };

  const primaryColor = store.colors?.primary || '#d4af37';
  const secondaryColor = store.colors?.secondary || '#c0c0c0';

  // Carousel navigation
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.max(1, featuredVehicles.length));
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + featuredVehicles.length) % Math.max(1, featuredVehicles.length)
    );
  };

  const whatsappUrl = `https://wa.me/${store.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Olá! Vim através do site e gostaria de mais informações sobre os veículos disponíveis.`
  )}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <style>
        {`
          :root {
            --premium-primary: ${primaryColor};
            --premium-secondary: ${secondaryColor};
          }

          .premium-gradient-text {
            background: linear-gradient(135deg, var(--premium-primary), var(--premium-secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .premium-border-gradient {
            border: 2px solid transparent;
            background-clip: padding-box;
            position: relative;
          }

          .premium-border-gradient::before {
            content: '';
            position: absolute;
            inset: -2px;
            background: linear-gradient(135deg, var(--premium-primary), var(--premium-secondary));
            border-radius: inherit;
            z-index: -1;
          }

          .parallax-section {
            background-attachment: fixed;
            background-size: cover;
            background-position: center;
          }

          .premium-card {
            background: rgba(31, 31, 31, 0.8);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(212, 175, 55, 0.2);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .premium-card:hover {
            border-color: var(--premium-primary);
            box-shadow: 0 20px 60px rgba(212, 175, 55, 0.3);
            transform: translateY(-8px);
          }

          .carousel-fade {
            animation: fadeIn 0.8s ease-in-out;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }

          .filter-sidebar {
            background: rgba(20, 20, 20, 0.95);
            backdrop-filter: blur(20px);
            border-right: 1px solid rgba(212, 175, 55, 0.1);
          }

          .premium-input {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(212, 175, 55, 0.3);
            color: white;
            transition: all 0.3s;
          }

          .premium-input:focus {
            background: rgba(255, 255, 255, 0.08);
            border-color: var(--premium-primary);
            outline: none;
            box-shadow: 0 0 20px rgba(212, 175, 55, 0.2);
          }

          .premium-button {
            background: linear-gradient(135deg, var(--premium-primary), var(--premium-secondary));
            color: #000;
            font-weight: 600;
            transition: all 0.3s;
            border: none;
          }

          .premium-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(212, 175, 55, 0.4);
          }
        `}
      </style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {store.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="h-12 w-12 object-cover rounded"
                />
              ) : (
                <div className="h-12 w-12 bg-gradient-to-br from-[var(--premium-primary)] to-[var(--premium-secondary)] rounded flex items-center justify-center text-black font-bold text-xl">
                  {store.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold premium-gradient-text">{store.name}</h1>
                <p className="text-sm text-gray-400">Veículos Premium</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              {store.phone && (
                <a
                  href={`tel:${store.phone}`}
                  className="flex items-center space-x-2 text-gray-300 hover:text-[var(--premium-primary)] transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span>{store.phone}</span>
                </a>
              )}
              {store.whatsapp && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="premium-button px-6 py-2 rounded-full"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Lateral Filters Sidebar */}
        <aside className="filter-sidebar hidden lg:block w-80 min-h-screen sticky top-16 p-6 space-y-6 overflow-y-auto">
          <div>
            <h2 className="text-xl font-bold mb-4 premium-gradient-text">Filtros Avançados</h2>

            {/* Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-300">Buscar</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Marca, modelo..."
                className="premium-input w-full px-4 py-2 rounded-lg"
              />
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-300">Categoria</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="premium-input w-full px-4 py-2 rounded-lg"
              >
                <option value="all">Todas</option>
                <option value="car">Carros</option>
                <option value="motorcycle">Motos</option>
                <option value="utility">Utilitários</option>
                <option value="truck">Caminhões</option>
              </select>
            </div>

            {/* Fuel Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-300">Combustível</label>
              <select
                value={fuelFilter}
                onChange={(e) => setFuelFilter(e.target.value)}
                className="premium-input w-full px-4 py-2 rounded-lg"
              >
                <option value="all">Todos</option>
                <option value="gasoline">Gasolina</option>
                <option value="ethanol">Etanol</option>
                <option value="flex">Flex</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Elétrico</option>
                <option value="hybrid">Híbrido</option>
              </select>
            </div>

            {/* Transmission Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-300">Câmbio</label>
              <select
                value={transmissionFilter}
                onChange={(e) => setTransmissionFilter(e.target.value)}
                className="premium-input w-full px-4 py-2 rounded-lg"
              >
                <option value="all">Todos</option>
                <option value="manual">Manual</option>
                <option value="automatic">Automático</option>
                <option value="cvt">CVT</option>
                <option value="automated">Automatizado</option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-300">Faixa de Preço</label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="premium-input w-full px-4 py-2 rounded-lg"
              >
                <option value="all">Todos</option>
                <option value="under50k">Até R$ 50.000</option>
                <option value="50k-100k">R$ 50.000 - R$ 100.000</option>
                <option value="over100k">Acima de R$ 100.000</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="w-full px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded-lg transition"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Hero Carousel Section */}
          {featuredVehicles.length > 0 && (
            <section className="relative h-[600px] overflow-hidden parallax-section">
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10" />

              {featuredVehicles.map((vehicle, index) => {
                const primaryPhoto =
                  vehicle.photos?.find((p) => p.is_primary) || vehicle.photos?.[0];
                return (
                  <div
                    key={vehicle.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ${
                      index === currentSlide ? 'opacity-100 carousel-fade' : 'opacity-0'
                    }`}
                    style={{
                      backgroundImage: primaryPhoto?.url
                        ? `url(${primaryPhoto.url})`
                        : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                );
              })}

              <div className="relative z-20 h-full flex items-center container mx-auto px-4">
                <div className="max-w-2xl">
                  <div className="inline-block px-4 py-1 bg-[var(--premium-primary)]/20 border border-[var(--premium-primary)] rounded-full mb-4">
                    <span className="text-[var(--premium-primary)] font-semibold">
                      DESTAQUE PREMIUM
                    </span>
                  </div>
                  <h2 className="text-5xl md:text-6xl font-bold mb-4 text-white">
                    {featuredVehicles[currentSlide]?.brand} {featuredVehicles[currentSlide]?.model}
                  </h2>
                  {featuredVehicles[currentSlide]?.version && (
                    <p className="text-2xl text-gray-300 mb-6">
                      {featuredVehicles[currentSlide].version}
                    </p>
                  )}
                  <div className="flex items-center space-x-6 mb-8">
                    <div className="text-5xl font-bold premium-gradient-text">
                      R$ {featuredVehicles[currentSlide]?.sale_price.toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <button
                    onClick={() => onVehicleClick(featuredVehicles[currentSlide]?.id)}
                    className="premium-button px-8 py-4 rounded-full text-lg"
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>

              {/* Carousel Controls */}
              {featuredVehicles.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-black/50 hover:bg-[var(--premium-primary)] rounded-full flex items-center justify-center transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-black/50 hover:bg-[var(--premium-primary)] rounded-full flex items-center justify-center transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>

                  {/* Carousel Indicators */}
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
                    {featuredVehicles.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-3 h-3 rounded-full transition ${
                          index === currentSlide
                            ? 'bg-[var(--premium-primary)] w-8'
                            : 'bg-white/30 hover:bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </section>
          )}

          {/* Vehicles Grid */}
          <section className="container mx-auto px-4 py-16">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2 premium-gradient-text">
                Nossa Coleção Premium
              </h2>
              <p className="text-gray-400">
                {filteredVehicles.length}{' '}
                {filteredVehicles.length === 1 ? 'veículo disponível' : 'veículos disponíveis'}
              </p>
            </div>

            {filteredVehicles.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🚗</div>
                <h3 className="text-2xl font-bold mb-2 text-gray-300">Nenhum veículo encontrado</h3>
                <p className="text-gray-500 mb-6">
                  Tente ajustar os filtros para ver mais resultados
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="premium-button px-6 py-3 rounded-full"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredVehicles.map((vehicle) => {
                  const primaryPhoto =
                    vehicle.photos?.find((p) => p.is_primary) || vehicle.photos?.[0];

                  return (
                    <div
                      key={vehicle.id}
                      onClick={() => onVehicleClick(vehicle.id)}
                      className="premium-card rounded-lg overflow-hidden cursor-pointer group"
                    >
                      <div className="relative h-64 overflow-hidden">
                        {primaryPhoto?.url ? (
                          <img
                            src={primaryPhoto.url}
                            alt={`${vehicle.brand} ${vehicle.model}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                            <svg
                              className="w-20 h-20 text-gray-600"
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
                        {vehicle.featured && (
                          <div className="absolute top-4 right-4 bg-[var(--premium-primary)] text-black px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span>DESTAQUE</span>
                          </div>
                        )}
                      </div>

                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-1 text-white">
                          {vehicle.brand} {vehicle.model}
                        </h3>
                        {vehicle.version && (
                          <p className="text-sm text-gray-400 mb-4">{vehicle.version}</p>
                        )}

                        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                          <div className="flex items-center space-x-2 text-gray-300">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span>{vehicle.year_model}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-300">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                            <span>{vehicle.mileage.toLocaleString()} km</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-300">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                              />
                            </svg>
                            <span className="capitalize">{vehicle.transmission}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-300">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                              />
                            </svg>
                            <span className="capitalize">{vehicle.fuel}</span>
                          </div>
                        </div>

                        <div className="border-t border-gray-700 pt-4">
                          <div className="text-3xl font-bold premium-gradient-text">
                            R$ {vehicle.sale_price.toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Footer */}
          <footer className="bg-black border-t border-gray-800 py-12">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                {/* Store Info */}
                <div>
                  <h3 className="text-xl font-bold mb-4 premium-gradient-text">{store.name}</h3>
                  {store.address && (
                    <p className="text-gray-400 mb-2 flex items-start space-x-2">
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
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>{store.address}</span>
                    </p>
                  )}
                </div>

                {/* Contact */}
                <div>
                  <h3 className="text-xl font-bold mb-4 premium-gradient-text">Contato</h3>
                  <div className="space-y-2">
                    {store.email && (
                      <a
                        href={`mailto:${store.email}`}
                        className="text-gray-400 hover:text-[var(--premium-primary)] transition flex items-center space-x-2"
                      >
                        <svg
                          className="w-5 h-5"
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
                        <span>{store.email}</span>
                      </a>
                    )}
                    {store.phone && (
                      <a
                        href={`tel:${store.phone}`}
                        className="text-gray-400 hover:text-[var(--premium-primary)] transition flex items-center space-x-2"
                      >
                        <svg
                          className="w-5 h-5"
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
                        <span>{store.phone}</span>
                      </a>
                    )}
                    {store.whatsapp && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-[var(--premium-primary)] transition flex items-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Hours */}
                <div>
                  <h3 className="text-xl font-bold mb-4 premium-gradient-text">
                    Horário de Atendimento
                  </h3>
                  <p className="text-gray-400">Segunda a Sexta: 9h - 18h</p>
                  <p className="text-gray-400">Sábado: 9h - 13h</p>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-8 text-center">
                <p className="text-gray-500 text-sm">
                  © {new Date().getFullYear()} {store.name}. Todos os direitos reservados.
                </p>
                <p className="text-gray-600 text-xs mt-2">
                  Powered by{' '}
                  <span className="premium-gradient-text font-semibold">Estoque.autos</span>
                </p>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Floating WhatsApp Button */}
      {store.whatsapp && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 z-50"
        >
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      )}
    </div>
  );
};

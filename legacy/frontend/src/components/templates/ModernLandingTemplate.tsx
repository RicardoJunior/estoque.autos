import React, { useState } from 'react';
import type { Tenant, Vehicle } from '../../types';

interface ModernLandingTemplateProps {
  store: Tenant;
  vehicles: Vehicle[];
  onVehicleClick: (vehicleId: string) => void;
}

export const ModernLandingTemplate: React.FC<ModernLandingTemplateProps> = ({
  store,
  vehicles,
  onVehicleClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState<'all' | 'under50k' | '50to100k' | 'over100k'>('all');

  // Filter vehicles based on search and price range
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch = searchTerm
      ? `${vehicle.brand} ${vehicle.model} ${vehicle.version}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      : true;

    let matchesPrice = true;
    if (priceRange === 'under50k') matchesPrice = vehicle.sale_price < 50000;
    if (priceRange === '50to100k')
      matchesPrice = vehicle.sale_price >= 50000 && vehicle.sale_price <= 100000;
    if (priceRange === 'over100k') matchesPrice = vehicle.sale_price > 100000;

    return matchesSearch && matchesPrice;
  });

  // Get featured vehicles
  const featuredVehicles = vehicles.filter((v) => v.featured).slice(0, 3);
  const showFeatured = featuredVehicles.length > 0;

  // Apply CSS variables for tenant colors
  const colorStyle = {
    '--primary-color': store.colors?.primary || '#2563eb',
    '--secondary-color': store.colors?.secondary || '#1e40af',
    '--accent-color': store.colors?.accent || '#f59e0b',
  } as React.CSSProperties;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (km: number) => {
    return new Intl.NumberFormat('pt-BR').format(km) + ' km';
  };

  const whatsappLink = `https://wa.me/${store.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Olá! Gostaria de mais informações sobre os veículos disponíveis.`
  )}`;

  return (
    <div className="modern-landing" style={colorStyle}>
      {/* Hero Section with Search */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="container">
            {/* Logo & Store Name */}
            <div className="hero-header">
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.name} className="hero-logo" />
              ) : (
                <div className="hero-logo-placeholder">{store.name.charAt(0).toUpperCase()}</div>
              )}
              <h1 className="hero-title">{store.name}</h1>
            </div>

            <p className="hero-subtitle">
              Encontre o veículo dos seus sonhos com qualidade e confiança
            </p>

            {/* Integrated Search */}
            <div className="hero-search-card">
              <div className="search-inputs">
                <div className="search-field">
                  <svg
                    className="search-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar por marca, modelo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="search-field">
                  <svg
                    className="search-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value as any)}
                    className="search-select"
                  >
                    <option value="all">Todas as faixas de preço</option>
                    <option value="under50k">Até R$ 50.000</option>
                    <option value="50to100k">R$ 50.000 - R$ 100.000</option>
                    <option value="over100k">Acima de R$ 100.000</option>
                  </select>
                </div>
              </div>

              <div className="hero-stats">
                <div className="stat-item">
                  <span className="stat-number">{filteredVehicles.length}</span>
                  <span className="stat-label">Veículos Disponíveis</span>
                </div>
                {showFeatured && (
                  <div className="stat-item">
                    <span className="stat-number">{featuredVehicles.length}</span>
                    <span className="stat-label">Em Destaque</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Buttons */}
            <div className="hero-actions">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-btn-primary"
              >
                <svg className="btn-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Falar no WhatsApp
              </a>
              <a href={`tel:${store.phone}`} className="hero-btn-secondary">
                <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                {store.phone}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Vehicles Section */}
      {showFeatured && (
        <section className="featured-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Veículos em Destaque</h2>
              <div className="section-divider"></div>
            </div>

            <div className="featured-grid">
              {featuredVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="featured-card"
                  onClick={() => onVehicleClick(vehicle.id)}
                >
                  <div className="featured-card-image">
                    {vehicle.photos && vehicle.photos.length > 0 ? (
                      <img
                        src={vehicle.photos.find((p) => p.is_primary)?.url || vehicle.photos[0].url}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                      />
                    ) : (
                      <div className="featured-card-placeholder">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="featured-badge">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Destaque
                    </div>
                  </div>
                  <div className="featured-card-content">
                    <h3 className="featured-card-title">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    {vehicle.version && <p className="featured-card-version">{vehicle.version}</p>}
                    <div className="featured-card-specs">
                      <span>{vehicle.year_model}</span>
                      <span>•</span>
                      <span>{formatMileage(vehicle.mileage)}</span>
                      <span>•</span>
                      <span className="spec-capitalize">{vehicle.transmission}</span>
                    </div>
                    <div className="featured-card-price">{formatPrice(vehicle.sale_price)}</div>
                  </div>
                  <div className="featured-card-overlay">
                    <button className="featured-card-btn">Ver Detalhes</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Vehicles Section */}
      <section className="vehicles-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              {searchTerm || priceRange !== 'all' ? 'Resultados da Busca' : 'Todos os Veículos'}
            </h2>
            <div className="section-divider"></div>
          </div>

          {filteredVehicles.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="empty-text">Nenhum veículo encontrado com os filtros selecionados.</p>
              <button
                className="empty-btn"
                onClick={() => {
                  setSearchTerm('');
                  setPriceRange('all');
                }}
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="vehicles-grid">
              {filteredVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="vehicle-card"
                  onClick={() => onVehicleClick(vehicle.id)}
                >
                  <div className="vehicle-card-image">
                    {vehicle.photos && vehicle.photos.length > 0 ? (
                      <img
                        src={vehicle.photos.find((p) => p.is_primary)?.url || vehicle.photos[0].url}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                      />
                    ) : (
                      <div className="vehicle-card-placeholder">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      <div className="vehicle-featured-badge">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="vehicle-card-content">
                    <h3 className="vehicle-card-title">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    {vehicle.version && <p className="vehicle-card-version">{vehicle.version}</p>}
                    <div className="vehicle-card-specs">
                      <div className="spec-item">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{vehicle.year_model}</span>
                      </div>
                      <div className="spec-item">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        <span>{formatMileage(vehicle.mileage)}</span>
                      </div>
                      <div className="spec-item">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="spec-capitalize">{vehicle.transmission}</span>
                      </div>
                      <div className="spec-item">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
                          />
                        </svg>
                        <span className="spec-capitalize">{vehicle.fuel}</span>
                      </div>
                    </div>
                    <div className="vehicle-card-price">{formatPrice(vehicle.sale_price)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="modern-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <h3 className="footer-heading">Sobre Nós</h3>
              <p className="footer-text">{store.name}</p>
              {store.address && (
                <div className="footer-item">
                  <svg
                    className="footer-icon"
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
                </div>
              )}
            </div>

            <div className="footer-col">
              <h3 className="footer-heading">Contato</h3>
              {store.phone && (
                <div className="footer-item">
                  <svg
                    className="footer-icon"
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
                  <a href={`tel:${store.phone}`}>{store.phone}</a>
                </div>
              )}
              {store.email && (
                <div className="footer-item">
                  <svg
                    className="footer-icon"
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
                  <a href={`mailto:${store.email}`}>{store.email}</a>
                </div>
              )}
              {store.whatsapp && (
                <div className="footer-item">
                  <svg className="footer-icon" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                </div>
              )}
            </div>

            <div className="footer-col">
              <h3 className="footer-heading">Horário</h3>
              <p className="footer-text">
                Segunda a Sexta: 9h - 18h
                <br />
                Sábado: 9h - 13h
              </p>
            </div>
          </div>

          <div className="footer-bottom">
            <p>
              &copy; {new Date().getFullYear()} {store.name}. Todos os direitos reservados.
            </p>
            <p className="footer-powered">
              Powered by <strong>Estoque.autos</strong>
            </p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="floating-whatsapp"
        aria-label="Falar no WhatsApp"
      >
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>

      <style>{`
        .modern-landing {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Hero Section */
        .hero-section {
          position: relative;
          min-height: 600px;
          display: flex;
          align-items: center;
          padding: 4rem 0;
          overflow: hidden;
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg,
            var(--primary-color, #2563eb) 0%,
            var(--secondary-color, #1e40af) 100%
          );
          opacity: 0.95;
        }

        .hero-content {
          position: relative;
          z-index: 10;
          width: 100%;
        }

        .hero-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .hero-logo {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .hero-logo-placeholder {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 700;
          color: white;
          border: 4px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .hero-title {
          font-size: 3rem;
          font-weight: 800;
          color: white;
          text-align: center;
          margin: 0;
          text-shadow: 0 2px 20px rgba(0, 0, 0, 0.2);
          letter-spacing: -0.02em;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.9);
          text-align: center;
          margin: 0 0 3rem 0;
          font-weight: 400;
        }

        /* Hero Search Card */
        .hero-search-card {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 800px;
          margin: 0 auto 2rem auto;
        }

        .search-inputs {
          display: grid;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        @media (min-width: 768px) {
          .search-inputs {
            grid-template-columns: 1fr 1fr;
          }
        }

        .search-field {
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          color: #9ca3af;
          pointer-events: none;
        }

        .search-input,
        .search-select {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 3rem;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.2s;
          background: white;
        }

        .search-input:focus,
        .search-select:focus {
          outline: none;
          border-color: var(--primary-color, #2563eb);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .hero-stats {
          display: flex;
          gap: 2rem;
          justify-content: center;
          padding-top: 1.5rem;
          border-top: 2px solid #f3f4f6;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 800;
          color: var(--primary-color, #2563eb);
          line-height: 1;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        /* Hero Actions */
        .hero-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .hero-btn-primary,
        .hero-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.2s;
          text-decoration: none;
          cursor: pointer;
        }

        .hero-btn-primary {
          background: #25D366;
          color: white;
          box-shadow: 0 4px 14px rgba(37, 211, 102, 0.4);
        }

        .hero-btn-primary:hover {
          background: #22c55e;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37, 211, 102, 0.5);
        }

        .hero-btn-secondary {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(10px);
        }

        .hero-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .btn-icon {
          width: 20px;
          height: 20px;
        }

        /* Featured Section */
        .featured-section {
          padding: 4rem 0;
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
        }

        .section-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: white;
          margin: 0 0 1rem 0;
          letter-spacing: -0.02em;
        }

        .section-divider {
          width: 80px;
          height: 4px;
          background: var(--accent-color, #f59e0b);
          margin: 0 auto;
          border-radius: 2px;
        }

        .featured-grid {
          display: grid;
          gap: 2rem;
          grid-template-columns: 1fr;
        }

        @media (min-width: 768px) {
          .featured-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .featured-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .featured-card {
          position: relative;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .featured-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .featured-card:hover .featured-card-overlay {
          opacity: 1;
        }

        .featured-card-image {
          position: relative;
          aspect-ratio: 16 / 10;
          overflow: hidden;
          background: #f3f4f6;
        }

        .featured-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }

        .featured-card:hover .featured-card-image img {
          transform: scale(1.05);
        }

        .featured-card-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
        }

        .featured-card-placeholder svg {
          width: 64px;
          height: 64px;
          color: #9ca3af;
        }

        .featured-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: var(--accent-color, #f59e0b);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .featured-badge svg {
          width: 16px;
          height: 16px;
        }

        .featured-card-content {
          padding: 1.5rem;
        }

        .featured-card-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.25rem 0;
          letter-spacing: -0.01em;
        }

        .featured-card-version {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0 0 1rem 0;
        }

        .featured-card-specs {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 1rem;
        }

        .featured-card-price {
          font-size: 2rem;
          font-weight: 800;
          color: var(--primary-color, #2563eb);
          letter-spacing: -0.02em;
        }

        .featured-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 2rem;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .featured-card-btn {
          background: white;
          color: var(--primary-color, #2563eb);
          padding: 0.875rem 2rem;
          border-radius: 12px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .featured-card-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 20px rgba(255, 255, 255, 0.3);
        }

        /* Vehicles Section */
        .vehicles-section {
          padding: 4rem 0;
          background: #f9fafb;
        }

        .vehicles-section .section-title {
          color: #111827;
        }

        .vehicles-grid {
          display: grid;
          gap: 2rem;
          grid-template-columns: 1fr;
        }

        @media (min-width: 640px) {
          .vehicles-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .vehicles-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .vehicle-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border: 2px solid transparent;
        }

        .vehicle-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
          border-color: var(--primary-color, #2563eb);
        }

        .vehicle-card-image {
          position: relative;
          aspect-ratio: 16 / 10;
          overflow: hidden;
          background: #f3f4f6;
        }

        .vehicle-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }

        .vehicle-card:hover .vehicle-card-image img {
          transform: scale(1.05);
        }

        .vehicle-card-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
        }

        .vehicle-card-placeholder svg {
          width: 48px;
          height: 48px;
          color: #9ca3af;
        }

        .vehicle-featured-badge {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: var(--accent-color, #f59e0b);
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .vehicle-featured-badge svg {
          width: 18px;
          height: 18px;
        }

        .vehicle-card-content {
          padding: 1.25rem;
        }

        .vehicle-card-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.25rem 0;
        }

        .vehicle-card-version {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0 0 1rem 0;
        }

        .vehicle-card-specs {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .spec-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .spec-item svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .spec-capitalize {
          text-transform: capitalize;
        }

        .vehicle-card-price {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--primary-color, #2563eb);
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          color: #9ca3af;
          margin: 0 auto 1.5rem auto;
        }

        .empty-text {
          font-size: 1.125rem;
          color: #6b7280;
          margin: 0 0 2rem 0;
        }

        .empty-btn {
          background: var(--primary-color, #2563eb);
          color: white;
          padding: 0.875rem 2rem;
          border-radius: 12px;
          border: none;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .empty-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3);
        }

        /* Footer */
        .modern-footer {
          background: #1f2937;
          color: white;
          padding: 3rem 0 1.5rem 0;
        }

        .footer-grid {
          display: grid;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        @media (min-width: 768px) {
          .footer-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .footer-heading {
          font-size: 1.125rem;
          font-weight: 700;
          margin: 0 0 1rem 0;
          color: var(--accent-color, #f59e0b);
        }

        .footer-text {
          color: #d1d5db;
          line-height: 1.6;
          margin: 0;
        }

        .footer-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          color: #d1d5db;
        }

        .footer-item a {
          color: #d1d5db;
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-item a:hover {
          color: var(--accent-color, #f59e0b);
        }

        .footer-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
          color: var(--accent-color, #f59e0b);
        }

        .footer-bottom {
          border-top: 1px solid #374151;
          padding-top: 1.5rem;
          text-align: center;
          font-size: 0.875rem;
          color: #9ca3af;
        }

        .footer-powered {
          margin-top: 0.5rem;
        }

        .footer-powered strong {
          color: var(--accent-color, #f59e0b);
        }

        /* Floating WhatsApp */
        .floating-whatsapp {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 56px;
          height: 56px;
          background: #25D366;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(37, 211, 102, 0.4);
          transition: all 0.3s;
          z-index: 1000;
          cursor: pointer;
        }

        .floating-whatsapp:hover {
          transform: scale(1.1);
          box-shadow: 0 8px 32px rgba(37, 211, 102, 0.5);
        }

        .floating-whatsapp svg {
          width: 28px;
          height: 28px;
          color: white;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .hero-title {
            font-size: 2rem;
          }

          .hero-subtitle {
            font-size: 1rem;
          }

          .section-title {
            font-size: 1.75rem;
          }

          .featured-card-title {
            font-size: 1.25rem;
          }

          .featured-card-price {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

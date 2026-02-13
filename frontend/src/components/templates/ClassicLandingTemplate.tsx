import React from 'react';
import type { Tenant, Vehicle } from '../../types';

interface ClassicLandingTemplateProps {
  store: Tenant;
  vehicles: Vehicle[];
  onVehicleClick: (vehicleId: string) => void;
}

export const ClassicLandingTemplate: React.FC<ClassicLandingTemplateProps> = ({
  store,
  vehicles,
  onVehicleClick,
}) => {
  const primaryColor = store.colors?.primary || '#D4AF37';
  const accentColor = store.colors?.accent || '#FFD700';

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header
        className="border-b border-gray-200"
        style={{
          borderBottomColor: `${primaryColor}20`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo and Store Name */}
            <div className="flex items-center gap-4">
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.name} className="h-16 w-auto object-contain" />
              ) : (
                <div
                  className="h-16 w-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {store.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{store.name}</h1>
                {store.address && <p className="text-sm text-gray-600 mt-1">{store.address}</p>}
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {store.phone && (
                <a
                  href={`tel:${store.phone}`}
                  className="btn btn-outline border-gray-300 hover:border-gray-400"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  {store.phone}
                </a>
              )}
              {store.whatsapp && (
                <a
                  href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn text-white hover:opacity-90"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Nossos Veículos</h2>
          <p className="text-gray-600">
            {vehicles.length}{' '}
            {vehicles.length === 1 ? 'veículo disponível' : 'veículos disponíveis'}
          </p>
        </div>

        {/* Vehicle Grid */}
        {vehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="card bg-white border border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                onClick={() => onVehicleClick(vehicle.id)}
                style={{
                  borderColor: `${primaryColor}20`,
                }}
              >
                {/* Vehicle Image */}
                <figure className="relative aspect-[4/3] overflow-hidden">
                  {vehicle.photos && vehicle.photos.length > 0 ? (
                    <img
                      src={vehicle.photos[0].url}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <svg
                        className="w-20 h-20 text-gray-300"
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
                    <div
                      className="absolute top-3 right-3 badge text-white font-semibold px-3 py-2"
                      style={{ backgroundColor: accentColor }}
                    >
                      ⭐ Destaque
                    </div>
                  )}
                </figure>

                {/* Vehicle Info */}
                <div className="card-body p-5">
                  <h3 className="card-title text-xl font-bold text-gray-900 mb-2">
                    {vehicle.brand} {vehicle.model}
                  </h3>
                  {vehicle.version && (
                    <p className="text-sm text-gray-600 mb-3">{vehicle.version}</p>
                  )}

                  {/* Specs */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">Ano:</span>
                      <span>{vehicle.year_model}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">KM:</span>
                      <span>{vehicle.mileage.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">Câmbio:</span>
                      <span className="capitalize">
                        {vehicle.transmission === 'manual'
                          ? 'Manual'
                          : vehicle.transmission === 'automatic'
                            ? 'Automático'
                            : vehicle.transmission === 'cvt'
                              ? 'CVT'
                              : 'Automatizado'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">Combustível:</span>
                      <span className="capitalize">
                        {vehicle.fuel === 'gasoline'
                          ? 'Gasolina'
                          : vehicle.fuel === 'ethanol'
                            ? 'Etanol'
                            : vehicle.fuel === 'flex'
                              ? 'Flex'
                              : vehicle.fuel === 'diesel'
                                ? 'Diesel'
                                : vehicle.fuel === 'electric'
                                  ? 'Elétrico'
                                  : 'Híbrido'}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: `${primaryColor}20` }}>
                    <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                      R$ {vehicle.sale_price.toLocaleString('pt-BR')}
                    </p>
                  </div>

                  {/* CTA Button */}
                  <button
                    className="btn btn-block mt-4 text-white hover:opacity-90"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-xl text-gray-500">Nenhum veículo disponível no momento</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Store Info */}
            <div>
              <h3 className="font-bold text-lg mb-4" style={{ color: primaryColor }}>
                {store.name}
              </h3>
              {store.address && (
                <p className="text-gray-600 mb-2 flex items-start gap-2">
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
                  {store.address}
                </p>
              )}
              {store.email && (
                <p className="text-gray-600 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  {store.email}
                </p>
              )}
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-bold text-lg mb-4" style={{ color: primaryColor }}>
                Contato
              </h3>
              {store.phone && (
                <p className="text-gray-600 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  {store.phone}
                </p>
              )}
              {store.whatsapp && (
                <p className="text-gray-600 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  {store.whatsapp}
                </p>
              )}
            </div>

            {/* Powered By */}
            <div>
              <h3 className="font-bold text-lg mb-4" style={{ color: primaryColor }}>
                Sobre
              </h3>
              <p className="text-gray-600 text-sm">
                Plataforma completa de gestão para lojas de veículos.
              </p>
              <p className="text-gray-400 text-xs mt-4">
                Powered by <span className="font-semibold">Estoque.autos</span>
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>
              &copy; {new Date().getFullYear()} {store.name}. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      {store.whatsapp && (
        <a
          href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform z-50"
          style={{ backgroundColor: '#25D366' }}
          aria-label="Contato via WhatsApp"
        >
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </a>
      )}
    </div>
  );
};

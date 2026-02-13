import React from 'react';
import type { Vehicle, VehicleStatus } from '../../types';

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick: (id: string) => void;
  showMargin?: boolean;
}

const statusConfig: Record<VehicleStatus, { label: string; color: string; bgColor: string }> = {
  available: {
    label: 'Disponível',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 border-emerald-200',
  },
  reserved: {
    label: 'Reservado',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
  },
  sold: {
    label: 'Vendido',
    color: 'text-neutral-700',
    bgColor: 'bg-neutral-100 border-neutral-200',
  },
  inactive: {
    label: 'Inativo',
    color: 'text-neutral-500',
    bgColor: 'bg-neutral-50 border-neutral-200',
  },
};

const categoryLabels: Record<string, string> = {
  car: 'Carro',
  motorcycle: 'Moto',
  utility: 'Utilitário',
  truck: 'Caminhão',
};

const transmissionLabels: Record<string, string> = {
  manual: 'Manual',
  automatic: 'Automático',
  cvt: 'CVT',
  automated: 'Automatizado',
};

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onClick,
  showMargin = false,
}) => {
  const status = statusConfig[vehicle.status];
  const daysInStock = Math.floor(
    (new Date().getTime() - new Date(vehicle.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  const calculateMargin = () => {
    if (!vehicle.purchase_price) return 0;
    const expenses = vehicle.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    return vehicle.sale_price - vehicle.purchase_price - expenses;
  };

  const margin = calculateMargin();
  const marginPercent = vehicle.purchase_price
    ? ((margin / vehicle.purchase_price) * 100).toFixed(1)
    : 0;

  return (
    <div
      onClick={() => onClick(vehicle.id)}
      className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer border border-neutral-100"
      style={{ animation: 'fadeIn 0.6s ease-out' }}
    >
      {/* Image Container */}
      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200">
        {vehicle.photos && vehicle.photos.length > 0 ? (
          <img
            src={vehicle.photos[0].url}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg
              className="w-16 h-16 text-neutral-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Status Badge */}
        <div
          className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-md ${status.bgColor} ${status.color}`}
        >
          {status.label}
        </div>

        {/* Featured Badge */}
        {vehicle.featured && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium bg-amber-500 text-white border border-amber-400 backdrop-blur-md flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Destaque
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Category */}
        <div
          className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-2"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          {categoryLabels[vehicle.category] || vehicle.category}
        </div>

        {/* Title */}
        <h3
          className="text-xl font-semibold text-neutral-900 mb-1 line-clamp-1 group-hover:text-amber-700 transition-colors duration-300"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          {vehicle.brand} {vehicle.model}
        </h3>

        {vehicle.version && (
          <p
            className="text-sm text-neutral-500 mb-3 line-clamp-1"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {vehicle.version}
          </p>
        )}

        {/* Specs */}
        <div
          className="flex items-center gap-4 text-sm text-neutral-600 mb-4"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          <div className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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
          <div className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>{vehicle.mileage.toLocaleString('pt-BR')} km</span>
          </div>
        </div>

        <div
          className="flex items-center gap-3 text-xs text-neutral-500 mb-4"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          <span>{transmissionLabels[vehicle.transmission]}</span>
          <span>•</span>
          <span className="capitalize">{vehicle.fuel}</span>
        </div>

        {/* Price and Margin */}
        <div className="flex items-end justify-between pt-4 border-t border-neutral-100">
          <div>
            <div
              className="text-xs text-neutral-500 mb-1"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Preço
            </div>
            <div
              className="text-2xl font-bold text-neutral-900"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              R$ {vehicle.sale_price.toLocaleString('pt-BR')}
            </div>
          </div>

          {showMargin && vehicle.purchase_price && (
            <div className="text-right">
              <div
                className="text-xs text-neutral-500 mb-1"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Margem
              </div>
              <div
                className={`text-lg font-semibold ${margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {marginPercent}%
              </div>
            </div>
          )}
        </div>

        {/* Days in Stock */}
        {daysInStock > 0 && (
          <div
            className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            <span>
              Em estoque há {daysInStock} {daysInStock === 1 ? 'dia' : 'dias'}
            </span>
            {daysInStock > 60 && <span className="text-amber-600 font-medium">⚠ Atenção</span>}
          </div>
        )}
      </div>

      {/* Hover Effect Border */}
      <div className="absolute inset-0 border-2 border-amber-500/0 group-hover:border-amber-500/30 rounded-xl transition-all duration-500 pointer-events-none" />
    </div>
  );
};

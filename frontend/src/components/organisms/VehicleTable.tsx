import React from 'react';
import type { Vehicle, VehicleStatus } from '../../types';

interface VehicleTableProps {
  vehicles: Vehicle[];
  onRowClick: (id: string) => void;
  showMargin?: boolean;
}

const statusConfig: Record<VehicleStatus, { label: string; color: string; bgColor: string }> = {
  available: { label: 'Disponível', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  reserved: { label: 'Reservado', color: 'text-amber-700', bgColor: 'bg-amber-50' },
  sold: { label: 'Vendido', color: 'text-neutral-700', bgColor: 'bg-neutral-100' },
  inactive: { label: 'Inativo', color: 'text-neutral-500', bgColor: 'bg-neutral-50' },
};

const transmissionLabels: Record<string, string> = {
  manual: 'Manual',
  automatic: 'Automático',
  cvt: 'CVT',
  automated: 'Automatizado',
};

export const VehicleTable: React.FC<VehicleTableProps> = ({
  vehicles,
  onRowClick,
  showMargin = false,
}) => {
  const calculateMargin = (vehicle: Vehicle) => {
    if (!vehicle.purchase_price) return { value: 0, percent: 0 };
    const expenses = vehicle.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    const margin = vehicle.sale_price - vehicle.purchase_price - expenses;
    const percent = (margin / vehicle.purchase_price) * 100;
    return { value: margin, percent };
  };

  const getDaysInStock = (createdAt: string) => {
    return Math.floor(
      (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  if (vehicles.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
        <svg
          className="w-16 h-16 text-neutral-300 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-neutral-600 text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Nenhum veículo encontrado
        </p>
        <p className="text-neutral-400 text-sm mt-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Tente ajustar os filtros ou adicionar um novo veículo
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-neutral-50 via-amber-50/20 to-neutral-50 border-b border-neutral-200">
              <th
                className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Veículo
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Ano
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Km
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Transmissão
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Preço
              </th>
              {showMargin && (
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  Margem
                </th>
              )}
              <th
                className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Status
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Dias
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {vehicles.map((vehicle, index) => {
              const status = statusConfig[vehicle.status];
              const margin = calculateMargin(vehicle);
              const daysInStock = getDaysInStock(vehicle.created_at);

              return (
                <tr
                  key={vehicle.id}
                  onClick={() => onRowClick(vehicle.id)}
                  className="hover:bg-amber-50/30 transition-colors duration-200 cursor-pointer group"
                  style={{ animation: `fadeIn 0.4s ease-out ${index * 0.05}s backwards` }}
                >
                  {/* Vehicle Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200 flex-shrink-0">
                        {vehicle.photos && vehicle.photos.length > 0 ? (
                          <img
                            src={vehicle.photos[0]}
                            alt={`${vehicle.brand} ${vehicle.model}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <svg
                              className="w-6 h-6 text-neutral-300"
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
                          </div>
                        )}
                      </div>
                      <div>
                        <div
                          className="font-semibold text-neutral-900 group-hover:text-amber-700 transition-colors duration-200"
                          style={{ fontFamily: 'Playfair Display, serif' }}
                        >
                          {vehicle.brand} {vehicle.model}
                        </div>
                        {vehicle.version && (
                          <div
                            className="text-sm text-neutral-500 mt-0.5"
                            style={{ fontFamily: 'Outfit, sans-serif' }}
                          >
                            {vehicle.version}
                          </div>
                        )}
                        {vehicle.featured && (
                          <div className="flex items-center gap-1 mt-1">
                            <svg
                              className="w-3 h-3 text-amber-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span
                              className="text-xs text-amber-600 font-medium"
                              style={{ fontFamily: 'Outfit, sans-serif' }}
                            >
                              Destaque
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Year */}
                  <td
                    className="px-6 py-4 text-sm text-neutral-700"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    {vehicle.year_model}
                  </td>

                  {/* Mileage */}
                  <td
                    className="px-6 py-4 text-sm text-neutral-700"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    {vehicle.mileage.toLocaleString('pt-BR')} km
                  </td>

                  {/* Transmission */}
                  <td
                    className="px-6 py-4 text-sm text-neutral-700"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    {transmissionLabels[vehicle.transmission]}
                  </td>

                  {/* Price */}
                  <td className="px-6 py-4">
                    <div
                      className="text-lg font-semibold text-neutral-900"
                      style={{ fontFamily: 'Playfair Display, serif' }}
                    >
                      R$ {vehicle.sale_price.toLocaleString('pt-BR')}
                    </div>
                  </td>

                  {/* Margin */}
                  {showMargin && (
                    <td className="px-6 py-4">
                      {vehicle.purchase_price ? (
                        <div>
                          <div
                            className={`text-sm font-semibold ${margin.value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                            style={{ fontFamily: 'Outfit, sans-serif' }}
                          >
                            {margin.percent.toFixed(1)}%
                          </div>
                          <div
                            className="text-xs text-neutral-500 mt-0.5"
                            style={{ fontFamily: 'Outfit, sans-serif' }}
                          >
                            R$ {margin.value.toLocaleString('pt-BR')}
                          </div>
                        </div>
                      ) : (
                        <span
                          className="text-sm text-neutral-400"
                          style={{ fontFamily: 'Outfit, sans-serif' }}
                        >
                          -
                        </span>
                      )}
                    </td>
                  )}

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}
                      style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                      {status.label}
                    </span>
                  </td>

                  {/* Days in Stock */}
                  <td className="px-6 py-4">
                    <div
                      className="text-sm text-neutral-700"
                      style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                      {daysInStock} {daysInStock === 1 ? 'dia' : 'dias'}
                    </div>
                    {daysInStock > 60 && (
                      <div
                        className="text-xs text-amber-600 font-medium mt-0.5"
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      >
                        ⚠ Atenção
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

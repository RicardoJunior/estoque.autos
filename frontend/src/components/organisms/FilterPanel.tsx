import React from 'react';
import type { VehicleStatus, VehicleCategory } from '../../types';
import { Select } from '../atoms/Select';

export interface FilterState {
  status: VehicleStatus | '';
  category: VehicleCategory | '';
  minPrice: string;
  maxPrice: string;
  minYear: string;
  maxYear: string;
  brand: string;
}

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  brands: string[];
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onChange, onReset, brands }) => {
  const handleChange = (field: keyof FilterState, value: string) => {
    onChange({ ...filters, [field]: value });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  const hasActiveFilters = Object.values(filters).some((value) => value !== '');

  return (
    <div className="bg-gradient-to-br from-white via-amber-50/30 to-white rounded-xl border border-neutral-200/60 shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3
            className="text-xl font-semibold text-neutral-900"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Filtros
          </h3>
          <p className="text-sm text-neutral-500 mt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Refine sua busca
          </p>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors duration-200 flex items-center gap-1.5"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Limpar filtros
          </button>
        )}
      </div>

      {/* Filters Grid */}
      <div className="space-y-5">
        {/* Status */}
        <div>
          <label
            className="block text-sm font-medium text-neutral-700 mb-2"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Status
          </label>
          <Select
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            options={[
              { value: '', label: 'Todos os status' },
              { value: 'available', label: 'Disponível' },
              { value: 'reserved', label: 'Reservado' },
              { value: 'sold', label: 'Vendido' },
              { value: 'inactive', label: 'Inativo' },
            ]}
          />
        </div>

        {/* Category */}
        <div>
          <label
            className="block text-sm font-medium text-neutral-700 mb-2"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Categoria
          </label>
          <Select
            value={filters.category}
            onChange={(e) => handleChange('category', e.target.value)}
            options={[
              { value: '', label: 'Todas as categorias' },
              { value: 'car', label: 'Carro' },
              { value: 'motorcycle', label: 'Moto' },
              { value: 'utility', label: 'Utilitário' },
              { value: 'truck', label: 'Caminhão' },
            ]}
          />
        </div>

        {/* Brand */}
        <div>
          <label
            className="block text-sm font-medium text-neutral-700 mb-2"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Marca
          </label>
          <Select
            value={filters.brand}
            onChange={(e) => handleChange('brand', e.target.value)}
            options={[
              { value: '', label: 'Todas as marcas' },
              ...brands.map((brand) => ({ value: brand, label: brand })),
            ]}
          />
        </div>

        {/* Price Range */}
        <div>
          <label
            className="block text-sm font-medium text-neutral-700 mb-2"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Faixa de Preço
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => handleChange('minPrice', e.target.value)}
              className="px-3 py-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all duration-200 text-sm"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => handleChange('maxPrice', e.target.value)}
              className="px-3 py-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all duration-200 text-sm"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            />
          </div>
        </div>

        {/* Year Range */}
        <div>
          <label
            className="block text-sm font-medium text-neutral-700 mb-2"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Ano
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={filters.minYear}
              onChange={(e) => handleChange('minYear', e.target.value)}
              options={[
                { value: '', label: 'De' },
                ...years.map((year) => ({ value: year.toString(), label: year.toString() })),
              ]}
            />
            <Select
              value={filters.maxYear}
              onChange={(e) => handleChange('maxYear', e.target.value)}
              options={[
                { value: '', label: 'Até' },
                ...years.map((year) => ({ value: year.toString(), label: year.toString() })),
              ]}
            />
          </div>
        </div>
      </div>

      {/* Active Filters Count */}
      {hasActiveFilters && (
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Filtros ativos:
            </span>
            <span
              className="font-semibold text-amber-600"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {Object.values(filters).filter((value) => value !== '').length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

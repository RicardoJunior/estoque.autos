import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Vehicle } from '../types';
import { SearchBar } from '../components/molecules/SearchBar';
import { VehicleCard } from '../components/molecules/VehicleCard';
import { VehicleTable } from '../components/organisms/VehicleTable';
import { FilterPanel } from '../components/organisms/FilterPanel';
import type { FilterState } from '../components/organisms/FilterPanel';
import { useAuthStore } from '../store/authStore';

type ViewMode = 'grid' | 'table';
type SortOption = 'created_at' | 'sale_price' | 'mileage' | 'margin';

export const VehicleListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    minYear: '',
    maxYear: '',
    brand: '',
  });

  const itemsPerPage = 12;
  const showMargin = user?.role === 'owner' || user?.role === 'manager';

  // Fetch vehicles
  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vehicles');
      setVehicles(response.data.data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique brands for filter
  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(vehicles.map((v) => v.brand))];
    return uniqueBrands.sort();
  }, [vehicles]);

  // Filter and sort vehicles
  const filteredVehicles = useMemo(() => {
    let filtered = vehicles;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.brand.toLowerCase().includes(query) ||
          v.model.toLowerCase().includes(query) ||
          v.plate?.toLowerCase().includes(query) ||
          v.version?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter((v) => v.status === filters.status);
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter((v) => v.category === filters.category);
    }

    // Brand filter
    if (filters.brand) {
      filtered = filtered.filter((v) => v.brand === filters.brand);
    }

    // Price filter
    if (filters.minPrice) {
      filtered = filtered.filter((v) => v.sale_price >= Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter((v) => v.sale_price <= Number(filters.maxPrice));
    }

    // Year filter
    if (filters.minYear) {
      filtered = filtered.filter((v) => v.year_model >= Number(filters.minYear));
    }
    if (filters.maxYear) {
      filtered = filtered.filter((v) => v.year_model <= Number(filters.maxYear));
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'sale_price': {
          comparison = a.sale_price - b.sale_price;
          break;
        }
        case 'mileage': {
          comparison = a.mileage - b.mileage;
          break;
        }
        case 'margin': {
          const marginA = a.purchase_price
            ? a.sale_price -
              a.purchase_price -
              (a.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0)
            : 0;
          const marginB = b.purchase_price
            ? b.sale_price -
              b.purchase_price -
              (b.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0)
            : 0;
          comparison = marginA - marginB;
          break;
        }
        case 'created_at':
        default: {
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        }
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [vehicles, searchQuery, filters, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const paginatedVehicles = filteredVehicles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleResetFilters = () => {
    setFilters({
      status: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      minYear: '',
      maxYear: '',
      brand: '',
    });
    setSearchQuery('');
  };

  const handleExportCSV = () => {
    const headers = ['Marca', 'Modelo', 'Versão', 'Ano', 'KM', 'Preço', 'Status'];
    const rows = filteredVehicles.map((v) => [
      v.brand,
      v.model,
      v.version || '',
      v.year_model,
      v.mileage,
      v.sale_price,
      v.status,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `veiculos-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600 text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Carregando veículos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-amber-50/20 to-neutral-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1
              className="text-4xl font-bold text-neutral-900 mb-2"
              style={{ fontFamily: 'Playfair Display, serif', animation: 'fadeIn 0.6s ease-out' }}
            >
              Estoque de Veículos
            </h1>
            <p
              className="text-neutral-600"
              style={{
                fontFamily: 'Outfit, sans-serif',
                animation: 'fadeIn 0.6s ease-out 0.1s backwards',
              }}
            >
              {filteredVehicles.length}{' '}
              {filteredVehicles.length === 1 ? 'veículo encontrado' : 'veículos encontrados'}
            </p>
          </div>

          <button
            onClick={() => navigate('/vehicles/new')}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 font-medium"
            style={{
              fontFamily: 'Outfit, sans-serif',
              animation: 'fadeIn 0.6s ease-out 0.2s backwards',
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Novo Veículo
          </button>
        </div>

        {/* Search and Controls */}
        <div
          className="flex flex-col lg:flex-row gap-4 mb-6"
          style={{ animation: 'fadeIn 0.6s ease-out 0.3s backwards' }}
        >
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>

          <div className="flex items-center gap-3">
            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-');
                setSortBy(sort as SortOption);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="px-4 py-3 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all duration-200"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              <option value="created_at-desc">Mais recentes</option>
              <option value="created_at-asc">Mais antigos</option>
              <option value="sale_price-asc">Menor preço</option>
              <option value="sale_price-desc">Maior preço</option>
              <option value="mileage-asc">Menor KM</option>
              <option value="mileage-desc">Maior KM</option>
              {showMargin && <option value="margin-desc">Maior margem</option>}
              {showMargin && <option value="margin-asc">Menor margem</option>}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                }`}
                aria-label="Visualização em grade"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded transition-all duration-200 ${
                  viewMode === 'table'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                }`}
                aria-label="Visualização em tabela"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </button>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportCSV}
              className="px-4 py-3 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-all duration-200 flex items-center gap-2"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              <svg
                className="w-5 h-5 text-neutral-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside
            className="lg:w-80 flex-shrink-0"
            style={{ animation: 'fadeIn 0.6s ease-out 0.4s backwards' }}
          >
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onReset={handleResetFilters}
              brands={brands}
            />
          </aside>

          {/* Vehicles Display */}
          <main className="flex-1" style={{ animation: 'fadeIn 0.6s ease-out 0.5s backwards' }}>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedVehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    onClick={(id) => navigate(`/vehicles/${id}`)}
                    showMargin={showMargin}
                  />
                ))}
              </div>
            ) : (
              <VehicleTable
                vehicles={paginatedVehicles}
                onRowClick={(id) => navigate(`/vehicles/${id}`)}
                showMargin={showMargin}
              />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  Anterior
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg transition-all duration-200 ${
                        currentPage === page
                          ? 'bg-amber-500 text-white shadow-md'
                          : 'bg-white border border-neutral-200 hover:bg-neutral-50'
                      }`}
                      style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  Próxima
                </button>
              </div>
            )}

            {/* Empty State */}
            {paginatedVehicles.length === 0 && !loading && (
              <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                <svg
                  className="w-20 h-20 text-neutral-300 mx-auto mb-4"
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
                <h3
                  className="text-xl font-semibold text-neutral-700 mb-2"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  Nenhum veículo encontrado
                </h3>
                <p className="text-neutral-500 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Tente ajustar os filtros ou adicionar um novo veículo ao estoque
                </p>
                <button
                  onClick={() => navigate('/vehicles/new')}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center gap-2 font-medium"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Adicionar Veículo
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Add fadeIn keyframes */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

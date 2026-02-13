import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { Tenant, Vehicle } from '../types';
import { ClassicLandingTemplate } from '../components/templates/ClassicLandingTemplate';
import { ModernLandingTemplate } from '../components/templates/ModernLandingTemplate';

interface StoreData {
  store: Tenant;
  vehicles: Vehicle[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const PublicLandingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStoreData = async () => {
      if (!slug) {
        setError('Loja não encontrada');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await axios.get<StoreData>(`${apiUrl}/api/public/${slug}/vehicles`, {
          params: {
            limit: 50, // Show more vehicles on landing page
          },
        });

        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching store data:', err);
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError('Loja não encontrada');
        } else {
          setError('Erro ao carregar os dados da loja');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [slug]);

  const handleVehicleClick = (vehicleId: string) => {
    navigate(`/${slug}/vehicles/${vehicleId}`);
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
            {error || 'Loja não encontrada'}
          </h1>
          <p className="text-gray-600 mb-6">
            Verifique se o endereço está correto e tente novamente.
          </p>
          <a href="/" className="btn btn-primary">
            Voltar para o início
          </a>
        </div>
      </div>
    );
  }

  // Render template based on store template_id
  const templateId = data.store.template_id || 'classic';

  switch (templateId) {
    case 'modern':
      return (
        <ModernLandingTemplate
          store={data.store}
          vehicles={data.vehicles}
          onVehicleClick={handleVehicleClick}
        />
      );
    case 'classic':
    default:
      return (
        <ClassicLandingTemplate
          store={data.store}
          vehicles={data.vehicles}
          onVehicleClick={handleVehicleClick}
        />
      );
  }
};

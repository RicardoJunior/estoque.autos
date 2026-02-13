import React from 'react';
import { useNavigate } from 'react-router-dom';
import { VehicleForm } from '../components/organisms/VehicleForm';
import { api } from '../services/api';
import type { Vehicle } from '../types';

export const VehicleFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<{ vehicle: Vehicle }>('/vehicles', {
        ...data,
        status: 'available',
      });

      console.log('Vehicle created:', response.data.vehicle);

      // Show success message (you can add a toast notification here)
      alert('Veículo cadastrado com sucesso!');

      // Redirect to vehicle list or detail page
      navigate('/vehicles');
    } catch (err: any) {
      console.error('Error creating vehicle:', err);
      setError(err.response?.data?.error || 'Erro ao criar veículo. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {error && (
          <div className="alert alert-error mb-6 shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <VehicleForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

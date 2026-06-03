import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Vehicle } from '../types';
import { useAuthStore } from '../store/authStore';

interface VehicleStatusLog {
  id: string;
  vehicle_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string;
  created_at: string;
}

interface VehicleDetailData extends Vehicle {
  created_by_user?: {
    id: string;
    name: string;
    email: string;
  };
  status_log?: VehicleStatusLog[];
}

export const VehicleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [vehicle, setVehicle] = useState<VehicleDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const showFinancials = user?.role === 'owner' || user?.role === 'manager';
  const canEdit = user?.role === 'owner' || user?.role === 'manager';

  useEffect(() => {
    if (id) {
      fetchVehicle();
    }
  }, [id]);

  const fetchVehicle = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/vehicles/${id}`);
      setVehicle(response.data.vehicle);
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      alert('Failed to load vehicle details');
      navigate('/vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus || !vehicle) return;

    try {
      setUpdatingStatus(true);
      await api.patch(`/vehicles/${vehicle.id}/status`, { status: newStatus });
      await fetchVehicle();
      setShowStatusModal(false);
      setNewStatus('');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update vehicle status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!vehicle) return;

    if (!confirm('Are you sure you want to delete this vehicle? This will set it to inactive.')) {
      return;
    }

    try {
      await api.delete(`/vehicles/${vehicle.id}`);
      navigate('/vehicles');
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('Failed to delete vehicle');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(date));
  };

  const getStatusBadgeClass = (status: string) => {
    const classes = {
      available: 'badge-success',
      reserved: 'badge-warning',
      sold: 'badge-info',
      inactive: 'badge-neutral',
    };
    return classes[status as keyof typeof classes] || 'badge-neutral';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      available: 'Available',
      reserved: 'Reserved',
      sold: 'Sold',
      inactive: 'Inactive',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const calculateDaysInStock = () => {
    if (!vehicle) return 0;
    const created = new Date(vehicle.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateTotalExpenses = () => {
    if (!vehicle?.expenses || !Array.isArray(vehicle.expenses)) return 0;
    return vehicle.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  };

  const calculateMargin = () => {
    if (!vehicle || !vehicle.purchase_price) return 0;
    const totalExpenses = calculateTotalExpenses();
    return vehicle.sale_price - vehicle.purchase_price - totalExpenses;
  };

  const calculateMarginPercent = () => {
    if (!vehicle || !vehicle.purchase_price) return 0;
    const margin = calculateMargin();
    const totalCost = vehicle.purchase_price + calculateTotalExpenses();
    return totalCost > 0 ? (margin / totalCost) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-[#d4af37]"></span>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Vehicle not found</h2>
          <button onClick={() => navigate('/vehicles')} className="btn btn-primary">
            Back to Vehicles
          </button>
        </div>
      </div>
    );
  }

  const daysInStock = calculateDaysInStock();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/vehicles')} className="btn btn-ghost btn-sm">
            ← Back
          </button>
          <div>
            <h1 className="text-4xl font-bold font-playfair bg-gradient-to-r from-[#d4af37] to-[#c0c0c0] bg-clip-text text-transparent">
              {vehicle.brand} {vehicle.model}
            </h1>
            {vehicle.version && <p className="text-lg text-gray-600 mt-1">{vehicle.version}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`badge ${getStatusBadgeClass(vehicle.status)} badge-lg`}>
            {getStatusLabel(vehicle.status)}
          </div>
          {vehicle.featured && <div className="badge badge-warning badge-lg">⭐ Featured</div>}
        </div>
      </div>

      {/* Action Buttons */}
      {canEdit && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => navigate(`/vehicles/${vehicle.id}/edit`)}
            className="btn btn-primary"
          >
            Edit Vehicle
          </button>
          {vehicle.status === 'available' && (
            <button
              onClick={() => navigate(`/sales/new/${vehicle.id}`)}
              className="btn bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:from-green-700 hover:to-emerald-600 border-0"
            >
              Mark as Sold
            </button>
          )}
          <button onClick={() => setShowStatusModal(true)} className="btn btn-outline">
            Change Status
          </button>
          <button onClick={handleDelete} className="btn btn-error btn-outline">
            Delete
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main Image */}
          <div className="bg-base-200 rounded-lg overflow-hidden aspect-video">
            {vehicle.photos && vehicle.photos.length > 0 ? (
              <img
                src={vehicle.photos[selectedImage].url}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <svg
                  className="w-24 h-24 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {vehicle.photos && vehicle.photos.length > 1 && (
            <div className="grid grid-cols-6 gap-2">
              {vehicle.photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index
                      ? 'border-[#d4af37] ring-2 ring-[#d4af37]/30'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Description */}
          {vehicle.description && (
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title font-playfair text-2xl">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{vehicle.description}</p>
              </div>
            </div>
          )}

          {/* Status History */}
          {vehicle.status_log && vehicle.status_log.length > 0 && (
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title font-playfair text-2xl">Status History</h2>
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Old Status</th>
                        <th>New Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicle.status_log.map((log) => (
                        <tr key={log.id}>
                          <td>{formatDate(log.created_at)}</td>
                          <td>
                            {log.old_status ? (
                              <span className={`badge ${getStatusBadgeClass(log.old_status)}`}>
                                {getStatusLabel(log.old_status)}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(log.new_status)}`}>
                              {getStatusLabel(log.new_status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Details */}
        <div className="space-y-4">
          {/* Price Card */}
          <div className="card bg-gradient-to-br from-[#d4af37]/10 to-[#c0c0c0]/10 shadow-lg">
            <div className="card-body">
              <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Sale Price
              </h2>
              <p className="text-4xl font-bold font-playfair text-[#d4af37]">
                {formatCurrency(vehicle.sale_price)}
              </p>

              {showFinancials && vehicle.purchase_price && (
                <>
                  <div className="divider my-2"></div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Purchase Price:</span>
                      <span className="font-semibold">
                        {formatCurrency(vehicle.purchase_price)}
                      </span>
                    </div>
                    {vehicle.expenses && vehicle.expenses.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Expenses:</span>
                        <span className="font-semibold">
                          {formatCurrency(calculateTotalExpenses())}
                        </span>
                      </div>
                    )}
                    <div className="divider my-1"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-semibold">Gross Margin:</span>
                      <div className="text-right">
                        <div
                          className={`text-lg font-bold ${
                            calculateMargin() >= 0 ? 'text-success' : 'text-error'
                          }`}
                        >
                          {formatCurrency(calculateMargin())}
                        </div>
                        <div className="text-xs text-gray-500">
                          {calculateMarginPercent().toFixed(1)}% margin
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Specs Card */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title font-playfair text-xl mb-3">Specifications</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-600">Year:</span>
                  <span className="font-semibold">
                    {vehicle.year_fab}/{vehicle.year_model}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-semibold capitalize">{vehicle.category}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-600">Color:</span>
                  <span className="font-semibold">{vehicle.color}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-600">Fuel:</span>
                  <span className="font-semibold capitalize">{vehicle.fuel}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-600">Transmission:</span>
                  <span className="font-semibold capitalize">{vehicle.transmission}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-600">Mileage:</span>
                  <span className="font-semibold">{vehicle.mileage.toLocaleString()} km</span>
                </div>
                {vehicle.doors && (
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-600">Doors:</span>
                    <span className="font-semibold">{vehicle.doors}</span>
                  </div>
                )}
                {vehicle.power && (
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-600">Power:</span>
                    <span className="font-semibold">{vehicle.power}</span>
                  </div>
                )}
                {vehicle.plate && (
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-600">Plate:</span>
                    <span className="font-semibold">{vehicle.plate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Optionals */}
          {vehicle.optionals && Object.keys(vehicle.optionals).length > 0 && (
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title font-playfair text-xl mb-3">Features & Optionals</h2>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(vehicle.optionals)
                    .filter(([, value]) => value)
                    .map(([key]) => (
                      <span key={key} className="badge badge-outline badge-lg">
                        ✓ {key.replace(/_/g, ' ')}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Expenses Breakdown */}
          {showFinancials && vehicle.expenses && vehicle.expenses.length > 0 && (
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title font-playfair text-xl mb-3">Expenses</h2>
                <div className="space-y-2 text-sm">
                  {vehicle.expenses.map((expense, index) => (
                    <div key={index} className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-600">{expense.description}:</span>
                      <span className="font-semibold">{formatCurrency(expense.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 border-t-2 border-gray-300 mt-2">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(calculateTotalExpenses())}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title font-playfair text-xl mb-3">Information</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Days in Stock:</span>
                  <span className={`font-semibold ${daysInStock > 60 ? 'text-warning' : ''}`}>
                    {daysInStock} days
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-semibold">{formatDate(vehicle.created_at)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Updated:</span>
                  <span className="font-semibold">{formatDate(vehicle.updated_at)}</span>
                </div>
                {vehicle.created_by_user && (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Created By:</span>
                    <span className="font-semibold">{vehicle.created_by_user.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Change Vehicle Status</h3>
            <div className="form-control">
              <label className="label">
                <span className="label-text">New Status</span>
              </label>
              <select
                className="select select-bordered"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="">Select status...</option>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="modal-action">
              <button
                onClick={() => setShowStatusModal(false)}
                className="btn btn-ghost"
                disabled={updatingStatus}
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                className="btn btn-primary"
                disabled={!newStatus || updatingStatus}
              >
                {updatingStatus ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Updating...
                  </>
                ) : (
                  'Update Status'
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowStatusModal(false)}></div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { Button } from '../atoms/Button';

interface Photo {
  url: string;
  order: number;
  is_primary: boolean;
}

interface PhotoUploadProps {
  vehicleId?: string;
  currentPhotos?: Photo[];
  onPhotosChange?: (photos: Photo[]) => void;
  maxPhotos?: number;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  vehicleId,
  currentPhotos = [],
  onPhotosChange,
  maxPhotos = 30,
}) => {
  const [photos, setPhotos] = useState<Photo[]>(currentPhotos);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewImages, setPreviewImages] = useState<Array<{ file: File; preview: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList: FileList) => {
    const files = Array.from(fileList);
    const remainingSlots = maxPhotos - photos.length;

    if (files.length > remainingSlots) {
      alert(
        `You can only upload ${remainingSlots} more photo(s). Maximum ${maxPhotos} photos allowed.`
      );
      return;
    }

    // Validate file types
    const validFiles = files.filter((file) => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      alert('Only image files are allowed');
    }

    // Validate file sizes (10MB max)
    const validSizeFiles = validFiles.filter((file) => file.size <= 10 * 1024 * 1024);
    if (validSizeFiles.length !== validFiles.length) {
      alert('Some files are too large. Maximum file size is 10MB');
    }

    // Create preview URLs
    const newPreviews = validSizeFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setPreviewImages((prev) => [...prev, ...newPreviews]);
  };

  const removePreview = (index: number) => {
    setPreviewImages((prev) => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index].preview);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  const uploadPhotos = async () => {
    if (!vehicleId) {
      alert('Vehicle ID is required to upload photos');
      return;
    }

    if (previewImages.length === 0) {
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('vehicle_id', vehicleId);
      formData.append('is_primary', String(photos.length === 0)); // First photo is primary if no existing photos

      previewImages.forEach(({ file }) => {
        formData.append('photos', file);
      });

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload photos');
      }

      const result = await response.json();

      // Update photos list
      setPhotos(result.vehicle.photos || []);

      // Clear previews
      previewImages.forEach(({ preview }) => URL.revokeObjectURL(preview));
      setPreviewImages([]);

      // Notify parent component
      if (onPhotosChange) {
        onPhotosChange(result.vehicle.photos || []);
      }

      alert(`Successfully uploaded ${result.uploaded_count} photo(s)`);
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (index: number) => {
    if (!vehicleId) return;

    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      const response = await fetch(`/api/photos/${vehicleId}/${index}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete photo');
      }

      const result = await response.json();
      setPhotos(result.vehicle.photos || []);

      if (onPhotosChange) {
        onPhotosChange(result.vehicle.photos || []);
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete photo');
    }
  };

  const setPrimary = async (index: number) => {
    if (!vehicleId) return;

    try {
      const response = await fetch(`/api/photos/${vehicleId}/${index}/primary`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to set primary photo');
      }

      const result = await response.json();
      setPhotos(result.vehicle.photos || []);

      if (onPhotosChange) {
        onPhotosChange(result.vehicle.photos || []);
      }
    } catch (error) {
      console.error('Error setting primary photo:', error);
      alert(error instanceof Error ? error.message : 'Failed to set primary photo');
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Photos */}
      {photos.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Current Photos ({photos.length}/{maxPhotos})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={photo.url}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
                {photo.is_primary && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold">
                    PRIMARY
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {!photo.is_primary && (
                    <button onClick={() => setPrimary(index)} className="btn btn-sm btn-primary">
                      Set Primary
                    </button>
                  )}
                  <button onClick={() => deletePhoto(index)} className="btn btn-sm btn-error">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      {photos.length < maxPhotos && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Add New Photos</h3>

          {/* Drag and Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div>
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  Drag and drop photos here, or click to select files
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Up to {maxPhotos - photos.length} more photos (PNG, JPG, max 10MB each)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
              <Button type="button" onClick={() => fileInputRef.current?.click()} outline>
                Select Files
              </Button>
            </div>
          </div>

          {/* Preview Images */}
          {previewImages.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-semibold mb-3">
                Ready to Upload ({previewImages.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                {previewImages.map(({ preview }, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePreview(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <Button onClick={uploadPhotos} disabled={uploading} className="w-full">
                {uploading ? 'Uploading...' : `Upload ${previewImages.length} Photo(s)`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

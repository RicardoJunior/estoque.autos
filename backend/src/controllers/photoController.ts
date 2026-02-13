import { Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { z } from 'zod';
import { createSupabaseClient, supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { randomUUID } from 'crypto';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 30, // Max 30 files per request
  },
  fileFilter: (_req, file, cb) => {
    // Only accept images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export const uploadMiddleware = upload.array('photos', 30);

// Validation schema for photo metadata
const photoMetadataSchema = z.object({
  vehicle_id: z.string().uuid('Invalid vehicle ID'),
  is_primary: z.boolean().optional().default(false),
  order: z.number().int().min(0).optional(),
});

/**
 * Upload photos for a vehicle
 */
export const uploadVehiclePhotos = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenant_id;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Validate metadata from body
    const { vehicle_id, is_primary = false, order } = photoMetadataSchema.parse(req.body);

    // Verify vehicle exists and belongs to tenant
    const supabase = createSupabaseClient(req.user!.access_token);
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, photos')
      .eq('id', vehicle_id)
      .eq('tenant_id', tenantId)
      .single();

    if (vehicleError || !vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Get current photos count
    const currentPhotos =
      (vehicle.photos as Array<{ url: string; order: number; is_primary: boolean }>) || [];
    const currentCount = currentPhotos.length;

    if (currentCount + files.length > 30) {
      return res.status(400).json({
        error: `Maximum 30 photos allowed per vehicle. Current: ${currentCount}, Uploading: ${files.length}`,
      });
    }

    // Process and upload photos
    const uploadedPhotos = [];
    const bucket = 'vehicle-photos';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Compress image with Sharp
        const compressedBuffer = await sharp(file.buffer)
          .resize(1920, 1080, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({
            quality: 85,
            progressive: true,
          })
          .toBuffer();

        // Generate unique filename
        const fileExtension = 'jpg'; // Always save as JPEG after compression
        const fileName = `${tenantId}/${vehicle_id}/${randomUUID()}.${fileExtension}`;

        // Upload to Supabase Storage using admin client (bypasses RLS for storage)
        const { error: uploadError } = await supabaseAdmin.storage
          .from(bucket)
          .upload(fileName, compressedBuffer, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error(`Error uploading file ${file.originalname}:`, uploadError);
          continue; // Skip this file and continue with others
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);

        uploadedPhotos.push({
          url: urlData.publicUrl,
          order: order !== undefined ? order + i : currentCount + i,
          is_primary: is_primary && i === 0, // Only first photo can be primary if specified
        });
      } catch (imageError) {
        console.error(`Error processing image ${file.originalname}:`, imageError);
        continue; // Skip this file
      }
    }

    if (uploadedPhotos.length === 0) {
      return res.status(500).json({ error: 'Failed to upload any photos' });
    }

    // Update vehicle with new photos
    const updatedPhotos = [...currentPhotos, ...uploadedPhotos];

    // If new primary photo, unset old primary
    if (uploadedPhotos.some((p) => p.is_primary)) {
      currentPhotos.forEach((p) => (p.is_primary = false));
    }

    const { data: updatedVehicle, error: updateError } = await supabase
      .from('vehicles')
      .update({ photos: updatedPhotos })
      .eq('id', vehicle_id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating vehicle photos:', updateError);
      return res.status(500).json({ error: 'Failed to update vehicle with photos' });
    }

    res.status(201).json({
      message: `Successfully uploaded ${uploadedPhotos.length} photo(s)`,
      uploaded_count: uploadedPhotos.length,
      total_photos: updatedPhotos.length,
      photos: uploadedPhotos,
      vehicle: updatedVehicle,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    console.error('Error in uploadVehiclePhotos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete a photo from a vehicle
 */
export const deleteVehiclePhoto = async (req: AuthRequest, res: Response) => {
  try {
    const { vehicle_id, photo_index } = req.params;
    const tenantId = req.user!.tenant_id;
    const photoIdx = parseInt(photo_index, 10);

    if (isNaN(photoIdx) || photoIdx < 0) {
      return res.status(400).json({ error: 'Invalid photo index' });
    }

    // Get vehicle
    const supabase = createSupabaseClient(req.user!.access_token);
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, photos')
      .eq('id', vehicle_id)
      .eq('tenant_id', tenantId)
      .single();

    if (vehicleError || !vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const currentPhotos =
      (vehicle.photos as Array<{ url: string; order: number; is_primary: boolean }>) || [];

    if (photoIdx >= currentPhotos.length) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const photoToDelete = currentPhotos[photoIdx];

    // Extract file path from URL
    const url = new URL(photoToDelete.url);
    const pathParts = url.pathname.split('/');
    const bucket = pathParts[pathParts.indexOf('storage') + 2]; // Get bucket name
    const filePath = pathParts.slice(pathParts.indexOf(bucket) + 1).join('/');

    // Delete from storage
    const { error: deleteError } = await supabaseAdmin.storage.from(bucket).remove([filePath]);

    if (deleteError) {
      console.error('Error deleting photo from storage:', deleteError);
      // Continue even if storage deletion fails
    }

    // Remove photo from array
    const updatedPhotos = currentPhotos.filter((_, idx) => idx !== photoIdx);

    // Reindex order
    updatedPhotos.forEach((photo, idx) => {
      photo.order = idx;
    });

    // Update vehicle
    const { data: updatedVehicle, error: updateError } = await supabase
      .from('vehicles')
      .update({ photos: updatedPhotos })
      .eq('id', vehicle_id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating vehicle photos:', updateError);
      return res.status(500).json({ error: 'Failed to update vehicle' });
    }

    res.json({
      message: 'Photo deleted successfully',
      vehicle: updatedVehicle,
    });
  } catch (error) {
    console.error('Error in deleteVehiclePhoto:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Reorder photos for a vehicle
 */
export const reorderVehiclePhotos = async (req: AuthRequest, res: Response) => {
  try {
    const { vehicle_id } = req.params;
    const tenantId = req.user!.tenant_id;

    // Validate request body
    const orderSchema = z.object({
      photo_orders: z.array(
        z.object({
          index: z.number().int().min(0),
          new_order: z.number().int().min(0),
        })
      ),
    });

    const { photo_orders } = orderSchema.parse(req.body);

    // Get vehicle
    const supabase = createSupabaseClient(req.user!.access_token);
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, photos')
      .eq('id', vehicle_id)
      .eq('tenant_id', tenantId)
      .single();

    if (vehicleError || !vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const currentPhotos =
      (vehicle.photos as Array<{ url: string; order: number; is_primary: boolean }>) || [];

    // Apply new orders
    photo_orders.forEach(({ index, new_order }) => {
      if (index < currentPhotos.length) {
        currentPhotos[index].order = new_order;
      }
    });

    // Sort by new order
    currentPhotos.sort((a, b) => a.order - b.order);

    // Normalize orders (0, 1, 2, ...)
    currentPhotos.forEach((photo, idx) => {
      photo.order = idx;
    });

    // Update vehicle
    const { data: updatedVehicle, error: updateError } = await supabase
      .from('vehicles')
      .update({ photos: currentPhotos })
      .eq('id', vehicle_id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating vehicle photos:', updateError);
      return res.status(500).json({ error: 'Failed to update vehicle' });
    }

    res.json({
      message: 'Photos reordered successfully',
      vehicle: updatedVehicle,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    console.error('Error in reorderVehiclePhotos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Set primary photo for a vehicle
 */
export const setPrimaryPhoto = async (req: AuthRequest, res: Response) => {
  try {
    const { vehicle_id, photo_index } = req.params;
    const tenantId = req.user!.tenant_id;
    const photoIdx = parseInt(photo_index, 10);

    if (isNaN(photoIdx) || photoIdx < 0) {
      return res.status(400).json({ error: 'Invalid photo index' });
    }

    // Get vehicle
    const supabase = createSupabaseClient(req.user!.access_token);
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, photos')
      .eq('id', vehicle_id)
      .eq('tenant_id', tenantId)
      .single();

    if (vehicleError || !vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const currentPhotos =
      (vehicle.photos as Array<{ url: string; order: number; is_primary: boolean }>) || [];

    if (photoIdx >= currentPhotos.length) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Unset all primary flags
    currentPhotos.forEach((photo) => {
      photo.is_primary = false;
    });

    // Set new primary
    currentPhotos[photoIdx].is_primary = true;

    // Update vehicle
    const { data: updatedVehicle, error: updateError } = await supabase
      .from('vehicles')
      .update({ photos: currentPhotos })
      .eq('id', vehicle_id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating vehicle photos:', updateError);
      return res.status(500).json({ error: 'Failed to update vehicle' });
    }

    res.json({
      message: 'Primary photo set successfully',
      vehicle: updatedVehicle,
    });
  } catch (error) {
    console.error('Error in setPrimaryPhoto:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

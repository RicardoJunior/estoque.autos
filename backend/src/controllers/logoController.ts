import { Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { createSupabaseClient, supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { randomUUID } from 'crypto';

// Configure multer for memory storage (logo only)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size for logos
    files: 1, // Only one logo at a time
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

export const uploadLogoMiddleware = upload.single('logo');

/**
 * Upload and crop tenant logo
 * POST /api/tenant/logo/upload
 *
 * Expects multipart/form-data with:
 * - logo: image file
 * - crop: JSON string with crop data { x, y, width, height, aspect }
 */
export const uploadTenantLogo = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenant_id;
    const file = req.file as Express.Multer.File;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Parse crop data from request body
    let cropData: { x: number; y: number; width: number; height: number; aspect?: string } | null =
      null;

    if (req.body.crop) {
      try {
        cropData = JSON.parse(req.body.crop);
      } catch {
        return res.status(400).json({ error: 'Invalid crop data' });
      }
    }

    const bucket = 'tenant-logos';
    const uploadedLogos = [];

    // Generate two versions: square (1:1) and wide (16:9)
    const versions = [
      { aspect: 'square', width: 400, height: 400, suffix: 'square' },
      { aspect: 'wide', width: 800, height: 450, suffix: 'wide' },
    ];

    for (const version of versions) {
      try {
        let imageProcessor = sharp(file.buffer);

        // Apply crop if provided and matches aspect ratio
        if (cropData && (!cropData.aspect || cropData.aspect === version.aspect)) {
          imageProcessor = imageProcessor.extract({
            left: Math.round(cropData.x),
            top: Math.round(cropData.y),
            width: Math.round(cropData.width),
            height: Math.round(cropData.height),
          });
        }

        // Resize to target dimensions
        const compressedBuffer = await imageProcessor
          .resize(version.width, version.height, {
            fit: 'cover',
            position: 'center',
          })
          .png({
            quality: 90,
            compressionLevel: 9,
          })
          .toBuffer();

        // Generate unique filename
        const fileName = `${tenantId}/${randomUUID()}_${version.suffix}.png`;

        // Upload to Supabase Storage using admin client
        const { error: uploadError } = await supabaseAdmin.storage
          .from(bucket)
          .upload(fileName, compressedBuffer, {
            contentType: 'image/png',
            upsert: false,
          });

        if (uploadError) {
          console.error('Error uploading to Supabase:', uploadError);
          return res.status(500).json({ error: 'Failed to upload logo' });
        }

        // Get public URL
        const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);

        uploadedLogos.push({
          aspect: version.aspect,
          url: publicUrlData.publicUrl,
          width: version.width,
          height: version.height,
        });
      } catch (error) {
        console.error(`Error processing ${version.aspect} logo:`, error);
        return res.status(500).json({ error: `Failed to process ${version.aspect} logo` });
      }
    }

    // Update tenant with square logo URL (primary logo)
    const squareLogo = uploadedLogos.find((l) => l.aspect === 'square');

    if (squareLogo) {
      const supabase = createSupabaseClient(req.user!.access_token);
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ logo_url: squareLogo.url })
        .eq('id', tenantId);

      if (updateError) {
        console.error('Error updating tenant logo:', updateError);
        // Don't fail the request, logos are already uploaded
      }
    }

    return res.json({
      message: 'Logo uploaded successfully',
      logos: uploadedLogos,
      primary_logo: squareLogo?.url,
    });
  } catch (error) {
    console.error('Error in uploadTenantLogo:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete old tenant logos
 * DELETE /api/tenant/logo
 *
 * Removes old logo files from storage
 */
export const deleteTenantLogo = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenant_id;

    const supabase = createSupabaseClient(req.user!.access_token);

    // Get current tenant logo URL
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('logo_url')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (!tenant.logo_url) {
      return res.status(400).json({ error: 'No logo to delete' });
    }

    // Clear logo_url from tenant
    const { error: updateError } = await supabase
      .from('tenants')
      .update({ logo_url: null })
      .eq('id', tenantId);

    if (updateError) {
      console.error('Error updating tenant:', updateError);
      return res.status(500).json({ error: 'Failed to delete logo' });
    }

    // Note: We don't delete files from storage to avoid breaking old URLs
    // Storage cleanup should be handled by a background job

    return res.json({ message: 'Logo deleted successfully' });
  } catch (error) {
    console.error('Error in deleteTenantLogo:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

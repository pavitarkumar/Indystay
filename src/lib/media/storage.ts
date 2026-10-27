import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';
import path from 'path';

function getCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  if (cloudinaryUrl) {
    cloudinary.config({
      cloudinary_url: cloudinaryUrl,
      secure: true,
    });
    return cloudinary;
  }

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return cloudinary;
  }

  return null;
}

export interface UploadResult {
  url: string;
  publicId: string;
  format?: string;
  width?: number;
  height?: number;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function uploadImageBuffer(
  buffer: Buffer,
  mimeType: string,
  folder = 'indistay/hotels'
): Promise<UploadResult> {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`Unsupported image format: ${mimeType}. Allowed: JPEG, PNG, WebP, AVIF`);
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error('Image size exceeds 10MB limit');
  }

  const cld = getCloudinary();

  // If Cloudinary is configured, upload directly to Cloudinary
  if (cld) {
    return new Promise((resolve, reject) => {
      const uploadStream = cld.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Cloudinary upload failed'));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              width: result.width,
              height: result.height,
            });
          }
        }
      );
      uploadStream.end(buffer);
    });
  }

  // Fallback to local public/uploads directory during local development
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadDir, { recursive: true });

  const ext = mimeType.split('/')[1] || 'jpg';
  const fileName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
  const filePath = path.join(uploadDir, fileName);

  await fs.writeFile(filePath, buffer);

  return {
    url: `/uploads/${fileName}`,
    publicId: `local_${fileName}`,
    format: ext,
  };
}

export async function deleteImage(publicId: string): Promise<boolean> {
  if (!publicId) return true;

  const cld = getCloudinary();
  if (cld && !publicId.startsWith('local_')) {
    try {
      const result = await cld.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch {
      return false;
    }
  }

  if (publicId.startsWith('local_')) {
    try {
      const fileName = publicId.replace('local_', '');
      const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  return true;
}

import { MEDIA_LIMITS } from '@uit-volunteer-map/shared';

export interface CloudinaryUploadResult { secure_url: string; public_id: string; width: number; height: number; }
export interface UploadProgress {
  file: File; progress: number; status: 'pending' | 'uploading' | 'success' | 'error';
  result?: CloudinaryUploadResult; error?: string;
}
export function imageFileError(file: File): string | undefined {
  if (!(MEDIA_LIMITS.imageMimeTypes as readonly string[]).includes(file.type)) return 'Chỉ nhận ảnh JPEG, PNG, WebP hoặc GIF.';
  if (!file.size || file.size > MEDIA_LIMITS.maxImageBytes) return 'Mỗi ảnh phải có dữ liệu và không vượt quá 5 MiB.';
}
function parseResult(value: unknown): CloudinaryUploadResult {
  if (!value || typeof value !== 'object') throw new Error('Dịch vụ ảnh trả về dữ liệu không hợp lệ.');
  const result = value as Partial<CloudinaryUploadResult>;
  let url: URL;
  try { url = new URL(result.secure_url || ''); } catch { throw new Error('Dịch vụ ảnh trả về URL không hợp lệ.'); }
  if (!['https:', 'http:'].includes(url.protocol) || typeof result.public_id !== 'string' || !result.public_id ||
      typeof result.width !== 'number' || !Number.isFinite(result.width) || result.width <= 0 ||
      typeof result.height !== 'number' || !Number.isFinite(result.height) || result.height <= 0) {
    throw new Error('Dịch vụ ảnh trả về dữ liệu không hợp lệ.');
  }
  return { secure_url: url.href, public_id: result.public_id, width: result.width, height: result.height };
}
export const cloudinaryApi = {
  uploadImage: async (file: File, onProgress?: (progress: number) => void): Promise<CloudinaryUploadResult> => {
    const fileError = imageFileError(file);
    if (fileError) throw new Error(fileError);
    const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    if (!cloud || !/^[a-z0-9_-]+$/i.test(cloud) || !preset?.trim()) throw new Error('Chưa cấu hình Cloudinary. Kiểm tra cloud name và upload preset.');
    const body = new FormData();
    body.append('file', file); body.append('upload_preset', preset);
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/upload`);
      xhr.timeout = 60_000;
      xhr.upload.onprogress = event => { if (event.lengthComputable) onProgress?.(Math.round(event.loaded / event.total * 100)); };
      xhr.onload = () => {
        try {
          if (xhr.status < 200 || xhr.status >= 300) throw new Error('Dịch vụ ảnh chưa nhận được tệp. Vui lòng thử lại.');
          resolve(parseResult(JSON.parse(xhr.responseText)));
        } catch (error) { reject(error instanceof Error ? error : new Error('Dịch vụ ảnh trả về dữ liệu không hợp lệ.')); }
      };
      xhr.onerror = () => reject(new Error('Mất kết nối khi tải ảnh. Vui lòng thử lại.'));
      xhr.ontimeout = () => reject(new Error('Tải ảnh quá thời gian. Vui lòng thử lại.'));
      xhr.onabort = () => reject(new Error('Đã dừng tải ảnh.'));
      xhr.send(body);
    });
  },
  uploadImages: async (files: File[], onFileProgress?: (index: number, progress: UploadProgress) => void): Promise<CloudinaryUploadResult[]> => {
    if (files.length > MEDIA_LIMITS.maxImages) throw new Error('Chọn tối đa bốn ảnh.');
    // Check the entire batch before uploading any item.
    for (const file of files) { const error = imageFileError(file); if (error) throw new Error(error); }
    const results: CloudinaryUploadResult[] = [];
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      onFileProgress?.(index, { file, progress: 0, status: 'uploading' });
      try {
        const result = await cloudinaryApi.uploadImage(file, progress => onFileProgress?.(index, { file, progress, status: 'uploading' }));
        results.push(result); onFileProgress?.(index, { file, progress: 100, status: 'success', result });
      } catch (error) {
        onFileProgress?.(index, { file, progress: 0, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' });
        throw error;
      }
    }
    return results;
  },
}

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  result?: CloudinaryUploadResult;
  error?: string;
}

export const cloudinaryApi = {
  /**
   * Upload a single image to Cloudinary
   */
  uploadImage: async (
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<CloudinaryUploadResult> => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error(
        "Cloudinary configuration missing. Check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.",
      );
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      );

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          resolve({
            secure_url: response.secure_url,
            public_id: response.public_id,
            width: response.width,
            height: response.height,
          });
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(formData);
    });
  },

  /**
   * Upload multiple images to Cloudinary
   */
  uploadImages: async (
    files: File[],
    onFileProgress?: (index: number, progress: UploadProgress) => void,
  ): Promise<CloudinaryUploadResult[]> => {
    const results: CloudinaryUploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      onFileProgress?.(i, {
        file,
        progress: 0,
        status: "uploading",
      });

      try {
        const result = await cloudinaryApi.uploadImage(file, (progress) => {
          onFileProgress?.(i, {
            file,
            progress,
            status: "uploading",
          });
        });

        results.push(result);
        onFileProgress?.(i, {
          file,
          progress: 100,
          status: "success",
          result,
        });
      } catch (error) {
        onFileProgress?.(i, {
          file,
          progress: 0,
          status: "error",
          error: error instanceof Error ? error.message : "Upload failed",
        });
        throw error;
      }
    }

    return results;
  },
};

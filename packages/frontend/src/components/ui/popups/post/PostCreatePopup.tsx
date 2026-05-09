import { useRef, useState, useCallback } from "react";
import { cloudinaryApi, type UploadProgress } from "@/api";
import uploadFileLogo from "@/assets/icons/upload_file_logo.svg"; 

interface ImageItem {
  id: string;
  file: File;
  preview: string;
  order: number | null;
  uploadProgress: UploadProgress | null;
  imageUrl?: string;
}

interface Props {
  maxFiles?: number;
  onComplete?: (imageUrls: string[]) => void;
  onClose?: () => void;
}

type Step = "select" | "choose";

export default function PostCreatePopup({
  maxFiles = 4,
  onComplete,
  onClose,
}: Props) {
  const [step, setStep] = useState<Step>("select");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const selectedImages = images
    .filter((img) => img.order !== null)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const selectedCount = selectedImages.length;

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) =>
      f.type.startsWith("image/"),
    );

    const newImages: ImageItem[] = fileArray.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      preview: URL.createObjectURL(file),
      order: null,
      uploadProgress: null,
    }));

    setImages(newImages);
    if (newImages.length > 0) {
      setStep("choose");
    }
  }, []);

  const toggleImageSelection = (id: string) => {
    setImages((prev) => {
      const clickedImg = prev.find((img) => img.id === id);
      if (!clickedImg) return prev;

      if (clickedImg.order !== null) {
        const removedOrder = clickedImg.order;
        return prev.map((img) => {
          if (img.id === id) {
            return { ...img, order: null };
          }
          if (img.order !== null && img.order > removedOrder) {
            return { ...img, order: img.order - 1 };
          }
          return img;
        });
      } else {
        const currentSelectedCount = prev.filter(
          (img) => img.order !== null,
        ).length;
        if (currentSelectedCount >= maxFiles) return prev;
        return prev.map((img) =>
          img.id === id ? { ...img, order: currentSelectedCount + 1 } : img,
        );
      }
    });
  };

  const handleAddMoreFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) =>
      f.type.startsWith("image/"),
    );

    const newImages: ImageItem[] = fileArray.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      preview: URL.createObjectURL(file),
      order: null,
      uploadProgress: null,
    }));

    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const handleUpload = async () => {
    if (selectedCount === 0) return;

    setIsUploading(true);

    const filesToUpload = selectedImages.map((img) => img.file);

    try {
      const results = await cloudinaryApi.uploadImages(
        filesToUpload,
        (index, progress) => {
          const imageId = selectedImages[index].id;
          setImages((prev) =>
            prev.map((img) =>
              img.id === imageId ? { ...img, uploadProgress: progress } : img,
            ),
          );
        },
      );

      const imageUrls = results.map((r) => r.secure_url);

      setImages((prev) =>
        prev.map((img) => {
          const selectedIndex = selectedImages.findIndex(
            (s) => s.id === img.id,
          );
          if (selectedIndex !== -1 && results[selectedIndex]) {
            return { ...img, imageUrl: results[selectedIndex].secure_url };
          }
          return img;
        }),
      );

      onComplete?.(imageUrls);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const cleanup = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
  };

  const handleClose = () => {
    cleanup();
    onClose?.();
  };

  if (step === "select") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-90 rounded-xl overflow-hidden bg-[#1F2329] text-white">
          {/* Header */}
          <div className="bg-[#C4161C] text-center py-2 font-bold">
            Tạo bài viết
          </div>

          {/* Content */}
          <div
            className={`flex flex-col items-center justify-center py-12 gap-4 border-2 border-dashed mx-4 my-4 rounded-lg transition-colors ${
              isDragging
                ? "border-[#F4B400] bg-[#F4B400]/10"
                : "border-gray-600"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <img src={uploadFileLogo} className="w-16 h-16" />
            <div className="text-gray-300 text-sm">
              {isDragging ? "Thả tệp vào đây" : "Kéo thả tệp vào đây"}
            </div>

            {/* Hidden input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              hidden
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFiles(e.target.files);
                }
              }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#F4B400] text-black text-sm font-bold px-4 py-2 rounded hover:bg-[#F4B400]/90 transition-colors"
            >
              Chọn tệp từ máy
            </button>
          </div>

          {/* Footer */}
          <div className="flex justify-end px-4 pb-3">
            <button
              onClick={handleClose}
              className="text-xs underline hover:text-gray-300"
            >
              Huỷ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="w-125 h-150 rounded-xl overflow-hidden bg-[#E1E4E8] text-black flex flex-col"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files.length > 0) {
            handleAddMoreFiles(e.dataTransfer.files);
          }
        }}
      >
        {/* Header */}
        <div className="bg-[#C4161C] text-white text-center py-3 font-bold">
          Tạo bài viết
        </div>

        {/* Grid */}
        <div
          className={`flex-1 p-4 overflow-y-auto transition-colors ${
            isDragging ? "bg-blue-100" : ""
          }`}
        >
          <div className="grid grid-cols-3 gap-4">
            {images.map((img) => {
              const isSelected = img.order !== null;
              const progress = img.uploadProgress;
              const isThisUploading = progress?.status === "uploading";
              const isSuccess = progress?.status === "success";
              const isError = progress?.status === "error";

              return (
                <div
                  key={img.id}
                  className={`relative aspect-square bg-white rounded overflow-hidden cursor-pointer transition-all hover:opacity-90 ${
                    isUploading ? "pointer-events-none" : ""
                  }`}
                  onClick={() => !isUploading && toggleImageSelection(img.id)}
                >
                  {/* Image */}
                  <img
                    src={img.preview}
                    alt=""
                    className="w-full h-full object-cover"
                  />

                  {/* Order badge - top left, blue */}
                  {isSelected && (
                    <div className="absolute -top-1 -left-1 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow">
                      {img.order}
                    </div>
                  )}

                  {/* Checkmark for unselected images - bottom right */}
                  {!isSelected && (
                    <div className="absolute bottom-1 right-1 w-5 h-5 border-2 border-blue-400 rounded-full bg-white/80 flex items-center justify-center">
                      <span className="text-blue-400 text-xs">✓</span>
                    </div>
                  )}

                  {/* Upload progress overlay */}
                  {isThisUploading && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                      <div className="w-3/4 h-1 bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#F4B400] transition-all"
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                      <span className="text-white text-xs mt-1">
                        {progress.progress}%
                      </span>
                    </div>
                  )}

                  {/* Success indicator */}
                  {isSuccess && (
                    <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                      <span className="text-2xl text-white">✓</span>
                    </div>
                  )}

                  {/* Error indicator */}
                  {isError && (
                    <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                      <span className="text-2xl text-white">✕</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#C4161C] px-4 py-3 flex justify-between items-center">
          {/* Add more button */}
          <button
            onClick={() => addMoreInputRef.current?.click()}
            disabled={isUploading}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded flex items-center justify-center text-white text-xl transition-colors disabled:opacity-50"
          >
            +
          </button>

          {/* Hidden input for adding more files */}
          <input
            ref={addMoreInputRef}
            type="file"
            multiple
            accept="image/*"
            hidden
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleAddMoreFiles(e.target.files);
                e.target.value = "";
              }
            }}
          />

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={selectedCount === 0 || isUploading}
            className={`text-sm px-4 py-2 rounded transition-colors ${
              selectedCount > 0 && !isUploading
                ? "bg-[#F4B400] text-black hover:bg-[#F4B400]/90"
                : "bg-gray-400 text-gray-200 cursor-not-allowed"
            }`}
          >
            {isUploading ? "Đang tải..." : `Chọn ${selectedCount} files`}
          </button>
        </div>
      </div>
    </div>
  );
}

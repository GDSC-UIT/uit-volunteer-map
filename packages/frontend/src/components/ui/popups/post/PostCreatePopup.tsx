import { useRef, useState, useEffect } from "react";
import { cloudinaryApi, type UploadProgress } from "@/api";
import Dialog from "@/components/ui/Dialog";
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
  open?: boolean;
}

export default function PostCreatePopup({ maxFiles = 4, onComplete, onClose, open = true }: Props) {
  const [step, setStep] = useState<"select" | "choose">("select");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const stepHeading = useRef<HTMLParagraphElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previews = useRef(new Set<string>());
  const active = useRef(true);
  const uploading = useRef(false);
  const selectedImages = images.filter(img => img.order !== null).sort((a, b) => a.order! - b.order!);
  const selectedCount = selectedImages.length;

  useEffect(() => {
    active.current = true;
    const urls = previews.current;
    return () => {
      active.current = false;
      urls.forEach(url => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  useEffect(() => {
    if (open) stepHeading.current?.focus();
  }, [step, open]);

  const handleFiles = (files: FileList | File[]) => {
    if (uploading.current) return;
    const all = Array.from(files);
    const accepted = all.filter(file => file.type.startsWith("image/"));
    const rejected = all.filter(file => !file.type.startsWith("image/"));
    setError(rejected.length ? `Không nhận tệp: ${rejected.map(file => file.name).join(", ")}. Vui lòng chọn tệp ảnh.` : "");
    const added = accepted.map(file => {
      const preview = URL.createObjectURL(file);
      previews.current.add(preview);
      return { id: crypto.randomUUID(), file, preview, order: null, uploadProgress: null };
    });
    setImages(prev => [...prev, ...added]);
    if (added.length) setStep("choose");
  };

  const toggleImageSelection = (id: string) => {
    if (uploading.current) return;
    const clicked = images.find(img => img.id === id);
    if (!clicked) return;
    if (clicked.order === null && selectedCount >= maxFiles) {
      setError(`Chỉ được chọn tối đa ${maxFiles} ảnh. Bỏ chọn một ảnh trước khi chọn ảnh khác.`);
      return;
    }
    setError("");
    setImages(prev => prev.map(img => {
      if (img.id === id) return { ...img, order: clicked.order === null ? selectedCount + 1 : null };
      return clicked.order !== null && img.order !== null && img.order > clicked.order
        ? { ...img, order: img.order - 1 } : img;
    }));
  };

  const handleUpload = async () => {
    if (!selectedCount || uploading.current) return;
    uploading.current = true;
    setIsUploading(true);
    setError("");
    // Reuse successful uploads when retrying a partially failed batch or going Back.
    const pending = selectedImages.filter(img => !img.imageUrl);
    try {
      const results = await cloudinaryApi.uploadImages(pending.map(img => img.file), (index, progress) => {
        if (!active.current) return;
        setImages(prev => prev.map(img => img.id === pending[index].id
          ? { ...img, uploadProgress: progress, imageUrl: progress.result?.secure_url ?? img.imageUrl } : img));
      });
      if (!active.current) return;
      const urls = selectedImages.map(img => img.imageUrl ?? results[pending.findIndex(item => item.id === img.id)].secure_url);
      onComplete?.(urls);
    } catch {
      if (active.current) setError("Không thể tải ảnh lên. Kiểm tra kết nối rồi thử lại. Ảnh đã chọn và ảnh tải thành công được giữ lại.");
    } finally {
      uploading.current = false;
      if (active.current) setIsUploading(false);
    }
  };
  const close = () => { active.current = false; onClose?.(); };

  return (
    <Dialog title="Tạo bài viết — chọn ảnh" open={open} onClose={close}
      className={`${step === "select" ? "w-90 bg-[#1F2329] text-white" : "w-125 bg-[#E1E4E8]"} rounded-xl`}>
      <div className="bg-[#C4161C] text-white text-center py-3 font-bold">Tạo bài viết</div>
      <p ref={stepHeading} tabIndex={-1} role="status" className="px-4 pt-3 text-sm">Đã chọn {selectedCount}/{maxFiles} ảnh. Chỉ nhận tệp ảnh.</p>
      {error && <p role="alert" className="mx-4 mt-3 p-2 rounded bg-white text-[#8B0000] text-sm wrap-anywhere">{error}</p>}
      <input ref={fileInputRef} type="file" multiple accept="image/*" hidden aria-label="Chọn tệp ảnh"
        onChange={event => { if (event.target.files) handleFiles(event.target.files); event.target.value = ""; }} />
      <div onDragOver={event => { event.preventDefault(); if (!isUploading) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={event => { event.preventDefault(); setIsDragging(false); handleFiles(event.dataTransfer.files); }}
        className={isDragging ? "ring-2 ring-inset ring-[#023A54]" : ""}>
        {step === "select" ? (
          <div className="flex flex-col items-center justify-center py-10 gap-4 border-2 border-dashed border-gray-500 mx-4 my-4 rounded-lg">
            <img src={uploadFileLogo} alt="" className="w-16 h-16" />
            <p className="text-gray-300 text-sm">{isDragging ? "Thả tệp vào đây" : "Kéo thả tệp vào đây"}</p>
            <button onClick={() => fileInputRef.current?.click()} className="bg-[#F4B400] text-black text-sm font-bold px-4 py-3 rounded">Chọn tệp từ máy</button>
            {images.length > 0 && <button onClick={() => setStep("choose")} className="underline py-2">Tiếp tục chọn ảnh</button>}
          </div>
        ) : (
          <div className="p-4 grid grid-cols-3 gap-3">
            {images.map(img => (
              <button key={img.id} type="button" aria-pressed={img.order !== null}
                aria-label={`${img.file.name}${img.order !== null ? `, thứ tự ${img.order}` : ""}`}
                disabled={isUploading} onClick={() => toggleImageSelection(img.id)}
                className="relative aspect-square min-w-0 bg-white rounded overflow-hidden hover:opacity-90">
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                {img.order !== null && <span aria-hidden="true" className="absolute top-1 left-1 px-1 rounded bg-[#023A54] text-white text-xs">✓ {img.order}</span>}
                {img.uploadProgress && <span className="absolute bottom-0 inset-x-0 bg-black/80 text-white text-xs p-1">
                  {img.uploadProgress.status === "success" ? "Đã tải" : img.uploadProgress.status === "error" ? "Tải lỗi" : `${img.uploadProgress.progress}%`}
                </span>}
              </button>
            ))}
          </div>
        )}
      </div>
      {isUploading && <p role="status" className="px-4 py-2 text-sm">Đang tải ảnh… Đóng hộp thoại sẽ dừng chuyển sang bước tiếp theo.</p>}
      <div className="bg-[#C4161C] text-white p-3 flex flex-wrap gap-2 items-center justify-end">
        <button onClick={close} className="px-3 py-3 underline">Hủy</button>
        {step === "choose" && <>
          <button disabled={isUploading} onClick={() => setStep("select")} className="px-3 py-3 underline disabled:opacity-60">Quay lại</button>
          <button aria-label="Thêm ảnh" disabled={isUploading} onClick={() => fileInputRef.current?.click()} className="w-11 h-11 bg-white text-black rounded">+</button>
          <button onClick={handleUpload} disabled={!selectedCount || isUploading}
            className="px-4 py-3 rounded bg-[#F4B400] text-black disabled:bg-gray-300 disabled:text-gray-700">
            {isUploading ? "Đang tải…" : `Chọn ${selectedCount} ảnh`}
          </button>
        </>}
      </div>
    </Dialog>
  );
}

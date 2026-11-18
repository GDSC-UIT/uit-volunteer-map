import { useEffect, useRef, useState } from 'react';
import { cloudinaryApi } from '@/api/cloudinary';
import EditorDialog from '../EditorDialog';

interface ImageItem { id: number; file: File; preview: string; url?: string; }
export default function PostCreatePopup({ open, onComplete, onClose, onDirty, maxFiles = 4 }: {
  open: boolean; onComplete: (urls: string[]) => void; onClose: () => void; onDirty: (dirty: boolean) => void; maxFiles?: number;
}) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const previews = useRef(new Set<string>());
  const nextId = useRef(0);
  useEffect(() => onDirty(images.length > 0), [images.length, onDirty]);
  useEffect(() => {
    const urls = previews.current;
    return () => { urls.forEach(url => URL.revokeObjectURL(url)); urls.clear(); };
  }, []);
  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files);
    if (images.length + selected.length > maxFiles) { setError(`Chọn tối đa ${maxFiles} ảnh.`); return; }
    if (selected.some(file => !file.type.startsWith('image/'))) { setError('Vui lòng chọn tệp ảnh.'); return; }
    setImages(previous => [...previous, ...selected.map(file => {
      const preview = URL.createObjectURL(file);
      previews.current.add(preview);
      return { id: nextId.current++, file, preview };
    })]);
    setError('');
  };
  const upload = async () => {
    setPending(true); setError('');
    const urls: string[] = [];
    try {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        let url = image.url;
        if (!url) {
          const result = await cloudinaryApi.uploadImage(image.file, value => setProgress(`Ảnh ${i + 1}/${images.length}: ${value}%`));
          url = result.secure_url;
          if (!URL.canParse(url) || !['https:', 'http:'].includes(new URL(url).protocol)) throw new Error('Invalid image URL');
          const uploadedUrl = url;
          setImages(previous => previous.map(item => item.id === image.id ? { ...item, url: uploadedUrl } : item));
        }
        urls.push(url);
      }
      onComplete(urls);
    } catch {
      setError('Chưa thể tải ảnh. Các ảnh đã tải thành công được giữ lại; thử lại sẽ tiếp tục phần còn thiếu. Kiểm tra kết nối hoặc cấu hình Cloudinary.');
    } finally { setPending(false); setProgress(''); }
  };
  if (!open) return null;
  return <EditorDialog title="Ảnh bài đăng" pending={pending} onClose={onClose}>
    <div className="p-5 space-y-4">
      <p>Chọn tối đa {maxFiles} ảnh. Ảnh đầu tiên là ảnh đại diện. Có thể đăng bài không có ảnh.</p>
      <fieldset disabled={pending} className="space-y-4">
        <label className="block font-bold">Thêm ảnh<input type="file" accept="image/*" multiple onChange={e => { addFiles(e.target.files); e.target.value = ''; }} className="block w-full min-h-11 py-2" /></label>
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {images.map((image, index) => <li key={image.id} className="border rounded p-3 min-w-0 bg-[#E1E4E8]">
            <img src={image.preview} alt={`Ảnh đã chọn ${index + 1}`} className="w-full h-36 object-contain" />
            <p className="wrap-anywhere text-sm">{index + 1}. {image.file.name}{image.url ? ' — Đã tải' : ''}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <button type="button" disabled={index === 0} onClick={() => setImages(previous => { const result = [...previous]; [result[index - 1], result[index]] = [result[index], result[index - 1]]; return result; })} className="min-h-11 px-3 border rounded bg-white disabled:opacity-50">Đưa lên trước</button>
              <button type="button" aria-label={`Bỏ ảnh ${index + 1}`} onClick={() => { URL.revokeObjectURL(image.preview); previews.current.delete(image.preview); setImages(previous => previous.filter(item => item.id !== image.id)); }} className="min-h-11 px-3 border rounded bg-white">Bỏ ảnh</button>
            </div>
          </li>)}
        </ol>
        {error && <p role="alert">{error}</p>}
        {pending && <p role="status">{progress || 'Đang tải ảnh…'}</p>}
        <div className="flex justify-end"><button type="button" onClick={() => void upload()} className="min-h-11 px-5 rounded bg-[#F4B400] font-bold">{pending ? 'Đang tải…' : 'Tiếp tục'}</button></div>
      </fieldset>
    </div>
  </EditorDialog>;
}

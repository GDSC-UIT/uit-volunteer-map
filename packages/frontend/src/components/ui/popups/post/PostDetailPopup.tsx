import { useId, useState } from "react";
import Dialog from "@/components/ui/Dialog";
interface Props {
  imageUrls?: string[];
  onBack?: () => void;
  onSubmit?: () => void;
  onClose?: () => void;
  open?: boolean;
}
export default function PostDetailPopup({ imageUrls = [], onBack, onSubmit, onClose, open = true }: Props) {
  const id = useId();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  return (
    <Dialog title="Nội dung bài viết" open={open} onClose={onClose ?? onBack} className="w-190 rounded-xl bg-[#F5F5F5]">
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-1/2 bg-[#E1E4E8] flex items-center justify-center">
          {imageUrls.length > 0 ? <img src={imageUrls[0]} alt="Ảnh đã chọn cho bài viết" className="w-full h-48 sm:h-105 object-cover" />
            : <div className="h-48 flex items-center">Chưa có ảnh xem trước</div>}
        </div>
        <div className="sm:w-1/2 min-w-0 bg-[#FFF5DA] p-5 flex flex-col">
          <label htmlFor={`${id}-title`} className="text-sm font-semibold">Tiêu đề</label>
          <input id={`${id}-title`} value={title} onChange={event => setTitle(event.target.value)}
            placeholder="Nhập tiêu đề..." className="min-w-0 bg-transparent text-lg font-bold mb-2" />
          <label htmlFor={`${id}-content`} className="text-sm font-semibold">Nội dung bài viết</label>
          <textarea id={`${id}-content`} value={content} onChange={event => setContent(event.target.value)}
            maxLength={3000} aria-describedby={`${id}-count`} placeholder="Nội dung bài viết..."
            className="min-h-28 flex-1 resize-y bg-transparent text-sm" />
          <div id={`${id}-count`} className="text-right text-xs text-gray-700 mb-2">{content.length} / 3000 ký tự</div>
          <div className="flex flex-wrap gap-2 mb-4">
            <label className="text-xs">Tỉnh/Thành<select className="block border px-2 py-2 rounded"><option>Tỉnh/Thành</option></select></label>
            <label className="text-xs">Phường/Xã<select className="block border px-2 py-2 rounded"><option>Phường/Xã</option></select></label>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button onClick={onClose ?? onBack} className="text-sm underline px-2 py-3">Hủy</button>
            <button onClick={onBack} className="text-sm underline px-2 py-3">Quay lại</button>
            <button onClick={onSubmit} className="bg-[#F4B400] text-black text-sm px-4 py-3 rounded">Đăng</button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

import { useRef } from "react";

interface Props {
  onNext?: () => void;
  onClose?: () => void;
}

export default function PostCreatePopup({ onNext, onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[360px] rounded-xl overflow-hidden bg-[#1F2329] text-white">
        {/* Header */}
        <div className="bg-[#C4161C] text-center py-2 font-bold">
          Tạo bài viết
        </div>

        {/* Content */}
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="text-gray-300 text-sm">
            Thả tệp vào đây
          </div>

          {/* Hidden input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                console.log("Selected files:", files);
                onNext?.(); // ✅ dùng onNext → hết lỗi lint
              }
            }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#F4B400] text-black text-sm font-bold px-4 py-2 rounded"
          >
            Chọn tệp từ máy
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-4 pb-3">
          <button
            onClick={onClose}
            className="text-xs underline"
          >
            Huỷ
          </button>
        </div>
      </div>
    </div>
  );
}

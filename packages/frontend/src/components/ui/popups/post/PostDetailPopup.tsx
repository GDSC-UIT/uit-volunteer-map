interface Props {
  imageUrls?: string[];
  onBack?: () => void;
  onSubmit?: () => void;
}

export default function PostDetailPopup({
  imageUrls = [],
  onBack,
  onSubmit,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-190 h-105 rounded-xl overflow-hidden bg-[#F5F5F5] flex">
        {/* Preview */}
        <div className="w-1/2 bg-[#E1E4E8] flex items-center justify-center">
          {imageUrls.length > 0 ? (
            <img
              src={imageUrls[0]}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-64 h-64 bg-gray-300">Preview</div>
          )}
        </div>

        {/* Form */}
        <div className="w-1/2 bg-[#FFF5DA] p-5 flex flex-col">
          <input
            placeholder="Nhập tiêu đề..."
            className="bg-transparent text-lg font-bold outline-none mb-2"
          />

          <textarea
            placeholder="Nội dung bài viết..."
            className="flex-1 resize-none bg-transparent outline-none text-sm"
          />

          <div className="text-right text-xs text-gray-500 mb-2">0 / 3000</div>

          <div className="flex gap-2 mb-4">
            <select className="border text-xs px-2 py-1 rounded">
              <option>Tỉnh/Thành</option>
            </select>
            <select className="border text-xs px-2 py-1 rounded">
              <option>Phường/Xã</option>
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={onBack} className="text-xs underline">
              Quay lại
            </button>

            <button
              onClick={onSubmit}
              className="bg-[#F4B400] text-white text-sm px-4 py-1.5 rounded"
            >
              Đăng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

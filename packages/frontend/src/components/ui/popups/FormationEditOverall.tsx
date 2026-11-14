import Dialog from "@/components/ui/Dialog";
interface Props {
  onClose?: () => void;
}

export default function FormationEditOverall({ onClose }: Props) {
  return (
      <Dialog title="Chỉnh sửa thông tin đội hình" onClose={onClose} className="w-[720px] h-[420px] rounded-xl  bg-[#E5E5E5] flex flex-col">
        {/* Header */}
        <div className="h-10 shrink-0 bg-[#C4161C] flex items-center px-3">
          <button aria-label="Thêm ảnh đội hình" className="text-white text-lg">＋</button>
        </div>

        {/* Image area */}
        <div className="bg-[#DCDCDC] px-6 py-4">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-[#EAEAEA] flex items-center justify-center border"
              >
                ✕
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="flex-1 bg-white p-4">
          <label htmlFor="formation-description" className="block text-sm font-semibold">Mô tả đội hình</label>
          <textarea id="formation-description"
            placeholder="Nhập nội dung..."
            className="w-full min-h-24 resize-none outline-none text-sm"
          />
        </div>

        {/* Footer */}
        <div className="h-12 shrink-0 bg-[#C4161C] flex items-center justify-end px-4">
          <button onClick={onClose} className="px-4 py-2 underline text-sm text-white">Hủy</button>
          <button
            onClick={onClose}
            className="bg-[#F4B400] text-black text-sm font-bold px-4 py-1.5 rounded"
          >
            Hoàn tất
          </button>
        </div>
      </Dialog>
  );
}

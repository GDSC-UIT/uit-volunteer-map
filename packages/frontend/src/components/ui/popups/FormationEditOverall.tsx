interface Props {
  onClose?: () => void;
}

export default function FormationEditOverall({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[720px] h-[420px] rounded-xl overflow-hidden bg-[#E5E5E5] flex flex-col">
        {/* Header */}
        <div className="h-10 bg-[#C4161C] flex items-center px-3">
          <button className="text-white text-lg">＋</button>
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
          <textarea
            placeholder="Nhập nội dung..."
            className="w-full h-full resize-none outline-none text-sm"
          />
        </div>

        {/* Footer */}
        <div className="h-12 bg-[#C4161C] flex items-center justify-end px-4">
          <button
            onClick={onClose}
            className="bg-[#F4B400] text-white text-sm font-bold px-4 py-1.5 rounded"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
}

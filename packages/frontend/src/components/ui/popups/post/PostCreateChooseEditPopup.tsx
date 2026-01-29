interface Props {
  onNext?: () => void;
  onBack?: () => void;
}

export default function PostCreateChooseEditPopup({
  onNext,
  onBack,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[380px] h-[520px] rounded-xl overflow-hidden bg-[#1F2329] text-white flex flex-col">
        {/* Header */}
        <div className="bg-[#C4161C] flex items-center justify-between px-3 py-2">
          <button onClick={onBack}>＋</button>
          <div className="font-bold">Tạo bài viết</div>
          <button
            onClick={onNext}
            className="bg-[#F4B400] text-black text-xs px-3 py-1 rounded"
          >
            Chọn 4 files
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 bg-[#2A2F36] p-3 grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-gray-400/30 flex items-center justify-center text-xs"
            >
              ✕
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

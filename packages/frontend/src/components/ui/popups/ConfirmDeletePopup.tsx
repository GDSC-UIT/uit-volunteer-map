interface Props {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeletePopup({ onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[#FFF8EB] rounded-2xl w-[420px] shadow-lg overflow-hidden">

        {/* CONTENT */}
        <div className="py-8 px-6 text-center">
          <p className="font-bold text-lg">
            Bạn có chắc muốn xóa không ?
          </p>
        </div>

        {/* DIVIDER */}
        <div className="border-t border-gray-300" />

        {/* ACTIONS */}
        <div className="flex justify-center gap-6 p-5">

        <button
            onClick={onConfirm}
            className="
            w-[140px] h-[42px]
            bg-[#F2A900] text-black font-bold
            rounded-lg
            hover:scale-105 transition
            "
        >
            Có
        </button>

        <button
            onClick={onCancel}
            className="
            w-[140px] h-[42px]
            bg-white text-black font-bold
            rounded-lg
            hover:scale-105 transition
            "
        >
            Không
        </button>

        </div>
      </div>
    </div>
  );
}

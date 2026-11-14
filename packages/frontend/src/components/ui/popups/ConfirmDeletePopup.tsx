import Dialog from "@/components/ui/Dialog";
interface Props {
  itemName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeletePopup({ onConfirm, onCancel, itemName = "bài đăng này" }: Props) {
  return (
      <Dialog title="Xóa bài đăng" onClose={onCancel} className="bg-[#FFF8EB] rounded-2xl w-[420px] shadow-lg ">

        {/* CONTENT */}
        <div className="py-8 px-6 text-center">
          <p className="font-bold text-lg">
            Xóa {itemName}?
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
            Xóa bài đăng
        </button>

        <button
            data-dialog-initial-focus
            onClick={onCancel}
            className="
            w-[140px] h-[42px]
            bg-white text-black font-bold
            rounded-lg
            hover:scale-105 transition
            "
        >
            Hủy
        </button>

        </div>
      </Dialog>
  );
}

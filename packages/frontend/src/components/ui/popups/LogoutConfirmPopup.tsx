import Dialog from "@/components/ui/Dialog";
interface Props {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LogoutConfirmPopup({ onConfirm, onCancel }: Props) {
  return (
      <Dialog title="Đăng xuất" onClose={onCancel} className="bg-[#FFF6E5] rounded-2xl shadow-lg w-[420px]  pointer-events-auto">
        
        <div className="p-8 text-center font-semibold text-lg">
          Bạn có chắc muốn đăng xuất không?
        </div>

        <div className="flex justify-center gap-6 pb-6">
            <button
            onClick={() => {
                console.log("STEP 0: Popup button CLICKED");
                onConfirm();
            }}
            className="px-8 py-2 bg-[#F2A900] text-black font-semibold rounded-lg hover:opacity-90"
            >
            Đăng xuất
            </button>

          <button
            data-dialog-initial-focus
            onClick={onCancel}
            className="px-8 py-2 bg-white text-black font-semibold rounded-lg border border-gray-300 hover:bg-gray-100"
          >
            Hủy
          </button>
        </div>
      </Dialog>
  );
}

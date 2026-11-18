import EditorDialog from './EditorDialog';
import { useRef } from 'react';
interface Props { onConfirm: () => void; onCancel: () => void; }
export default function LogoutConfirmPopup({ onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return <EditorDialog title="Đăng xuất" onClose={onCancel} compact initialFocusRef={cancelRef}>
    <p className="p-6 text-center font-semibold text-lg">Bạn có chắc muốn đăng xuất không?</p>
    <div className="flex flex-wrap justify-center gap-6 px-4 pb-6">
      <button onClick={onConfirm} className="min-h-11 px-8 py-2 bg-[#F2A900] text-black font-semibold rounded-lg hover:opacity-90">Có</button>
      <button ref={cancelRef} onClick={onCancel} className="min-h-11 px-8 py-2 bg-white text-black font-semibold rounded-lg border border-gray-300 hover:bg-gray-100">Không</button>
    </div>
  </EditorDialog>;
}

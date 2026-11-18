import EditorDialog from './EditorDialog';

export default function ConfirmDeletePopup({ onConfirm, onCancel, pending = false, error, title }: {
  onConfirm: () => void; onCancel: () => void; pending?: boolean; error?: string; title: string;
}) {
  return <EditorDialog title="Xóa bài đăng" pending={pending} onClose={onCancel}>
    <div className="p-6 space-y-4">
      <p className="wrap-anywhere">Bạn có chắc muốn xóa bài đăng “{title}”?</p>
      {error && <p role="alert">{error}</p>}
      <div className="flex flex-wrap justify-end gap-3">
        <button disabled={pending} onClick={onCancel} className="min-h-11 px-5 rounded border">Không, giữ lại</button>
        <button disabled={pending} onClick={onConfirm} className="min-h-11 px-5 rounded bg-[#F4B400] font-bold">{pending ? 'Đang xóa…' : 'Có, xóa bài đăng'}</button>
      </div>
    </div>
  </EditorDialog>;
}

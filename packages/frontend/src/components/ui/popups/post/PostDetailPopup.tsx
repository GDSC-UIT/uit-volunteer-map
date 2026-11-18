import type { FormEvent, ReactNode } from 'react';
import EditorDialog from '../EditorDialog';

export interface PostDraft { title: string; content: string; latitude: string; longitude: string; }
export default function PostDetailPopup({ draft, onChange, imageUrls, editing, pending, error, onBack, onClose, onSubmit, blocked, recovery }: {
  draft: PostDraft; onChange: (draft: PostDraft) => void; imageUrls: string[]; editing: boolean;
  pending: boolean; error?: string; blocked?: string; recovery?: ReactNode; onBack: () => void; onClose: () => void; onSubmit: (event: FormEvent) => void;
}) {
  return <EditorDialog title={editing ? 'Chỉnh sửa bài đăng' : 'Nội dung bài đăng'} pending={pending} onClose={onClose}>
    <form onSubmit={onSubmit} className="grid md:grid-cols-2">
      <div className="bg-[#E1E4E8] p-4 flex flex-col gap-3">
        {imageUrls.length ? imageUrls.map((url, i) => <img key={url} src={url} alt={`Ảnh bài đăng ${i + 1}`} className="w-full max-h-64 object-contain rounded" />) : <p>Bài đăng không có ảnh.</p>}
        {editing && <p className="text-sm">Ảnh hiện có được giữ nguyên.</p>}
      </div>
      <fieldset disabled={pending} className="p-5 space-y-4 min-w-0">
        <label className="block font-bold">Tiêu đề<input required value={draft.title} onChange={e => onChange({ ...draft, title: e.target.value })} className="block min-h-11 p-2 w-full rounded border bg-white" /></label>
        <label className="block">Nội dung<textarea required value={draft.content} onChange={e => onChange({ ...draft, content: e.target.value })} className="block min-h-40 p-2 w-full rounded border bg-white" /></label>
        <p className="text-xs text-right">{draft.content.length} ký tự</p>
        <p className="text-sm">Tọa độ WGS84 (tùy chọn). Để trống cả hai nếu chưa có vị trí.</p>
        <div className="grid grid-cols-2 gap-3">
          <label>Vĩ độ<input type="number" step="any" min="-90" max="90" required={draft.longitude !== ''} value={draft.latitude} onChange={e => onChange({ ...draft, latitude: e.target.value })} className="block min-h-11 p-2 w-full rounded border bg-white" /></label>
          <label>Kinh độ<input type="number" step="any" min="-180" max="180" required={draft.latitude !== ''} value={draft.longitude} onChange={e => onChange({ ...draft, longitude: e.target.value })} className="block min-h-11 p-2 w-full rounded border bg-white" /></label>
        </div>
        {blocked && <p role="alert">{blocked}</p>}
        {error && <p role="alert" className="wrap-anywhere">{error}</p>}
        {recovery}
        <div className="flex flex-wrap justify-end gap-3">
          {!editing && <button type="button" onClick={onBack} className="min-h-11 px-3 border rounded">Quay lại ảnh</button>}
          <button disabled={!!blocked} className="min-h-11 px-4 rounded bg-[#F4B400] font-bold disabled:opacity-50">{pending ? 'Đang lưu…' : editing ? 'Lưu bài đăng' : 'Đăng bài'}</button>
        </div>
      </fieldset>
    </form>
  </EditorDialog>;
}

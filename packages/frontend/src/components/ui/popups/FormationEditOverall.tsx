import { useState } from 'react';
import type { TeamReadDto } from '@uit-volunteer-map/shared';
import { teamApi } from '@/api/team';
import { managementError } from '@/api/management';
import { useManagementMutation } from '@/hooks/useManagement';
import EditorDialog from './EditorDialog';

export default function FormationEditOverall({ team, onClose }: { team: TeamReadDto; onClose: () => void }) {
  const [name, setName] = useState(team.teamName);
  const [description, setDescription] = useState(team.description || '');
  const save = useManagementMutation(() => teamApi.updateOwn(team.teamId, { teamName: name.trim(), description: description.trim() || null }));
  const cancel = () => {
    if ((name === team.teamName && description === (team.description || '')) || window.confirm('Bỏ thay đổi đội hình đang soạn?')) onClose();
  };
  return <EditorDialog title="Chỉnh sửa đội hình" pending={save.isPending} onClose={cancel}>
    <form className="p-5 space-y-4" onSubmit={event => { event.preventDefault(); save.mutate(undefined, { onSuccess: onClose }); }}>
      <fieldset disabled={save.isPending} className="space-y-4">
        <label className="block">Tên đội hình<input required minLength={3} maxLength={100} value={name} onChange={event => setName(event.target.value)} className="block min-h-11 w-full border rounded p-2 bg-white" /></label>
        <label className="block">Mô tả<textarea value={description} onChange={event => setDescription(event.target.value)} className="block min-h-40 w-full border rounded p-2 bg-white" /></label>
        <p className="text-sm">Ban chỉ huy được phân công bởi quản trị viên.</p>
        {save.isError && <p role="alert">{managementError(save.error)}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={cancel} className="min-h-11 px-4 border rounded">Hủy</button>
          <button className="min-h-11 px-4 bg-[#F4B400] rounded font-bold">{save.isPending ? 'Đang lưu…' : 'Lưu đội hình'}</button>
        </div>
      </fieldset>
    </form>
  </EditorDialog>;
}

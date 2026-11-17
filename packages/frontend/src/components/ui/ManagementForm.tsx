import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import type { CampaignReadDto, CampaignWriteDto, AdminTeamReadDto, TeamWriteDto, TeamLeaderOptionDto } from '@uit-volunteer-map/shared';

const inputClass='block w-full border rounded px-3 py-2 min-h-11 mt-1';
export function ManagementFormFrame({title,pending,onSubmit,onCancel,children}:{title:string;pending:boolean;onSubmit:(event:FormEvent)=>void;onCancel:()=>void;children:ReactNode}) {
  return <form onSubmit={onSubmit} className="border rounded-md p-4 space-y-4 max-w-3xl" aria-label={title}>
    <h2 className="text-xl font-bold">{title}</h2>
    <fieldset disabled={pending} className="space-y-4 min-w-0">{children}
      <div className="flex flex-wrap gap-3"><button type="submit" className="border-2 border-cyan-400 px-4 py-2 rounded min-h-11">{pending?'Đang lưu…':'Lưu thay đổi'}</button><button type="button" onClick={onCancel} className="border px-4 py-2 rounded min-h-11">Hủy chỉnh sửa</button></div>
    </fieldset>
  </form>;
}
export function CampaignForm({initial,pending,onSave,onCancel}:{initial?:CampaignReadDto;pending:boolean;onSave:(data:CampaignWriteDto)=>void;onCancel:()=>void}) {
  const [name,setName]=useState(initial?.campaignName ?? ''), [description,setDescription]=useState(initial?.description ?? '');
  const [start,setStart]=useState(initial?.startDate.slice(0,10) ?? ''), [end,setEnd]=useState(initial?.endDate.slice(0,10) ?? '');
  return <ManagementFormFrame title={initial?'Sửa chiến dịch':'Thêm chiến dịch'} pending={pending} onCancel={onCancel} onSubmit={event=>{event.preventDefault();onSave({campaignName:name.trim(),description:description.trim()||null,startDate:start,endDate:end});}}>
    <label className="block">Tên chiến dịch<input required maxLength={200} value={name} onChange={e=>setName(e.target.value)} className={inputClass}/></label>
    <label className="block">Mô tả chiến dịch<textarea value={description} onChange={e=>setDescription(e.target.value)} rows={4} className={inputClass}/></label>
    <div className="grid sm:grid-cols-2 gap-4"><label>Ngày bắt đầu<input type="date" required value={start} onChange={e=>setStart(e.target.value)} className={inputClass}/></label><label>Ngày kết thúc<input type="date" required min={start||undefined} value={end} onChange={e=>setEnd(e.target.value)} className={inputClass}/></label></div>
  </ManagementFormFrame>;
}
export function TeamForm({initial,options,pending,onSave,onCancel}:{initial?:AdminTeamReadDto;options:TeamLeaderOptionDto[];pending:boolean;onSave:(data:TeamWriteDto)=>void;onCancel:()=>void}) {
  const [name,setName]=useState(initial?.teamName ?? ''),[description,setDescription]=useState(initial?.description ?? ''),[leader,setLeader]=useState(String(initial?.leaderId ?? ''));
  return <ManagementFormFrame title={initial?'Sửa đội hình':'Thêm đội hình'} pending={pending} onCancel={onCancel} onSubmit={event=>{event.preventDefault();onSave({teamName:name.trim(),description:description.trim()||null,leaderId:leader?Number(leader):null});}}>
    <label className="block">Tên đội hình<input required minLength={3} maxLength={100} value={name} onChange={e=>setName(e.target.value)} className={inputClass}/></label>
    <label className="block">Mô tả đội hình<textarea rows={4} value={description} onChange={e=>setDescription(e.target.value)} className={inputClass}/></label>
    <label className="block">Chỉ huy<select value={leader} onChange={e=>setLeader(e.target.value)} className={inputClass}>
      <option value="">Chưa phân công</option>
      {leader&&!options.some(option=>String(option.userId)===leader)&&<option value={leader}>Chỉ huy hiện tại không khả dụng (#{leader})</option>}
      {options.map(option=>{const busy=(option.assignedTeamId!==null&&option.assignedTeamId!==initial?.teamId)||option.commandedTeamIds.some(id=>id!==initial?.teamId);return <option key={option.userId} value={option.userId} disabled={busy}>{option.fullName}{busy?' — đang thuộc đội hình khác':''}</option>;})}
    </select></label>
    <p className="text-sm text-gray-600">Có thể lưu đội hình chưa phân công. Để chuyển chỉ huy, hãy gỡ phân công ở đội hình cũ trước.</p>
  </ManagementFormFrame>;
}

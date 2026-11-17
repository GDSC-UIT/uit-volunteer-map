import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { routeId } from '@/hooks/readState';
import type { AdminTeamReadDto, TeamWriteDto } from '@uit-volunteer-map/shared';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useManagementTeams, useLeaderOptions, useManagementMutation } from '@/hooks/useManagement';
import { managementApi, managementError } from '@/api/management';
import { TeamForm } from '@/components/ui/ManagementForm';
import ReadState from '@/components/ui/ReadState';

type Action={kind:'save';id?:number;campaignId:number;data:TeamWriteDto}|{kind:'delete';id:number};
export default function TeamManagementPage() {
  const campaigns=useCampaigns();const [params,setParams]=useSearchParams();
  const campaignId=routeId(params.get('campaignId') ?? undefined);
  const selected=campaigns.data?.find(item=>item.campaignId===campaignId) ?? campaigns.data?.[0];
  const teams=useManagementTeams(selected?.campaignId ?? 0),leaders=useLeaderOptions();
  const [search,setSearch]=useState(''),[notice,setNotice]=useState('');
  const [editing,setEditing]=useState<AdminTeamReadDto|'create'|null>(null),[confirm,setConfirm]=useState<number|null>(null);
  const mutation=useManagementMutation(async(action:Action)=>{
    if(action.kind==='delete')return managementApi.deleteTeam(action.id);
    return action.id?managementApi.updateTeam(action.id,action.data):managementApi.createTeam({...action.data,campaignId:action.campaignId});
  });
  function edit(value:AdminTeamReadDto|'create') {mutation.reset();setNotice('');setConfirm(null);setEditing(value);}
  async function save(data:TeamWriteDto) {
    if(!selected)return;
    try {await mutation.mutateAsync({kind:'save',campaignId:selected.campaignId,id:editing&&editing!=='create'?editing.teamId:undefined,data});setEditing(null);setNotice('Đã lưu đội hình.');} catch { /* Keep all entered fields on failure. */ }
  }
  async function remove(id:number) {try {await mutation.mutateAsync({kind:'delete',id});setConfirm(null);setNotice('Đã xóa đội hình; hồ sơ và tài khoản được giữ nguyên.');} catch { /* Keep confirmation for conflict feedback. */ }}
  const locked=editing!==null||mutation.isPending;
  const visible=(teams.data ?? []).filter(team=>team.teamName.toLocaleLowerCase('vi-VN').includes(search.toLocaleLowerCase('vi-VN')));
  return <div className="text-black space-y-6">
    <h1 className="text-3xl font-bold">QUẢN LÝ ĐỘI HÌNH</h1>
    <ReadState pending={campaigns.isPending} error={campaigns.error} label="chiến dịch" empty={campaigns.data?.length===0} onRetry={campaigns.refetch}/>
    {campaigns.data?.length===0&&<Link to="/admin/campaigns" className="underline">Tạo chiến dịch trước</Link>}
    {selected&&<>
      <label className="block max-w-xl">Chiến dịch<select value={selected.campaignId} disabled={locked} onChange={e=>{setParams({campaignId:e.target.value},{replace:true});setConfirm(null);setSearch('');setNotice('');mutation.reset();}} className="block w-full border rounded px-3 py-2 min-h-11 mt-1">{campaigns.data?.map(item=><option key={item.campaignId} value={item.campaignId}>{item.campaignName}</option>)}</select></label>
      <ReadState pending={leaders.isPending} error={leaders.error} label="chỉ huy" onRetry={leaders.refetch}/>
      <div className="flex flex-col sm:flex-row gap-4 max-w-3xl">
        <label className="flex-1 min-w-0">Tìm kiếm đội hình<input type="search" value={search} onChange={e=>setSearch(e.target.value)} className="block w-full border rounded px-3 py-2 min-h-11 mt-1"/></label>
        <button disabled={locked||!leaders.data||!teams.data} onClick={()=>edit('create')} className="self-start sm:self-end shrink-0 border-2 border-cyan-400 px-4 py-2 rounded min-h-11">Thêm đội hình</button>
      </div>
      {notice&&<p role="status">{notice}</p>}{mutation.isError&&<p role="alert">{managementError(mutation.error)}</p>}
      {editing&&<TeamForm key={editing==='create'?'create':editing.teamId} initial={editing==='create'?undefined:editing} options={leaders.data ?? []} pending={mutation.isPending} onSave={data=>void save(data)} onCancel={()=>{setEditing(null);mutation.reset();}}/>}
      <ReadState pending={teams.isPending} error={teams.error} label="đội hình" empty={teams.data?.length===0} onRetry={teams.refetch}/>
      {teams.isSuccess&&teams.data.length>0&&visible.length===0&&<p>Không có đội hình khớp tìm kiếm.</p>}
      <div className="space-y-4 max-w-3xl">{visible.map(team=><article key={team.teamId} className="bg-gray-200 rounded p-4 space-y-3">
        <h2 className="font-semibold text-xl wrap-anywhere">{team.teamName}</h2><p className="whitespace-pre-wrap wrap-anywhere">{team.description||'Chưa có mô tả.'}</p>
        <p>Chỉ huy: {team.leaderId===null?'Chưa phân công':leaders.data?.find(person=>person.userId===team.leaderId)?.fullName ?? `Không khả dụng (#${team.leaderId})`}</p>
        <div className="flex flex-wrap gap-3"><button disabled={locked||!leaders.data} onClick={()=>edit(team)} aria-label={`Sửa đội hình: ${team.teamName}`} className="border px-4 py-2 rounded min-h-11">Sửa</button><button disabled={locked} onClick={()=>{mutation.reset();setNotice('');setConfirm(team.teamId);}} aria-label={`Xóa đội hình: ${team.teamName}`} className="border border-red-700 px-4 py-2 rounded min-h-11 text-red-700">Xóa</button></div>
        {confirm===team.teamId&&<div role="group" aria-label={`Xác nhận xóa đội hình: ${team.teamName}`} className="border rounded p-4 space-y-3"><p>Xóa “{team.teamName}”? Đội hình còn bài đăng hoặc ảnh đính kèm sẽ không thể xóa. Hồ sơ và tài khoản sẽ được giữ nguyên.</p><button disabled={mutation.isPending} onClick={()=>void remove(team.teamId)} className="border border-red-700 px-4 py-2 rounded min-h-11 mr-3">Xác nhận xóa đội hình</button><button disabled={mutation.isPending} onClick={()=>{setConfirm(null);mutation.reset();}} className="border px-4 py-2 rounded min-h-11">Hủy xóa</button></div>}
      </article>)}</div>
    </>}
  </div>;
}

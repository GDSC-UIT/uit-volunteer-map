import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { routeId } from '@/hooks/readState';
import type { CampaignReadDto, CampaignWriteDto } from '@uit-volunteer-map/shared';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useManagementMutation } from '@/hooks/useManagement';
import { managementApi, managementError } from '@/api/management';
import { CampaignForm } from '@/components/ui/ManagementForm';
import ReadState from '@/components/ui/ReadState';

type Action={kind:'save';id?:number;data:CampaignWriteDto}|{kind:'delete';id:number};
export default function CampaignManagementPage() {
  const query=useCampaigns();
  const [params,setParams]=useSearchParams();
  const selectedId=routeId(params.get('campaignId') ?? undefined);
  const [editing,setEditing]=useState<CampaignReadDto|'create'|null>(null);
  const [confirm,setConfirm]=useState(false),[notice,setNotice]=useState('');
  const mutation=useManagementMutation(async(action:Action)=>{
    if(action.kind==='delete')return managementApi.deleteCampaign(action.id);
    return action.id?managementApi.updateCampaign(action.id,action.data):managementApi.createCampaign(action.data);
  });
  const campaigns=query.data ?? [], selected=campaigns.find(item=>item.campaignId===selectedId) ?? campaigns[0];
  const locked=editing!==null||mutation.isPending;
  function edit(value:CampaignReadDto|'create') {mutation.reset();setNotice('');setConfirm(false);setEditing(value);}
  async function save(data:CampaignWriteDto) {
    try {
      const result=await mutation.mutateAsync({kind:'save',id:editing&&editing!=='create'?editing.campaignId:undefined,data});
      if(result)setParams({campaignId:String(result.campaignId)},{replace:true});
      setEditing(null);setNotice('Đã lưu chiến dịch.');
    } catch { /* Mutation error stays visible; the form keeps its input. */ }
  }
  async function remove() {
    if(!selected)return;
    try {await mutation.mutateAsync({kind:'delete',id:selected.campaignId});setConfirm(false);setParams({},{replace:true});setNotice('Đã xóa chiến dịch.');} catch { /* Keep confirmation and feedback. */ }
  }
  return <div className="flex flex-col text-black gap-6">
    <h1 className="text-3xl font-bold">QUẢN LÝ CHIẾN DỊCH</h1>
    <ReadState pending={query.isPending} error={query.error} label="chiến dịch" empty={campaigns.length===0} onRetry={query.refetch}/>
    {query.data&&<>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4 lg:gap-10" aria-label="Chọn chiến dịch">
          {campaigns.map(item=><button key={item.campaignId} disabled={locked} aria-pressed={selected?.campaignId===item.campaignId} onClick={()=>{setParams({campaignId:String(item.campaignId)},{replace:true});setConfirm(false);mutation.reset();setNotice('');}} className={`min-h-11 pb-2 text-sm wrap-anywhere ${selected?.campaignId===item.campaignId?'font-semibold border-b-2 border-black':'text-gray-600'}`}>{item.campaignName}</button>)}
        </div>
        <button disabled={locked} onClick={()=>edit('create')} className="shrink-0 border-2 border-cyan-400 px-4 py-2 rounded min-h-11">Thêm chiến dịch</button>
      </div>
      {notice&&<p role="status">{notice}</p>}
      {mutation.isError&&<p role="alert">{managementError(mutation.error)}</p>}
      {editing?<CampaignForm key={editing==='create'?'create':editing.campaignId} initial={editing==='create'?undefined:editing} pending={mutation.isPending} onSave={data=>void save(data)} onCancel={()=>{setEditing(null);mutation.reset();}}/>:selected&&<section className="space-y-4 max-w-3xl">
        <h2 className="text-xl font-semibold wrap-anywhere">{selected.campaignName}</h2>
        <p>{selected.startDate} — {selected.endDate}</p>
        <div><h3 className="font-semibold mb-2">Mô tả chung</h3><p className="bg-gray-100 rounded-md p-4 whitespace-pre-wrap wrap-anywhere">{selected.description||'Chưa có mô tả.'}</p></div>
        {selected.attachments.map(image=><img key={image.attachmentId} src={image.imageUrl} alt={selected.campaignName} className="max-w-full max-h-64 object-contain rounded"/>)}
        <div className="flex flex-wrap gap-3"><button disabled={mutation.isPending} onClick={()=>edit(selected)} className="border px-4 py-2 rounded min-h-11">Sửa chiến dịch</button><button disabled={mutation.isPending} onClick={()=>{mutation.reset();setNotice('');setConfirm(true);}} className="border border-red-700 text-red-700 px-4 py-2 rounded min-h-11">Xóa chiến dịch</button></div>
        {confirm&&<div role="group" aria-label="Xác nhận xóa chiến dịch" className="border rounded p-4 space-y-3">
          <p>Xóa “{selected.campaignName}”? Chiến dịch còn đội hình hoặc ảnh đính kèm sẽ không thể xóa.</p>
          <button disabled={mutation.isPending} onClick={()=>void remove()} className="border border-red-700 px-4 py-2 rounded min-h-11 mr-3">Xác nhận xóa chiến dịch</button><button disabled={mutation.isPending} onClick={()=>{setConfirm(false);mutation.reset();}} className="border px-4 py-2 rounded min-h-11">Hủy xóa</button>
        </div>}
      </section>}
    </>}
  </div>;
}

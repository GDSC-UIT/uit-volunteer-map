import { useState } from 'react';
import { Link } from 'react-router';
import type { CreateLeaderAccountDto, UpdateLeaderAccountDto, LeaderAccountReadDto } from '@uit-volunteer-map/shared';
import { useLeaderAccounts, useManagementMutation } from '@/hooks/useManagement';
import { managementApi, managementError } from '@/api/management';
import LeaderAccountForm from '@/components/ui/LeaderAccountForm';
import ReadState from '@/components/ui/ReadState';

type Action={kind:'create';data:CreateLeaderAccountDto}|{kind:'update';id:number;data:UpdateLeaderAccountDto}|{kind:'deactivate';id:number};
export default function AccountManagementPage() {
  const query=useLeaderAccounts();
  const [search,setSearch]=useState(''),[status,setStatus]=useState('all'),[notice,setNotice]=useState('');
  const [editing,setEditing]=useState<LeaderAccountReadDto|'create'|null>(null),[confirm,setConfirm]=useState<LeaderAccountReadDto|null>(null);
  const mutation=useManagementMutation(async(action:Action)=>action.kind==='create'?managementApi.createAccount(action.data):action.kind==='update'?managementApi.updateAccount(action.id,action.data):managementApi.deactivateAccount(action.id));
  const locked=editing!==null||mutation.isPending;
  const visible=(query.data ?? []).filter(account=>
    (status==='all'||account.active===(status==='active'))
    && [account.username,account.profile?.fullName,account.profile?.email,account.profile?.mssv,account.team?.teamName,account.team?.campaignName].filter(Boolean).join(' ').toLocaleLowerCase('vi-VN').includes(search.toLocaleLowerCase('vi-VN')));
  function edit(value:LeaderAccountReadDto|'create'){mutation.reset();setNotice('');setConfirm(null);setEditing(value);}
  async function save(action:Action){
    try {
      await mutation.mutateAsync(action);setEditing(null);setConfirm(null);
      setNotice(action.kind==='create'?'Đã tạo tài khoản và hồ sơ. Có thể phân công tại Quản lý Đội hình.':action.kind==='update'?'Đã cập nhật tài khoản và hồ sơ.':'Đã vô hiệu hóa tài khoản và gỡ phân công. Hồ sơ và bài đăng được giữ nguyên.');
    } catch { /* Keep entered values/confirmation until success or explicit cancel. */ }
  }
  return <div className="text-black space-y-6">
    <div><h1 className="text-3xl font-bold mb-2">QUẢN LÝ CHỈ HUY</h1><p className="text-sm text-gray-600">Danh sách tài khoản và hồ sơ chỉ huy theo chiến dịch, đội hình.</p></div>
    <ReadState pending={query.isPending} error={query.error} label="tài khoản chỉ huy" empty={query.data?.length===0} onRetry={query.refetch}/>
    {query.data&&<>
      <div className="flex flex-wrap items-end gap-4">
        <label className="block flex-1 min-w-0">Tìm kiếm chỉ huy<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tên tài khoản, họ tên, chiến dịch, đội hình" className="block w-full border rounded px-3 py-2 min-h-11 mt-1"/></label>
        <label className="block">Trạng thái<select value={status} onChange={e=>setStatus(e.target.value)} className="block border rounded px-3 py-2 min-h-11 mt-1"><option value="all">Tất cả</option><option value="active">Đang hoạt động</option><option value="inactive">Đã vô hiệu hóa</option></select></label>
        <button disabled={locked} onClick={()=>edit('create')} className="border-2 border-cyan-400 px-4 py-2 rounded min-h-11">Thêm tài khoản</button>
      </div>
      {notice&&<p role="status">{notice}</p>}
      {mutation.isError&&<p role="alert">{managementError(mutation.error)}</p>}
      {editing&&<LeaderAccountForm key={editing==='create'?'create':editing.accId} initial={editing==='create'?undefined:editing} pending={mutation.isPending} onCreate={data=>void save({kind:'create',data})} onUpdate={(id,data)=>void save({kind:'update',id,data})} onCancel={()=>{setEditing(null);mutation.reset();}}/>}
      {confirm&&<div role="group" aria-label={`Xác nhận vô hiệu hóa: ${confirm.username}`} className="border rounded p-4 space-y-3 max-w-3xl">
        <p>Vô hiệu hóa “{confirm.username}” và gỡ phân công chỉ huy? Tài khoản sẽ không đăng nhập được; hồ sơ và bài đăng được giữ nguyên.</p>
        <button disabled={mutation.isPending} onClick={()=>void save({kind:'deactivate',id:confirm.accId})} className="border border-red-700 text-red-700 rounded px-4 py-2 min-h-11 mr-3">Xác nhận vô hiệu hóa</button><button autoFocus disabled={mutation.isPending} onClick={()=>{setConfirm(null);mutation.reset();}} className="border rounded px-4 py-2 min-h-11">Hủy vô hiệu hóa</button>
      </div>}
      {query.data.length>0&&visible.length===0&&<p>Không có tài khoản khớp tìm kiếm hoặc trạng thái.</p>}
      <p className="text-xs text-gray-600 sm:hidden">Cuộn ngang để xem đầy đủ danh sách và thao tác.</p>
      <div role="region" aria-label="Danh sách tài khoản" tabIndex={0} className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-[#023A54]">
        <table className="w-full min-w-[760px] text-sm text-left"><caption className="sr-only">Tài khoản chỉ huy và phân công hiện tại</caption>
          <thead><tr>{['STT','Tài khoản / Hồ sơ','Chiến dịch / Đội hình','Trạng thái','Thao tác'].map(title=><th key={title} scope="col" className="p-3 border-b font-semibold">{title}</th>)}</tr></thead>
          <tbody>{visible.map((account,index)=><tr key={account.accId} aria-label={`Tài khoản ${account.username}`} className="align-top border-b">
            <td className="p-3">{index+1}</td><td className="p-3 wrap-anywhere"><p className="font-semibold">{account.username}</p><p>{account.profile?.fullName || 'Chưa có hồ sơ'}</p><p>{account.profile?.email}</p>{account.profile&&!account.profile.active&&<p>Hồ sơ đã lưu trữ</p>}</td>
            <td className="p-3 wrap-anywhere">{account.team?<><p>{account.team.campaignName||'Chưa có chiến dịch'}</p><p>{account.team.teamName}{!account.team.active?' (không khả dụng)':''}</p></>:<p>Chưa phân công</p>}{account.commandedTeamIds.some(id=>id!==account.team?.teamId)&&<p>Có phân công cần kiểm tra.</p>}</td>
            <td className="p-3">{account.active?'Đang hoạt động':'Đã vô hiệu hóa'}</td>
            <td className="p-3 min-w-48"><div className="flex flex-wrap gap-2">
              <button disabled={locked||!account.active||!!account.profile&&!account.profile.active} onClick={()=>edit(account)} aria-label={`${account.profile?'Sửa tài khoản':'Bổ sung hồ sơ'}: ${account.username}`} className="border rounded px-3 py-2 min-h-11">{account.profile?'Sửa':'Bổ sung hồ sơ'}</button>
              <button disabled={locked||!account.active} onClick={()=>{mutation.reset();setNotice('');setConfirm(account);}} aria-label={`Vô hiệu hóa: ${account.username}`} className="border border-red-700 text-red-700 rounded px-3 py-2 min-h-11">Vô hiệu hóa</button>
              {account.active&&account.profile?.active&&<Link to={account.team?.campaignId?`/admin/teams?campaignId=${account.team.campaignId}`:'/admin/teams'} className="underline inline-flex items-center min-h-11">Phân công đội hình</Link>}
            </div></td>
          </tr>)}</tbody>
        </table>
      </div>
    </>}
  </div>;
}

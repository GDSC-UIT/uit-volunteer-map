import { useState } from 'react';
import type { CreateLeaderAccountDto, UpdateLeaderAccountDto, LeaderAccountReadDto } from '@uit-volunteer-map/shared';
import { ManagementFormFrame } from './ManagementForm';

interface Props {
  initial?:LeaderAccountReadDto;
  pending:boolean;
  onCreate:(data:CreateLeaderAccountDto)=>void;
  onUpdate:(id:number,data:UpdateLeaderAccountDto)=>void;
  onCancel:()=>void;
}
const field='block w-full border rounded px-3 py-2 min-h-11 mt-1';
export default function LeaderAccountForm({initial,pending,onCreate,onUpdate,onCancel}:Props) {
  const profile=initial?.profile,needsProfile=!profile;
  const [username,setUsername]=useState(initial?.username ?? ''),[password,setPassword]=useState('');
  const [fullname,setFullname]=useState(profile?.fullName ?? ''),[email,setEmail]=useState(profile?.email ?? '');
  const [mssv,setMssv]=useState(profile?.mssv ?? ''),[className,setClassName]=useState(profile?.class ?? ''),[phone,setPhone]=useState(profile?.phoneNumber ?? '');
  const [error,setError]=useState('');
  function save() {
    setError('');
    if(password&&new TextEncoder().encode(password).length>72){setError('Mật khẩu không được vượt quá 72 byte UTF-8.');return;}
    const values={fullname:fullname.trim(),email:email.trim(),mssv:mssv.trim(),class:className.trim(),phoneNumber:phone.trim()};
    if(!initial){onCreate({...values,username:username.trim(),password});return;}
    const changes:UpdateLeaderAccountDto={};
    if(!profile||values.fullname!==profile.fullName)changes.fullname=values.fullname;
    if(!profile||values.email!==profile.email)changes.email=values.email;
    if(!profile||values.mssv!==(profile.mssv ?? ''))changes.mssv=needsProfile?values.mssv:values.mssv||null;
    if(!profile||values.class!==(profile.class ?? ''))changes.class=needsProfile?values.class:values.class||null;
    if(!profile||values.phoneNumber!==(profile.phoneNumber ?? ''))changes.phoneNumber=needsProfile?values.phoneNumber:values.phoneNumber||null;
    if(password)changes.password=password;
    if(!Object.keys(changes).length){setError('Chưa có thay đổi để lưu.');return;}
    onUpdate(initial.accId,changes);
  }
  return <ManagementFormFrame title={!initial?'Thêm tài khoản':!profile?'Bổ sung hồ sơ chỉ huy':'Sửa tài khoản chỉ huy'} pending={pending} onCancel={onCancel} onSubmit={event=>{event.preventDefault();save();}}>
    {error&&<p role="alert">{error}</p>}
    <label className="block">Tên tài khoản<input autoFocus={!initial} required minLength={3} maxLength={100} autoComplete="off" readOnly={!!initial} value={username} onChange={e=>setUsername(e.target.value)} className={field}/></label>
    <label className="block">{initial?'Mật khẩu mới (không bắt buộc)':'Mật khẩu'}<input type="password" autoComplete="new-password" required={!initial} minLength={6} maxLength={72} value={password} onChange={e=>setPassword(e.target.value)} className={field}/></label>
    {initial&&<p className="text-sm text-gray-600">Để trống để giữ nguyên mật khẩu. Tên tài khoản đăng nhập được giữ nguyên.</p>}
    <label className="block">Họ và tên<input autoFocus={!!initial} required minLength={3} maxLength={200} value={fullname} onChange={e=>setFullname(e.target.value)} className={field}/></label>
    <label className="block">Email<input required type="email" autoComplete="off" value={email} onChange={e=>setEmail(e.target.value)} className={field}/></label>
    <p className="text-sm text-gray-600">Email tạo mới hoặc thay đổi phải thuộc @gm.uit.edu.vn.</p>
    <div className="grid sm:grid-cols-2 gap-4"><label>MSSV<input required={needsProfile} minLength={8} maxLength={8} value={mssv} onChange={e=>setMssv(e.target.value)} className={field}/></label><label>Lớp<input maxLength={15} value={className} onChange={e=>setClassName(e.target.value)} className={field}/></label></div>
    <label className="block">Số điện thoại<input type="tel" required={needsProfile} minLength={10} maxLength={30} value={phone} onChange={e=>setPhone(e.target.value)} className={field}/></label>
    <p className="text-sm text-gray-600">Phân công chỉ huy được thực hiện tại Quản lý Đội hình sau khi lưu hồ sơ.</p>
  </ManagementFormFrame>;
}

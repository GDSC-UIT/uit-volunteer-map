import { beforeEach, afterEach, it, expect } from 'vitest';
import { render, screen, cleanup, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route, Link } from 'react-router';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { STORAGE_KEYS, RoleEnum, type LeaderAccountReadDto, type TeamReadDto } from '@uit-volunteer-map/shared';
import client from './client';
import { teamKeys } from './queryKeys';
import AccountManagementPage from '@/pages/admin/AccountManagementPage';
import TeamPage from '@/pages/TeamPage';

const original=client.defaults.adapter;
let accounts:LeaderAccountReadDto[],calls:InternalAxiosRequestConfig[],failWrite:number,failReads:number;
let hold:Promise<void>|undefined,release:(()=>void)|undefined;
const makeProfile=(userId:number,name:string)=>({userId,fullName:name,mssv:null,class:null,email:`fixture-${userId}@gm.uit.edu.vn`,phoneNumber:null,active:true});
function publicTeam():TeamReadDto {return {teamId:10,campaignId:1,teamName:'Team A',description:null,imageUrl:null,attachments:[],leaders:accounts.filter(account=>account.active&&account.profile?.active&&account.team?.teamId===10).map(account=>({userId:account.profile!.userId,fullName:account.profile!.fullName,avatarUrl:null,role:'leader'}))};}
function respond(config:InternalAxiosRequestConfig,data:unknown,status=200){
 const response={config,status,statusText:'Test',headers:{},data:status===200?{success:true,data}:{success:false,error:status===409?'Email đã được sử dụng, kể cả hồ sơ lưu trữ.':'Synthetic server failure'}};
 if(status!==200)throw new AxiosError(response.data.error,undefined,config,undefined,response);return response;
}
beforeEach(()=>{
 calls=[];failWrite=0;failReads=0;hold=undefined;release=undefined;localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN,'synthetic-admin-token');
 accounts=[101,203,404,505].map((accId,index)=>({accId,username:['leader-a','orphan','disabled','archived'][index],role:RoleEnum.LEADER,active:accId!==404,createdAt:null,updatedAt:null,
  profile:accId===203?null:{...makeProfile(index+11,['Leader A','','Disabled Leader','Archived Leader'][index]),active:accId!==505},
  team:accId===101?{teamId:10,teamName:'Team A',campaignId:1,campaignName:'Campaign A',active:true}:null,commandedTeamIds:accId===101?[10]:[]}));
 client.defaults.adapter=async config=>{
  calls.push(config);const url=config.url!,method=config.method;
  if(method==='get'){
   if(url==='/accounts'){if(failReads-->0)return respond(config,null,500);return respond(config,structuredClone(accounts));}
   if(url==='/teams/10')return respond(config,publicTeam());if(url==='/posts')return respond(config,[]);
  }
  if(failWrite){const status=failWrite;failWrite=0;return respond(config,null,status);}
  if(hold)await hold;
  const data=typeof config.data==='string'?JSON.parse(config.data):config.data;
  if(method==='post'){
   const item:LeaderAccountReadDto={accId:901,username:data.username,role:RoleEnum.LEADER,active:true,createdAt:'2026-01-01',updatedAt:null,profile:{...makeProfile(99,data.fullname),mssv:data.mssv,class:data.class,email:data.email,phoneNumber:data.phoneNumber},team:null,commandedTeamIds:[]};accounts.push(item);return respond(config,structuredClone(item));
  }
  const account=accounts.find(item=>item.accId===Number(url.split('/').at(-1)))!;
  if(method==='delete'){account.active=false;account.team=null;account.commandedTeamIds=[];return respond(config,structuredClone(account));}
  if(method==='put'){
   account.profile ??= makeProfile(99,data.fullname);
   if(data.fullname!==undefined)account.profile.fullName=data.fullname;
   for(const key of ['email','mssv','class','phoneNumber'] as const)if(data[key]!==undefined)account.profile[key]=data[key];
   return respond(config,structuredClone(account));
  }
  return respond(config,null,404);
 };
});
afterEach(()=>{cleanup();client.defaults.adapter=original;localStorage.clear();});
function mount(){const queryClient=new QueryClient({defaultOptions:{queries:{staleTime:Infinity,retryDelay:0,gcTime:0}}});render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={['/admin/accounts']}><Link to="/campaign/1/team/10">Guest team</Link><Routes><Route path="/admin/accounts" element={<AccountManagementPage/>}/><Route path="/campaign/:campaignId/team/:teamId" element={<TeamPage/>}/></Routes></MemoryRouter></QueryClientProvider>);return queryClient;}
const user=()=>userEvent.setup();
async function createForm(){await user().click(await screen.findByRole('button',{name:'Thêm tài khoản'}));await user().type(screen.getByLabelText('Tên tài khoản'),'new-leader');await user().type(screen.getByLabelText('Mật khẩu',{exact:true}),'synthetic-password');await fillProfile();}
async function fillProfile(){await user().type(screen.getByLabelText('Họ và tên'),'New Leader');await user().type(screen.getByLabelText('Email'),'new@gm.uit.edu.vn');await user().type(screen.getByLabelText('MSSV'),'99000001');await user().type(screen.getByLabelText('Lớp'),'SE.01');await user().type(screen.getByLabelText('Số điện thoại'),'0900000000');}

it('renders actual identity/status records without a password column or fake rows',async()=>{
 mount();await screen.findByRole('row',{name:'Tài khoản leader-a'});expect(screen.queryByRole('columnheader',{name:'Mật khẩu'})).not.toBeInTheDocument();expect(within(screen.getByRole('row',{name:'Tài khoản disabled'})).getByText('Đã vô hiệu hóa')).toBeInTheDocument();expect(screen.getByText('Chưa có hồ sơ')).toBeInTheDocument();
});
it('searches names/team/campaign and filters account status',async()=>{
 mount();await screen.findByRole('row',{name:'Tài khoản leader-a'});await user().type(screen.getByLabelText('Tìm kiếm chỉ huy'),'Campaign A');expect(screen.queryByRole('row',{name:'Tài khoản disabled'})).not.toBeInTheDocument();await user().clear(screen.getByLabelText('Tìm kiếm chỉ huy'));
 await user().selectOptions(screen.getByRole('combobox',{name:'Trạng thái'}),'inactive');expect(screen.queryByRole('row',{name:'Tài khoản leader-a'})).not.toBeInTheDocument();expect(screen.getByRole('row',{name:'Tài khoản disabled'})).toBeInTheDocument();
});
it('creates an authenticated unassigned Leader/profile and clears the credential form on success',async()=>{
 mount();await createForm();expect(screen.getByLabelText('Mật khẩu',{exact:true})).toHaveAttribute('type','password');await user().click(screen.getByRole('button',{name:'Lưu thay đổi'}));await screen.findByRole('row',{name:'Tài khoản new-leader'});
 const call=calls.find(call=>call.method==='post')!;expect(call.headers.Authorization).toBe('Bearer synthetic-admin-token');const data=JSON.parse(call.data);expect(data.fullname).toBe('New Leader');expect(data).not.toHaveProperty('teamId');expect(data).not.toHaveProperty('roleId');expect(screen.queryByLabelText('Mật khẩu',{exact:true})).not.toBeInTheDocument();expect(screen.queryByText('synthetic-password')).not.toBeInTheDocument();
});
it('updates only changed fields, preserves untouched legacy email/password and refreshes cached Guest commander data',async()=>{
 accounts[0].profile!.email='LEGACY@EXAMPLE.TEST';const queryClient=mount();queryClient.setQueryData(teamKeys.detail(10),publicTeam());await user().click(await screen.findByRole('button',{name:'Sửa tài khoản: leader-a'}));expect(screen.getByLabelText('Mật khẩu mới (không bắt buộc)')).toHaveValue('');expect(screen.getByLabelText('Tên tài khoản')).toHaveAttribute('readonly');await user().clear(screen.getByLabelText('Họ và tên'));await user().type(screen.getByLabelText('Họ và tên'),'Updated Leader');
 await user().click(screen.getByRole('button',{name:'Lưu thay đổi'}));await screen.findByText('Đã cập nhật tài khoản và hồ sơ.');expect(JSON.parse(calls.find(call=>call.method==='put')!.data)).toEqual({fullname:'Updated Leader'});
 await user().click(screen.getByRole('link',{name:'Guest team'}));await screen.findByText('Updated Leader');expect(screen.queryByText('Leader A')).not.toBeInTheDocument();
});
it('sends an explicit password reset to AccountId without leaking profile/user IDs into the payload',async()=>{
 mount();await user().click(await screen.findByRole('button',{name:'Sửa tài khoản: leader-a'}));await user().type(screen.getByLabelText('Mật khẩu mới (không bắt buộc)'),'synthetic-reset-password');await user().click(screen.getByRole('button',{name:'Lưu thay đổi'}));await screen.findByText('Đã cập nhật tài khoản và hồ sơ.');const call=calls.find(call=>call.method==='put')!;expect(call.url).toBe('/accounts/101');expect(JSON.parse(call.data)).toEqual({password:'synthetic-reset-password'});
});
it('repairs a missing profile without requiring a team or a password reset',async()=>{
 mount();await user().click(await screen.findByRole('button',{name:'Bổ sung hồ sơ: orphan'}));await fillProfile();await user().click(screen.getByRole('button',{name:'Lưu thay đổi'}));await screen.findByText('Đã cập nhật tài khoản và hồ sơ.');const data=JSON.parse(calls.find(call=>call.method==='put')!.data);expect(data.fullname).toBe('New Leader');expect(data).not.toHaveProperty('password');expect(data).not.toHaveProperty('teamId');expect(data).not.toHaveProperty('username');
});
it.each([409,500])('retains entered profile and new password on rejected save %i',async status=>{
 mount();await user().click(await screen.findByRole('button',{name:'Sửa tài khoản: leader-a'}));await user().type(screen.getByLabelText('Họ và tên'),' retained');await user().type(screen.getByLabelText('Mật khẩu mới (không bắt buộc)'),'synthetic-retained-password');failWrite=status;await user().click(screen.getByRole('button',{name:'Lưu thay đổi'}));await screen.findByRole('alert');expect(screen.getByLabelText('Họ và tên')).toHaveValue('Leader A retained');expect(screen.getByLabelText('Mật khẩu mới (không bắt buộc)')).toHaveValue('synthetic-retained-password');
});
it('requires confirmation, retains inactive history and invalidates Guest team data after deactivation',async()=>{
 const queryClient=mount();queryClient.setQueryData(teamKeys.detail(10),publicTeam());await user().click(await screen.findByRole('button',{name:'Vô hiệu hóa: leader-a'}));expect(calls.some(call=>call.method==='delete')).toBe(false);await user().click(screen.getByRole('button',{name:'Xác nhận vô hiệu hóa'}));await screen.findByText('Đã vô hiệu hóa tài khoản và gỡ phân công. Hồ sơ và bài đăng được giữ nguyên.');const row=screen.getByRole('row',{name:'Tài khoản leader-a'});expect(within(row).getByText('Đã vô hiệu hóa')).toBeInTheDocument();expect(within(row).getByRole('button',{name:'Vô hiệu hóa: leader-a'})).toBeDisabled();expect(within(row).getByText('Leader A')).toBeInTheDocument();
 await user().click(screen.getByRole('link',{name:'Guest team'}));await screen.findByText('Chưa có thông tin ban chỉ huy.');
});
it('keeps confirmation and active status when deactivation fails',async()=>{
 mount();await user().click(await screen.findByRole('button',{name:'Vô hiệu hóa: leader-a'}));failWrite=409;await user().click(screen.getByRole('button',{name:'Xác nhận vô hiệu hóa'}));await screen.findByRole('alert');expect(screen.getByRole('group',{name:'Xác nhận vô hiệu hóa: leader-a'})).toBeInTheDocument();expect(within(screen.getByRole('row',{name:'Tài khoản leader-a'})).getByText('Đang hoạt động')).toBeInTheDocument();
});
it('announces read errors and retries without fabricated identities',async()=>{
 failReads=2;mount();expect(screen.getByRole('status')).toHaveTextContent('Đang tải');await screen.findByRole('alert');await user().click(screen.getByRole('button',{name:'Thử lại tài khoản chỉ huy'}));await screen.findByRole('row',{name:'Tài khoản leader-a'});
});
it('disables duplicate writes while pending',async()=>{
 mount();await createForm();hold=new Promise(resolve=>{release=resolve});await user().click(screen.getByRole('button',{name:'Lưu thay đổi'}));expect(await screen.findByRole('button',{name:'Đang lưu…'})).toBeDisabled();expect(screen.getByLabelText('Họ và tên')).toBeDisabled();await act(async()=>release!());await screen.findByRole('row',{name:'Tài khoản new-leader'});expect(calls.filter(call=>call.method==='post')).toHaveLength(1);
});
it('does not offer reactivation or silent restoration of archived profiles',async()=>{
 mount();expect(await screen.findByRole('button',{name:'Sửa tài khoản: archived'})).toBeDisabled();expect(screen.getByRole('button',{name:'Sửa tài khoản: disabled'})).toBeDisabled();expect(screen.queryByRole('button',{name:/Kích hoạt/})).not.toBeInTheDocument();
});
it('explains an unchanged edit instead of submitting an empty update',async()=>{
 mount();await user().click(await screen.findByRole('button',{name:'Sửa tài khoản: leader-a'}));await user().click(screen.getByRole('button',{name:'Lưu thay đổi'}));expect(await screen.findByRole('alert')).toHaveTextContent('Chưa có thay đổi');expect(calls.some(call=>call.method==='put')).toBe(false);
});

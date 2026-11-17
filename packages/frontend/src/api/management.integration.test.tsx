import { beforeEach, afterEach, it, expect } from 'vitest';
import { render, screen, cleanup, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route, Link } from 'react-router';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { STORAGE_KEYS, type CampaignReadDto, type AdminTeamReadDto, type TeamLeaderOptionDto } from '@uit-volunteer-map/shared';
import client from './client';
import { teamKeys } from './queryKeys';
import CampaignManagementPage from '@/pages/admin/CampaignManagementPage';
import TeamManagementPage from '@/pages/admin/TeamManagementPage';
import TeamPage from '@/pages/TeamPage';

const original=client.defaults.adapter;
let campaigns:CampaignReadDto[],teams:AdminTeamReadDto[],leaders:TeamLeaderOptionDto[],calls:InternalAxiosRequestConfig[];
let failWrite=0,failCampaignReads=0,releaseWrite:(()=>void)|undefined,holdWrite:Promise<void>|undefined;
function response(config:InternalAxiosRequestConfig,data:unknown,status=200) {
 const result={config,status,statusText:'Test',headers:{},data:status===200?{success:true,data}:{success:false,error:status===409?'Chỉ huy đang thuộc đội hình khác. Hãy gỡ phân công cũ trước.':'Synthetic server failure'}};
 if(status!==200)throw new AxiosError(result.data.error,undefined,config,undefined,result);
 return result;
}
beforeEach(()=>{
 calls=[];failWrite=0;failCampaignReads=0;holdWrite=undefined;releaseWrite=undefined;
 localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN,'synthetic-test-token');
 campaigns=[1,2,3].map(campaignId=>({campaignId,campaignName:`Campaign ${campaignId}`,description:`Description ${campaignId}`,startDate:'2026-01-01',endDate:'2026-02-01',attachments:[]}));
 leaders=[{userId:11,fullName:'Leader A',assignedTeamId:10,commandedTeamIds:[10]},{userId:22,fullName:'Leader B',assignedTeamId:20,commandedTeamIds:[20]},{userId:33,fullName:'Free Leader',assignedTeamId:null,commandedTeamIds:[]}];
 teams=[10,20].map((teamId,index)=>({teamId,campaignId:index+1,teamName:`Team ${teamId}`,description:`Team body ${teamId}`,leaderId:index?22:11,imageUrl:null,attachments:[],leaders:[{userId:index?22:11,fullName:index?'Leader B':'Leader A',avatarUrl:null,role:'leader'}]}));
 client.defaults.adapter=async config=>{
  calls.push(config);const url=config.url!,method=config.method;
  if(method==='get'){
   if(url==='/campaigns'){if(failCampaignReads-->0)return response(config,null,500);return response(config,structuredClone(campaigns));}
   if(url==='/admin/team-leaders')return response(config,structuredClone(leaders));
   if(url==='/admin/teams')return response(config,structuredClone(teams.filter(team=>team.campaignId===config.params.campaignId)));
   if(url.startsWith('/teams/'))return response(config,structuredClone(teams.find(team=>team.teamId===Number(url.split('/').at(-1)))));
   if(url==='/posts')return response(config,[]);
  }
  if(failWrite){const status=failWrite;failWrite=0;return response(config,null,status);}
  if(holdWrite)await holdWrite;
  const data=typeof config.data==='string'?JSON.parse(config.data):config.data;
  const id=Number(url.split('/').at(-1));
  if(url.startsWith('/campaigns')){
   if(method==='delete'){campaigns=campaigns.filter(item=>item.campaignId!==id);return response(config,undefined);}
   if(method==='post'){const item={...data,campaignId:4,attachments:[]};campaigns.push(item);return response(config,structuredClone(item));}
   const item=campaigns.find(item=>item.campaignId===id)!;Object.assign(item,data);return response(config,structuredClone(item));
  }
  if(url.startsWith('/teams')){
   if(method==='delete'){teams=teams.filter(item=>item.teamId!==id);return response(config,undefined);}
   const item=method==='post'?{...data,teamId:30,imageUrl:null,attachments:[],leaders:[]}:teams.find(item=>item.teamId===id)!;
   Object.assign(item,data);if(method==='post')teams.push(item);
   for(const leader of leaders){if(leader.assignedTeamId===item.teamId){leader.assignedTeamId=null;leader.commandedTeamIds=[];}}
   const owner=leaders.find(leader=>leader.userId===data.leaderId);
   item.leaders=owner?[{userId:owner.userId,fullName:owner.fullName,avatarUrl:null,role:'leader'}]:[];
   if(owner){owner.assignedTeamId=item.teamId;owner.commandedTeamIds=[item.teamId];}
   return response(config,structuredClone(item));
  }
  return response(config,null,404);
 };
});
afterEach(()=>{cleanup();client.defaults.adapter=original;localStorage.clear();});
function mount(path:string){
 const queryClient=new QueryClient({defaultOptions:{queries:{staleTime:Infinity,retryDelay:0,gcTime:0}}});
 render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={[path]}><Link to="/campaign/1/team/10">Guest team</Link><Routes><Route path="/admin/campaigns" element={<CampaignManagementPage/>}/><Route path="/admin/teams" element={<TeamManagementPage/>}/><Route path="/campaign/:campaignId/team/:teamId" element={<TeamPage/>}/></Routes></MemoryRouter></QueryClientProvider>);
 return queryClient;
}
const user=()=>userEvent.setup();
it('loads real campaign selection from URL and creates a campaign through the authenticated client',async()=>{
 mount('/admin/campaigns?campaignId=2');expect(await screen.findByRole('button',{name:'Campaign 2'})).toHaveAttribute('aria-pressed','true');
 await user().click(screen.getByRole('button',{name:'Thêm chiến dịch'}));
 await user().type(screen.getByLabelText('Tên chiến dịch'),'Created campaign');await user().type(screen.getByLabelText('Ngày bắt đầu'),'2026-03-01');await user().type(screen.getByLabelText('Ngày kết thúc'),'2026-04-01');
 await user().click(screen.getByRole('button',{name:'Lưu thay đổi'}));await screen.findByText('Đã lưu chiến dịch.');
 expect(screen.getByRole('button',{name:'Created campaign'})).toHaveAttribute('aria-pressed','true');
 expect(calls.find(call=>call.method==='post')?.headers.Authorization).toBe('Bearer synthetic-test-token');
});
it('retains campaign input after a failed update and saves it on retry',async()=>{
 mount('/admin/campaigns');await user().click(await screen.findByRole('button',{name:'Sửa chiến dịch'}));
 const input=screen.getByLabelText('Tên chiến dịch');await user().clear(input);await user().type(input,'Retained campaign');failWrite=500;
 await user().click(screen.getByRole('button',{name:'Lưu thay đổi'}));await screen.findByRole('alert');expect(input).toHaveValue('Retained campaign');
 await user().click(screen.getByRole('button',{name:'Lưu thay đổi'}));await screen.findByText('Đã lưu chiến dịch.');expect(screen.getByRole('button',{name:'Retained campaign'})).toBeInTheDocument();
});
it('requires explicit delete confirmation and preserves campaign on 409',async()=>{
 mount('/admin/campaigns');await user().click(await screen.findByRole('button',{name:'Xóa chiến dịch'}));expect(calls.some(call=>call.method==='delete')).toBe(false);failWrite=409;
 await user().click(screen.getByRole('button',{name:'Xác nhận xóa chiến dịch'}));await screen.findByRole('alert');expect(screen.getByRole('button',{name:'Campaign 1'})).toBeInTheDocument();
 await user().click(screen.getByRole('button',{name:'Hủy xóa'}));expect(screen.queryByRole('group',{name:'Xác nhận xóa chiến dịch'})).not.toBeInTheDocument();
});
it('deletes an empty campaign and refreshes the campaign list',async()=>{
 mount('/admin/campaigns?campaignId=3');await user().click(await screen.findByRole('button',{name:'Xóa chiến dịch'}));await user().click(screen.getByRole('button',{name:'Xác nhận xóa chiến dịch'}));await screen.findByText('Đã xóa chiến dịch.');expect(screen.queryByRole('button',{name:'Campaign 3'})).not.toBeInTheDocument();
});
it('scopes team reads by selected campaign and searches the current list',async()=>{
 mount('/admin/teams?campaignId=2');await screen.findByRole('heading',{name:'Team 20'});expect(screen.queryByRole('heading',{name:'Team 10'})).not.toBeInTheDocument();
 expect(calls.find(call=>call.url==='/admin/teams')?.params).toEqual({campaignId:2});await user().type(screen.getByLabelText('Tìm kiếm đội hình'),'absent');await screen.findByText('Không có đội hình khớp tìm kiếm.');
});
it('creates and deletes an unassigned team without fake default Leader IDs',async()=>{
 mount('/admin/teams?campaignId=3');await waitFor(()=>expect(screen.getByRole('button',{name:'Thêm đội hình'})).toBeEnabled());await user().click(screen.getByRole('button',{name:'Thêm đội hình'}));
 await user().type(screen.getByLabelText('Tên đội hình'),'Unassigned team');await user().click(screen.getByRole('button',{name:'Lưu thay đổi'}));await screen.findByText('Đã lưu đội hình.');
 expect(JSON.parse(calls.find(call=>call.method==='post')!.data)).toEqual({teamName:'Unassigned team',description:null,leaderId:null,campaignId:3});
 await user().click(screen.getByRole('button',{name:'Xóa đội hình: Unassigned team'}));await user().click(screen.getByRole('button',{name:'Xác nhận xóa đội hình'}));await screen.findByText('Đã xóa đội hình; hồ sơ và tài khoản được giữ nguyên.');expect(screen.queryByRole('heading',{name:'Unassigned team'})).not.toBeInTheDocument();
});
it('uses actual User IDs, disables foreign assignments and invalidates cached Guest team details',async()=>{
 const queryClient=mount('/admin/teams');queryClient.setQueryData(teamKeys.detail(10),structuredClone(teams[0]));
 await waitFor(()=>expect(screen.getByRole('button',{name:'Sửa đội hình: Team 10'})).toBeEnabled());await user().click(screen.getByRole('button',{name:'Sửa đội hình: Team 10'}));
 expect(screen.getByRole('option',{name:'Leader B — đang thuộc đội hình khác'})).toBeDisabled();
 await user().selectOptions(screen.getByLabelText('Chỉ huy'),'33');await user().clear(screen.getByLabelText('Tên đội hình'));await user().type(screen.getByLabelText('Tên đội hình'),'Renamed team');await user().click(screen.getByRole('button',{name:'Lưu thay đổi'}));await screen.findByText('Đã lưu đội hình.');
 expect(JSON.parse(calls.find(call=>call.method==='put')!.data).leaderId).toBe(33);
 await user().click(screen.getByRole('link',{name:'Guest team'}));await screen.findByRole('heading',{name:'Renamed team'});expect(await screen.findByText('Free Leader')).toBeInTheDocument();
});
it.each([409,500])('retains team fields and selection on mutation failure %i',async status=>{
 mount('/admin/teams');await waitFor(()=>expect(screen.getByRole('button',{name:'Sửa đội hình: Team 10'})).toBeEnabled());await user().click(screen.getByRole('button',{name:'Sửa đội hình: Team 10'}));
 await user().selectOptions(screen.getByLabelText('Chỉ huy'),'33');await user().type(screen.getByLabelText('Mô tả đội hình'),' retained');failWrite=status;
 await user().click(screen.getByRole('button',{name:'Lưu thay đổi'}));await screen.findByRole('alert');expect(screen.getByLabelText('Chỉ huy')).toHaveValue('33');expect(screen.getByLabelText('Mô tả đội hình')).toHaveValue('Team body 10 retained');
});
it('announces failed reads and recovers via retry instead of showing sample campaigns',async()=>{
 failCampaignReads=2;mount('/admin/campaigns');expect(screen.getByRole('status')).toHaveTextContent('Đang tải');await screen.findByRole('alert');await user().click(screen.getByRole('button',{name:'Thử lại chiến dịch'}));await screen.findByRole('button',{name:'Campaign 1'});
});
it('prevents repeated submits while the write is pending',async()=>{
 mount('/admin/teams?campaignId=3');await waitFor(()=>expect(screen.getByRole('button',{name:'Thêm đội hình'})).toBeEnabled());await user().click(screen.getByRole('button',{name:'Thêm đội hình'}));await user().type(screen.getByLabelText('Tên đội hình'),'Pending team');
 holdWrite=new Promise(resolve=>{releaseWrite=resolve});await user().click(screen.getByRole('button',{name:'Lưu thay đổi'}));expect(await screen.findByRole('button',{name:'Đang lưu…'})).toBeDisabled();expect(screen.getByLabelText('Tên đội hình')).toBeDisabled();
 await act(async()=>releaseWrite!());await screen.findByText('Đã lưu đội hình.');expect(calls.filter(call=>call.method==='post')).toHaveLength(1);
});

import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { render, screen, waitFor, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route, Link } from 'react-router';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { CampaignReadDto, TeamReadDto, PostDetailDto } from '@uit-volunteer-map/shared';
import apiClient from './client';
import { postKeys } from './queryKeys';
import CampaignPage from '@/pages/CampaignPage';
import TeamPage from '@/pages/TeamPage';
import HomePage from '@/pages/HomePage';
import PostPage from '@/pages/PostPage';
vi.mock('@/components/layouts/MapView',()=>({default:()=>null})); // R06 map excluded.
const campaigns:CampaignReadDto[]=[1,2,3].map(id=>({campaignId:id,campaignName:`Campaign ${id}`,description:`Description ${id}`,startDate:'2026-01-01',endDate:'2026-02-01',attachments:[]}));
const teams:TeamReadDto[]=[10,20].map((id,index)=>({teamId:id,campaignId:index+1,teamName:`Team ${id}`,description:`Team description ${id}`,imageUrl:null,attachments:[],leaders:[]}));
let posts:PostDetailDto[];
const original=apiClient.defaults.adapter;
let calls:InternalAxiosRequestConfig[];
let campaignFailures=0;
function respond(config:InternalAxiosRequestConfig,status:number,data:unknown) {
 const response={config,status,statusText:status===200?'OK':'Error',headers:{},data:status===200?{success:true,data}:{success:false,error:'Test rejection'}};
 if(status!==200)throw new AxiosError('Test rejection',undefined,config,undefined,response);
 return response;
}
beforeEach(()=>{
 calls=[];campaignFailures=0;
 posts=[100,101,200].map((id,index)=>({postId:id,title:`Post ${id}`,content:`Body ${id}`,createdAt:'2026-01-01',updatedAt:'2026-01-01',team:{teamId:index<2?10:20,teamName:index<2?'Team 10':'Team 20',campaignId:index<2?1:2},author:null,thumbnail:null,photos:[]}));
 apiClient.defaults.adapter=async config=>{
  calls.push(config);const url=config.url!;
  if(url==='/campaigns') {if(campaignFailures-->0)return respond(config,500,null);return respond(config,200,campaigns);}
  if(url.startsWith('/campaigns/')) {const data=campaigns.find(item=>item.campaignId===Number(url.split('/').at(-1)));return respond(config,data?200:404,data);}
  if(url==='/teams')return respond(config,200,teams.filter(item=>!config.params?.campaignId||item.campaignId===config.params.campaignId));
  if(url.startsWith('/teams/')){const data=teams.find(item=>item.teamId===Number(url.split('/').at(-1)));return respond(config,data?200:404,data);}
  if(url==='/posts')return respond(config,200,posts.filter(item=>(!config.params?.campaignId||item.team.campaignId===config.params.campaignId)&&(!config.params?.teamId||item.team.teamId===config.params.teamId)).map(({photos,...summary})=>({...summary,thumbnail:photos[0]??null})));
  if(url.startsWith('/posts/')){const data=posts.find(item=>item.postId===Number(url.split('/').at(-1)));return respond(config,data?200:404,data);}
  return respond(config,404,null);
 };
});
afterEach(()=>{cleanup();apiClient.defaults.adapter=original;});
function mount(path='/campaign/1'){
 const client=new QueryClient({defaultOptions:{queries:{retryDelay:0,gcTime:0}}});
 render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><nav><Link to="/campaign/1">Campaign A</Link><Link to="/campaign/2">Campaign B</Link></nav><Routes>
  <Route path="/" element={<HomePage/>}/><Route path="/campaign/:campaignId" element={<CampaignPage/>}/><Route path="/campaign/:campaignId/team/:teamId" element={<TeamPage/>}/>
  <Route path="/campaign/:campaignId/post/:postId" element={<PostPage/>}/><Route path="/campaign/:campaignId/team/:teamId/post/:postId" element={<PostPage/>}/>
 </Routes></MemoryRouter></QueryClientProvider>);
 return client;
}
it('loads campaign data from the common client and scopes cache/requests on navigation',async()=>{
 mount();await screen.findByRole('heading',{name:'Campaign 1'});await screen.findByText('Post 100');expect(screen.queryByText('Post 200')).not.toBeInTheDocument();
 expect(calls.find(item=>item.url==='/posts')?.params).toEqual({campaignId:1});expect(calls.find(item=>item.url==='/teams')?.params).toEqual({campaignId:1});
 await userEvent.setup().click(screen.getByRole('link',{name:'Campaign B'}));await screen.findByText('Post 200');expect(screen.queryByText('Post 100')).not.toBeInTheDocument();expect(screen.getByText('Description 2')).toBeInTheDocument();
});
it('opens the selected second post, then closes to its team list',async()=>{
 mount('/campaign/1/team/10');await screen.findByText('Team description 10');expect(screen.queryByText('Post 200')).not.toBeInTheDocument();
 await userEvent.setup().click(await screen.findByRole('link',{name:'Xem bài đăng: Post 101'}));await screen.findByRole('heading',{name:'Post 101'});expect(screen.getByText('Body 101')).toBeInTheDocument();
 await userEvent.setup().click(screen.getByRole('button',{name:'Quay lại danh sách'}));await screen.findByRole('heading',{name:'Team 10'});
 expect(calls.some(item=>item.url==='/posts'&&item.params?.teamId===10&&item.params?.campaignId===1)).toBe(true);
});
it('loads a direct post URL with ordered gallery data and close fallback',async()=>{
 posts[1].photos=[{photoId:1,title:null,imageUrl:'/a.png',uploadedAt:'2026-01-01',isFirstImage:true},{photoId:2,title:null,imageUrl:'/b.png',uploadedAt:'2026-01-01',isFirstImage:false}];
 mount('/campaign/1/post/101');await screen.findByRole('heading',{name:'Post 101'});expect(screen.getByRole('img',{name:'Post 101 — ảnh 1'})).toHaveAttribute('src','/a.png');
 await userEvent.setup().click(screen.getByRole('button',{name:'Ảnh tiếp theo'}));expect(screen.getByRole('img',{name:'Post 101 — ảnh 2'})).toHaveAttribute('src','/b.png');
 await userEvent.setup().click(screen.getByRole('button',{name:'Quay lại danh sách'}));await screen.findByRole('heading',{name:'Campaign 1'});
});
it.each(['/campaign/1/team/20','/campaign/1/post/200','/campaign/1/team/20/post/100'])('rejects wrong route context %s',async path=>{
 mount(path);await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('Không tìm thấy'));expect(screen.queryByText('Body 200')).not.toBeInTheDocument();
});
it.each(['/campaign/xtn','/campaign/999','/campaign/1/team/999','/campaign/1/post/999'])('shows missing/invalid resource %s',async path=>{
 mount(path);await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('Không tìm thấy'));expect(screen.queryByText('Post 100')).not.toBeInTheDocument();
});
it('shows valid empty campaign state instead of fake content',async()=>{
 mount('/campaign/3');await screen.findByText('Chưa có đội hình.');await screen.findByText('Chưa có bài đăng.');
});
it('announces loading and recoverable error then retries the actual API',async()=>{
 campaignFailures=2;mount('/');expect(screen.getByRole('status')).toHaveTextContent('Đang tải chiến dịch');
 await screen.findByRole('alert');await userEvent.setup().click(screen.getByRole('button',{name:'Thử lại chiến dịch'}));
 expect(await screen.findByRole('link',{name:'Campaign 1 2026-01-01 — 2026-02-01'})).toHaveAttribute('href','/campaign/1');
});
it('supports refetching all post lists/details through the common key prefix',async()=>{
 const client=mount();await screen.findByText('Post 100');posts[0].title='Updated post';
 await act(async()=>{await client.invalidateQueries({queryKey:postKeys.all});});expect(await screen.findByText('Updated post')).toBeInTheDocument();
});
it('shows all team attachments and real commander data without invented profiles',async()=>{
 const team=teams[0];
 const originalAttachments=team.attachments, originalLeaders=team.leaders;
 team.attachments=[1,2,3,4].map(id=>({attachmentId:id,imageUrl:`/team-${id}.png`,uploadedAt:'2026-01-01',position:id}));
 team.leaders=[{userId:11,fullName:'Chỉ huy từ API',avatarUrl:null,role:'leader'}];
 try {
  mount('/campaign/1/team/10');await screen.findByText('Chỉ huy từ API');
  expect(screen.getByRole('img',{name:'Team 10 — ảnh 4'})).toHaveAttribute('src','/team-4.png');
  expect(screen.queryByText('Chưa có thông tin ban chỉ huy.')).not.toBeInTheDocument();
 } finally {team.attachments=originalAttachments;team.leaders=originalLeaders;}
});

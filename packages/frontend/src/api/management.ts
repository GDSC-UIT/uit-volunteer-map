import { isAxiosError } from 'axios';
import type { ApiResponse, CampaignReadDto, CampaignWriteDto, TeamCreateDto, TeamWriteDto, AdminTeamReadDto, TeamLeaderOptionDto } from '@uit-volunteer-map/shared';
import apiClient from './client';
import { readData } from './read';
import type { LeaderAccountReadDto, CreateLeaderAccountDto, UpdateLeaderAccountDto } from '@uit-volunteer-map/shared';

async function write<T>(method:'post'|'put'|'delete',url:string,data?:unknown):Promise<T> {
  const response=await apiClient.request<ApiResponse<T>>({method,url,data});
  if(!response.data.success)throw new Error(response.data.error || 'Không thể lưu dữ liệu.');
  return response.data.data as T;
}
export const managementApi={
  accounts:(signal?:AbortSignal)=>readData<LeaderAccountReadDto[]>('/accounts',{signal}),
  createAccount:(data:CreateLeaderAccountDto)=>write<LeaderAccountReadDto>('post','/accounts',data),
  updateAccount:(id:number,data:UpdateLeaderAccountDto)=>write<LeaderAccountReadDto>('put',`/accounts/${id}`,data),
  deactivateAccount:(id:number)=>write<LeaderAccountReadDto>('delete',`/accounts/${id}`),
  teams:(campaignId:number,signal?:AbortSignal)=>readData<AdminTeamReadDto[]>('/admin/teams',{params:{campaignId},signal}),
  leaders:(signal?:AbortSignal)=>readData<TeamLeaderOptionDto[]>('/admin/team-leaders',{signal}),
  createCampaign:(data:CampaignWriteDto)=>write<CampaignReadDto>('post','/campaigns',data),
  updateCampaign:(id:number,data:CampaignWriteDto)=>write<CampaignReadDto>('put',`/campaigns/${id}`,data),
  deleteCampaign:(id:number)=>write<void>('delete',`/campaigns/${id}`),
  createTeam:(data:TeamCreateDto)=>write<AdminTeamReadDto>('post','/teams',data),
  updateTeam:(id:number,data:TeamWriteDto)=>write<AdminTeamReadDto>('put',`/teams/${id}`,data),
  deleteTeam:(id:number)=>write<void>('delete',`/teams/${id}`),
};
export function managementError(error:unknown):string {
  if(isAxiosError(error)) {
    if(error.response?.status===403)return 'Bạn không có quyền thực hiện thao tác này.';
    if(error.response?.status===404)return 'Dữ liệu không còn tồn tại. Hãy tải lại danh sách.';
    if(error.response?.status===400)return error.response.data?.message || error.message || 'Thông tin chưa hợp lệ.';
    if(error.message==='Campaign name already exists')return 'Tên chiến dịch đã tồn tại.';
    if(error.message==='Team name already exists')return 'Tên đội hình đã tồn tại, kể cả dữ liệu đã lưu trữ.';
    if(error.message==='Leader not found')return 'Chỉ huy không còn khả dụng. Hãy chọn người khác hoặc bỏ phân công.';
    if(error.response?.status===409)return error.message;
  }
  return 'Không thể lưu thay đổi. Nội dung đang nhập được giữ lại; vui lòng thử lại.';
}

import { Link, useParams, useNavigate, useLocation } from 'react-router';
import { usePost } from '@/hooks/usePosts';
import { routeId } from '@/hooks/readState';
import ReadState from '@/components/ui/ReadState';
import GuestPostOverPlay from '@/components/ui/popups/post/GuestPostOverPlay';
export default function PostPage() {
  const {campaignId,teamId,postId}=useParams();
  const campaign=routeId(campaignId), team=teamId===undefined?undefined:routeId(teamId), id=routeId(postId);
  const query=usePost(id);
  const navigate=useNavigate(), location=useLocation();
  const parent=team?`/campaign/${campaign}/team/${team}`:`/campaign/${campaign}`;
  if(!campaign||!id||team===0) return <p role="alert" className="p-8">Không tìm thấy bài đăng.</p>;
  if(!query.data||query.isError) return <div className="p-4"><ReadState pending={query.isPending} error={query.error} label="bài đăng" onRetry={query.refetch} /><Link to={parent} className="underline">Về danh sách</Link></div>;
  if(query.data.team.campaignId!==campaign||(team!==undefined&&query.data.team.teamId!==team)) return <p role="alert" className="p-8">Không tìm thấy bài đăng trong chiến dịch hoặc đội hình này.</p>;
  return <GuestPostOverPlay post={query.data} onClose={()=>location.state?.from===parent?navigate(-1):navigate(parent,{replace:true})} />;
}

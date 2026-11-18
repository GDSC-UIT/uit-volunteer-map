import { Link, useNavigate, useParams } from 'react-router';
import { useOwnTeam } from '@/hooks/useOwnTeam';
import { usePost } from '@/hooks/usePosts';
import { routeId } from '@/hooks/readState';
import ReadState from '@/components/ui/ReadState';
import GuestPostOverPlay from '@/components/ui/popups/post/GuestPostOverPlay';

export default function LeaderPostPage() {
  const own = useOwnTeam();
  const id = routeId(useParams().postId);
  const post = usePost(id);
  const navigate = useNavigate();
  if (!id) return <p role="alert" className="p-8">Không tìm thấy bài đăng.</p>;
  if (!own.data || own.isError) return <ReadState pending={own.isPending} error={own.error} label="đội hình được phân công" onRetry={own.refetch} />;
  if (!post.data || post.isError) return <ReadState pending={post.isPending} error={post.error} label="bài đăng" onRetry={post.refetch} />;
  if (post.data.team.teamId !== own.data.teamId) return <p role="alert" className="p-8">Bài đăng không thuộc đội hình được phân công. <Link to="/leader" className="underline">Về đội hình</Link></p>;
  return <><div className="max-w-6xl mx-auto px-4 pt-4"><Link to={`/leader/posts/${id}/edit`} className="inline-block min-h-11 py-3 px-4 rounded bg-[#F4B400] font-bold">Chỉnh sửa bài đăng</Link></div><GuestPostOverPlay post={post.data} onClose={() => navigate('/leader')} /></>;
}

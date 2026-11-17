import { useParams, Link, useLocation } from 'react-router';
import avatarFrame from '@/assets/background/avar_frame.svg';
import { PostItem } from '@/components/ui/PostItem';
import { useTeam } from '@/hooks/useTeams';
import { usePostsByTeam } from '@/hooks/usePosts';
import { routeId } from '@/hooks/readState';
import ReadState from '@/components/ui/ReadState';

export default function TeamPage() {
  const {campaignId,teamId}=useParams();
  const campaign=routeId(campaignId), id=routeId(teamId);
  const location=useLocation();
  const query=useTeam(id);
  const posts=usePostsByTeam(id,campaign);
  if(!campaign||!id) return <p role="alert" className="p-8">Không tìm thấy đội hình.</p>;
  if(!query.data||query.isError) return <ReadState pending={query.isPending} error={query.error} label="đội hình" onRetry={query.refetch} />;
  const team=query.data;
  if(team.campaignId!==campaign) return <p role="alert" className="p-8">Không tìm thấy đội hình trong chiến dịch này.</p>;
  const images=[...new Set([team.imageUrl,...team.attachments.map(image=>image.imageUrl)].filter((url):url is string=>!!url))];
  return <div className="py-8">
    <section className="max-w-4xl mx-auto px-4">
      <h1 className="text-center text-3xl font-black mb-8 wrap-anywhere">{team.teamName}</h1>
      <Link to={`/campaign/${campaign}`} className="underline">Về chiến dịch</Link>
    </section>
    <section className="max-w-4xl mx-auto px-4 my-8">
      <div className="bg-[#E6E6E6] rounded-xl p-6 flex flex-wrap gap-4 items-center justify-center">
        {images.length ? images.map((url,index)=><img key={url} src={url} alt={`${team.teamName} — ảnh ${index+1}`} className={index===0?'w-64 max-w-full rounded-xl':'w-32 max-w-full rounded-xl'} />) : <p>Chưa có ảnh đội hình.</p>}
      </div>
    </section>
    <section className="max-w-3xl mx-auto px-4 text-center mb-12">
      <p className="text-sm font-bold leading-relaxed text-black whitespace-pre-line wrap-anywhere">{team.description || 'Chưa có mô tả đội hình.'}</p>
    </section>
    <section className="max-w-4xl mx-auto px-4 mb-14">
      <h2 className="text-center font-black mb-6">Ban chỉ huy</h2>
      {!team.leaders.length && <p className="text-center">Chưa có thông tin ban chỉ huy.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {team.leaders.map(leader=><div key={leader.userId} className="text-center min-w-0">
          <div className="relative w-28 h-40 mx-auto mb-4">
            <div className="absolute inset-3 rounded-[9999px] overflow-hidden bg-[#DDE1E6]">
              {leader.avatarUrl ? <img src={leader.avatarUrl} alt={leader.fullName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span>Chưa có ảnh</span></div>}
            </div>
            <img src={avatarFrame} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
          </div>
          <div className="text-xs font-black">Chỉ huy</div><p className="text-sm font-bold wrap-anywhere">{leader.fullName}</p>
        </div>)}
      </div>
    </section>
    <section className="max-w-4xl mx-auto px-4">
      <h2 className="text-center font-black mb-6">Hoạt động</h2>
      <ReadState pending={posts.isPending} error={posts.error} label="bài đăng" empty={posts.data?.length===0} onRetry={posts.refetch} />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
        {posts.data?.map(post=><Link key={post.postId} to={`post/${post.postId}`} state={{from:location.pathname}} aria-label={`Xem bài đăng: ${post.title}`} className="min-w-0 hover:scale-105 transition"><PostItem post={post} /></Link>)}
      </div>
    </section>
  </div>;
}

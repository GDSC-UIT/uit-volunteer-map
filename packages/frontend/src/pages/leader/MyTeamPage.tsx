import { Link } from 'react-router';
import { useState } from 'react';
import type { PostSummaryDto } from '@uit-volunteer-map/shared';
import avatarFrame from '@/assets/background/avar_frame.svg';
import { PostItem } from '@/components/ui/PostItem';
import ReadState from '@/components/ui/ReadState';
import FormationEditOverall from '@/components/ui/popups/FormationEditOverall';
import ConfirmDeletePopup from '@/components/ui/popups/ConfirmDeletePopup';
import { useOwnTeam } from '@/hooks/useOwnTeam';
import { usePostsByTeam } from '@/hooks/usePosts';
import { useManagementMutation } from '@/hooks/useManagement';
import { postApi } from '@/api/post';
import { managementError } from '@/api/management';

export default function MyTeamPage() {
  const own = useOwnTeam();
  const team = own.data;
  const posts = usePostsByTeam(team?.teamId || 0, team?.campaignId);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState<PostSummaryDto | null>(null);
  const remove = useManagementMutation((id: number) => postApi.delete(id));
  if (!team) return <div className="p-8"><ReadState pending={own.isPending} error={own.error} label="đội hình được phân công" onRetry={own.refetch} /></div>;
  const images = [...new Set([team.imageUrl, ...team.attachments.map(image => image.imageUrl)].filter((url): url is string => !!url))];
  return <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
    {own.isError && <ReadState pending={false} error={own.error} label="đội hình" onRetry={own.refetch} />}
    <section>
      <h1 className="text-center text-3xl font-black wrap-anywhere mb-5">{team.teamName}</h1>
      <div className="flex flex-wrap justify-center gap-3">
        <button disabled={own.isError} onClick={() => setEditing(true)} className="min-h-11 px-4 rounded bg-[#F4B400] font-bold disabled:opacity-50">Chỉnh sửa đội hình</button>
        {!own.isError && <Link to="/leader/posts/new" className="min-h-11 px-4 py-3 rounded bg-[#C4161C] text-white font-bold">Tạo bài đăng</Link>}
        <Link to={`/campaign/${team.campaignId}/team/${team.teamId}`} className="min-h-11 py-3 underline">Xem trang công khai</Link>
      </div>
    </section>
    <section aria-label="Ảnh đội hình" className="rounded-xl bg-[#E6E6E6] p-5 flex flex-wrap justify-center items-center gap-4">
      {images.length ? images.map((url, index) => <img key={url} src={url} alt={`${team.teamName} — ảnh ${index + 1}`} className={index === 0 ? 'w-80 max-w-full rounded-xl' : 'w-40 max-w-full rounded-xl'} />) : <p>Chưa có ảnh đội hình.</p>}
    </section>
    <p className="whitespace-pre-line wrap-anywhere text-center font-bold">{team.description || 'Chưa có mô tả đội hình.'}</p>
    <section>
      <h2 className="font-black text-xl text-center mb-6">Ban chỉ huy</h2>
      {!team.leaders.length && <p className="text-center">Chưa có thông tin ban chỉ huy.</p>}
      <div className="flex flex-wrap justify-center gap-8">
        {team.leaders.map(leader => <div key={leader.userId} className="text-center w-44 max-w-full">
          <div className="relative w-28 h-40 mx-auto">
            <div className="absolute inset-3 rounded-[9999px] overflow-hidden bg-[#DDE1E6] flex items-center justify-center">
              {leader.avatarUrl ? <img src={leader.avatarUrl} alt={leader.fullName} className="w-full h-full object-cover" /> : <span className="text-xs">Chưa có ảnh</span>}
            </div>
            <img src={avatarFrame} alt="" className="absolute inset-0 w-full h-full pointer-events-none" />
          </div>
          <p className="font-bold wrap-anywhere">{leader.fullName}</p><p>Chỉ huy</p>
        </div>)}
      </div>
    </section>
    <section>
      <h2 className="text-center text-xl font-black mb-6">Hoạt động</h2>
      <ReadState pending={posts.isPending} error={posts.error} label="bài đăng" empty={posts.data?.length === 0} onRetry={posts.refetch} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.data?.map(post => <article key={post.postId} className="min-w-0">
          <Link to={`/leader/posts/${post.postId}`} aria-label={`Xem bài đăng: ${post.title}`} className="block rounded-3xl focus-visible:outline-4 focus-visible:outline-[#C4161C]"><PostItem post={post} /></Link>
          <div className="flex flex-wrap gap-3 mt-3">
            {!own.isError && <Link to={`/leader/posts/${post.postId}/edit`} aria-label={`Sửa bài đăng: ${post.title}`} className="min-h-11 px-4 py-3 rounded border bg-[#FFF5DA]">Sửa</Link>}
            <button disabled={own.isError} onClick={() => { remove.reset(); setDeleting(post); }} aria-label={`Xóa bài đăng: ${post.title}`} className="min-h-11 px-4 rounded border bg-[#FFF5DA]">Xóa</button>
          </div>
        </article>)}
      </div>
    </section>
    {editing && <FormationEditOverall team={team} onClose={() => setEditing(false)} />}
    {deleting && <ConfirmDeletePopup title={deleting.title} pending={remove.isPending} error={remove.isError ? managementError(remove.error) : undefined} onCancel={() => setDeleting(null)} onConfirm={() => remove.mutate(deleting.postId, { onSuccess: () => setDeleting(null) })} />}
  </div>;
}

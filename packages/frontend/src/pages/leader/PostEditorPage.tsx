import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { isPostCoordinates, type PostDetailDto, type TeamReadDto } from '@uit-volunteer-map/shared';
import { postApi } from '@/api/post';
import { managementError } from '@/api/management';
import { postKeys } from '@/api/queryKeys';
import { useOwnTeam } from '@/hooks/useOwnTeam';
import { usePost } from '@/hooks/usePosts';
import { useManagementMutation } from '@/hooks/useManagement';
import { routeId } from '@/hooks/readState';
import ReadState from '@/components/ui/ReadState';
import PostCreatePopup from '@/components/ui/popups/post/PostCreatePopup';
import PostDetailPopup, { type PostDraft } from '@/components/ui/popups/post/PostDetailPopup';

export default function PostEditorPage({ editing = false }: { editing?: boolean }) {
  const id = routeId(useParams().postId);
  const own = useOwnTeam();
  const post = usePost(editing ? id : 0);
  if (editing && !id) return <p role="alert" className="p-8">Không tìm thấy bài đăng.</p>;
  if (!own.data) return <ReadState pending={own.isPending} error={own.error} label="đội hình được phân công" onRetry={own.refetch} />;
  if (editing && !post.data) return <ReadState pending={post.isPending} error={post.error} label="bài đăng" onRetry={post.refetch} />;
  return <Editor key={editing ? id : 'new'} team={own.data} post={editing ? post.data : undefined} readFailed={own.isError || (editing && post.isError)} />;
}

function Editor({ team, post, readFailed }: { team: TeamReadDto; post?: PostDetailDto; readFailed: boolean }) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const [initialTeam] = useState(team.teamId);
  const [initial] = useState<PostDraft>(() => ({
    title: post?.title || '', content: post?.content || '',
    latitude: post?.coordinates ? String(post.coordinates.latitude) : '',
    longitude: post?.coordinates ? String(post.coordinates.longitude) : '',
  }));
  const [draft, setDraft] = useState(initial);
  const [step, setStep] = useState<'images' | 'details'>(post ? 'details' : 'images');
  const [images, setImages] = useState<string[]>(post?.photos.map(photo => photo.imageUrl) || []);
  const [error, setError] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [mediaDirty, setMediaDirty] = useState(false);
  const blocked = initialTeam !== team.teamId || (post && post.team.teamId !== initialTeam)
    ? 'Phân công đội hình đã thay đổi hoặc bài đăng không thuộc đội hình này. Nội dung đang soạn được giữ lại; hãy về đội hình để kiểm tra.'
    : readFailed ? 'Chưa xác nhận được quyền truy cập hiện tại. Vui lòng tải lại dữ liệu trước khi lưu.' : undefined;
  const save = useManagementMutation(async () => {
    if (blocked) throw new Error(blocked);
    const coordinates = draft.latitude === '' && draft.longitude === '' ? null : { latitude: Number(draft.latitude), longitude: Number(draft.longitude) };
    if (!draft.title.trim() || !draft.content.trim()) throw new Error('Nhập tiêu đề và nội dung bài đăng.');
    if (coordinates && (draft.latitude === '' || draft.longitude === '' || !isPostCoordinates(coordinates))) throw new Error('Nhập đủ vĩ độ −90 đến 90 và kinh độ −180 đến 180.');
    const data = { title: draft.title.trim(), content: draft.content.trim(), coordinates };
    return post ? postApi.update(post.postId, data) : postApi.create({ ...data, teamId: initialTeam, photos: images.map((imageUrl, index) => ({ imageUrl, isFirstImage: index === 0 ? 1 : 0 })) });
  });
  const dirty = draft.title !== initial.title || draft.content !== initial.content || draft.latitude !== initial.latitude || draft.longitude !== initial.longitude || (!post && mediaDirty);
  // Browser reload/close warns about an unsaved editor. Drafts are never written to persistent storage.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const close = () => { if (!dirty || window.confirm('Bỏ bài đăng đang soạn?')) navigate('/leader'); };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (save.isPending || blocked || uncertain) return;
    setError('');
    save.mutate(undefined, {
      onSuccess: result => navigate(`/leader/posts/${result.postId}`, { replace: true }),
      onError: failure => {
        const ambiguous = !post && isAxiosError(failure) && (!failure.response || failure.response.status >= 500);
        if (ambiguous) {
          setUncertain(true);
          setError('Chưa xác nhận được kết quả tạo bài. Nội dung được giữ lại. Kiểm tra danh sách trước khi quyết định gửi lại để tránh tạo trùng.');
          void client.invalidateQueries({ queryKey: postKeys.all });
        } else setError(isAxiosError(failure) ? managementError(failure) : failure instanceof Error ? failure.message : managementError(failure));
      },
    });
  };
  if (post && post.team.teamId !== initialTeam) return <p role="alert" className="p-8">Bài đăng không thuộc đội hình được phân công. <Link to="/leader" className="underline">Về đội hình</Link></p>;
  return <>
    <div className="max-w-4xl mx-auto p-6"><h1 className="text-2xl font-bold">{post ? 'Chỉnh sửa bài đăng' : 'Tạo bài đăng'} — {team.teamName}</h1></div>
    {!post && <PostCreatePopup open={step === 'images'} onDirty={setMediaDirty} onClose={close} onComplete={urls => { setImages(urls); setStep('details'); }} />}
    {step === 'details' && <PostDetailPopup draft={draft} onChange={setDraft} imageUrls={images} editing={!!post} pending={save.isPending} error={error}
      blocked={blocked || (uncertain ? 'Hãy kiểm tra kết quả trước khi gửi lại.' : undefined)} onBack={() => setStep('images')} onClose={close} onSubmit={submit}
      recovery={uncertain && <div className="space-y-2">
        <a href="/leader" target="_blank" rel="noopener noreferrer" className="inline-block min-h-11 py-3 underline">Mở danh sách để kiểm tra</a>
        <button type="button" onClick={() => { if (window.confirm('Bạn đã kiểm tra danh sách và xác nhận cần gửi lại?')) { setUncertain(false); setError(''); } }} className="min-h-11 px-4 rounded border">Đã kiểm tra, cho phép gửi lại</button>
      </div>} />}
  </>;
}

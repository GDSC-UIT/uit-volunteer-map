import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { render, screen, cleanup, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route, Link } from 'react-router';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { STORAGE_KEYS, type TeamReadDto, type PostDetailDto } from '@uit-volunteer-map/shared';
import client from './client';
import { postKeys } from './queryKeys';
import { cloudinaryApi } from './cloudinary';
import { ownTeamKey } from '@/hooks/useOwnTeam';
import MyTeamPage from '@/pages/leader/MyTeamPage';
import LeaderPostPage from '@/pages/leader/LeaderPostPage';
import PostEditorPage from '@/pages/leader/PostEditorPage';
import PostPage from '@/pages/PostPage';

const original = client.defaults.adapter;
let team: TeamReadDto, posts: PostDetailDto[], calls: InternalAxiosRequestConfig[];
let failWrite: number, failOwn: boolean, hold: Promise<void> | undefined, release: (() => void) | undefined;
function respond(config: InternalAxiosRequestConfig, data: unknown, status = 200) {
  const response = { config, status, statusText: 'Test', headers: {}, data: status === 200 ? { success: true, data } : { success: false, error: 'Synthetic failure' } };
  if (status !== 200) throw new AxiosError('Synthetic failure', undefined, config, undefined, response);
  return response;
}
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value() { this.open = false; } });
  vi.stubGlobal('confirm', vi.fn(() => true));
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:fixture'), revokeObjectURL: vi.fn() }));
  team = { teamId: 10, campaignId: 1, teamName: 'Đội hình thật', description: 'Mô tả thật', imageUrl: null, attachments: [], leaders: [{ userId: 11, fullName: 'Chỉ huy A', avatarUrl: null, role: 'leader' }] };
  posts = [1, 2].map(postId => ({ postId, title: 'Bài ' + postId, content: 'Nội dung ' + postId, coordinates: null, createdAt: '2026-01-01', updatedAt: '2026-01-01', author: { userId: 11, fullName: 'Chỉ huy A', avatarUrl: null }, team: { teamId: postId === 1 ? 10 : 20, campaignId: 1, teamName: 'Đội hình thật' }, thumbnail: null, photos: [] }));
  calls = []; failWrite = 0; failOwn = false; hold = undefined; release = undefined;
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'synthetic-leader-token');
  client.defaults.adapter = async config => {
    calls.push(config);
    const url = config.url!, method = config.method;
    if (method === 'get') {
      if (url === '/leader/team') return respond(config, structuredClone(team), failOwn ? 404 : 200);
      if (url === '/posts') return respond(config, structuredClone(posts.filter(post => post.team.teamId === config.params.teamId)));
      if (url.startsWith('/posts/')) { const post = posts.find(item => item.postId === Number(url.split('/').at(-1))); return respond(config, structuredClone(post), post ? 200 : 404); }
    }
    if (failWrite) { const status = failWrite; failWrite = 0; return respond(config, null, status); }
    if (hold) await hold;
    const data = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    if (url === '/teams/10') { Object.assign(team, data); return respond(config, structuredClone(team)); }
    if (method === 'post' && url === '/posts') {
      const photos = data.photos.map((photo: { imageUrl: string; isFirstImage: number }, i: number) => ({ photoId: i + 1, imageUrl: photo.imageUrl, title: null, uploadedAt: '2026-01-01', isFirstImage: photo.isFirstImage === 1 }));
      const post: PostDetailDto = { ...posts[0], ...data, postId: 3, photos, thumbnail: photos[0] || null };
      posts.push(post); return respond(config, { postId: 3, rawEntityOnly: true });
    }
    const id = Number(url.split('/').at(-1));
    if (method === 'put') { Object.assign(posts.find(post => post.postId === id)!, data); return respond(config, { postId: id }); }
    if (method === 'delete') { posts = posts.filter(post => post.postId !== id); return respond(config, undefined); }
    return respond(config, null, 404);
  };
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); client.defaults.adapter = original; localStorage.clear(); });
function mount(path = '/leader') {
  const query = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retryDelay: 0, gcTime: 0 } } });
  render(<QueryClientProvider client={query}><MemoryRouter initialEntries={[path]}><Link to="/campaign/1/post/1">Public post</Link><Routes>
    <Route path="/leader" element={<MyTeamPage />} /><Route path="/leader/posts/new" element={<PostEditorPage />} />
    <Route path="/leader/posts/:postId" element={<LeaderPostPage />} /><Route path="/leader/posts/:postId/edit" element={<PostEditorPage editing />} />
    <Route path="/campaign/:campaignId/post/:postId" element={<PostPage />} />
  </Routes></MemoryRouter></QueryClientProvider>);
  return query;
}
const user = () => userEvent.setup();
async function fillNew() {
  await user().click(await screen.findByRole('button', { name: 'Tiếp tục' }));
  await user().type(screen.getByLabelText('Tiêu đề'), 'Bài mới');
  await user().type(screen.getByLabelText('Nội dung', { exact: true }), 'Nội dung mới');
}
it('resolves authenticated own team and scoped posts without fabricated commanders or rows', async () => {
  mount(); await screen.findByRole('heading', { name: team.teamName });
  await screen.findByRole('link', { name: 'Xem bài đăng: Bài 1' });
  expect(screen.queryByRole('link', { name: 'Xem bài đăng: Bài 2' })).not.toBeInTheDocument();
  expect(calls.find(call => call.url === '/leader/team')!.headers.Authorization).toBe('Bearer synthetic-leader-token');
  expect(calls.find(call => call.url === '/posts')!.params).toEqual({ teamId: 10, campaignId: 1 });
  expect(screen.getByRole('link', { name: 'Sửa bài đăng: Bài 1' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Xóa bài đăng: Bài 1' })).toBeVisible();
});
it('shows unassigned state without enabling writes', async () => {
  failOwn = true; mount(); await screen.findByRole('alert'); expect(screen.queryByRole('link', { name: 'Tạo bài đăng' })).not.toBeInTheDocument();
  expect(calls.some(call => call.url === '/posts')).toBe(false);
});
it('saves team metadata without sending leader assignment or campaign identity', async () => {
  mount(); await user().click(await screen.findByRole('button', { name: 'Chỉnh sửa đội hình' }));
  await user().clear(screen.getByLabelText('Tên đội hình')); await user().type(screen.getByLabelText('Tên đội hình'), 'Đội hình mới');
  await user().click(screen.getByRole('button', { name: 'Lưu đội hình' })); await screen.findByRole('heading', { name: 'Đội hình mới' });
  expect(JSON.parse(calls.find(call => call.method === 'put')!.data)).toEqual({ teamName: 'Đội hình mới', description: 'Mô tả thật' });
});
it.each([403, 500])('retains team metadata on failed save %i', async status => {
  mount(); await user().click(await screen.findByRole('button', { name: 'Chỉnh sửa đội hình' }));
  await user().type(screen.getByLabelText('Mô tả'), ' giữ lại'); failWrite = status;
  await user().click(screen.getByRole('button', { name: 'Lưu đội hình' })); await screen.findByRole('alert');
  expect(screen.getByLabelText('Mô tả')).toHaveValue('Mô tả thật giữ lại'); expect(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)).toBeTruthy();
});
it('creates a text-only post with explicit zero coordinates and loads canonical detail', async () => {
  mount('/leader/posts/new'); await fillNew();
  await user().type(screen.getByLabelText('Vĩ độ'), '0'); await user().type(screen.getByLabelText('Kinh độ'), '0');
  await user().click(screen.getByRole('button', { name: 'Đăng bài' })); await screen.findByRole('heading', { name: 'Bài mới' });
  const call = calls.find(call => call.method === 'post')!;
  expect(JSON.parse(call.data)).toEqual({ title: 'Bài mới', content: 'Nội dung mới', teamId: 10, coordinates: { latitude: 0, longitude: 0 }, photos: [] });
  expect(calls.some(call => call.url === '/posts/3' && call.method === 'get')).toBe(true);
});
it('retains text and uploaded photos across steps and reuses successful uploads on retry', async () => {
  const upload = vi.spyOn(cloudinaryApi, 'uploadImage').mockResolvedValueOnce({ secure_url: 'https://example.test/one.png', public_id: 'one', width: 1, height: 1 }).mockRejectedValueOnce(new Error('provider')).mockResolvedValueOnce({ secure_url: 'https://example.test/two.png', public_id: 'two', width: 1, height: 1 });
  mount('/leader/posts/new');
  await user().upload(await screen.findByLabelText('Thêm ảnh'), [new File(['a'], 'one.png', { type: 'image/png' }), new File(['b'], 'two.png', { type: 'image/png' })]);
  await user().click(screen.getByRole('button', { name: 'Tiếp tục' })); await screen.findByRole('alert');
  await user().click(screen.getByRole('button', { name: 'Tiếp tục' })); await screen.findByLabelText('Tiêu đề');
  await user().type(screen.getByLabelText('Tiêu đề'), 'Giữ tiêu đề'); await user().type(screen.getByLabelText('Nội dung', { exact: true }), 'Giữ nội dung');
  await user().click(screen.getByRole('button', { name: 'Quay lại ảnh' })); await user().click(screen.getByRole('button', { name: 'Tiếp tục' }));
  expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Giữ tiêu đề'); expect(upload).toHaveBeenCalledTimes(3);
  await user().click(screen.getByRole('button', { name: 'Đăng bài' })); await screen.findByRole('heading', { name: 'Giữ tiêu đề' });
  expect(posts.at(-1)!.photos.map(photo => photo.imageUrl)).toEqual(['https://example.test/one.png', 'https://example.test/two.png']);
});
it('requires checking an ambiguous create result before manual retry without losing the draft', async () => {
  mount('/leader/posts/new'); await fillNew(); failWrite = 500;
  await user().click(screen.getByRole('button', { name: 'Đăng bài' }));
  await screen.findByRole('link', { name: 'Mở danh sách để kiểm tra' });
  expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Bài mới'); await waitFor(() => expect(screen.getByRole('button', { name: 'Đăng bài' })).toBeDisabled());
  expect(calls.filter(call => call.method === 'post')).toHaveLength(1);
  await user().click(screen.getByRole('button', { name: 'Đã kiểm tra, cho phép gửi lại' }));
  await user().click(screen.getByRole('button', { name: 'Đăng bài' })); await screen.findByRole('heading', { name: 'Bài mới' });
});
it('preserves edit input on forbidden response then updates body and clears coordinates explicitly', async () => {
  posts[0].coordinates = { latitude: 10, longitude: 106 }; mount('/leader/posts/1/edit');
  await user().type(await screen.findByLabelText('Tiêu đề'), ' đã sửa');
  await user().clear(screen.getByLabelText('Vĩ độ')); await user().clear(screen.getByLabelText('Kinh độ')); failWrite = 403;
  await user().click(screen.getByRole('button', { name: 'Lưu bài đăng' })); await screen.findByRole('alert');
  expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Bài 1 đã sửa');
  await user().click(screen.getByRole('button', { name: 'Lưu bài đăng' })); await screen.findByRole('heading', { name: 'Bài 1 đã sửa' });
  expect(JSON.parse(calls.find(call => call.method === 'put')!.data)).toEqual({ title: 'Bài 1 đã sửa', content: 'Nội dung 1', coordinates: null });
});
it.each(['/leader/posts/2', '/leader/posts/2/edit'])('rejects management of another team post %s', async path => {
  mount(path); await screen.findByRole('alert'); expect(screen.queryByLabelText('Tiêu đề')).not.toBeInTheDocument();
  expect(screen.queryByText('Nội dung 2')).not.toBeInTheDocument();
});
it('preserves a draft and blocks saving if the account assignment changes', async () => {
  const query = mount('/leader/posts/new'); await fillNew();
  await act(async () => { query.setQueryData(ownTeamKey, { ...team, teamId: 20, teamName: 'Đội khác' }); });
  expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Bài mới'); await waitFor(() => expect(screen.getByRole('button', { name: 'Đăng bài' })).toBeDisabled());
  expect(screen.getByRole('alert')).toHaveTextContent('Phân công đội hình đã thay đổi');
});
it('confirms deletion, retains error state and invalidates cached public post detail', async () => {
  const query = mount(); query.setQueryData(postKeys.detail(1), structuredClone(posts[0]));
  await user().click(await screen.findByRole('button', { name: 'Xóa bài đăng: Bài 1' }));
  expect(calls.some(call => call.method === 'delete')).toBe(false); failWrite = 403;
  await user().click(screen.getByRole('button', { name: 'Có, xóa bài đăng' })); await screen.findByRole('alert');
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  await user().click(screen.getByRole('button', { name: 'Có, xóa bài đăng' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.queryByRole('link', { name: 'Xem bài đăng: Bài 1' })).not.toBeInTheDocument();
  await user().click(screen.getByRole('link', { name: 'Public post' })); await screen.findByRole('alert');
  expect(screen.queryByText('Nội dung 1')).not.toBeInTheDocument();
});
it('disables repeated submits, navigation and input while saving', async () => {
  mount('/leader/posts/new'); await fillNew(); hold = new Promise(resolve => { release = resolve; });
  await user().click(screen.getByRole('button', { name: 'Đăng bài' }));
  expect(await screen.findByRole('button', { name: 'Đang lưu…' })).toBeDisabled();
  expect(screen.getByLabelText('Tiêu đề')).toBeDisabled(); expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Đóng' })).toBeDisabled();
  await act(async () => release!()); await screen.findByRole('heading', { name: 'Bài mới' }); expect(calls.filter(call => call.method === 'post')).toHaveLength(1);
});
it('cancels an unchanged modal and restores the trigger focus', async () => {
  mount(); const trigger = await screen.findByRole('button', { name: 'Chỉnh sửa đội hình' }); await user().click(trigger);
  await user().click(screen.getByRole('button', { name: 'Hủy' })); expect(trigger).toHaveFocus();
});

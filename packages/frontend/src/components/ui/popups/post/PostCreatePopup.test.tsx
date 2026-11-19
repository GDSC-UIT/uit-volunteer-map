import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { cloudinaryApi } from '@/api';
import { mockDialog } from '@/test/dialog';
import PostCreatePopup from './PostCreatePopup';
vi.mock('@/api', () => ({ cloudinaryApi: { uploadImages: vi.fn() } }));
beforeEach(() => {
  mockDialog();
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = vi.fn(() => 'blob:test');
    static revokeObjectURL = vi.fn();
  });
  vi.mocked(cloudinaryApi.uploadImages).mockReset();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const files = [new File(['a'], 'a.png', { type: 'image/png' }), new File(['b'], 'b.png', { type: 'image/png' })];
function addFiles(selected = files) {
  fireEvent.change(screen.getByLabelText('Chọn tệp ảnh'), { target: { files: selected } });
}
it('selects by keyboard, announces limits/rejections and preserves selections on Back', async () => {
  const user = userEvent.setup();
  render(<PostCreatePopup maxFiles={1} />); addFiles();
  const first = screen.getByRole('button', { name: 'a.png' }); first.focus(); await user.keyboard(' ');
  expect(first).toHaveAttribute('aria-pressed', 'true');
  await user.click(screen.getByRole('button', { name: 'b.png' }));
  expect(screen.getByRole('alert')).toHaveTextContent('tối đa 1 ảnh');
  expect(screen.getByRole('status')).toHaveTextContent('Đã chọn 1/1');
  await user.click(screen.getByRole('button', { name: 'Quay lại' }));
  await user.click(screen.getByRole('button', { name: 'Tiếp tục chọn ảnh' }));
  expect(screen.getByRole('button', { name: 'a.png, thứ tự 1' })).toHaveAttribute('aria-pressed', 'true');
  addFiles([new File(['x'], 'notes.txt', { type: 'text/plain' })]);
  expect(screen.getByRole('alert')).toHaveTextContent('notes.txt');
  expect(screen.getByRole('button', { name: 'a.png, thứ tự 1' })).toBeInTheDocument();
});
it('retries only failed files and retains selected order after partial upload failure', async () => {
  const result = { secure_url: 'https://example.test/a.png', public_id: 'a', width: 1, height: 1 };
  vi.mocked(cloudinaryApi.uploadImages).mockImplementationOnce(async (batch, progress) => {
    progress?.(0, { file: batch[0], progress: 100, status: 'success', result });
    throw new Error('simulated failure');
  }).mockResolvedValueOnce([{ ...result, secure_url: 'https://example.test/b.png' }]);
  const complete = vi.fn(), user = userEvent.setup();
  render(<PostCreatePopup onComplete={complete} />); addFiles();
  await user.click(screen.getByRole('button', { name: 'a.png' }));
  await user.click(screen.getByRole('button', { name: 'b.png' }));
  await user.click(screen.getByRole('button', { name: 'Chọn 2 ảnh' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('được giữ lại');
  expect(complete).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Chọn 2 ảnh' }));
  await waitFor(() => expect(complete).toHaveBeenCalledWith(['https://example.test/a.png', 'https://example.test/b.png']));
  expect(vi.mocked(cloudinaryApi.uploadImages).mock.calls[1][0]).toEqual([files[1]]);
});
it('ignores late completion after closing and revokes previews on unmount', async () => {
  let resolveUpload!: (value: never[]) => void;
  vi.mocked(cloudinaryApi.uploadImages).mockImplementation(() => new Promise(resolve => { resolveUpload = resolve; }));
  const complete = vi.fn(), close = vi.fn(), user = userEvent.setup();
  const { unmount } = render(<PostCreatePopup onComplete={complete} onClose={close} />); addFiles();
  await user.click(screen.getByRole('button', { name: 'a.png' }));
  await user.click(screen.getByRole('button', { name: 'Chọn 1 ảnh' }));
  await user.click(screen.getByRole('button', { name: 'Hủy' }));
  resolveUpload([]);
  await waitFor(() => expect(close).toHaveBeenCalledOnce());
  expect(complete).not.toHaveBeenCalled();
  unmount(); expect(URL.revokeObjectURL).toHaveBeenCalled();
});

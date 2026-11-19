import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockDialog } from '@/test/dialog';
import PostDetailPopup from './PostDetailPopup';
beforeEach(mockDialog);
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it('keeps draft values and live character count across the image-selection step', async () => {
  const user = userEvent.setup();
  const { rerender } = render(<PostDetailPopup />);
  await user.type(screen.getByLabelText('Tiêu đề'), 'Ngày tình nguyện');
  await user.type(screen.getByRole('textbox', { name: 'Nội dung bài viết' }), 'Xin chào');
  expect(screen.getByText('8 / 3000 ký tự')).toBeInTheDocument();
  rerender(<PostDetailPopup open={false} />);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  rerender(<PostDetailPopup open />);
  expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Ngày tình nguyện');
  expect(screen.getByRole('textbox', { name: 'Nội dung bài viết' })).toHaveValue('Xin chào');
});

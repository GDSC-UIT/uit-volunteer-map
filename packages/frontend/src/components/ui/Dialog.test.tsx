import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Dialog from './Dialog';
import ConfirmDeletePopup from './popups/ConfirmDeletePopup';
import { mockDialog } from '@/test/dialog';

beforeEach(mockDialog);
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe('Dialog lifecycle', () => {
  it('names the dialog, starts on safe cancel and restores focus/scroll', () => {
    const trigger = document.createElement('button');
    document.body.append(trigger); trigger.focus();
    document.body.style.overflow = 'auto';
    const cancel = vi.fn();
    const { unmount } = render(<ConfirmDeletePopup onCancel={cancel} onConfirm={vi.fn()} itemName="bài đăng 2" />);
    const dialog = screen.getByRole('dialog', { name: 'Xóa bài đăng' });
    expect(screen.getByRole('button', { name: 'Hủy' })).toHaveFocus();
    expect(screen.getByText('Xóa bài đăng 2?')).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    expect(cancel).toHaveBeenCalledOnce();
    unmount();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe('auto');
    trigger.remove();
  });
  it('keeps focus stable on rerender and uses the latest close callback', () => {
    const first = vi.fn(), second = vi.fn();
    const { rerender } = render(<Dialog title="Editor" onClose={first}><input aria-label="Draft" /></Dialog>);
    screen.getByRole('textbox').focus();
    rerender(<Dialog title="Editor" onClose={second}><input aria-label="Draft" /></Dialog>);
    expect(screen.getByRole('textbox')).toHaveFocus();
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    expect(first).not.toHaveBeenCalled(); expect(second).toHaveBeenCalledOnce();
  });
});

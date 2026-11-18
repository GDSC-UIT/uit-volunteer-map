import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import HomePage from './HomePage';
import Statistic from '@/components/layouts/Statistic';
vi.mock('@/hooks/useCampaigns', () => ({ useCampaigns: () => ({ data: [], isPending: false, error: null, refetch: vi.fn() }) }));
afterEach(() => { cleanup(); vi.useRealTimers(); });
it('keeps the carousel stationary until requested, then pauses on keyboard focus', () => {
  vi.useFakeTimers(); render(<MemoryRouter><HomePage /></MemoryRouter>);
  const selected = (index: number) => screen.getByRole('button', { name: `Xem ảnh ${index}` });
  act(() => vi.advanceTimersByTime(10000)); expect(selected(1)).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu trình chiếu' }));
  act(() => vi.advanceTimersByTime(5000)); expect(selected(2)).toHaveAttribute('aria-pressed', 'true');
  fireEvent.focus(screen.getByRole('button', { name: 'Ảnh tiếp theo' }));
  act(() => vi.advanceTimersByTime(10000)); expect(selected(2)).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Ảnh trước' })); expect(selected(1)).toHaveAttribute('aria-pressed', 'true');
});
it('distinguishes unavailable metrics from actual zero and reflects new API counts immediately', () => {
  const { rerender } = render(<Statistic />);
  expect(screen.getAllByText('Chưa có số liệu')).toHaveLength(3);
  expect(screen.queryByText('0')).not.toBeInTheDocument();
  rerender(<Statistic postCount={0} teamCount={1} mappedCount={0} />);
  expect(screen.queryByText('Chưa có số liệu')).not.toBeInTheDocument();
  expect(screen.getAllByText('0')).toHaveLength(2);
  rerender(<Statistic postCount={123456} teamCount={2} mappedCount={3} />);
  expect(screen.getByText('123456')).toBeInTheDocument(); expect(screen.queryByText('1')).not.toBeInTheDocument();
});

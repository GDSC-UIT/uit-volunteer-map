import ScrollToTop from '@/routes/ScrollToTop';
import { Outlet } from 'react-router';
import { Suspense } from 'react';

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ScrollToTop />
      <Suspense fallback={<p role="status" className="p-8 text-center">Đang tải trang…</p>}>
        <Outlet />
      </Suspense>
    </div>
  );
}

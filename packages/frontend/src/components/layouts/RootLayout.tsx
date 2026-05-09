import ScrollToTop from '@/routes/ScrollToTop';
import { Outlet } from 'react-router';

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ScrollToTop />
      <Outlet />
    </div>
  );
}

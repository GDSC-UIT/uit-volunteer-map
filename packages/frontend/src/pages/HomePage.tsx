import MapView from '@/components/layouts/MapView';
import { Link } from 'react-router';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-primary-900 to-primary-700 flex items-center justify-center">
      <div className="text-center">
        <MapView />
        <h1 className="text-5xl font-bold text-white mb-4">
          Trang chủ UIT Volunteer Map
        </h1>
        <div className="flex gap-4 justify-center">
          <Link
            to="login"
            className="px-6 py-3 bg-white text-primary-700 font-medium rounded-lg hover:bg-primary-50 transition-colors"
          >
            Đăng nhập (cho Admin/Leader)
          </Link>
          <Link
            to="campaign/123"
            className="px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
          >
            Xuân Tình Nguyện
          </Link>
          <Link
            to="campaign/456"
            className="px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
          >
            Mùa hè Xanh
          </Link>
        </div>
      </div>
    </div>
  );
}

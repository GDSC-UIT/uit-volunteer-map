import { Outlet, Link } from 'react-router';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 text-white p-4">
        <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
        <nav className="space-y-2">
          <Link to="/admin" className="block px-3 py-2 rounded hover:bg-gray-800">
            Bảng điều khiển
          </Link>
          <Link to="/admin/campaigns" className="block px-3 py-2 rounded hover:bg-gray-800">
            Quản lý chiến dịch
          </Link>
          <Link to="/admin/teams" className="block px-3 py-2 rounded hover:bg-gray-800">
            Quản lý đội hình
          </Link>
          <Link to="/admin/leaders" className="block px-3 py-2 rounded hover:bg-gray-800">
            Quản lý chỉ huy
          </Link>
          {/* Add more admin links here */}
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}

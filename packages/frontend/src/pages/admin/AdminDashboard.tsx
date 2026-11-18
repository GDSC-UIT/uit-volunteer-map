import { Link } from 'react-router';
const areas = [
  { to: '/admin/campaigns', title: 'Quản lý Chiến dịch', description: 'Tạo và cập nhật thông tin chiến dịch.' },
  { to: '/admin/accounts', title: 'Quản lý Chỉ huy', description: 'Tạo hồ sơ, cập nhật và vô hiệu hóa tài khoản chỉ huy.' },
  { to: '/admin/teams', title: 'Quản lý Đội hình', description: 'Tạo đội hình và phân công chỉ huy theo chiến dịch.' },
];
export default function AdminDashboard() {
  return <div className="space-y-6">
    <h1 className="text-3xl font-bold">Bảng điều khiển</h1>
    <p>Chọn mục quản lý để cập nhật dữ liệu UITVolunteer.</p>
    <nav aria-label="Tác vụ quản trị" className="grid gap-4 xl:grid-cols-3">
      {areas.map(area => <Link key={area.to} to={area.to} className="min-w-0 rounded border p-5 space-y-3 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#023A54]">
        <h2 className="text-xl font-bold wrap-anywhere">{area.title}</h2><p className="wrap-anywhere">{area.description}</p>
      </Link>)}
    </nav>
  </div>;
}

import { Outlet, NavLink } from "react-router";

const menu = [
  { label: "Bảng điều khiển", to: "/admin/dashboard" },
  { label: "Quản lý Chiến dịch", to: "/admin/campaigns" },
  { label: "Quản lý Chỉ huy", to: "/admin/accounts" },
  { label: "Quản lý Đội hình", to: "/admin/teams" },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#BFB8B8] p-6">
      <div className="flex gap-6 h-[calc(100vh-48px)]">
        {/* Sidebar */}
        <aside className="w-[260px] bg-white rounded-md p-4 flex flex-col">
          <div className="flex-1">
            <h2 className="font-bold mb-4 text-black">Admin</h2>

            <nav className="space-y-2 text-black">
              {menu.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded text-sm transition ${
                      isActive
                        ? "bg-gray-200 font-semibold"
                        : "hover:bg-gray-100"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <button className="border rounded px-3 py-1 text-sm hover:bg-gray-100 text-black">
            Đăng xuất
          </button>
        </aside>

        {/* Content */}
        <main className="flex-1 bg-white rounded-md p-8 text-black overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

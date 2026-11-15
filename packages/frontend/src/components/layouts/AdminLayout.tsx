import { Outlet, NavLink } from "react-router";

const menu = [
  { label: "Bảng điều khiển", to: "/admin/dashboard" },
  { label: "Quản lý Chiến dịch", to: "/admin/campaigns" },
  { label: "Quản lý Chỉ huy", to: "/admin/accounts" },
  { label: "Quản lý Đội hình", to: "/admin/teams" },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#BFB8B8] p-4 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6 lg:h-[calc(100vh-48px)]">
        {/* Sidebar */}
        <aside className="w-full lg:w-[260px] lg:shrink-0 bg-white rounded-md p-4 flex flex-col">
          <div className="flex-1">
            <h2 className="font-bold mb-4 text-black">Admin</h2>

            <nav aria-label="Điều hướng quản trị" className="grid gap-2 sm:grid-cols-2 lg:block lg:space-y-2 text-black">
              {menu.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center min-h-11 lg:min-h-0 px-3 py-2 rounded text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#023A54] ${
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

          <button className="mt-4 lg:mt-0 min-h-11 lg:min-h-0 border rounded px-3 py-1 text-sm hover:bg-gray-100 text-black">
            Đăng xuất
          </button>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1 bg-white rounded-md p-4 sm:p-6 lg:p-8 text-black lg:overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { Link } from "react-router";

export default function GuestHeader() {
  return (
    <header className="w-full bg-white border-b border-black/10">
      <div className="max-w-6xl mx-auto h-14 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xs text-gray-700">
          <span>✉</span>
          <span>Logo chiến dịch</span>
        </div>

        <nav className="flex gap-10 text-xs font-bold text-black">
          <a href="#info" className="hover:text-blue-600">
            Thông tin
          </a>
          <a href="#teams" className="hover:text-blue-600">
            Đội hình
          </a>
          <a href="#activities" className="hover:text-blue-600">
            Hoạt động
          </a>
        </nav>

        <Link
          to="/login"
          className="text-xs font-bold px-3 py-1 border border-black/20 rounded hover:bg-gray-100"
        >
          Đăng nhập
        </Link>
      </div>
    </header>
  );
}

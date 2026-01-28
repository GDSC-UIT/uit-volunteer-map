import { Link } from "react-router";

export default function PublicHeader() {
  return (
    <header className="w-full bg-blue-500 text-white">
      <div className="max-w-6xl mx-auto h-14 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-sm">
          <span>✉</span>
          <span>UITVolunteer</span>
        </div>

        <Link
          to="/login"
          className="bg-white text-blue-600 text-xs font-bold px-3 py-1 rounded hover:bg-blue-100"
        >
          Đăng nhập
        </Link>
      </div>
    </header>
  );
}

const headers = [
  "STT",
  "Tài khoản",
  "Mật khẩu",
  "Chiến dịch",
  "Đội hình",
  "Trạng thái",
];

const rows = Array.from({ length: 6 });

export default function AccountManagementPage() {
  return (
    <div className="h-full text-black">
      {/* ===== HEADER ===== */}
      <h1 className="text-3xl font-bold mb-2">QUẢN LÝ CHỈ HUY</h1>
      <p className="text-sm text-gray-600 mb-6">
        Danh sách tài khoản chỉ huy các đội hình của các chiến dịch
      </p>

      {/* ===== SEARCH + ADD ===== */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        {/* Search */}
        <div className="flex min-w-0 items-center gap-2 bg-gray-200 rounded px-3 py-2 w-full sm:w-[420px] max-w-full">
          <input
            placeholder="Tìm kiếm theo tên tài khoản, chiến dịch, đội hình"
            className="bg-transparent min-w-0 w-full flex-1 text-sm outline-none"
          />
          <div className="w-4 h-4 shrink-0 bg-gray-500 rounded" />
        </div>

        {/* Add */}
        <button className="flex shrink-0 items-center gap-2 border-2 border-cyan-400 px-4 py-2 rounded text-sm hover:bg-cyan-50 transition">
          <span className="w-4 h-4 bg-black inline-block" />
          Thêm tài khoản
        </button>
      </div>

      {/* ===== TABLE ===== */}
      <p className="mb-2 text-xs text-gray-600 sm:hidden">Cuộn ngang để xem đầy đủ danh sách.</p>
      <div role="region" aria-label="Danh sách tài khoản" tabIndex={0} className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-[#023A54]">
        <div className="grid min-w-[600px] grid-cols-6 gap-y-4 text-sm">
          {/* Header */}
          {headers.map((h) => (
            <div key={h} className="font-semibold">
              {h}
            </div>
          ))}

          {/* Rows */}
          {rows.map((_, index) => (
            <>
              <div key={`stt-${index}`}>STT</div>
              <div>Tài khoản</div>
              <div>Mật khẩu</div>
              <div>Chiến dịch</div>
              <div>Đội hình</div>
              <div>Trạng thái</div>
            </>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";

const campaigns = [
  "Xuân Tình Nguyện 2026",
  "Chiến dịch 2",
  "Chiến dịch 3",
];

export default function CampaignManagementPage() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="flex flex-col text-black">
      {/* ===== TITLE ===== */}
      <h1 className="text-3xl font-bold mb-6">
        QUẢN LÝ CHIẾN DỊCH
      </h1>

      {/* ===== TABS + ADD BUTTON ===== */}
      <div className="flex items-center justify-between mb-6">
        {/* Tabs */}
        <div className="flex items-center gap-10">
          {campaigns.map((name, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={name}
                onClick={() => setActiveIndex(index)}
                className={`pb-2 text-sm transition ${
                  isActive
                    ? "font-semibold border-b-2 border-black"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>

        {/* Add button */}
        <button className="flex items-center gap-2 border-2 border-cyan-400 px-4 py-2 rounded text-sm hover:bg-cyan-50 transition">
          <span className="w-4 h-4 bg-black inline-block" />
          Thêm chiến dịch
        </button>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="space-y-6 max-w-3xl">
        {/* Mô tả chung */}
        <div>
          <p className="font-semibold mb-2">Mô tả chung</p>
          <div className="h-32 bg-gray-300 rounded-md" />
        </div>

        {/* Ảnh mô tả */}
        <div>
          <p className="font-semibold mb-2">Ảnh mô tả</p>
          <button className="border px-4 py-1 rounded text-sm hover:bg-gray-100">
            + Thêm ảnh
          </button>
        </div>

        {/* Hoạt động nổi bật */}
        <div>
          <p className="font-semibold mb-2">Hoạt động nổi bật</p>
          <button className="border px-4 py-1 rounded text-sm hover:bg-gray-100">
            Chọn hoạt động
          </button>
        </div>
      </div>
    </div>
  );
}

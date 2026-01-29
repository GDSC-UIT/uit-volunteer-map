import { useState } from "react";

const campaigns = [
  "Xuân Tình Nguyện 2026",
  "Chiến dịch 2",
  "Chiến dịch 3",
];

const teams = ["Đội hình A", "Đội hình A", "Đội hình A"];

export default function TeamManagementPage() {
  const [activeCampaign, setActiveCampaign] = useState(0);

  return (
    <div className="text-black">
      <h1 className="text-3xl font-bold mb-6">QUẢN LÝ ĐỘI HÌNH</h1>

      {/* Tabs */}
      <div className="flex items-center gap-10 mb-4">
        {campaigns.map((name, index) => {
          const isActive = index === activeCampaign;
          return (
            <button
              key={name}
              onClick={() => setActiveCampaign(index)}
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

      {/* Search + Add */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 border rounded px-3 py-2 text-sm text-gray-400">
          Tìm kiếm đội hình...
        </div>

        <button className="flex items-center gap-2 border-2 border-cyan-400 px-4 py-2 rounded text-sm hover:bg-cyan-50 transition">
          <span className="w-4 h-4 bg-black inline-block" />
          Thêm đội hình
        </button>
      </div>

      {/* Team list */}
      <div className="space-y-4 max-w-3xl">
        {teams.map((team, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-gray-200 rounded px-4 py-4"
          >
            <span className="font-semibold">{team}</span>
            <div className="w-5 h-5 bg-gray-300 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
import MapView, { MarkerData } from "@/components/layouts/MapView";
import Statistic from "@/components/layouts/Statistic";
import GuestPostOverPlay from "@/components/ui/popups/post/GuestPostOverPlay";
import TimeSelect from "@/components/layouts/TimeSelect";
import EventCard from "@/components/ui/popups/post/EventCard";
import TeamItem from "@/components/ui/TeamItem";

import { useTeams } from "@/hooks/useTeams";
import { usePosts } from "@/hooks/usePosts";

import bndLogo from "@/assets/icons/bnd.png";
import bgTop from "@/assets/background/background_top-01.svg";
import { PostItem } from "@/components/ui/PostItem";

export default function CampaignPage() {
  const [selectedEvent, setSelectedEvent] = useState<MarkerData | null>(null);
  const [hoverData, setHoverData] = useState<MarkerData | null>(null);

  const { data: teams = [] } = useTeams();
  const { data: posts = [] } = usePosts();

  const handleClose = () => {
    setSelectedEvent(null);
  };

  return (
    <div className="z-25">
      <img
        src={bgTop}
        alt="background top"
        className="absolute top-0 left-0 w-full z-15 pointer-events-none"
      />
      <section id="logoTop" className="max-w-4xl mx-auto px-4">
        <div className="flex justify-center">
          <img src={bndLogo} className="h-16 object-contain" alt="BND Logo" />
        </div>
      </section>
      {hoverData && <EventCard visible={true} data={null} />}
      {selectedEvent && (
        <GuestPostOverPlay post={posts[0]} onClose={handleClose} />
      )}
      <main className="flex-1">
        <section id="mapSection" className="max-w-6xl mx-auto px-4">
          <div className="p-3 rounded-md flex">
            <div
              className="relative flex items-center justify-center"
              style={{ width: 650, height: 550 }}
            >
              <div
                className="overflow-hidden"
                style={{ width: 580, height: 450, zIndex: 1 }}
              >
                <MapView
                  onMarkerClick={(data) => setSelectedEvent(data)}
                  onMarkerHover={(data) => setHoverData(data)}
                />
              </div>
              <img
                src="/map-element/map-frame-01.svg"
                className="absolute top-0 left-0 pointer-events-none w-170 z-10"
                alt=""
              />
            </div>
            <Statistic />
          </div>
          <TimeSelect />
        </section>

        <section id="info" className="max-w-6xl mx-auto mt-16 px-6">
          <h2 className="text-center font-black text-black mb-12 text-5xl">
            THÔNG TIN CHUNG
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <p className="text-black text-2xl font-bold leading-relaxed">
              Chiến dịch Xuân Tình Nguyện – Trường Đại học Công nghệ Thông tin,
              ĐHQG-HCM là hoạt động tình nguyện ý nghĩa được tổ chức thường niên
              với sự tham gia của hàng trăm sinh viên thuộc nhiều đội hình khác
              nhau, với sứ mệnh mang không khí và hơi ấm ngày Tết đến với những
              hoàn cảnh, địa phương còn khó khăn.
            </p>
            <img
              src="https://res.cloudinary.com/duallvqjh/image/upload/v1770284139/XTN_info_nce2w5.jpg"
              className="rounded-3xl shadow-xl w-full"
              alt="Volunteer"
            />
          </div>
        </section>

        <section id="teams" className="max-w-7xl mx-auto mt-32 px-10 relative">
          <div className="mb-12">
            <h2 className="text-center font-black text-5xl text-black">
              ĐỘI HÌNH
            </h2>
          </div>

          {/* Vertical line */}
          <div className="absolute left-25 top-40 bottom-0 w-2 bg-green-600 z-1 rounded-lg" />

          {/* Teams list */}
          <div className="relative z-2 mt-16 space-y-24">
            {teams.map((team, index) => {
              return (
                <div
                  key={`${team.teamId}-${index}`}
                  className="flex items-center justify-center"
                >
                  <div
                    className={
                      index % 2 === 0
                        ? "scroll-appear timeline-item"
                        : "scroll-appear scroll-appear-right timeline-item"
                    }
                  >
                    <TeamItem team={team} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="activities" className="max-w-6xl mx-auto mt-32 px-6 pb-32">
          <h2 className="text-center font-black text-5xl mb-16 text-black tracking-widest">
            HOẠT ĐỘNG
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
            {posts.map((post, i) => (
              <PostItem key={i} post={post} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

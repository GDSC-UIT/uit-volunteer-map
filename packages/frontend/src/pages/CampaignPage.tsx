import { useState } from "react";
import { Link, useParams, useLocation } from "react-router";
import { useCampaign } from "@/hooks/useCampaigns";
import ReadState from "@/components/ui/ReadState";
import { routeId } from "@/hooks/readState";
import MapView from "@/components/layouts/MapView";
import Statistic from "@/components/layouts/Statistic";
import TimeSelect from "@/components/layouts/TimeSelect";
import TeamItem from "@/components/ui/TeamItem";

import { useTeamsByCampaign } from "@/hooks/useTeams";
import { usePostsByCampaign } from "@/hooks/usePosts";

import bndLogo from "@/assets/icons/bnd.png";
import bgTop from "@/assets/background/background_top-01.svg";
import { PostItem } from "@/components/ui/PostItem";

export default function CampaignPage() {
  const { campaignId } = useParams();
  const id = routeId(campaignId);
  const location = useLocation();
  const campaign = useCampaign(id);
  const teamsQuery = useTeamsByCampaign(id);
  const postsQuery = usePostsByCampaign(id);
  const teams = teamsQuery.data ?? [];
  const posts = postsQuery.data ?? [];
  const [mapNotice, setMapNotice] = useState('Bản đồ chưa kết nối bài đăng. Vui lòng xem danh sách hoạt động bên dưới.');
  if(!id) return <p role="alert" className="p-8">Không tìm thấy chiến dịch.</p>;
  if(!campaign.data || campaign.isError) return <ReadState pending={campaign.isPending} error={campaign.error} label="chiến dịch" onRetry={campaign.refetch} />;

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
      <main className="flex-1">
        <h1 className="text-center text-3xl font-bold p-4">{campaign.data.campaignName}</h1>
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
                  onMarkerClick={() => setMapNotice("Thông tin bản đồ chưa được kết nối. Chọn bài đăng trong danh sách hoạt động.")}
                  onMarkerHover={() => {}}
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
          <p role="status" className="p-3 text-center">{mapNotice}</p>
          <p className="text-center text-sm">Năm và số liệu trên bản đồ là minh họa, chưa kết nối dữ liệu.</p>
        </section>

        <section id="info" className="max-w-6xl mx-auto mt-16 px-6">
          <h2 className="text-center font-black text-black mb-12 text-5xl">
            THÔNG TIN CHUNG
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <p className="text-black text-2xl font-bold leading-relaxed">
              {campaign.data.description || 'Chưa có mô tả chiến dịch.'}
            </p>
            {campaign.data.attachments[0] && <img src={campaign.data.attachments[0].imageUrl} className="rounded-3xl shadow-xl w-full" alt={campaign.data.campaignName} />}
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

          <ReadState pending={teamsQuery.isPending} error={teamsQuery.error} label="đội hình" empty={teams.length===0} onRetry={teamsQuery.refetch} />
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
          <ReadState pending={postsQuery.isPending} error={postsQuery.error} label="bài đăng" empty={posts.length===0} onRetry={postsQuery.refetch} />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
            {posts.map(post=><Link key={post.postId} to={`post/${post.postId}`} state={{from:location.pathname}} aria-label={`Xem bài đăng: ${post.title}`}><PostItem post={post} /></Link>)}
          </div>
        </section>
      </main>
    </div>
  );
}

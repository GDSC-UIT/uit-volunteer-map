import { useCallback } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router";
import { useCampaign } from "@/hooks/useCampaigns";
import ReadState from "@/components/ui/ReadState";
import { routeId } from "@/hooks/readState";
import MapView from "@/components/layouts/MapView";
import Statistic from "@/components/layouts/Statistic";
import { getMapPosts } from "@/components/layouts/mapData";
import TeamItem from "@/components/ui/TeamItem";

import { useTeamsByCampaign } from "@/hooks/useTeams";
import { usePostsByCampaign } from "@/hooks/usePosts";

import bndLogo from "@/assets/icons/bnd.png";
import bgTop from "@/assets/background/background_top-01.svg";
import { PostItem } from "@/components/ui/PostItem";
import type { PostSummaryDto } from "@uit-volunteer-map/shared";

export default function CampaignPage() {
  const { campaignId } = useParams();
  const id = routeId(campaignId);
  const location = useLocation();
  const navigate = useNavigate();
  const openMapPost = useCallback((post: PostSummaryDto) => {
    navigate(`post/${post.postId}`, { state: { from: location.pathname } });
  }, [navigate, location.pathname]);
  const campaign = useCampaign(id);
  const teamsQuery = useTeamsByCampaign(id);
  const postsQuery = usePostsByCampaign(id);
  const teams = teamsQuery.data ?? [];
  const posts = postsQuery.data ?? [];
  const locatedPosts = getMapPosts(posts, id);
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
          <div className="p-0 sm:p-3 rounded-md flex flex-col lg:flex-row items-center gap-4">
            <div className="relative w-full max-w-[650px] p-8 sm:p-12 shrink-0 lg:w-[60%]">
              <div className="relative z-20">
                <MapView
                  campaignId={id}
                  posts={posts}
                  onMarkerClick={openMapPost}
                />
              </div>
              <img
                src="/map-element/map-frame-01.svg"
                className="absolute inset-0 pointer-events-none w-full h-full z-10"
                alt=""
              />
            </div>
            <Statistic postCount={postsQuery.isSuccess ? posts.length : undefined} teamCount={teamsQuery.isSuccess ? teams.length : undefined} mappedCount={postsQuery.isSuccess ? locatedPosts.length : undefined} />
          </div>
          <p role="status" className="p-3 text-center">
            {postsQuery.isPending ? 'Đang tải điểm bài đăng…' : postsQuery.isError ? 'Chưa tải được điểm bài đăng. Vui lòng thử lại ở danh sách hoạt động.'
              : locatedPosts.length ? `${locatedPosts.length} bài đăng có tọa độ. Chọn một bông hoa để mở đúng bài đăng.` : 'Chưa có bài đăng có tọa độ trong chiến dịch này.'}
            {postsQuery.isSuccess && posts.length > locatedPosts.length && ` ${posts.length - locatedPosts.length} bài chưa có tọa độ hợp lệ; vẫn có trong danh sách hoạt động.`}
          </p>
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

        <section id="teams" className="max-w-7xl mx-auto mt-32 px-4 sm:px-6 lg:px-10 relative">
          <div className="mb-12">
            <h2 className="text-center font-black text-5xl text-black">
              ĐỘI HÌNH
            </h2>
          </div>

          {/* Vertical line */}
          <div className="absolute left-10 sm:left-18 lg:left-25 top-40 bottom-0 w-2 bg-green-600 z-1 rounded-lg" />

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

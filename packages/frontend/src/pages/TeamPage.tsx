import { useParams } from "react-router";
import { useState } from "react";
import avatarFrame from "@/assets/background/avar_frame.svg";
import { useTeam } from "@/hooks/useTeams";
import { usePostsByTeam } from "@/hooks/usePosts";
import { PostItem } from "@/components/ui/PostItem";
import GuestPostOverPlay from "@/components/ui/popups/post/GuestPostOverPlay";
import type { PostData } from "@/mocks/post.mock";

export default function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const numericTeamId = Number(teamId);
  const { data: team, isLoading, error } = useTeam(numericTeamId);
  const { data: posts = [] } = usePostsByTeam(numericTeamId);
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);

  if (isLoading) {
    return (
      <div className="pt-8 pb-4 text-center text-xl font-bold">
        Đang tải thông tin đội hình...
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="pt-8 pb-4 text-center text-xl font-bold text-red-600">
        Không tìm thấy đội hình
      </div>
    );
  }

  // Build commanders list: leader first, then vice leaders
  const commanders = [
    team.leader
      ? {
          role: "Đội trưởng",
          name: team.leader.name,
          avatarUrl: team.leader.avatarUrl,
        }
      : null,
    ...team.viceLeaders.map((v) => ({
      role: "Đội phó",
      name: v.name,
      avatarUrl: v.avatarUrl,
    })),
  ].filter(Boolean) as {
    role: string;
    name: string;
    avatarUrl: string | null;
  }[];

  // Pick up to 3 images for gallery (main + 2 side)
  const mainImage = team.images[0] ?? null;
  const leftImage = team.images[1] ?? null;
  const rightImage = team.images[2] ?? null;

  return (
    <>
      {/* ===== POST OVERLAY ===== */}
      {selectedPost && (
        <GuestPostOverPlay
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}

      <div className="pt-8 pb-4">
        {/* ===== HEADER ===== */}
        <section className="max-w-4xl mx-auto px-4 mb-8">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-black">{team.teamName}</h1>
          </div>
        </section>

        {/* ===== IMAGES GALLERY ===== */}
        <section className="max-w-5xl mx-auto px-4 mb-12 flex flex-col items-center">
          <div className="relative flex items-end justify-center">
            {/* MAIN IMAGE */}
            <div className="relative z-20 w-110 h-70 rounded-2xl overflow-hidden shadow-lg bg-white flex items-center justify-center">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={`${team.teamName} - ảnh chính`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-sm">Ảnh chính</span>
              )}
            </div>

            {/* LEFT IMAGE */}
            <div
              className="
            absolute -left-40 bottom-12.5
            z-10 w-65 h-45
            rounded-xl overflow-hidden shadow-md bg-white
            flex items-center justify-center
          "
            >
              {leftImage ? (
                <img
                  src={leftImage}
                  alt={`${team.teamName} - ảnh phụ`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-sm">Ảnh phụ</span>
              )}
            </div>

            {/* RIGHT IMAGE */}
            <div
              className="
            absolute -right-40 bottom-12.5
            z-10 w-65 h-45
            rounded-xl overflow-hidden shadow-md bg-white
            flex items-center justify-center
          "
            >
              {rightImage ? (
                <img
                  src={rightImage}
                  alt={`${team.teamName} - ảnh phụ`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-sm">Ảnh phụ</span>
              )}
            </div>
          </div>
        </section>

        {/* ===== DESCRIPTION ===== */}
        <section className="max-w-3xl mx-auto px-4 text-center mb-12">
          <p className="text-sm font-bold leading-relaxed text-black">
            {team.description || "Chưa có mô tả cho đội hình này."}
          </p>
        </section>

        {/* ===== COMMANDERS ===== */}
        <section className="max-w-4xl mx-auto px-4 mb-14 relative">
          <h2 className="text-center font-black mb-6">Ban chỉ huy</h2>

          <div className="grid grid-cols-3 gap-8 justify-items-center">
            {commanders.map((cmd, i) => (
              <div key={i} className="text-center">
                {/* Container avatar */}
                <div className="relative w-28 h-40 mx-auto mb-4">
                  <div className="absolute inset-x-1 inset-y-3 rounded-[50%] overflow-hidden bg-[#DDE1E6] ml-1.5">
                    {cmd.avatarUrl ? (
                      <img
                        src={cmd.avatarUrl}
                        alt={cmd.name}
                        className="w-full h-full object-cover"
                        style={{ objectPosition: "center" }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/70" />
                      </div>
                    )}
                  </div>

                  {/* Frame */}
                  <img
                    src={avatarFrame}
                    alt="avatar frame"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  />
                </div>
                <div className="text-xs font-black">{cmd.role}</div>
                <div className="text-xs font-bold text-gray-700">
                  {cmd.name}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== POSTS ===== */}
        <section className="max-w-4xl mx-auto px-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-black">Hoạt động</h2>
          </div>

          {posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <PostItem
                  key={post.postId}
                  post={post}
                  onClick={() => setSelectedPost(post)}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 text-sm">
              Chưa có bài đăng nào.
            </p>
          )}
        </section>
      </div>
    </>
  );
}

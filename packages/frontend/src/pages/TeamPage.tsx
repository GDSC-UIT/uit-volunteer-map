import { useParams, Link, useLocation } from "react-router";
import avatarFrame from "@/assets/background/avar_frame.svg";
import { PostItem } from "@/components/ui/PostItem";
import { usePosts } from "@/hooks/usePosts";




export default function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const location = useLocation();
  const { data: posts = [] } = usePosts();

  const commanders = Array.from({ length: 3 });

  return (
    <div className="py-8">
      <section className="max-w-4xl mx-auto px-4">
        <h1 className="text-center text-3xl font-black mb-8">
          Tên đội hình {teamId}
        </h1>
      </section>

      <section className="max-w-4xl mx-auto px-4 mb-10">
        <div className="bg-[#E6E6E6] rounded-xl p-6 flex items-center justify-center">
          <div className="flex gap-6">
            <div className="w-24 h-24 bg-[#D9D9D9] flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-white rotate-45" />
            </div>
            <div className="w-32 h-32 bg-[#D9D9D9] flex items-center justify-center">
              <div className="w-14 h-14 border-2 border-white rotate-45" />
            </div>
            <div className="w-24 h-24 bg-[#D9D9D9] flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-white rotate-45" />
            </div>
          </div>
        </div>

        <div className="text-center mt-3 text-xs font-black text-gray-500">
          • • •
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 text-center mb-12">
        <p className="text-sm font-bold leading-relaxed text-black">
          Rhoncus morbi et augue nec, in id ullamcorper at...
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-4 mb-14">
        <h2 className="text-center font-black mb-6">Ban chỉ huy</h2>

        <div className="grid grid-cols-3 gap-8">
          {commanders.map((_, i) => (
            <div key={i} className="text-center">
              {/* Container avatar */}
              <div className="relative w-28 h-40 mx-auto mb-4">
                <div className="absolute inset-3 rounded-[9999px] overflow-hidden bg-[#DDE1E6]">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/70" />
                  </div>
                </div>

                {/* Frame */}
                <img
                  src={avatarFrame}
                  alt="avatar frame"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
              </div>
              <div className="text-xs font-black">Chức vụ</div>
              <div className="text-xs font-bold text-gray-700">
                Họ và tên
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4">
        <h2 className="text-center font-black mb-6">Hoạt động</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
          {posts.map((post, i) => (
            <Link
              key={i}
              to={`post/${post.postId}`}
              state={{ backgroundLocation: location }}
              className="hover:scale-105 transition"
            >
              <PostItem post={post} />
            </Link>
          ))}
        </div>
      </section>
    </div>
);
}


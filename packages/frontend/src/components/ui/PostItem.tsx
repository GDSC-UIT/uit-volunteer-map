import type { PostSummaryDto } from "@uit-volunteer-map/shared";

interface PostItemProps {
  post: PostSummaryDto
}

export function PostItem({ post }: PostItemProps) {
  return (
    <div
      key={post.postId}
      className="rounded-3xl p-6 shadow-xl
                            bg-linear-to-b
                            from-[#F7CC1D]
                            via-[#FCF2DA]
                            to-[#F7CC1D]"
    >
      <h3 className="font-black wrap-anywhere text-xl text-black mb-4">{post.title}</h3>
      <div className="bg-[#DDE1E6] rounded-2xl aspect-4/3 mb-4 flex items-center justify-center">
        {post.thumbnail ? <img src={post.thumbnail.imageUrl} alt="" className="w-full h-full object-cover rounded-2xl" /> : <span>Chưa có ảnh</span>}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-red-600 text-xl">❤</span>
        <div className="flex-1 h-1 bg-black/50 rounded-full" />
      </div>
    </div>
  );
}

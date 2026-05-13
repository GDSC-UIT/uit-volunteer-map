import type { Post } from "@uit-volunteer-map/shared";

interface PostItemProps {
  post: Post;
}

export function PostItem({ post }: PostItemProps) {
  const thumbnail = post.thumbnail?.imageUrl ?? post.photos?.[0]?.imageUrl;

  return (
    <div
      key={post.postId}
      className="rounded-3xl p-6 shadow-xl
                 bg-linear-to-b
                 from-[#F7CC1D]
                 via-[#FCF2DA]
                 to-[#F7CC1D]"
    >
      <h3 className="font-black text-xl text-black mb-4">{post.title}</h3>
      <div className="bg-[#DDE1E6] rounded-2xl aspect-4/3 mb-4 flex items-center justify-center overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={post.title}
            className="w-full h-full object-cover rounded-2xl"
          />
        ) : (
          <span className="text-gray-400 text-sm">Chưa có ảnh</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-red-600 text-xl">❤</span>
        <div className="flex-1 h-1 bg-black/50 rounded-full" />
      </div>
    </div>
  );
}
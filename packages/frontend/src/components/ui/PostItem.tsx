import { PostData } from "@/mocks/post.mock";

interface PostItemProps {
  post: PostData
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
      <h3 className="font-black text-xl text-black mb-4">{post.title}</h3>
      <div className="bg-[#DDE1E6] rounded-2xl aspect-4/3 mb-4 flex items-center justify-center">
        <img src={post.photos?.[0]} alt={post.title} className="w-full h-full object-cover rounded-2xl" />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-red-600 text-xl">❤</span>
        <div className="flex-1 h-1 bg-black/50 rounded-full" />
      </div>
    </div>
  );
}

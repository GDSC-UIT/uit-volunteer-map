import { useParams, useNavigate } from "react-router";
import { usePost } from "@/hooks/usePosts";

export default function PostPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { data: post, isLoading, isError } = usePost(Number(postId));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Đang tải...</p>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-500">Không tìm thấy bài viết.</p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm underline text-gray-500 hover:text-black"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const photos = post.photos ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 hover:text-black mb-6 flex items-center gap-1"
      >
        ← Quay lại
      </button>

      {/* Title */}
      <h1 className="text-3xl font-black text-black mb-2">{post.title}</h1>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-6">
        <span>{new Date(post.createdAt).toLocaleDateString("vi-VN")}</span>
      </div>

      {/* Thumbnail */}
      {post.thumbnail && (
        <div className="rounded-2xl overflow-hidden mb-6 aspect-video bg-[#DDE1E6]">
          <img
            src={post.thumbnail.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="text-sm text-black leading-relaxed whitespace-pre-line mb-10">
        {post.content}
      </div>

      {/* Photo gallery */}
      {photos.length > 0 && (
        <div>
          <h2 className="font-black text-lg mb-4">Hình ảnh</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.photoId}
                className="rounded-xl overflow-hidden aspect-square bg-[#DDE1E6]"
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.title ?? post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
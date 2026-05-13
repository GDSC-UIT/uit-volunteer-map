import { useState } from "react";
import { usePosts, useCreatePost, useUpdatePost, useDeletePost } from "@/hooks/usePosts";
import type { Post } from "@uit-volunteer-map/shared";

const EMPTY_FORM = {
  title: "",
  content: "",
  teamId: 0,
  authorId: 0,
};

export default function PostManagementPage() {
  const { data: postsResponse, isLoading } = usePosts();
  const { mutate: createPost, isPending: isCreating } = useCreatePost();
  const { mutate: updatePost, isPending: isUpdating } = useUpdatePost();
  const { mutate: deletePost, isPending: isDeleting } = useDeletePost();

    const posts = postsResponse ?? [];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const activePost: Post | undefined = posts[activeIndex];

  function handleSelectPost(index: number) {
    setActiveIndex(index);
    setIsAdding(false);
    const post = posts[index];
    if (post) {
      setForm({
        title: post.title,
        content: post.content,
        teamId: 0,
        authorId: 0,
      });
    }
  }

  function handleAddNew() {
    setIsAdding(true);
    setForm(EMPTY_FORM);
  }

  function handleSave() {
    if (isAdding) {
      createPost(
        { ...form },
        {
          onSuccess: () => {
            setIsAdding(false);
            setForm(EMPTY_FORM);
          },
        }
      );
    } else if (activePost) {
      updatePost(
        { id: activePost.postId, payload: { title: form.title, content: form.content } },
        {
          onSuccess: () => setIsAdding(false),
        }
      );
    }
  }

  function handleDelete() {
    if (!activePost) return;
    deletePost(activePost.postId, {
      onSuccess: () => {
        setActiveIndex(0);
        setForm(EMPTY_FORM);
      },
    });
  }

  if (isLoading) {
    return <div className="text-black">Đang tải...</div>;
  }

  return (
    <div className="flex flex-col text-black">
      {/* ===== TITLE ===== */}
      <h1 className="text-3xl font-bold mb-6">QUẢN LÝ BÀI VIẾT</h1>

      {/* ===== TABS + ADD BUTTON ===== */}
      <div className="flex items-center justify-between mb-6">
        {/* Tabs */}
        <div className="flex items-center gap-10 overflow-x-auto">
          {posts.map((post, index) => {
            const isActive = index === activeIndex && !isAdding;
            return (
              <button
                key={post.postId}
                onClick={() => handleSelectPost(index)}
                className={`pb-2 text-sm whitespace-nowrap transition ${
                  isActive
                    ? "font-semibold border-b-2 border-black"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                {post.title}
              </button>
            );
          })}
          {isAdding && (
            <span className="pb-2 text-sm font-semibold border-b-2 border-black whitespace-nowrap">
              Bài viết mới
            </span>
          )}
        </div>

        {/* Add button */}
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 border-2 border-cyan-400 px-4 py-2 rounded text-sm hover:bg-cyan-50 transition whitespace-nowrap"
        >
          <span className="text-base leading-none">+</span>
          Thêm bài viết
        </button>
      </div>

      {/* ===== FORM ===== */}
      {(activePost || isAdding) && (
        <div className="space-y-6 max-w-3xl">
          {/* Tiêu đề */}
          <div>
            <label className="font-semibold mb-2 block">Tiêu đề</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Nhập tiêu đề bài viết"
            />
          </div>

          {/* Nội dung */}
          <div>
            <label className="font-semibold mb-2 block">Nội dung</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={6}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Nhập nội dung bài viết"
            />
          </div>

          {/* TeamId — chỉ hiện khi tạo mới */}
          {isAdding && (
            <div>
              <label className="font-semibold mb-2 block">Team ID</label>
              <input
                type="number"
                value={form.teamId || ""}
                onChange={(e) => setForm({ ...form, teamId: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="Nhập team ID"
              />
            </div>
          )}

          {/* AuthorId — chỉ hiện khi tạo mới */}
          {isAdding && (
            <div>
              <label className="font-semibold mb-2 block">Author ID</label>
              <input
                type="number"
                value={form.authorId || ""}
                onChange={(e) => setForm({ ...form, authorId: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="Nhập author ID"
              />
            </div>
          )}

          {/* ===== ACTIONS ===== */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={isCreating || isUpdating}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800 transition disabled:opacity-50"
            >
              ✓ {isAdding ? "Tạo" : "Lưu"}
            </button>

            {!isAdding && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 border border-red-400 text-red-500 px-4 py-2 rounded text-sm hover:bg-red-50 transition disabled:opacity-50"
              >
                🗑 Xóa
              </button>
            )}

            {isAdding && (
              <button
                onClick={() => { setIsAdding(false); setForm(EMPTY_FORM); }}
                className="flex items-center gap-2 border border-gray-300 text-gray-500 px-4 py-2 rounded text-sm hover:bg-gray-50 transition"
              >
                Hủy
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {posts.length === 0 && !isAdding && (
        <p className="text-gray-400 text-sm">Chưa có bài viết nào. Nhấn "Thêm bài viết" để bắt đầu.</p>
      )}
    </div>
  );
}
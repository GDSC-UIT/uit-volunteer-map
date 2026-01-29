import { useParams, Link, useLocation } from "react-router";
import editIcon from "@/assets/icons/edit.svg";
import { useState } from "react";
import FormationEditOverall from "@/components/ui/popups/FormationEditOverall";
import FormationEditRole from "@/components/ui/popups/FormationEditRole";
import PostCreatePopup from "@/components/ui/popups/post/PostCreatePopup";
import PostCreateChooseEditPopup from "@/components/ui/popups/post/PostCreateChooseEditPopup";
import PostCreatePublishEditPopup from "@/components/ui/popups/post/PostCreatePublishEditPopup";


export default function MyTeamPage() {
    const { teamId } = useParams<{ teamId: string }>();
    const location = useLocation();

    const [showOverall, setShowOverall] = useState(false);
    const [showRole, setShowRole] = useState(false);

    const [postStep, setPostStep] = useState<0 | 1 | 2 | null>(null);

    const commanders = Array.from({ length: 3 });
    const activities = Array.from({ length: 8 });

  return (
    <>
      {/* ===== POPUPS ===== */}
      {showOverall && (
        <FormationEditOverall onClose={() => setShowOverall(false)} />
      )}

      {showRole && (
        <FormationEditRole onClose={() => setShowRole(false)} />
      )}

    {/* ===== POST CREATE POPUPS ===== */}
    {postStep === 0 && (
    <PostCreatePopup
        onNext={() => setPostStep(1)}
        onClose={() => setPostStep(null)}
    />
    )}

    {postStep === 1 && (
    <PostCreateChooseEditPopup
        onBack={() => setPostStep(0)}
        onNext={() => setPostStep(2)}
    />
    )}

    {postStep === 2 && (
    <PostCreatePublishEditPopup
        onBack={() => setPostStep(1)}
        onSubmit={() => setPostStep(null)}
    />
    )}

      {/* ===== PAGE ===== */}
      <div className="bg-[#D9D9D9] py-8">
        {/* ===== HEADER ===== */}
        <section className="max-w-4xl mx-auto px-4 relative">
          <h1 className="text-center text-3xl font-black mb-8">
            Tên đội hình {teamId}
          </h1>

          {/* Edit team info */}
          <button
            onClick={() => setShowOverall(true)}
            className="absolute right-4 top-0 flex items-center gap-1 text-xs font-bold hover:underline"
          >
            <img src={editIcon} className="w-4 h-4" />
            Chỉnh sửa
          </button>
        </section>

        {/* ===== IMAGES ===== */}
        <section className="max-w-4xl mx-auto px-4 mb-10">
          <div className="bg-[#E6E6E6] rounded-xl p-6 flex items-center justify-center relative">
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

            <button
              onClick={() => setShowOverall(true)}
              className="absolute right-4 bottom-4 flex items-center gap-1 text-xs font-bold underline hover:opacity-80 transition"
            >
            <img src={editIcon} className="w-4 h-4" />
                Chỉnh sửa
            </button>
          </div>

          <div className="text-center mt-3 text-xs font-black text-gray-500">
            • • •
          </div>
        </section>

        {/* ===== DESCRIPTION ===== */}
        <section className="max-w-3xl mx-auto px-4 text-center mb-12">
          <p className="text-sm font-bold leading-relaxed text-black">
            Mô tả đội hình
          </p>
        </section>

        {/* ===== COMMANDERS ===== */}
        <section className="max-w-4xl mx-auto px-4 mb-14 relative">
          <h2 className="text-center font-black mb-6">Ban chỉ huy</h2>

          <button
            onClick={() => setShowRole(true)}
            className="absolute flex gap-1 right-4 top-0 text-xs underline" 
          >
            <img src={editIcon} className="w-4 h-4" />
            Edit chỉ huy
          </button>

          <div className="grid grid-cols-3 gap-8">
            {commanders.map((_, i) => (
              <div key={i} className="text-center">
                <div
                  onClick={() => setShowRole(true)}
                  className="cursor-pointer w-24 h-24 mx-auto rounded-full bg-[#E6E6E6] flex items-center justify-center mb-4"
                >
                  <div className="w-8 h-8 rounded-full bg-white/60" />
                </div>
                <div className="text-xs font-black">Chức vụ</div>
                <div className="text-xs font-bold text-gray-700">
                  Họ và tên
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== POSTS ===== */}
        <section className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-black">Hoạt động</h2>

            <button
            onClick={() => setPostStep(0)}
            className="text-xs font-bold underline"
            >
            + Tạo bài đăng
            </button>
          </div>

          <div className="grid grid-cols-4 gap-6">
            {activities.map((_, i) => (
              <div key={i} className="relative group">
                <Link
                  to={`post/${i + 1}`}
                  state={{ backgroundLocation: location }}
                  className="bg-[#E6E6E6] aspect-square flex items-center justify-center rounded-md hover:scale-105 transition"
                >
                  <div className="w-12 h-12 border-2 border-white rotate-45" />
                </Link>

                <Link
                  to={`post/${i + 1}`}
                  state={{ backgroundLocation: location }}
                  className="absolute top-1 right-1 text-[10px] bg-white px-1 rounded opacity-0 group-hover:opacity-100 transition"
                >
                  Edit
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

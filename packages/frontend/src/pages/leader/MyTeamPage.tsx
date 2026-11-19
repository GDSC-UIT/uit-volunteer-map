import { useParams, Link, useLocation } from "react-router";
import editIcon from "@/assets/icons/edit.svg";
import deleteIcon from "@/assets/icons/delete.svg";
import { useState } from "react";
import FormationEditOverall from "@/components/ui/popups/FormationEditOverall";
import FormationEditRole from "@/components/ui/popups/FormationEditRole";
import PostCreatePopup from "@/components/ui/popups/post/PostCreatePopup";
import PostDetailPopup from "@/components/ui/popups/post/PostDetailPopup";
import ConfirmDeletePopup from "@/components/ui/popups/ConfirmDeletePopup";


export default function MyTeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const location = useLocation();

  const [showOverall, setShowOverall] = useState(false);
  const [showRole, setShowRole] = useState(false);

  const [postStep, setPostStep] = useState<"upload" | "publish" | null>(null);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);

  const commanders = Array.from({ length: 3 });
  const activities = Array.from({ length: 8 });

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedPost, setSelectedPost] = useState<number | null>(null);

  


  return (
    <>
      {/* ===== POPUPS ===== */}
      {showOverall && (
        <FormationEditOverall onClose={() => setShowOverall(false)} />
      )}

      {showRole && <FormationEditRole onClose={() => setShowRole(false)} />}

      {/* ===== POST CREATE POPUPS ===== */}
      {postStep !== null && (
        <PostCreatePopup
          open={postStep === "upload"}
          maxFiles={4}
          onComplete={(imageUrls) => {
            setUploadedImageUrls(imageUrls);
            setPostStep("publish");
          }}
          onClose={() => setPostStep(null)}
        />
      )}

      {postStep !== null && (
        <PostDetailPopup
          open={postStep === "publish"}
          onClose={() => { setPostStep(null); setUploadedImageUrls([]); }}
          imageUrls={uploadedImageUrls}
          onBack={() => setPostStep("upload")}
          onSubmit={() => {
            setPostStep(null);
            setUploadedImageUrls([]);
          }}
        />
      )}

        {showDeletePopup && (
        <ConfirmDeletePopup
          itemName={`bài đăng ${(selectedPost ?? 0) + 1}`}
          onConfirm={() => {
            console.log("Delete post:", selectedPost);

            // chỗ này sau này gọi API xóa thật
            // handleDeletePost(selectedPost)

            setShowDeletePopup(false);
            setSelectedPost(null);
          }}
          onCancel={() => {
            setShowDeletePopup(false);
            setSelectedPost(null);
          }}
        />
      )}


      {/* ===== PAGE ===== */}
      <div className="pt-8 pb-4">

        {/* ===== HEADER ===== */}
        <section className="max-w-4xl mx-auto px-4 mb-8">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl wrap-anywhere font-black">
              Tên đội hình {teamId}
            </h1>
          </div>
        </section>


        {/* ===== IMAGES GALLERY ===== */}
        <section className="max-w-5xl mx-auto px-4 mb-12 flex flex-col items-center">

          <div className="leader-gallery">

            {/* MAIN IMAGE */}
            <div className="leader-gallery-main relative z-20 rounded-2xl overflow-hidden shadow-lg bg-white flex items-center justify-center">
              <span className="text-gray-600 text-sm">Ảnh chính</span>
            </div>

            {/* LEFT IMAGE */}
            <div className="
              leader-gallery-side leader-gallery-left z-10
              rounded-xl overflow-hidden shadow-md bg-white
              flex items-center justify-center
            ">
              <span className="text-gray-600 text-sm">Ảnh phụ</span>
            </div>

            {/* RIGHT IMAGE */}
            <div className="
              leader-gallery-side leader-gallery-right z-10
              rounded-xl overflow-hidden shadow-md bg-white
              flex items-center justify-center
            ">
              <span className="text-gray-600 text-sm">Ảnh phụ</span>
            </div>

          </div>

          {/* EDIT BUTTON */}
          <div className="w-full max-w-240 flex justify-end mt-3">
            <button
              aria-label="Chỉnh sửa thông tin đội hình" onClick={() => setShowOverall(true)}
              className="flex items-center gap-1 text-xs font-bold text-gray-600 min-h-11 px-3 hover:scale-110 transition"
            >
              <img alt="" src={editIcon} className="w-7 h-7 opacity-70" /> Chỉnh sửa
            </button>
          </div>

        </section>

        {/* ===== DESCRIPTION ===== */}
        <section className="max-w-3xl mx-auto px-4 text-center mb-12">
          <p className="text-sm font-bold wrap-anywhere leading-relaxed text-black">
            Mô tả đội hình
          </p>
        </section>

        {/* ===== COMMANDERS ===== */}
        <section className="max-w-4xl mx-auto px-4 mb-14 relative">
          <h2 className="text-center font-black mb-6">Ban chỉ huy</h2>


          <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-6 sm:gap-8">
            {commanders.map((_, i) => (
              <div key={i} className="min-w-0 text-center wrap-anywhere">
                <button aria-label={`Chỉnh sửa ban chỉ huy ${i + 1}`}
                  onClick={() => setShowRole(true)}
                  className="cursor-pointer w-24 h-24 mx-auto rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center mb-4"
                >
                  <div className="w-8 h-8 rounded-full bg-white/60" />
                </button>
                <div className="text-xs font-black">Chức vụ</div>
                <div className="text-xs font-bold text-gray-700">Họ và tên</div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== POSTS ===== */}
        <section className="max-w-4xl mx-auto px-4 mb-4">
          <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
            <h2 className="font-black">Hoạt động</h2>

            <button
              onClick={() => setPostStep("upload")}
              className="min-h-11 text-sm font-bold underline"
            >
              + Tạo bài đăng
            </button>
          </div>

          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-6">
            {activities.map((_, i) => (
              <div key={i} className="relative group">

                {/* POST THUMBNAIL */}
                <Link
                  aria-label={`Xem bài đăng ${i + 1}`} to={`post/${i + 1}`}
                  state={{ backgroundLocation: location }}
                  className="bg-white/80 backdrop-blur-sm aspect-square flex items-center justify-center rounded-md hover:scale-105 transition"
                >
                  <div className="w-12 h-12 border-2 border-white rotate-45" />
                </Link>

                <div className="flex flex-wrap justify-center gap-3 mt-3">
                  <button aria-label={`Xóa bài đăng ${i + 1}`}
                    onClick={() => { setSelectedPost(i); setShowDeletePopup(true); }}
                    className="w-11 h-11 rounded-full bg-red-400 flex items-center justify-center shadow-lg">
                    <img alt="" src={deleteIcon} className="w-6 h-6" />
                  </button>
                  <Link aria-label={`Chỉnh sửa bài đăng ${i + 1}`} to={`post/${i + 1}`}
                    state={{ backgroundLocation: location }}
                    className="w-11 h-11 rounded-full bg-gray-400 flex items-center justify-center shadow-lg">
                    <img alt="" src={editIcon} className="w-6 h-6" />
                  </Link>
                </div>

              </div>
            ))}
          </div>
        </section>
      </div>
    </>
    
  );
}

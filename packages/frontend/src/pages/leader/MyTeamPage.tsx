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
      {postStep === "upload" && (
        <PostCreatePopup
          maxFiles={4}
          onComplete={(imageUrls) => {
            setUploadedImageUrls(imageUrls);
            setPostStep("publish");
          }}
          onClose={() => setPostStep(null)}
        />
      )}

      {postStep === "publish" && (
        <PostDetailPopup
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
            <h1 className="text-3xl font-black">
              Tên đội hình {teamId}
            </h1>
          </div>
        </section>


        {/* ===== IMAGES GALLERY ===== */}
        <section className="max-w-5xl mx-auto px-4 mb-12 flex flex-col items-center">

          <div className="relative flex items-end justify-center">

            {/* MAIN IMAGE */}
            <div className="relative z-20 w-110 h-70 rounded-2xl overflow-hidden shadow-lg bg-white flex items-center justify-center">
              <span className="text-gray-400 text-sm">Ảnh chính</span>
            </div>

            {/* LEFT IMAGE */}
            <div className="
              absolute -left-40 bottom-12.5
              z-10 w-65 h-45
              rounded-xl overflow-hidden shadow-md bg-white
              flex items-center justify-center
            ">
              <span className="text-gray-400 text-sm">Ảnh phụ</span>
            </div>

            {/* RIGHT IMAGE */}
            <div className="
              absolute -right-40 bottom-12.5
              z-10 w-65 h-45
              rounded-xl overflow-hidden shadow-md bg-white
              flex items-center justify-center
            ">
              <span className="text-gray-400 text-sm">Ảnh phụ</span>
            </div>

          </div>

          {/* EDIT BUTTON */}
          <div className="w-full max-w-240 flex justify-end mr-1">
            <button
              onClick={() => setShowOverall(true)}
              className="flex items-center gap-1 text-xs font-bold text-gray-600 hover:scale-110 transition mr-20"
            >
              <img src={editIcon} className="w-7 h-7 opacity-70" />
            </button>
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


          <div className="grid grid-cols-3 gap-8">
            {commanders.map((_, i) => (
              <div key={i} className="text-center">
                <div
                  onClick={() => setShowRole(true)}
                  className="cursor-pointer w-24 h-24 mx-auto rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center mb-4"
                >
                  <div className="w-8 h-8 rounded-full bg-white/60" />
                </div>
                <div className="text-xs font-black">Chức vụ</div>
                <div className="text-xs font-bold text-gray-700">Họ và tên</div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== POSTS ===== */}
        <section className="max-w-4xl mx-auto px-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-black">Hoạt động</h2>

            <button
              onClick={() => setPostStep("upload")}
              className="text-xs font-bold underline"
            >
              + Tạo bài đăng
            </button>
          </div>

          <div className="grid grid-cols-4 gap-6">
            {activities.map((_, i) => (
              <div key={i} className="relative group">

                {/* POST THUMBNAIL */}
                <Link
                  to={`post/${i + 1}`}
                  state={{ backgroundLocation: location }}
                  className="bg-white/80 backdrop-blur-sm aspect-square flex items-center justify-center rounded-md hover:scale-105 transition"
                >
                  <div className="w-12 h-12 border-2 border-white rotate-45" />
                </Link>

                {/* ACTION BUTTONS (DELETE + EDIT) */}
                <div
                  className="
                    absolute inset-0 
                    opacity-0 group-hover:opacity-100 
                    transition
                    flex items-center justify-center
                  "
                >

                  {/* CONTAINER chứa 2 nút + dấu gạch */}
                  <div className="relative w-full h-full">

                    {/* DELETE BUTTON */}
                    <button
                      onClick={() => {
                        setSelectedPost(i);
                        setShowDeletePopup(true);
                      }}
                      className="
                        absolute
                        top-[18%] left-[18%]
                        w-14 h-14 rounded-full bg-red-400
                        flex items-center justify-center
                        hover:scale-110 transition
                        shadow-lg z-20
                      "
                    >
                      <img src={deleteIcon} className="w-6 h-6" />
                    </button>

                    {/* DẤU GẠCH CHÉO Ở GIỮA */}
                <div
                  className="
                    absolute inset-0
                    flex items-center justify-center
                    pointer-events-none
                  "
                >
                  <div
                    className="
                      w-[120px] h-[6px]
                      bg-white
                      -rotate-45
                      rounded-full
                      opacity-100
                      shadow
                    "
                  />
                </div>


                    {/* EDIT BUTTON */}
                    <Link
                      to={`post/${i + 1}`}
                      state={{ backgroundLocation: location }}
                      className="
                        absolute
                        bottom-[18%] right-[18%]
                        w-14 h-14 rounded-full bg-gray-400
                        flex items-center justify-center
                        hover:scale-110 transition
                        shadow-lg z-20
                      "
                    >
                      <img src={editIcon} className="w-6 h-6" />
                    </Link>

                  </div>
                </div>

              </div>
            ))}
          </div>
        </section>
      </div>
    </>
    
  );
}

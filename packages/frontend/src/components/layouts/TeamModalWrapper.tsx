import { Outlet, useParams, useLocation, useNavigate } from "react-router";
import PostModal from "@/pages/PostModal";

export default function TeamModalWrapper() {
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location };
  const params = useParams();
  const navigate = useNavigate();

  const handleClose = () => navigate(-1);
  
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const isModalOpen = !!state?.backgroundLocation && !!params.postId;

  return (
    <>
      <Outlet />
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-transparent"
          onClick={handleBackdropClick}
        >
          <PostModal />
        </div>
      )}
    </>
  );
}
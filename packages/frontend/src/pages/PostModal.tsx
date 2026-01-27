import { useNavigate, useParams } from "react-router";

export default function PostModal() {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();

  const handleClose = () => {
    navigate(-1);
  };

  return (
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          X
        </button>

        {/* Modal content */}
        <h2 className="text-2xl font-semibold mb-4 text-black">Thông tin bài post {postId}</h2>
        
        <div className="text-gray-700">
          <p>Chi tiết bài viết sẽ được hiển thị tại đây...</p>
        </div>
      </div>
  );
}
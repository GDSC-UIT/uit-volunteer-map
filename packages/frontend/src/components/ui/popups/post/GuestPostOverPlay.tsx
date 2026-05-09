import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import LinkIcon from "@heroicons/react/24/outline/LinkIcon";
import CalendarIcon from "@heroicons/react/24/outline/CalendarIcon";
import MapPinIcon from "@heroicons/react/24/outline/MapPinIcon";
import UserGroupIcon from "@heroicons/react/24/outline/UserGroupIcon";
import ArrowLeft from "@heroicons/react/24/outline/ArrowLeftIcon";
import ArrowRight from "@heroicons/react/24/outline/ArrowRightIcon";
import type { PostData } from "@/mocks/post.mock";
interface GuestPostOverlayProps {
  post: PostData | null;
  onClose?: () => void;
}

export default function GuestPostOverPlay({
  post,
  onClose,
}: GuestPostOverlayProps) {
  const {
    title,
    content,
    photos = [],
    createdAt,
    location,
    teamId,
  } = post || {};
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    // Reset slider khi mở post mới
    setCurrent(0);
  }, [post?.postId]);

  if (!post) return null;

  const next = () => setCurrent((current + 1) % photos.length);

  const prev = () => setCurrent((current - 1 + photos.length) % photos.length);

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-10000 text-black"
      onClick={onClose}
    >
      <div
        className="w-300 h-162.5 bg-white rounded-lg overflow-hidden flex"
        onClick={(e) => e.stopPropagation()}
      >
        {/* LEFT - IMAGE SLIDER */}
        <div className="relative w-[60%] bg-black flex items-center justify-center">
          {photos.length > 0 && (
            <img
              src={photos[current]}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
          {photos.length > 1 && (
            <>
              {/* Prev */}
              <button
                onClick={prev}
                className="
                    absolute left-4 top-1/2 -translate-y-1/2
                    w-10 h-10
                    bg-white
                    rounded-full
                    flex items-center justify-center
                    text-black text-2xl
                    shadow-md
                    hover:scale-105
                    active:scale-95
                    transition
                "
              >
                <ArrowLeft className="w-6 h-6" />
              </button>

              {/* Next */}
              <button
                onClick={next}
                className="
                    absolute right-4 top-1/2 -translate-y-1/2
                    w-10 h-10
                    bg-white
                    rounded-full
                    flex items-center justify-center
                    text-black text-2xl
                    shadow-md
                    hover:scale-105
                    active:scale-95
                    transition
                "
              >
                <ArrowRight className="w-6 h-6" />
              </button>
              {/* Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {photos.map((_: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrent(index)}
                    className={`w-2 h-2 rounded-full ${
                      current === index ? "bg-white" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* RIGHT - POST CONTENT */}
        <div className="w-[40%] flex flex-col border-l bg-[#FCF2DA]">
          {/* Header */}
          <div className="flex items-center gap-3 p-2 mt-10 mx-5">
            <span className="text-3xl font-heading">{title}</span>
          </div>

          {/* Caption */}
          <div className="flex-1 p-2 whitespace-pre-line overflow-y-auto text-sm mx-5 font-body">
            {content}
          </div>

          {/* Footer */}
          <div className="p-2 text-sm text-gray-500 mx-5">
            {/* Actions */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                {/* Copy Link icon */}
                <button
                  title="Share"
                  className="flex items-center hover:text-blue-500 transition"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>
                {createdAt && (
                  <span className="flex items-center gap-1 leading-none">
                    <CalendarIcon className="w-4 h-4" />
                    {new Date(createdAt).toLocaleDateString("vi-VN")}
                  </span>
                )}
                {location && (
                  <span className="flex items-center gap-1 leading-none">
                    <MapPinIcon className="w-4 h-4" />
                    {location}
                  </span>
                )}
              </div>
              {teamId && (
                <span className="flex items-center gap-1 leading-none">
                  <UserGroupIcon className="w-4 h-4" />
                  {teamId}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            border: "none",
            background: "#f0f0f0",
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            transition: "background 0.3s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#e0e0e0")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#f0f0f0")}
        >
          ✕
        </button>
      </div>
    </div>,
    document.body,
  );
}

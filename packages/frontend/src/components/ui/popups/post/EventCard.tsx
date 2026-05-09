import { PostData } from '@/mocks/post.mock';
import React, { useState, useEffect, useRef } from 'react';

interface EventCardProps {
  visible: boolean;
  data: PostData | null;
}

// Data khi không có data từ props
const NO_DATA: PostData = {
  postId: 0,
  title: "Không tìm thấy sự kiện",
  content: "",
  photos: [],
  teamId: 0,
  createdAt: new Date().toISOString(),
  location: "",
};

const EventCard: React.FC<EventCardProps> = ({ visible, data }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // 2. Ưu tiên data từ props, nếu không có thì dùng Mock Data
  const displayData = data && Object.keys(data).length > 0 ? data : NO_DATA;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!visible) return;

      let x = e.clientX + 20;
      let y = e.clientY + 20;

      // Giới hạn khung hình
      if (x + 288 > window.innerWidth) x = e.clientX - 288 - 20;
      if (y + 350 > window.innerHeight) y = e.clientY - 350 - 20;

      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [visible]);

  if (!visible) return null;

  return (
    <div 
      ref={cardRef}
      className="fixed z-9999 w-72 overflow-hidden rounded-[30px] shadow-2xl bg-[#FFF5DE] border-2 border-[#660000]/10 pointer-events-none transition-transform duration-75 ease-out"
      style={{ 
        left: `${mousePos.x}px`, 
        top: `${mousePos.y}px`,
      }}
    >
      {/* Thumbnail với hiệu ứng Overlay nhẹ, chỉ hiện khi có ảnh */}
      <div className="h-36 bg-[#DDE1E6] relative overflow-hidden">
        {displayData.photos && displayData.photos.length > 0 && (
          <>
            <img 
              src={displayData.photos[0]} 
              alt={displayData.title} 
              className="w-full h-full object-cover shadow-inner"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent"></div>
          </>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col items-center text-center">
        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-1 tracking-tight">
          {displayData.title}
        </h2>
        
        <p className="text-[#ED7A2D] text-[12px] font-bold uppercase tracking-widest mb-2">
          {displayData.location}
        </p>

        <p className="text-gray-700 text-[12px] leading-relaxed mb-4 line-clamp-3 italic">
          "{displayData.content}"
        </p>
      </div>

      {/* Trang trí góc (Optional - cho giống style skeuomorphic) */}
      <div className="absolute top-2 right-4 w-2 h-2 bg-white/50 rounded-full shadow-sm"></div>
    </div>
  );
};

export default EventCard;
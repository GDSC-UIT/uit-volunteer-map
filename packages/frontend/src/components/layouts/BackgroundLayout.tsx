import React, { useEffect, useState } from "react";
import bgBottom from "@/assets/background/background_bottom-01.svg";
import bgCloud from "@/assets/background/background_star_cloud-01.svg";
import Footer from "@/components/layouts/Footer";

interface Props {
  children: React.ReactNode;
}

export default function BackgroundLayout({ children }: Props) {
  const [offsetY, setOffsetY] = useState(0);
  const parallaxSpeed = 0.2;

  // Lắng nghe scroll để tạo hiệu ứng parallax
  useEffect(() => {
    const handleScroll = () => setOffsetY(window.scrollY * -parallaxSpeed);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative bg-[#FCDEAE] flex flex-col min-h-screen overflow-hidden">
      {/* Nội dung và background */}
      <div className="relative flex-1">
        {/* Ảnh nền lặp lại */}
        <div 
          className="absolute top-0 left-0 w-full h-full overflow-hidden"
          style={{
            backgroundImage: `url(${bgCloud})`,
            height: `${100 + (parallaxSpeed * 100)}%`,
            backgroundRepeat: "repeat-y",
            backgroundSize: "100% auto",
            backgroundPosition: "top center",
            transform: `translateY(${offsetY}px)`,
            transition: "transform 0.1s ease-out",
          }}
        />
        
        {/* Nội dung đè lên */}
        <div className="relative z-10">{children}</div>
      </div>

      {/* Hình bottom */}
      <div className="-mb-px z-20 leading-none">
        <img
          src={bgBottom}
          alt="background bottom"
          className="w-full block m-0 p-0 align-bottom"
        />
      </div>

      {/* Footer */}
      <div className="relative z-20">
        <Footer />
      </div>
    </div>
  );
}
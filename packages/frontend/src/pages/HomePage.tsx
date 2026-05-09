import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import PublicHeader from "@/components/layouts/PublicHeader";
import Footer from "@/components/layouts/Footer";

import mhx from "@/assets/icons/mhx.png";
import xtn from "@/assets/icons/xtn.png";
import bndHover from "@/assets/icons/bnd-ko-logo-1.png";

export default function HomePage() {
  const allImages = [
    "https://res.cloudinary.com/duallvqjh/image/upload/v1770283331/image-container_hvd34y.jpg",
    "https://res.cloudinary.com/duallvqjh/image/upload/v1770283324/image-container-2_seyjmk.jpg",
    "https://res.cloudinary.com/duallvqjh/image/upload/v1770283302/image-container-1_cydeau.jpg",
  ];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleThumbClick = (index: number) => {
    if (index === currentIndex || isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const prevSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, allImages.length]);

  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, allImages.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 3000);

    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#4B9ED8] to-[#285372]">
      <PublicHeader />

      <main className="flex-1">
        <section className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
          <div className="relative w-full h-[85vh] max-h-[980px] group overflow-hidden">
            {/* Sliding images container */}
            <div
              className="flex h-full transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {allImages.map((img, index) => (
                <div
                  key={index}
                  className="min-w-full h-full flex-shrink-0"
                  style={{
                    backgroundImage: `url(${img})`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                    backgroundColor: "#d3d3d3",
                  }}
                />
              ))}
            </div>

            {/* Prev button */}
            <button
              onClick={prevSlide}
              className="absolute left-6 top-1/2 -translate-y-1/2
                      bg-black/40 text-white w-10 h-10 rounded-full
                      opacity-0 group-hover:opacity-100 transition"
            >
              ‹
            </button>

            {/* Next button */}
            <button
              onClick={nextSlide}
              className="absolute right-6 top-1/2 -translate-y-1/2
                      bg-black/40 text-white w-10 h-10 rounded-full
                      opacity-0 group-hover:opacity-100 transition"
            >
              ›
            </button>

            {/* Thumbnails */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
              {allImages.map((img, index) => {
                const isActive = index === currentIndex;
                return (
                  <button
                    key={index}
                    onClick={() => handleThumbClick(index)}
                    className={`relative transition-transform duration-300 ${
                      isActive ? "scale-110" : "scale-95"
                    }`}
                  >
                    <img
                      src={img}
                      className="w-36 h-16 object-cover rounded-md"
                    />
                    {!isActive && (
                      <div className="absolute inset-0 bg-black/50 rounded-md" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="text-white py-24">
          <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-10">
            <img src="/Homepage_Logo.svg" className="w-56" />
            <p className="font-semibold text-base leading-relaxed">
              UITVolunteer là một trang web tổng hợp các chiến dịch tình nguyện
              đã và đang được tổ chức tại Trường Đại học Công nghệ Thông tin –
              ĐHQG TP.HCM. Đây là nơi các bạn chiến sĩ có thể nhìn lại những
              chặng đường đã qua, cũng như những hình ảnh, bài đăng của từng
              chiến dịch, đồng thời đóng góp những dấu ấn cá nhân của mình.
            </p>
          </div>

          <h2 className="text-center mt-24 mb-20 text-5xl font-extrabold tracking-widest">
            Chiến Dịch
          </h2>

          <div className="max-w-4xl mx-auto grid grid-cols-2 gap-24 place-items-center">
            <div className="relative group flex flex-col items-center gap-6">
              <Link to="/campaign/xtn">
                <img
                  src={xtn}
                  className="w-40 h-40 object-contain cursor-pointer"
                  alt="Xuân Tình Nguyện"
                />
              </Link>

              <div
                className="absolute -top-6 left-1/2 -translate-x-1/2
                            flex gap-3 bg-white/95 p-2 rounded-xl shadow-lg
                            opacity-0 scale-95 pointer-events-none
                            transition-all duration-300
                            group-hover:opacity-100
                            group-hover:scale-100
                            group-hover:pointer-events-auto"
              >
                {[2026].map((y) => (
                  <Link key={y} to={`/campaign/xtn`} className="w-16 h-16">
                    <img
                      src={bndHover}
                      className="w-full h-full object-contain"
                      alt={`XTN ${y}`}
                    />
                  </Link>
                ))}
              </div>
            </div>

            <div
              className="flex flex-col items-center gap-6"
              title="Chiến dịch chưa diễn ra"
            >
              <img src={mhx} className="w-40 h-40 object-contain opacity-50" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

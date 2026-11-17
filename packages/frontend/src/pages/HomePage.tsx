import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import PublicHeader from "@/components/layouts/PublicHeader";
import Footer from "@/components/layouts/Footer";

import { useCampaigns } from '@/hooks/useCampaigns';
import ReadState from '@/components/ui/ReadState';

export default function HomePage() {
  const query = useCampaigns();
  const campaigns = query.data ?? [];
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

          <div id="campaigns" className="max-w-4xl mx-auto px-4">
            <ReadState pending={query.isPending} error={query.error} label="chiến dịch" empty={campaigns.length===0} onRetry={query.refetch} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 place-items-center">
              {campaigns.map(campaign=><Link key={campaign.campaignId} to={`/campaign/${campaign.campaignId}`} className="flex flex-col items-center gap-4 text-center">
                <img src={campaign.attachments[0]?.imageUrl ?? '/Homepage_Logo.svg'} alt="" className="w-40 h-40 object-contain" />
                <h3 className="font-bold text-xl">{campaign.campaignName}</h3>
                <p>{campaign.startDate} — {campaign.endDate}</p>
              </Link>)}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

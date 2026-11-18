import { Link } from "react-router";
import { useEffect, useRef, useState } from "react";
import banhChungPin from "@/assets/icons/Formation-pin-slider.png";
import type { TeamReadDto } from "@uit-volunteer-map/shared";

interface TeamItemProps {
  team: TeamReadDto;
}

const TeamItem = ({ team }: TeamItemProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [opacity, setOpacity] = useState(0);
  const [translateY, setTranslateY] = useState(50);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      if (ref.current.contains(document.activeElement) || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        setOpacity(1); setTranslateY(0); return;
      }

      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Fade in from bottom, fade out at top
      let newOpacity = 1;
      if (rect.top > windowHeight * 0.7) {
        // Entering from bottom
        newOpacity = Math.max(
          0,
          1 - (rect.top - windowHeight * 0.7) / (windowHeight * 0.3),
        );
      } else if (rect.bottom < windowHeight * 0.3) {
        // Exiting at top
        newOpacity = Math.max(0, rect.bottom / (windowHeight * 0.3));
      }

      // Translate effect (slide up as it appears)
      const newTranslateY =
        rect.top > windowHeight * 0.7
          ? Math.min(50, (rect.top - windowHeight * 0.7) / 5)
          : 0;

      setOpacity(newOpacity);
      setTranslateY(newTranslateY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={ref}
      className="flex w-full min-w-0 items-start mb-12 lg:mb-24 transition-all duration-300 ease-out motion-reduce:transition-none"
      onFocusCapture={() => { setOpacity(1); setTranslateY(0); }}
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {/* Pin */}
      <div className="w-14 sm:w-24 lg:w-35 mr-3 sm:mr-6 lg:mr-10 shrink-0 flex justify-center relative z-10">
        <img
          src={banhChungPin}
          alt=""
          className="w-12 sm:w-20 lg:w-27.5 h-auto drop-shadow-lg transition-transform duration-500 motion-reduce:transition-none hover:scale-110 hover:rotate-[5deg]"
        />
      </div>

      {/* Content */}
      <div className="min-w-0 grow pt-2">
        <h3 className="text-3xl lg:text-[3.5rem] font-black text-red-700 mb-2 leading-tight wrap-anywhere">
          {team.teamName}
        </h3>
        <p className="text-lg lg:text-2xl text-black mb-6 wrap-anywhere">
          <strong>Ban chỉ huy:</strong> {team.leaders.map(leader=>leader.fullName).join(', ') || 'Chưa có thông tin'}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 lg:gap-10 items-stretch sm:items-center">
          {/* Image */}
          <div className="min-w-0 flex-7 rounded-[35px] overflow-hidden shadow-2xl group">
            {(team.imageUrl || team.attachments[0]?.imageUrl) ? <img
              src={team.imageUrl ?? team.attachments[0]?.imageUrl}
              alt={team.teamName}
              className="w-full block transition-transform duration-500 group-hover:scale-[1.08]"
            /> : <p className="p-8 bg-white/60">Chưa có ảnh đội hình</p>}
          </div>
          {/* Button */}
          <div className="min-w-0 flex-3">
            <Link
              to={`/campaign/${team.campaignId}/team/${team.teamId}`}
              className="inline-block max-w-full bg-red-700 text-white text-base sm:text-xl lg:text-2xl font-extrabold py-3 lg:py-5 px-4 sm:px-8 lg:px-16 rounded-full shadow-[0_15px_35px_rgba(185,28,28,0.4)] transition-all duration-300 hover:bg-rose-600 hover:-translate-y-2 hover:shadow-[0_20px_45px_rgba(185,28,28,0.5)] whitespace-normal lg:whitespace-nowrap focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#023A54]"
            >
              Xem thêm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamItem;

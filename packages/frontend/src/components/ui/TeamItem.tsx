import { Link } from "react-router";
import { useEffect, useRef, useState } from "react";
import banhChungPin from "@/assets/icons/Formation-pin-slider.png";
import { TeamData } from "@/mocks/team.mock";

interface TeamItemProps {
  team: TeamData;
}

const TeamItem = ({ team }: TeamItemProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [opacity, setOpacity] = useState(0);
  const [translateY, setTranslateY] = useState(50);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

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
      className="flex min-w-0 items-start mb-12 lg:mb-24 transition-all duration-300 ease-out"
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {/* Pin */}
      <div className="w-10 mr-3 lg:w-35 lg:mr-10 shrink-0 flex justify-center relative z-10">
        <img
          src={banhChungPin}
          alt=""
          className="w-10 lg:w-27.5 h-auto drop-shadow-lg transition-transform duration-500 hover:scale-110 hover:rotate-[5deg]"
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pt-2">
        <h3 className="text-2xl sm:text-4xl lg:text-[3.5rem] font-black text-red-700 mb-2 leading-tight wrap-anywhere">
          {team.teamName}
        </h3>
        <div className="flex flex-col lg:flex-row gap-2 lg:gap-10 text-base sm:text-xl lg:text-2xl text-black mb-6">
          <span>
            <span className="font-bold">Đội trưởng:</span>{" "}
            <span className="font-normal">{team.leader.name}</span>
          </span>

          <span>
            <span className="font-bold">Đội phó:</span>{" "}
            <span className="font-normal">{team.vice[0].name}</span>
          </span>
        </div>
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-10 items-stretch lg:items-center">
          {/* Image */}
          <div className="min-w-0 w-full lg:flex-7 rounded-[35px] overflow-hidden shadow-2xl group">
            <img
              src={team.images[0]}
              alt={team.teamName}
              className="w-full block transition-transform duration-500 group-hover:scale-[1.08]"
            />
          </div>
          {/* Button */}
          <div className="lg:flex-3">
            <Link
              to={`team/${team.teamId}`}
              className="inline-block bg-red-700 text-white text-lg lg:text-2xl font-extrabold py-3 lg:py-5 px-6 lg:px-16 rounded-full shadow-[0_15px_35px_rgba(185,28,28,0.4)] transition-all duration-300 hover:bg-rose-600 hover:-translate-y-2 hover:shadow-[0_20px_45px_rgba(185,28,28,0.5)] whitespace-nowrap"
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

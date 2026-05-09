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
      className="flex items-start mb-24 transition-all duration-300 ease-out"
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {/* Pin */}
      <div className="w-35 mr-10 shrink-0 flex justify-center relative z-10">
        <img
          src={banhChungPin}
          alt="pin"
          className="w-27.5 h-auto drop-shadow-lg transition-transform duration-500 hover:scale-110 hover:rotate-[5deg]"
        />
      </div>

      {/* Content */}
      <div className="grow pt-2">
        <h3 className="text-[3.5rem] font-black text-red-700 mb-2 leading-none">
          {team.teamName}
        </h3>
        <div className="flex gap-10 text-2xl text-black mb-6">
          <span>
            <span className="font-bold">Đội trưởng:</span>{" "}
            <span className="font-normal">{team.leader.name}</span>
          </span>

          <span>
            <span className="font-bold">Đội phó:</span>{" "}
            <span className="font-normal">{team.vice[0].name}</span>
          </span>
        </div>
        <div className="flex gap-10 items-center">
          {/* Image */}
          <div className="flex-7 rounded-[35px] overflow-hidden shadow-2xl group">
            <img
              src={team.images[0]}
              alt={team.teamName}
              className="w-full block transition-transform duration-500 group-hover:scale-[1.08]"
            />
          </div>
          {/* Button */}
          <div className="flex-3">
            <Link
              to={`team/${team.teamId}`}
              className="inline-block bg-red-700 text-white text-2xl font-extrabold py-5 px-16 rounded-full shadow-[0_15px_35px_rgba(185,28,28,0.4)] transition-all duration-300 hover:bg-rose-600 hover:-translate-y-2 hover:shadow-[0_20px_45px_rgba(185,28,28,0.5)] whitespace-nowrap"
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

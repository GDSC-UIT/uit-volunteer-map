import { useState, useEffect } from "react";

const useCountUp = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smoother animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);

      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [end, duration]);

  return count;
};

const StatItem = ({ num, label }: { num: string; label: string }) => {
  const animatedNum = useCountUp(parseInt(num), 2000);

  return (
    <div className="flex items-center">
      {/* CỘT SỐ: Cố định độ rộng và ép nội dung sang phải */}
      <div className="flex justify-end w-30 mr-6">
        <span className="stats-number text-[80px] b">{animatedNum}</span>
      </div>

      {/* CỘT CHỮ: Căn lề trái tự nhiên */}
      <div className="flex-1">
        <span className="stats-label text-[35px] uppercase">{label}</span>
      </div>
    </div>
  );
};

const Statistic = () => {
  const stats = [
    { num: "268", label: "Chiến sĩ" },
    { num: "9", label: "Đội hình" },
    { num: "4", label: "Địa bàn" },
  ];

  return (
    <div className="flex flex-col gap-2 pl-12 justify-center">
      {stats.map((item, index) => (
        <StatItem key={index} num={item.num} label={item.label} />
      ))}
    </div>
  );
};

export default Statistic;

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

const StatItem = ({ num, label }: { num: number | undefined; label: string }) => {
  const animatedNum = useCountUp(num ?? 0, 2000);

  return (
    <div className="flex items-center">
      {/* CỘT SỐ: Cố định độ rộng và ép nội dung sang phải */}
      <div className="flex justify-end w-24 shrink-0 mr-4">
        <span className="stats-number text-6xl lg:text-[80px] b">{num === undefined ? '—' : animatedNum}</span>
      </div>

      {/* CỘT CHỮ: Căn lề trái tự nhiên */}
      <div className="flex-1">
        <span className="stats-label text-2xl lg:text-[35px] uppercase">{label}</span>
      </div>
    </div>
  );
};

interface Props { postCount?: number; teamCount?: number; mappedCount?: number; }
const Statistic = ({ postCount, teamCount, mappedCount }: Props) => {
  const stats = [
    { num: postCount, label: "Bài đăng" },
    { num: teamCount, label: "Đội hình" },
    { num: mappedCount, label: "Điểm bài đăng" },
  ];

  return (
    <div role="group" aria-label="Thống kê chiến dịch" className="flex flex-col gap-2 w-full max-w-sm justify-center">
      {stats.map((item, index) => (
        <StatItem key={index} num={item.num} label={item.label} />
      ))}
    </div>
  );
};

export default Statistic;

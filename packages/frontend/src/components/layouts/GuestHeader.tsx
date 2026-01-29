import { Link } from "react-router";
import { useEffect, useState, useRef } from "react";

const SECTIONS = ["info", "teams", "activities"] as const;
type SectionId = (typeof SECTIONS)[number];

export default function GuestHeader() {
  const [active, setActive] = useState<SectionId | null>(null);
  const isClickingRef = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isClickingRef.current) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id as SectionId);
          }
        });
      },
      {
        rootMargin: "-80px 0px -50% 0px",
        threshold: 0,
      }
    );

    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleClick = (id: SectionId) => {
    isClickingRef.current = true;
    setActive(id);

    setTimeout(() => {
      isClickingRef.current = false;
    }, 400);
  };

  const navItem = (id: SectionId, label: string) => (
    <a
      href={`#${id}`}
      onClick={() => handleClick(id)}
      className={`relative text-xs font-bold transition
        ${active === id ? "text-blue-600" : "text-black"}
      `}
    >
      {label}
      {active === id && (
        <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-blue-600" />
      )}
    </a>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-black/10">
      <div className="max-w-6xl mx-auto h-14 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xs text-gray-700">
          <span>✉</span>
          <span>Logo chiến dịch</span>
        </div>

        <nav className="flex gap-10">
          {navItem("info", "Thông tin")}
          {navItem("teams", "Đội hình")}
          {navItem("activities", "Hoạt động")}
        </nav>

        <Link
          to="/login"
          className="text-xs font-bold px-3 py-1 border border-black/20 rounded hover:bg-gray-100"
        >
          Đăng nhập
        </Link>
      </div>
    </header>
  );
}

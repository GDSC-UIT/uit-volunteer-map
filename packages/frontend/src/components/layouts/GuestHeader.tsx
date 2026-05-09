import { Link } from "react-router";
import { useEffect, useState, useRef } from "react";
import bndLogo from "@/assets/icons/bnd.png";

const SECTIONS = ["info", "teams", "activities"] as const;
type SectionId = (typeof SECTIONS)[number];

export default function GuestHeader() {
  const [active, setActive] = useState<SectionId | null>("info");
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
        rootMargin: "-90px 0px -50% 0px",
        threshold: 0,
      },
    );

    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: SectionId,
  ) => {
    e.preventDefault();
    isClickingRef.current = true;
    setActive(id);

    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }

    setTimeout(() => {
      isClickingRef.current = false;
    }, 800);
  };

  const navItem = (id: SectionId, label: string) => {
    const isActive = active === id;

    return (
      <a
        key={id}
        href={`#${id}`}
        onClick={(e) => handleClick(e, id)}
        className={`
          relative inline-block font-heading
          text-lg
          transition-all duration-200
          group
          ${isActive ? "text-red-600" : "text-black hover:text-red-500"}
        `}
      >
        {label}

        <span
          className={`
            absolute -bottom-2 left-0
            h-[3px] w-full
            bg-red-600
            origin-left
            transition-transform duration-200
            ${
              isActive
                ? "scale-x-100"
                : "scale-x-0 group-hover:scale-x-100 hover:text-red-500"
            }
          `}
        />
      </a>
    );
  };

  return (
    <header
      className="
        sticky top-0 left-0 right-0
        z-[9999]
        bg-[#F5B311]
        border-b-2 border-black/20
      "
    >
      <div className="max-w-6xl mx-auto h-16 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={bndLogo} className="h-8" />
        </div>

        <nav className="flex gap-16 text-lg">
          {navItem("info", "Thông tin")}
          {navItem("teams", "Đội hình")}
          {navItem("activities", "Hoạt động")}
        </nav>

        <Link
          to="/login"
          className="
            text-sm font-black px-4 py-1 rounded
            border-2 border-black
            hover:bg-black hover:text-white transition
          "
        >
          Đăng nhập
        </Link>
      </div>
    </header>
  );
}

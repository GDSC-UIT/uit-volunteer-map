import { Link, useLocation, useParams } from "react-router";
import { useCallback, useEffect, useState, useRef } from "react";
import bndLogo from "@/assets/icons/bnd.png";

const SECTIONS = ["info", "teams", "activities"] as const;
type SectionId = (typeof SECTIONS)[number];

export default function GuestHeader() {
  const { campaignId } = useParams();
  const { pathname, hash } = useLocation();
  const campaignPath = `/campaign/${campaignId}`;
  const headerRef = useRef<HTMLElement>(null);
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
        rootMargin: `-${headerRef.current?.offsetHeight ?? 80}px 0px -50% 0px`,
        threshold: 0,
      },
    );

    if (pathname !== campaignPath) setActive(null);
    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [pathname, campaignPath]);

  const scrollToSection = useCallback((id: SectionId) => {
    const element = document.getElementById(id);
    if (!element) return;
    isClickingRef.current = true;
    setActive(id);
    const headerOffset = (headerRef.current?.getBoundingClientRect().height ?? 66) + 14;
    window.scrollTo({
      top: element.getBoundingClientRect().top + window.scrollY - headerOffset,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
    setTimeout(() => { isClickingRef.current = false; }, 800);
  }, []);

  useEffect(() => {
    const id = hash.slice(1) as SectionId;
    if (pathname !== campaignPath || !SECTIONS.includes(id)) return;
    const frame = requestAnimationFrame(() => scrollToSection(id));
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash, campaignPath, scrollToSection]);

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: SectionId,
  ) => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    if (pathname === campaignPath && document.getElementById(id)) {
      e.preventDefault();
      scrollToSection(id);
    }
  };

  const navItem = (id: SectionId, label: string) => {
    const isActive = active === id;

    return (
      <Link
        key={id}
        to={`${campaignPath}#${id}`}
        aria-current={isActive ? 'location' : undefined}
        onClick={(e) => handleClick(e, id)}
        className={`
          relative inline-flex items-center justify-center min-h-11 md:min-h-0 font-heading
          text-base md:text-lg whitespace-nowrap rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black
          transition-all duration-200
          group
          ${isActive ? "text-red-600" : "text-black hover:text-red-500"}
        `}
      >
        {label}

        <span
          className={`
            absolute bottom-0 md:-bottom-2 left-0
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
      </Link>
    );
  };

  return (
    <header
      ref={headerRef}
      className="
        sticky top-0 left-0 right-0
        z-[9999]
        bg-[#F5B311]
        border-b-2 border-black/20
      "
    >
      <div className="max-w-6xl mx-auto min-h-16 px-4 py-2 md:px-6 md:py-0 flex flex-wrap items-center justify-between gap-x-4 md:h-16 md:flex-nowrap">
        <Link to={campaignPath} aria-label="Trang chiến dịch Xuân Tình Nguyện" className="shrink-0 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">
          <img src={bndLogo} alt="Xuân Tình Nguyện" className="h-8 w-auto" />
        </Link>

        <nav aria-label="Điều hướng chiến dịch" className="order-3 w-full flex flex-wrap justify-between gap-x-3 md:order-none md:w-auto md:gap-8 lg:gap-16 text-lg">
          {navItem("info", "Thông tin")}
          {navItem("teams", "Đội hình")}
          {navItem("activities", "Hoạt động")}
        </nav>

        <Link
          to="/login"
          className="
            text-sm font-black px-4 py-1 rounded shrink-0 whitespace-nowrap inline-flex items-center min-h-11 md:min-h-0
            border-2 border-black
            hover:bg-black hover:text-white transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black
          "
        >
          Đăng nhập
        </Link>
      </div>
    </header>
  );
}

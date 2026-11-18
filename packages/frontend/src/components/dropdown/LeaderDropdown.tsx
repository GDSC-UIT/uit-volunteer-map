import { useState, useRef, useEffect, useId } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import LogoutConfirmPopup from "@/components/ui/popups/LogoutConfirmPopup";

export default function LeaderDropdown() {
  const [open, setOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const logoutRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    void logout();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    if (open) logoutRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef} onKeyDown={event => {
      if (event.key === 'Escape' && open) { event.stopPropagation(); setOpen(false); triggerRef.current?.focus(); }
    }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      {/* BUTTON */}
      <button
        ref={triggerRef}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 font-semibold min-h-11 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      >
        {/* Icon */}
        <div className="text-[#8B0000]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z" />
          </svg>
        </div>

        <span>Xin chào!</span>

        <span
          className={`transition-transform duration-150 ${
            open ? "rotate-180" : "rotate-0"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </span>
      </button>

      {/* DROPDOWN MENU */}
      {open && (
        <div
          id={panelId}
          className="
            absolute right-0 mt-2 w-40 bg-white
            border-2 border-[#8B0000] rounded-lg
            shadow-lg z-40 overflow-hidden p-1
          "
        >
          <button
            ref={logoutRef}
            onClick={() => {
              setOpen(false);
              triggerRef.current?.focus();
              setShowPopup(true);
            }}
            className="flex items-center justify-between w-full min-h-11 px-3 py-2 hover:bg-gray-100 rounded-md font-semibold focus-visible:outline-2 focus-visible:outline-black"
          >
            <span>Đăng xuất</span>

            {/* Icon logout */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M16 13v-2H7V8l-5 4 5 4v-3z" />
              <path d="M20 3H12c-1.1 0-2 .9-2 2v4h2V5h8v14h-8v-4h-2v4c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
            </svg>
          </button>
        </div>
      )}

      {/* POPUP CONFIRM */}
      {showPopup && (
        <LogoutConfirmPopup
          onConfirm={handleLogout}
          onCancel={() => setShowPopup(false)}
        />
      )}
    </div>
  );
}

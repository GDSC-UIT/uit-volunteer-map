import { Link } from "react-router";
import uitLogo from "@/assets/icons/uitvolunteer.svg";

export default function PublicHeader() {
  return (
    <header
      className="
        w-full
        bg-gradient-to-r
        from-[#94DDFF]
        via-[#0480BA]
        to-[#023A54]
        shadow-md
      "
    >
      <div
        className="
          max-w-[1920px]
          mx-auto
          min-h-16
          px-4 sm:px-6 lg:px-20
          flex
          flex-wrap gap-3 py-2
          items-center
          justify-between
        "
      >

        <Link to="/" aria-label="UITVolunteer — Trang chủ" className="shrink-0 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          <img
            src={uitLogo}
            alt="UITVolunteer"
            className="h-7 w-auto drop-shadow-sm"
          />
        </Link>

        <Link
          to="/login"
          className="
            bg-white
            text-[#023A54]
            text-sm
            shrink-0 whitespace-nowrap inline-flex items-center min-h-11 sm:min-h-0
            font-bold
            px-5
            py-2
            rounded-full
            shadow
            transition-all
            hover:bg-blue-100
            hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white
          "
        >
          Đăng nhập
        </Link>
      </div>
    </header>
  );
}

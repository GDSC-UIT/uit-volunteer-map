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
          h-16
          px-20
          flex
          items-center
          justify-between
        "
      >

        <div className="flex items-center gap-3">
          <img
            src={uitLogo}
            alt="UITVolunteer"
            className="h-7 w-auto drop-shadow-sm"
          />
        </div>

        <Link
          to="/login"
          className="
            bg-white
            text-[#023A54]
            text-sm
            font-bold
            px-5
            py-2
            rounded-full
            shadow
            transition-all
            hover:bg-blue-100
            hover:scale-105
          "
        >
          Đăng nhập
        </Link>
      </div>
    </header>
  );
}
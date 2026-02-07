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
      </div>
    </header>
  );
}

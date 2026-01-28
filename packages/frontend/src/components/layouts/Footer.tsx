export default function Footer() {
  return (
    <footer className="bg-black text-white mt-20">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">

          <div>
            <div className="font-bold text-base mb-2">UITVolunteer</div>
            <div className="text-white/60 text-xs">
              UITVolunteer © 2026. All rights reserved.
            </div>
          </div>

          <div className="space-y-1 text-xs text-white/80">
            <div className="font-semibold text-white">Trang chủ</div>
            <div>Liên hệ: hsvdhcntt@hoisinhvientphcm.com</div>
            <div>facebook.com/tuoitre.uit</div>
            <div>Khu phố 34, Phường Linh Xuân, TP.HCM</div>
          </div>

          <div className="md:text-right text-xs text-white/60">
            <div>UITVolunteer</div>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { Link } from "react-router";
import PublicHeader from "@/components/layouts/PublicHeader";
import Footer from "@/components/layouts/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#CFCFCF]">
      <PublicHeader />
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-4 pt-4">
          <div className="bg-[#BDBDBD] h-80 flex flex-col items-center justify-center gap-6">

            <div className="flex gap-4">
              <div className="w-28 h-16 bg-black rounded-sm" />
              <div className="w-28 h-16 bg-black rounded-sm" />
              <div className="w-28 h-16 bg-black rounded-sm" />
            </div>
            <div className="text-black font-bold">...</div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
            <div>
              <div className="text-2xl font-bold text-black/70">
                UITVolunteer
              </div>
              <div className="text-xs font-bold text-black/40 tracking-widest">
                XXXXXXX
              </div>
            </div>

            <div>
              <p className="font-bold text-sm text-black leading-relaxed">
                Mô tả chiến dịch.
              </p>

              <h2 className="text-center mt-8 font-bold tracking-widest">
                CHIẾN DỊCH
              </h2>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-16">
            <Link to="campaign/456" className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-white/70 border border-black/10 rounded-md" />
              <span className="text-xs font-bold text-black">
                Mùa hè Xanh
              </span>
            </Link>

            <Link to="campaign/123" className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-white/70 border border-black/10 rounded-full" />
              <span className="text-xs font-bold text-black">
                Xuân Tình Nguyện
              </span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

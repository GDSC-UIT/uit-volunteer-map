import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import PublicHeader from '@/components/layouts/PublicHeader';
import Footer from '@/components/layouts/Footer';
import { useCampaigns } from '@/hooks/useCampaigns';
import ReadState from '@/components/ui/ReadState';

const images = ['/homepage/slide-01.jpg', '/homepage/slide-02.jpg', '/homepage/slide-03.jpg'];
export default function HomePage() {
  const query = useCampaigns();
  const campaigns = query.data ?? [];
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setCurrent(index => (index + 1) % images.length), 5000);
    return () => clearInterval(timer);
  }, [playing]);
  const select = (index: number) => { setPlaying(false); setCurrent((index + images.length) % images.length); };
  const control = 'absolute top-1/2 -translate-y-1/2 bg-black/60 text-white w-11 h-11 rounded-full text-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';
  return <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#4B9ED8] to-[#285372]">
    <PublicHeader />
    <main className="flex-1">
      <h1 className="sr-only">UITVolunteer — Các chiến dịch tình nguyện</h1>
      <section aria-label="Ảnh hoạt động tình nguyện" aria-roledescription="trình chiếu" onFocusCapture={() => setPlaying(false)} onMouseEnter={() => setPlaying(false)} className="relative w-full">
        <div className="relative w-full h-[65svh] min-h-80 sm:h-[85vh] max-h-[980px] overflow-hidden">
          <div className="flex h-full transition-transform duration-500 ease-in-out motion-reduce:transition-none" style={{ transform: `translateX(-${current * 100}%)` }}>
            {images.map((src, index) => <img key={src} src={src} alt={`Ảnh hoạt động tình nguyện ${index + 1}`} aria-hidden={index !== current} fetchPriority={index === 0 ? 'high' : 'auto'} className="min-w-full w-full h-full shrink-0 object-cover bg-gray-300" />)}
          </div>
          <button aria-label="Ảnh trước" onClick={() => select(current - 1)} className={`${control} left-4 sm:left-6`}>‹</button>
          <button aria-label="Ảnh tiếp theo" onClick={() => select(current + 1)} className={`${control} right-4 sm:right-6`}>›</button>
          <div className="absolute bottom-17 left-1/2 -translate-x-1/2 flex justify-center gap-3 w-[min(90%,29rem)]">
            {images.map((src, index) => <button key={src} aria-label={`Xem ảnh ${index + 1}`} aria-pressed={current === index} onClick={() => select(index)} className={`min-w-0 flex-1 max-w-36 rounded-md border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${current === index ? 'border-white' : 'border-transparent opacity-75'}`}>
              <img src={src} alt="" className="w-full h-12 sm:h-16 object-cover rounded-md" />
            </button>)}
          </div>
          <div className="absolute bottom-3 left-0 w-full flex flex-wrap items-center justify-center gap-3 text-white">
            <p aria-live={playing ? 'off' : 'polite'} aria-atomic="true" className="rounded bg-black/60 px-3 py-2">Ảnh {current + 1} / {images.length}</p>
            <button onClick={() => setPlaying(value => !value)} aria-pressed={playing} className="min-h-11 px-4 rounded bg-black/70 border border-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{playing ? 'Dừng trình chiếu' : 'Bắt đầu trình chiếu'}</button>
          </div>
        </div>
      </section>
      <section className="text-white py-24">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-10">
          <img src="/Homepage_Logo.svg" alt="UITVolunteer" className="w-56 max-w-full" />
          <p className="font-semibold text-base leading-relaxed">UITVolunteer là một trang web tổng hợp các chiến dịch tình nguyện đã và đang được tổ chức tại Trường Đại học Công nghệ Thông tin – ĐHQG TP.HCM. Đây là nơi các bạn chiến sĩ có thể nhìn lại những chặng đường đã qua, cũng như những hình ảnh, bài đăng của từng chiến dịch, đồng thời đóng góp những dấu ấn cá nhân của mình.</p>
        </div>
        <h2 className="text-center mt-24 mb-20 text-4xl sm:text-5xl font-extrabold tracking-widest">Chiến Dịch</h2>
        <div id="campaigns" className="max-w-4xl mx-auto px-4">
          <ReadState pending={query.isPending} error={query.error} label="chiến dịch" empty={campaigns.length === 0} onRetry={query.refetch} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 place-items-center">
            {campaigns.map(campaign => <Link key={campaign.campaignId} to={`/campaign/${campaign.campaignId}`} className="flex min-w-0 flex-col items-center gap-4 text-center rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              <img src={campaign.attachments[0]?.imageUrl ?? '/Homepage_Logo.svg'} alt="" className="w-40 h-40 object-contain" />
              <h3 className="font-bold text-xl wrap-anywhere">{campaign.campaignName}</h3><p>{campaign.startDate} — {campaign.endDate}</p>
            </Link>)}
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </div>;
}

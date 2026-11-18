import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
export default function RouteErrorPage() {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => title.current?.focus(), []);
  return <main className="min-h-screen flex items-center justify-center p-6">
    <div className="max-w-lg space-y-5 text-center">
      <h1 ref={title} tabIndex={-1} className="text-3xl font-bold">Không thể tải trang</h1>
      <p role="alert">Trang chưa tải được đầy đủ. Hãy tải lại để thử lại.</p>
      <div className="flex flex-wrap gap-4 justify-center">
        <button onClick={() => window.location.reload()} className="min-h-11 rounded bg-[#023A54] text-white px-5 py-3">Tải lại trang</button>
        <Link to="/" className="min-h-11 underline px-5 py-3">Về trang chủ</Link>
      </div>
    </div>
  </main>;
}

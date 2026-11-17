import { isNotFound } from '@/hooks/readState';
interface Props { pending: boolean; error: unknown; label: string; empty?: boolean; onRetry: () => unknown; }
export default function ReadState({pending,error,label,empty,onRetry}:Props) {
  if(pending) return <p role="status" className="p-4 text-center">Đang tải {label}…</p>;
  if(error) return <div role="alert" className="p-4 text-center">
    <p>{isNotFound(error) ? `Không tìm thấy ${label}.` : `Không thể tải ${label}.`}</p>
    {!isNotFound(error) && <button onClick={()=>void onRetry()} className="mt-2 rounded bg-[#023A54] px-4 py-3 text-white">Thử lại {label}</button>}
  </div>;
  if(empty) return <p className="p-4 text-center">Chưa có {label}.</p>;
  return null;
}

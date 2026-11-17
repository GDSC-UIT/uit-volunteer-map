import { useState, useEffect } from 'react';
import type { PostDetailDto } from '@uit-volunteer-map/shared';
import ArrowLeft from '@heroicons/react/24/outline/ArrowLeftIcon';
import ArrowRight from '@heroicons/react/24/outline/ArrowRightIcon';
interface Props { post: PostDetailDto; onClose: () => void; }
/** Existing two-panel guest detail skin, rendered by a reloadable route. */
export default function GuestPostOverPlay({post,onClose}:Props) {
  const [current,setCurrent]=useState(0);
  useEffect(()=>setCurrent(0),[post.postId]);
  const active=Math.min(current,Math.max(0,post.photos.length-1));
  return <div className="max-w-6xl mx-auto px-4 py-8 text-black">
    <button onClick={onClose} className="mb-4 underline min-h-11">Quay lại danh sách</button>
    <div className="bg-white rounded-lg overflow-hidden flex flex-col md:flex-row">
      <div className="relative md:w-[60%] bg-black flex items-center justify-center min-h-60">
        {post.photos.length ? <img src={post.photos[active].imageUrl} alt={`${post.title} — ảnh ${active+1}`} className="w-full max-h-[650px] object-contain" /> : <p className="text-white p-8">Chưa có ảnh.</p>}
        {post.photos.length>1 && <>
          <button aria-label="Ảnh trước" onClick={()=>setCurrent((active-1+post.photos.length)%post.photos.length)} className="absolute left-4 top-1/2 w-11 h-11 bg-white rounded-full flex items-center justify-center"><ArrowLeft className="w-6 h-6" /></button>
          <button aria-label="Ảnh tiếp theo" onClick={()=>setCurrent((active+1)%post.photos.length)} className="absolute right-4 top-1/2 w-11 h-11 bg-white rounded-full flex items-center justify-center"><ArrowRight className="w-6 h-6" /></button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 rounded p-1">
            {post.photos.map((photo,index)=><button key={photo.photoId} onClick={()=>setCurrent(index)} aria-label={`Xem ảnh ${index+1}`} aria-pressed={index===active} className="w-8 h-8 text-white rounded border">{index+1}</button>)}
          </div>
        </>}
      </div>
      <div className="md:w-[40%] min-w-0 bg-[#FCF2DA] p-6 flex flex-col gap-4">
        <h1 className="text-3xl font-heading wrap-anywhere">{post.title}</h1>
        <p className="whitespace-pre-line text-sm font-body wrap-anywhere">{post.content}</p>
        <p className="text-sm text-gray-700">{post.team.teamName}</p>
        {post.author && <p className="text-sm">{post.author.fullName}</p>}
        <time dateTime={post.createdAt} className="text-sm text-gray-700">{new Date(post.createdAt).toLocaleDateString('vi-VN')}</time>
      </div>
    </div>
  </div>;
}

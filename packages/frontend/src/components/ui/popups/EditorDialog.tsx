import { useEffect, useId, useRef, type ReactNode } from 'react';

export default function EditorDialog({ title, children, onClose, pending = false }: {
  title: string; children: ReactNode; onClose: () => void; pending?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current!;
    const opener = document.activeElement;
    dialog.showModal();
    return () => { dialog.close(); if (opener instanceof HTMLElement && opener.isConnected) opener.focus(); };
  }, []);
  return <dialog ref={ref} aria-labelledby={titleId} aria-modal="true" aria-busy={pending}
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const targets = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button, input, textarea, select, a[href], [tabindex]'))
        .filter(element => !element.matches(':disabled') && element.tabIndex >= 0 && element.getClientRects().length > 0);
      const first = targets[0], last = targets.at(-1);
      if (!first || !last) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}
    onCancel={event => { event.preventDefault(); if (!pending) onClose(); }}
    className="m-auto w-[min(94vw,760px)] max-h-[90dvh] overflow-y-auto rounded-xl border-0 p-0 bg-[#FFF5DA] text-black shadow-xl backdrop:bg-black/40">
    <div className="flex items-center justify-between gap-4 bg-[#C4161C] px-4 py-2 text-white">
      <h2 id={titleId} className="font-bold wrap-anywhere">{title}</h2>
      <button type="button" disabled={pending} onClick={onClose} aria-label="Đóng" className="min-h-11 min-w-11 rounded border border-white/50 disabled:opacity-50">✕</button>
    </div>
    {children}
  </dialog>;
}

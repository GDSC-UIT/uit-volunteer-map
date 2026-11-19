import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  open?: boolean;
  className?: string;
}

let scrollLocks = 0;
let previousOverflow = '';

/** Native top-layer modal: inert background, shared focus and scroll lifecycle. */
export default function Dialog({ title, children, onClose, open = true, className = '' }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  const titleId = useId();
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (scrollLocks++ === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    dialog.showModal();
    (dialog.querySelector<HTMLElement>('[data-dialog-initial-focus]') ?? dialog).focus();

    const cancel = (event: Event) => {
      event.preventDefault();
      closeRef.current?.();
    };
    const trapTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button, a[href], input, select, textarea, [tabindex]',
      )).filter((el) => el.tabIndex >= 0 && !el.matches(':disabled') && el.getClientRects().length > 0);
      const first = controls[0];
      const last = controls.at(-1);
      if (!first) { event.preventDefault(); dialog.focus(); return; }
      const active = document.activeElement;
      const outsideTabOrder = !controls.includes(active as HTMLElement);
      if (event.shiftKey && (active === first || outsideTabOrder)) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && (active === last || outsideTabOrder)) {
        event.preventDefault(); first.focus();
      }
    };
    dialog.addEventListener('cancel', cancel);
    dialog.addEventListener('keydown', trapTab);
    return () => {
      dialog.removeEventListener('cancel', cancel);
      dialog.removeEventListener('keydown', trapTab);
      dialog.close();
      if (--scrollLocks === 0) document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [open]);

  return createPortal(
    <dialog ref={ref} tabIndex={-1} aria-labelledby={titleId} aria-modal="true" className={`shared-dialog ${className}`}>
      <h2 id={titleId} className="sr-only">{title}</h2>
      {children}
    </dialog>,
    document.body,
  );
}

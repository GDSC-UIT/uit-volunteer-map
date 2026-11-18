import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router';

export default function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const initialFocus = document.activeElement;
    let focused = false;
    const focusHeading = () => {
      if (focused) return;
      const heading = document.querySelector<HTMLElement>('h1');
      if (!heading || heading.getClientRects().length === 0) return;
      focused = true;
      observer.disconnect();
      // A freshly mounted editor dialog owns focus; never pull it behind the modal.
      if (document.querySelector('dialog[open], [aria-expanded="true"]')) return;
      if (document.activeElement !== initialFocus && document.activeElement !== document.body) return;
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    };
    const observer = new MutationObserver(focusHeading);
    observer.observe(document.body, { childList: true, subtree: true });
    focusHeading();
    const timeout = setTimeout(() => observer.disconnect(), 15000);
    return () => { clearTimeout(timeout); observer.disconnect(); };
  }, [pathname]);
  return null;
}

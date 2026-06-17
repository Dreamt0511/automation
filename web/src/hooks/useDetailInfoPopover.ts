import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

const DETAIL_INFO_BREAKPOINT_PX = 980;
const DETAIL_INFO_CLOSE_MS = 150;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function isNarrowDetailLayout(): boolean {
  return window.matchMedia(`(max-width: ${DETAIL_INFO_BREAKPOINT_PX}px)`).matches;
}

type UseDetailInfoPopoverOptions = {
  enabled: boolean;
};

type UseDetailInfoPopoverResult = {
  infoButtonRef: RefObject<HTMLButtonElement | null>;
  statusSectionRef: RefObject<HTMLElement | null>;
  isOpen: boolean;
  toggle: () => void;
  close: (options?: { immediate?: boolean }) => void;
};

export function useDetailInfoPopover({
  enabled,
}: UseDetailInfoPopoverOptions): UseDetailInfoPopoverResult {
  const infoButtonRef = useRef<HTMLButtonElement>(null);
  const statusSectionRef = useRef<HTMLElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const positionFrameRef = useRef<number | null>(null);

  const positionPopover = useCallback(() => {
    const button = infoButtonRef.current;
    const section = statusSectionRef.current;
    if (!button || !section || button.classList.contains('hidden')) return;

    const triggerRect = button.getBoundingClientRect();
    const viewportPadding = 14;
    const width = Math.min(320, window.innerWidth - viewportPadding * 2);
    const left = clamp(
      triggerRect.right - width,
      viewportPadding,
      window.innerWidth - width - viewportPadding,
    );
    const top = Math.max(viewportPadding, triggerRect.bottom + 8);
    section.style.setProperty('--detail-info-popover-left', `${left}px`);
    section.style.setProperty('--detail-info-popover-top', `${top}px`);
  }, []);

  const queuePosition = useCallback(() => {
    if (positionFrameRef.current) {
      window.cancelAnimationFrame(positionFrameRef.current);
    }
    positionFrameRef.current = window.requestAnimationFrame(() => {
      positionFrameRef.current = null;
      positionPopover();
    });
  }, [positionPopover]);

  const close = useCallback(
    (options: { immediate?: boolean } = {}) => {
      const immediate = Boolean(options.immediate);
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      if (positionFrameRef.current) {
        window.cancelAnimationFrame(positionFrameRef.current);
        positionFrameRef.current = null;
      }

      setIsOpen(false);
      document.body.classList.remove('detail-info-open');

      if (immediate || !isNarrowDetailLayout()) {
        document.body.classList.remove('detail-info-closing');
        return;
      }

      document.body.classList.add('detail-info-closing');
      closeTimerRef.current = window.setTimeout(() => {
        document.body.classList.remove('detail-info-closing');
        closeTimerRef.current = null;
      }, DETAIL_INFO_CLOSE_MS);
    },
    [],
  );

  const open = useCallback(() => {
    if (!enabled || !isNarrowDetailLayout()) return;
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    document.body.classList.remove('detail-info-closing');
    document.body.classList.add('detail-info-open');
    setIsOpen(true);
    queuePosition();
  }, [enabled, queuePosition]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
      return;
    }
    open();
  }, [close, isOpen, open]);

  useEffect(() => {
    if (!enabled) {
      close({ immediate: true });
    }
  }, [close, enabled]);

  useEffect(() => {
    if (!isOpen) return;
    queuePosition();
  }, [isOpen, queuePosition]);

  useEffect(() => {
    const handleResize = () => {
      if (isNarrowDetailLayout()) {
        if (isOpen) queuePosition();
        return;
      }
      close({ immediate: true });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [close, isOpen, queuePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleDocumentClick = () => {
      close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [close, isOpen]);

  useEffect(
    () => () => {
      close({ immediate: true });
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      if (positionFrameRef.current) window.cancelAnimationFrame(positionFrameRef.current);
    },
    [close],
  );

  return {
    infoButtonRef,
    statusSectionRef,
    isOpen,
    toggle,
    close,
  };
}

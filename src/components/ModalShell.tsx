import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useDeviceType } from '../hooks/useMediaQuery';

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string; // desktop max width, default max-w-[420px]
  showCloseButton?: boolean;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-[420px]',
  showCloseButton = true,
}) => {
  const { isMobile } = useDeviceType();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // Store previously focused element and restore on close
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement;
      // Focus the dialog container itself to satisfy accessibility (screen readers announce dialog)
      // without drawing a premature focus ring on the close button or first interactive child
      dialogRef.current?.focus({ preventScroll: true });
    } else {
      previouslyFocusedElementRef.current?.focus();
    }
  }, [isOpen]);

  // Esc key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Scrim with 8px blur */}
      <div
        className="fixed inset-0 scrim-translucent transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Sheet on Mobile / Dialog on Desktop */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`relative z-10 w-full outline-none bg-surface text-text overflow-hidden transition-all duration-[220ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          isMobile
            ? 'rounded-t-dialog max-h-[90dvh] pb-[max(16px,env(safe-area-inset-bottom))] shadow-floating animate-in slide-in-from-bottom'
            : `rounded-dialog ${maxWidth} p-7 shadow-floating animate-in fade-in zoom-in-95`
        }`}
      >
        {/* Mobile Grabber */}
        {isMobile && (
          <div className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
            <div className="w-9 h-1.5 bg-text-2/25 rounded-full" />
          </div>
        )}

        {/* Header / Title if provided */}
        {(title || showCloseButton) && (
          <div className={`flex items-center justify-between ${isMobile ? 'px-6 pt-2 pb-3' : 'mb-5'}`}>
            {title ? (
              <h2 className="text-[20px] font-semibold text-text leading-tight">{title}</h2>
            ) : <div />}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="w-8 h-8 flex items-center justify-center rounded-control text-text-2 hover:text-text hover:bg-surface-2 transition-colors focus-visible:ring-2 focus-visible:ring-focus"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={isMobile ? 'px-6 pb-6 overflow-y-auto max-h-[calc(90dvh-70px)]' : ''}>
          {children}
        </div>
      </div>
    </div>
  );
};

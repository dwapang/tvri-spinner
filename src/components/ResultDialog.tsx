import React, { useState, useRef, useLayoutEffect } from 'react';
import { ModalShell } from './ModalShell';
import { useI18n } from '../i18n/useI18n';
import type { Item, Slice } from '../types';

interface ResultDialogProps {
  isOpen: boolean;
  item: Item | null;
  slice: Slice | null;
  spinNo: number;
  onConfirm: (winnerName?: string) => void;
  onConfirmAndSpinAgain: (winnerName?: string) => void;
  onUndo: () => void;
  onClose: () => void;
  isFullscreen?: boolean;
}

export const ResultDialog: React.FC<ResultDialogProps> = ({
  isOpen,
  item,
  spinNo,
  onConfirm,
  onConfirmAndSpinAgain,
  onUndo,
  onClose,
  isFullscreen = false,
}) => {
  const { t } = useI18n();
  const [winnerName, setWinnerName] = useState('');
  const textRef = useRef<HTMLHeadingElement>(null);

  // Closing the dialog counts as Confirm
  const handleDismiss = () => {
    onConfirm(winnerName);
    onClose();
  };

  const handleConfirmOnly = () => {
    onConfirm(winnerName);
    setWinnerName('');
  };

  const handleConfirmAndSpinAgain = () => {
    onConfirmAndSpinAgain(winnerName);
    setWinnerName('');
  };

  const handleUndo = () => {
    onUndo();
    setWinnerName('');
  };

  useLayoutEffect(() => {
    if (!isOpen || !textRef.current) return;
    const el = textRef.current;

    const fitText = () => {
      // Presentation mode: hero-sized starting at up to 64px or 8vw; standard dialog: 32px
      let size = isFullscreen ? Math.min(Math.max(window.innerWidth * 0.06, 44), 64) : 32;
      const minSize = 20;
      el.style.fontSize = `${size}px`;
      el.style.lineHeight = '1.24';

      // Height constraint: standard dialog fits within max ~3 lines (~128px), presentation fits within ~35vh
      const maxH = isFullscreen ? Math.max(window.innerHeight * 0.35, 180) : 128;

      // Step down in 2px decrements until it fits comfortably
      while (size > minSize) {
        if (el.scrollHeight <= maxH && el.scrollWidth <= el.clientWidth + 2) {
          break;
        }
        size -= 2;
        el.style.fontSize = `${size}px`;
      }
    };

    fitText();

    const handleResize = () => fitText();
    window.addEventListener('resize', handleResize);
    window.addEventListener('fullscreenchange', handleResize);
    if (document.fonts?.ready) {
      document.fonts.ready.then(fitText).catch(() => {});
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('fullscreenchange', handleResize);
    };
  }, [isOpen, item?.name, isFullscreen]);

  if (!item) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleDismiss}
      showCloseButton={true}
      maxWidth={isFullscreen ? 'max-w-[min(90vw,680px)]' : 'max-w-[440px]'}
    >
      <div className="flex flex-col items-center text-center">
        {/* Caption */}
        <span className="text-[13px] font-medium text-text-2 tracking-normal mb-2">
          {t('spinCount', { n: spinNo })}
        </span>

        {/* Prize Name with vertical padding to prevent descender clipping */}
        <div className="w-full mb-6 px-1 flex justify-center">
          <h2
            ref={textRef}
            style={{
              paddingBlock: '0.12em',
              textWrap: 'balance',
              overflowWrap: 'anywhere',
              hyphens: 'auto',
            }}
            className="font-semibold text-text max-w-full"
          >
            {item.name}
          </h2>
        </div>

        {/* Optional Ticket / Winner Input */}
        <div className="w-full text-left mb-6">
          <label className="block text-[13px] font-medium text-text-2 mb-1.5">
            {t('winnerInputLabel')}
          </label>
          <input
            type="text"
            value={winnerName}
            onChange={e => setWinnerName(e.target.value)}
            placeholder={t('winnerInputPlaceholder')}
            className="w-full h-11 px-3.5 bg-surface-2 rounded-control text-[15px] text-text placeholder:text-text-2/60 border border-transparent focus:border-transparent focus-visible:ring-2 focus-visible:ring-focus transition-all"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleConfirmAndSpinAgain();
              }
            }}
          />
        </div>

        {/* Stacked Full-Width Actions */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleConfirmAndSpinAgain}
            className="w-full h-12 bg-brand text-white rounded-control font-medium text-[16px] hover:bg-brand-hover active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-focus shadow-sm"
          >
            {t('confirmAndSpinAgain')}
          </button>

          <button
            type="button"
            onClick={handleConfirmOnly}
            className="w-full h-11 bg-surface-2 text-text rounded-control font-medium text-[15px] hover:bg-surface-2/80 active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-focus"
          >
            {t('confirm')}
          </button>

          <button
            type="button"
            onClick={handleUndo}
            className="w-full h-9 text-[14px] text-text-2 hover:text-danger font-medium transition-colors focus-visible:ring-2 focus-visible:ring-focus"
          >
            {t('undoLastWin')}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

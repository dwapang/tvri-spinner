import React, { useState } from 'react';
import { Shuffle } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';

interface SpinButtonProps {
  isSpinning: boolean;
  disabled?: boolean;
  onClick: () => void;
  onShuffle?: () => void;
  isShuffleDisabled?: boolean;
  fullWidth?: boolean;
  hideSpaceHint?: boolean;
}

export const SpinButton: React.FC<SpinButtonProps> = ({
  isSpinning,
  disabled = false,
  onClick,
  onShuffle,
  isShuffleDisabled = false,
  fullWidth = false,
  hideSpaceHint = false,
}) => {
  const { t } = useI18n();
  const [animatingShuffle, setAnimatingShuffle] = useState(false);

  const handleShuffleClick = () => {
    if (disabled || isSpinning || isShuffleDisabled || !onShuffle) return;
    setAnimatingShuffle(true);
    onShuffle();
    setTimeout(() => {
      setAnimatingShuffle(false);
    }, 600);
  };

  return (
    <div className={`flex flex-col items-center ${fullWidth ? 'w-full' : 'w-full max-w-[360px]'}`}>
      <div className="w-full flex items-center justify-center gap-2 sm:gap-2.5">
        {/* Main SPIN Button */}
        <button
          type="button"
          disabled={disabled || isSpinning}
          onClick={onClick}
          className={`flex-1 h-14 rounded-full font-medium text-[17px] text-white transition-all duration-150 select-none shadow-sm flex items-center justify-center focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 active:scale-[0.98] ${
            disabled || isSpinning
              ? 'bg-brand/50 cursor-not-allowed text-white/80'
              : 'bg-brand hover:bg-brand-hover active:bg-brand-hover cursor-pointer'
          }`}
        >
          {isSpinning ? t('spinning') : t('spin')}
        </button>

        {/* 56px Circle Shuffle Button */}
        {onShuffle && (
          <button
            type="button"
            disabled={disabled || isSpinning || isShuffleDisabled}
            onClick={handleShuffleClick}
            title={t('shuffleWheel')}
            aria-label={t('shuffleWheel')}
            className={`w-14 h-14 min-w-[56px] min-h-[56px] rounded-full flex items-center justify-center transition-all duration-150 border border-hairline focus-visible:ring-2 focus-visible:ring-focus active:scale-[0.95] ${
              disabled || isSpinning || isShuffleDisabled
                ? 'bg-surface-2/50 text-text-2/40 cursor-not-allowed'
                : 'bg-surface-2 hover:bg-surface-2/80 text-text cursor-pointer hover:text-brand'
            }`}
          >
            <Shuffle
              size={22}
              strokeWidth={2}
              className={`transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                animatingShuffle ? 'rotate-[360deg]' : ''
              }`}
            />
          </button>
        )}
      </div>

      {/* Subtle Space Key Hint for fine-pointer desktop */}
      {!hideSpaceHint && (
        <div className="fine-pointer-only items-center justify-center gap-1.5 mt-2.5 text-[12px] text-text-2">
          <span>{t('pressSpaceToSpin').split('Space')[0]}</span>
          <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-medium text-text bg-surface-2 border border-hairline rounded-[6px] shadow-sm leading-none">
            Space
          </kbd>
          <span>{t('pressSpaceToSpin').split('Space')[1] || ''}</span>
        </div>
      )}
    </div>
  );
};

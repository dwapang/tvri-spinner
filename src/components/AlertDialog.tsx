import React, { useEffect } from 'react';
import { useI18n } from '../i18n/useI18n';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isDestructive?: boolean;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  isDestructive = true,
}) => {
  const { t } = useI18n();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="fixed inset-0 scrim-translucent" onClick={onClose} />

      <div className="relative z-10 w-full max-w-[320px] bg-surface rounded-panel overflow-hidden shadow-floating border border-hairline animate-in fade-in zoom-in-95">
        <div className="p-5 text-center">
          <h3 className="text-[17px] font-semibold text-text mb-1 leading-snug">{title}</h3>
          <p className="text-[13px] text-text-2 leading-relaxed">{message}</p>
        </div>

        <div className="grid grid-cols-2 border-t border-hairline divide-x divide-hairline">
          <button
            type="button"
            onClick={onClose}
            className="h-11 text-[15px] font-medium text-text hover:bg-surface-2 active:bg-surface-2/80 transition-colors focus-visible:ring-2 focus-visible:ring-focus"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`h-11 text-[15px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-focus hover:bg-surface-2 active:bg-surface-2/80 ${
              isDestructive ? 'text-danger' : 'text-brand'
            }`}
          >
            {confirmLabel || (isDestructive ? t('delete') : t('confirm'))}
          </button>
        </div>
      </div>
    </div>
  );
};

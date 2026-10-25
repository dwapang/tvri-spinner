import React, { useState, useEffect } from 'react';
import { ModalShell } from './ModalShell';
import { useI18n } from '../i18n/useI18n';
import type { Item, PaletteType } from '../types';
import { getItemColor, BLUE_PALETTE, COLORFUL_PALETTE } from '../lib/palettes';

interface PrizeFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, qty: number, color?: string) => void;
  onDelete?: (id: string) => void;
  item?: Item | null;
  existingItems: Item[];
  palette: PaletteType;
  nextColorIndex?: number;
}

export const PrizeFormDialog: React.FC<PrizeFormDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  item,
  existingItems,
  palette,
  nextColorIndex = 0,
}) => {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [customColor, setCustomColor] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setName(item.name);
        setQty(item.qty);
        setCustomColor(item.color);
      } else {
        setName('');
        setQty(1);
        setCustomColor(undefined);
      }
      setError(null);
    }
  }, [isOpen, item]);

  // Check duplicate warning
  const isDuplicate = existingItems.some(
    it => it.name.trim().toLowerCase() === name.trim().toLowerCase() && it.id !== item?.id
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('nameRequired'));
      return;
    }
    onSave(trimmed, qty, customColor);
    onClose();
  };

  // Preview color if auto
  const previewItem: Item = {
    id: item?.id ?? 'preview',
    name: name || 'Preview',
    qty,
    colorIndex: item?.colorIndex ?? nextColorIndex,
  };
  const autoColor = getItemColor(previewItem, palette);

  const presetColors = [
    ...BLUE_PALETTE.slice(0, 4),
    ...COLORFUL_PALETTE.slice(0, 6),
    '#E11D48',
    '#7C3AED',
    '#059669',
    '#D97706',
  ];

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={item ? t('editPrize') : t('addPrize')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name input */}
        <div>
          <label className="block text-[13px] font-medium text-text-2 mb-1.5">
            {t('prizeNameLabel')}
          </label>
          <input
            type="text"
            required
            maxLength={40}
            value={name}
            onChange={e => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder={t('prizeNamePlaceholder')}
            className="w-full h-11 px-3.5 bg-surface-2 rounded-control text-[15px] text-text placeholder:text-text-2/60 border border-transparent focus:border-transparent focus-visible:ring-2 focus-visible:ring-focus transition-all"
          />
          {error && <p className="mt-1.5 text-[12px] text-danger">{error}</p>}
          {isDuplicate && !error && (
            <p className="mt-1.5 text-[12px] text-amber-600 dark:text-amber-400">
              {t('duplicateNameWarning')}
            </p>
          )}
        </div>

        {/* Quantity input */}
        <div>
          <label className="block text-[13px] font-medium text-text-2 mb-1.5">
            {t('quantityLabel')}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={999}
              value={qty}
              onChange={e => {
                const parsed = parseInt(e.target.value, 10);
                setQty(isNaN(parsed) ? 0 : Math.max(0, Math.min(999, parsed)));
              }}
              className="w-24 h-11 px-3 bg-surface-2 rounded-control text-[15px] font-medium text-text tabular-nums border border-transparent focus-visible:ring-2 focus-visible:ring-focus"
            />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setQty(q => Math.max(0, q - 1))}
                className="w-11 h-11 flex items-center justify-center bg-surface-2 rounded-control text-text font-medium text-[16px] active:scale-95 transition-all hover:bg-surface-2/80"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setQty(q => Math.min(999, q + 1))}
                className="w-11 h-11 flex items-center justify-center bg-surface-2 rounded-control text-text font-medium text-[16px] active:scale-95 transition-all hover:bg-surface-2/80"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Custom Color (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[13px] font-medium text-text-2">
              {t('customColorLabel')}
            </label>
            {customColor !== undefined && (
              <button
                type="button"
                onClick={() => setCustomColor(undefined)}
                className="text-[12px] text-brand hover:underline font-medium"
              >
                {t('useWheelColor')}
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {/* Auto swatch preview option */}
            <button
              type="button"
              onClick={() => setCustomColor(undefined)}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-control border text-[13px] transition-all ${
                customColor === undefined
                  ? 'border-brand bg-brand-soft/60 text-brand font-medium'
                  : 'border-hairline bg-surface-2/40 text-text-2 hover:text-text'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border border-hairline shadow-sm"
                  style={{ backgroundColor: autoColor }}
                />
                <span>{t('autoFollowsWheel')}</span>
              </div>
              {customColor === undefined && (
                <span className="text-[12px] font-semibold">Active</span>
              )}
            </button>

            {/* Color swatches */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {presetColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCustomColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-7 h-7 rounded-full border-2 transition-transform active:scale-90 ${
                    customColor === color ? 'border-text scale-110 shadow-sm' : 'border-transparent'
                  }`}
                  title={color}
                />
              ))}
              {/* Native color picker */}
              <label
                className="relative w-7 h-7 rounded-full border border-hairline flex items-center justify-center cursor-pointer hover:scale-105 transition-transform overflow-hidden shadow-sm bg-gradient-to-tr from-blue-400 via-rose-400 to-amber-300"
                title="Custom color picker"
              >
                <input
                  type="color"
                  value={customColor || autoColor}
                  onChange={e => setCustomColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-3 flex flex-col gap-2">
          <button
            type="submit"
            className="w-full h-11 bg-brand text-white rounded-control font-medium text-[15px] hover:bg-brand-hover active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-focus shadow-sm"
          >
            {t('save')}
          </button>

          {item && onDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete(item.id);
                onClose();
              }}
              className="w-full h-10 text-[14px] text-danger font-medium hover:bg-danger/10 rounded-control transition-colors"
            >
              {t('deletePrize')}
            </button>
          )}
        </div>
      </form>
    </ModalShell>
  );
};

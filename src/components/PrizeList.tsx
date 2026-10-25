import React, { useState, useRef, useEffect } from 'react';
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Item, PaletteType } from '../types';
import { getItemColor } from '../lib/palettes';
import { Stepper } from './Stepper';
import { useI18n } from '../i18n/useI18n';

interface PrizeListProps {
  items: Item[];
  palette: PaletteType;
  isSpinning: boolean;
  onAddItem: () => void;
  onEditItem: (item: Item) => void;
  onDeleteItem: (id: string) => void;
  onAdjustQty: (id: string, delta: number) => void;
  onLoadSampleData: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
  onClearAll: () => void;
  onResetStock: () => void;
}

export const PrizeList: React.FC<PrizeListProps> = ({
  items,
  palette,
  isSpinning,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onAdjustQty,
  onLoadSampleData,
  onExportJson,
  onImportJson,
  onClearAll,
  onResetStock,
}) => {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const totalUnits = items.reduce((sum, it) => sum + (it.qty > 0 ? it.qty : 0), 0);
  const allGivenAway = items.length > 0 && totalUnits === 0;

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [menuOpen]);

  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-4 border-b border-hairline">
        <div>
          <h2 className="text-[20px] font-semibold text-text leading-tight">{t('prizes')}</h2>
          <p className="text-[13px] text-text-2 mt-0.5 tabular-nums">
            {items.length === 1
              ? t('singlePrizeSummary', { units: totalUnits })
              : t('prizesSummary', { prizes: items.length, units: totalUnits })}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={isSpinning}
            onClick={onAddItem}
            className="h-9 px-3.5 bg-brand text-white rounded-control text-[14px] font-medium flex items-center gap-1.5 hover:bg-brand-hover active:scale-[0.98] transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-focus shadow-sm"
          >
            <Plus size={16} strokeWidth={2} />
            <span>{t('addPrize')}</span>
          </button>

          {/* More actions menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              disabled={isSpinning}
              onClick={() => setMenuOpen(!menuOpen)}
              title={t('moreActions')}
              aria-label={t('moreActions')}
              aria-expanded={menuOpen}
              className="w-9 h-9 flex items-center justify-center rounded-control text-text-2 hover:text-text hover:bg-surface-2 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-focus"
            >
              <MoreHorizontal size={18} strokeWidth={1.75} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-10 z-40 w-48 bg-surface rounded-control shadow-floating border border-hairline py-1 animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onLoadSampleData();
                  }}
                  className="w-full text-left px-3.5 py-2 text-[14px] text-text hover:bg-surface-2 transition-colors"
                >
                  {t('loadSampleData')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onExportJson();
                  }}
                  className="w-full text-left px-3.5 py-2 text-[14px] text-text hover:bg-surface-2 transition-colors"
                >
                  {t('exportJson')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onImportJson();
                  }}
                  className="w-full text-left px-3.5 py-2 text-[14px] text-text hover:bg-surface-2 transition-colors"
                >
                  {t('importJson')}
                </button>
                <div className="my-1 border-t border-hairline" />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onClearAll();
                  }}
                  className="w-full text-left px-3.5 py-2 text-[14px] text-danger font-medium hover:bg-danger/10 transition-colors"
                >
                  {t('clearAll')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto mt-3 pr-1">
        {items.length === 0 ? (
          <div className="py-12 text-center text-text-2 text-[14px]">
            <p className="mb-4">{t('noPrizesYet')}</p>
            <button
              type="button"
              onClick={onLoadSampleData}
              className="px-4 py-2 bg-surface-2 text-text font-medium text-[14px] rounded-control hover:bg-surface-2/80 transition-all focus-visible:ring-2 focus-visible:ring-focus"
            >
              {t('loadSampleData')}
            </button>
          </div>
        ) : allGivenAway ? (
          <div className="py-12 text-center text-text-2 text-[14px]">
            <p className="mb-4">{t('allPrizesGivenAway')}</p>
            <button
              type="button"
              onClick={onResetStock}
              className="px-4 py-2 bg-brand text-white font-medium text-[14px] rounded-control hover:bg-brand-hover transition-all focus-visible:ring-2 focus-visible:ring-focus shadow-sm"
            >
              {t('resetStock')}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-hairline">
            {items.map(item => {
              const itemColor = getItemColor(item, palette);
              const chancePercent =
                totalUnits > 0 && item.qty > 0
                  ? ((item.qty / totalUnits) * 100).toFixed(1)
                  : '0.0';
              const isOutOfStock = item.qty === 0;

              return (
                <div
                  key={item.id}
                  onClick={() => !isSpinning && onEditItem(item)}
                  className={`group flex items-center justify-between py-2.5 px-2 rounded-control hover:bg-surface-2/60 transition-colors cursor-pointer ${
                    isOutOfStock ? 'opacity-50' : ''
                  }`}
                >
                  {/* Left: Color Dot + Name + Percent */}
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: itemColor }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-medium text-text truncate">
                          {item.name}
                        </span>
                        {isOutOfStock && (
                          <span className="px-1.5 py-0.5 text-[11px] font-medium bg-surface-2 text-text-2 rounded-[5px]">
                            {t('outOfStock')}
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-text-2 tabular-nums">
                        {chancePercent}% {t('chance')}
                      </p>
                    </div>
                  </div>

                  {/* Right: Stepper & Hover Action Icons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Stepper */}
                    <div onClick={e => e.stopPropagation()}>
                      <Stepper
                        value={item.qty}
                        disabled={isSpinning}
                        onChange={newVal => onAdjustQty(item.id, newVal - item.qty)}
                      />
                    </div>

                    {/* Edit icon */}
                    <button
                      type="button"
                      disabled={isSpinning}
                      onClick={e => {
                        e.stopPropagation();
                        onEditItem(item);
                      }}
                      title={t('editPrize')}
                      aria-label={t('editPrize')}
                      className="w-8 h-8 hidden sm:flex items-center justify-center rounded-control text-text-2 hover:text-text hover:bg-surface-2 transition-colors"
                    >
                      <Pencil size={15} strokeWidth={1.75} />
                    </button>

                    {/* Hover Trash on desktop */}
                    <button
                      type="button"
                      disabled={isSpinning}
                      onClick={e => {
                        e.stopPropagation();
                        onDeleteItem(item.id);
                      }}
                      title={t('deletePrize')}
                      aria-label={t('deletePrize')}
                      className="w-8 h-8 hidden sm:group-hover:flex items-center justify-center rounded-control text-text-2 hover:text-danger hover:bg-danger/10 transition-colors"
                    >
                      <Trash2 size={15} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

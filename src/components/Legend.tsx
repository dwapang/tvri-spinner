import React from 'react';
import type { Item, PaletteType } from '../types';
import { getItemColor } from '../lib/palettes';
import { useI18n } from '../i18n/useI18n';

interface LegendProps {
  items: Item[];
  palette: PaletteType;
  totalUnits: number;
  showVisual?: boolean;
}

export const Legend: React.FC<LegendProps> = ({
  items,
  palette,
  totalUnits,
  showVisual = true,
}) => {
  const { t } = useI18n();
  const activeItems = items.filter(it => it.qty > 0);

  if (activeItems.length === 0) return null;

  // Screen reader accessible table/summary when visual legend is turned off
  if (!showVisual) {
    return (
      <div className="sr-only" aria-live="polite">
        <h3>{t('showPrizeLegend')}</h3>
        <ul>
          {activeItems.map(item => {
            const percent = totalUnits > 0 ? ((item.qty / totalUnits) * 100).toFixed(1) : '0.0';
            return (
              <li key={item.id}>
                {item.name}: {item.qty} {t('units')}, {percent}%
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div
      aria-label={t('showPrizeLegend')}
      className="w-full max-w-[560px] mx-auto mt-6 p-3 bg-surface-2/40 rounded-control border border-hairline"
    >
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[13px] text-text-2">
        {activeItems.map(item => {
          const color = getItemColor(item, palette);
          const percent = totalUnits > 0 ? ((item.qty / totalUnits) * 100).toFixed(1) : '0.0';

          return (
            <div key={item.id} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="font-medium text-text">{item.name}</span>
              <span className="tabular-nums text-text-2">
                ({item.qty} {t('units')}, {percent}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

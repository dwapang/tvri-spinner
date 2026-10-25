import React from 'react';
import { Download, Trash2 } from 'lucide-react';
import type { HistoryEntry } from '../types';
import { useI18n } from '../i18n/useI18n';

interface HistoryListProps {
  history: HistoryEntry[];
  onClearHistory: () => void;
  onExportCsv: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  history,
  onClearHistory,
  onExportCsv,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-hairline">
        <div>
          <h2 className="text-[20px] font-semibold text-text leading-tight">{t('history')}</h2>
          <p className="text-[13px] text-text-2 mt-0.5 tabular-nums">
            {history.length === 1
              ? t('singleSpinSummary')
              : t('spinsSummary', { count: history.length })}
          </p>
        </div>

        {history.length > 0 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onExportCsv}
              title={t('exportCsv')}
              className="h-9 px-3 bg-surface-2 text-text rounded-control text-[13px] font-medium flex items-center gap-1.5 hover:bg-surface-2/80 transition-colors focus-visible:ring-2 focus-visible:ring-focus"
            >
              <Download size={14} strokeWidth={1.75} />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={onClearHistory}
              title={t('clearHistory')}
              aria-label={t('clearHistory')}
              className="w-9 h-9 flex items-center justify-center rounded-control text-text-2 hover:text-danger hover:bg-danger/10 transition-colors focus-visible:ring-2 focus-visible:ring-focus"
            >
              <Trash2 size={16} strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>

      {/* History Items */}
      <div className="flex-1 overflow-y-auto mt-3 pr-1">
        {history.length === 0 ? (
          <div className="py-16 text-center text-text-2 text-[14px]">
            {t('emptyHistory')}
          </div>
        ) : (
          <div className="divide-y divide-hairline">
            {history.map(entry => {
              const date = new Date(entry.at);
              const formattedTime = date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div key={entry.id} className="py-2.5 px-2 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium px-1.5 py-0.5 bg-surface-2 text-text-2 rounded-[5px] tabular-nums">
                        #{entry.spinNo}
                      </span>
                      <span className="text-[15px] font-medium text-text">
                        {entry.itemName}
                      </span>
                    </div>
                    {entry.winnerName && (
                      <p className="text-[13px] text-text-2 mt-0.5">
                        {entry.winnerName}
                      </p>
                    )}
                  </div>
                  <span className="text-[12px] text-text-2 tabular-nums">
                    {formattedTime}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

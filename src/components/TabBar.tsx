import React from 'react';
import { Disc, Gift, History } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';

export type MobileTab = 'wheel' | 'prizes' | 'history';

interface TabBarProps {
  activeTab: MobileTab;
  onChangeTab: (tab: MobileTab) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onChangeTab }) => {
  const { t } = useI18n();

  const tabs: Array<{ id: MobileTab; label: string; icon: React.ReactNode }> = [
    { id: 'wheel', label: t('wheel'), icon: <Disc size={20} strokeWidth={1.75} /> },
    { id: 'prizes', label: t('prizes'), icon: <Gift size={20} strokeWidth={1.75} /> },
    { id: 'history', label: t('history'), icon: <History size={20} strokeWidth={1.75} /> },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-30 chrome-translucent border-t border-hairline pb-[max(6px,env(safe-area-inset-bottom))] pt-1.5 px-3 flex items-center justify-around sm:hidden select-none"
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChangeTab(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-control transition-colors ${
              isActive ? 'text-brand font-medium' : 'text-text-2 hover:text-text font-normal'
            }`}
          >
            <div className="mb-0.5">{tab.icon}</div>
            <span className="text-[11px] leading-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

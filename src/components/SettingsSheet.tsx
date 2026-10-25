import React, { useState } from 'react';
import { ModalShell } from './ModalShell';
import { SegmentedControl } from './SegmentedControl';
import { Switch } from './Switch';
import { AlertDialog } from './AlertDialog';
import { useI18n } from '../i18n/useI18n';
import type { Settings } from '../types';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSettings: (newSettings: Partial<Settings>) => void;
  onResetAllData: () => void;
}

export const SettingsSheet: React.FC<SettingsSheetProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetAllData,
}) => {
  const { t } = useI18n();
  const [showResetAlert, setShowResetAlert] = useState(false);

  return (
    <>
      <ModalShell
        isOpen={isOpen}
        onClose={onClose}
        title={t('settings')}
        maxWidth="max-w-[480px]"
      >
        <div className="space-y-6">
          {/* Group 1: Appearance & Wheel Colors */}
          <div className="bg-surface-2/50 rounded-panel p-3.5 space-y-3.5 border border-hairline">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-[14px] font-medium text-text shrink-0">{t('appearance')}</span>
              <SegmentedControl
                size="sm"
                value={settings.appearance}
                onChange={appearance => onUpdateSettings({ appearance })}
                options={[
                  { value: 'system', label: t('appearanceSystem') },
                  { value: 'light', label: t('appearanceLight') },
                  { value: 'dark', label: t('appearanceDark') },
                ]}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-hairline flex-wrap">
              <span className="text-[14px] font-medium text-text shrink-0">{t('wheelColors')}</span>
              <SegmentedControl
                size="sm"
                value={settings.palette}
                onChange={palette => onUpdateSettings({ palette })}
                options={[
                  { value: 'blue', label: t('colorBlue') },
                  { value: 'colorful', label: t('colorColorful') },
                ]}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-hairline flex-wrap">
              <span className="text-[14px] font-medium text-text shrink-0">{t('language')}</span>
              <SegmentedControl
                size="sm"
                value={settings.language}
                onChange={language => onUpdateSettings({ language })}
                options={[
                  { value: 'en', label: t('languageEn') },
                  { value: 'id', label: t('languageId') },
                ]}
              />
            </div>
          </div>

          {/* Group 2: Display */}
          <div className="bg-surface-2/50 rounded-panel p-3.5 space-y-3.5 border border-hairline">
            <div className="flex items-center justify-between">
              <div className="pr-4">
                <span className="text-[14px] font-medium text-text block">
                  {t('showPrizeLegend')}
                </span>
              </div>
              <Switch
                checked={settings.showLegend}
                onChange={showLegend => onUpdateSettings({ showLegend })}
                aria-label={t('showPrizeLegend')}
              />
            </div>
          </div>

          {/* Group 3: Spin Behavior */}
          <div className="bg-surface-2/50 rounded-panel p-3.5 space-y-3.5 border border-hairline">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[14px] font-medium text-text">{t('spinDuration')}</span>
              </div>
              <SegmentedControl
                size="sm"
                className="w-full flex"
                value={String(settings.durationMs) as '4000' | '6000' | '10000'}
                onChange={val => onUpdateSettings({ durationMs: parseInt(val, 10) })}
                options={[
                  { value: '4000', label: t('durationQuick') },
                  { value: '6000', label: t('durationNormal') },
                  { value: '10000', label: t('durationDramatic') },
                ]}
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-hairline flex-wrap gap-2">
              <span className="text-[14px] font-medium text-text shrink-0">{t('individualArrangement')}</span>
              <SegmentedControl
                size="sm"
                value={settings.arrangement}
                onChange={arrangement => onUpdateSettings({ arrangement })}
                options={[
                  { value: 'spread', label: t('arrangementSpread') },
                  { value: 'together', label: t('arrangementTogether') },
                ]}
              />
            </div>

            {/* Slice Order */}
            <div className="flex items-center justify-between pt-2 border-t border-hairline">
              <div>
                <span className="text-[14px] font-medium text-text block">{t('sliceOrder')}</span>
                <span className="text-[12px] text-text-2">
                  {settings.shuffleSeed !== null ? t('customShuffledOrder') : t('defaultOrder')}
                </span>
              </div>
              {settings.shuffleSeed !== null && (
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ shuffleSeed: null })}
                  className="px-2.5 py-1 text-[13px] font-medium text-brand hover:text-brand-hover bg-brand-soft rounded-control transition-colors focus-visible:ring-2 focus-visible:ring-focus"
                >
                  {t('resetToDefault')}
                </button>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-hairline">
              <div>
                <span className="text-[14px] font-medium text-text">{t('soundEffects')}</span>
              </div>
              <Switch
                checked={settings.sound}
                onChange={sound => onUpdateSettings({ sound })}
                aria-label={t('soundEffects')}
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-hairline">
              <div>
                <span className="text-[14px] font-medium text-text">{t('autoReduceStock')}</span>
              </div>
              <Switch
                checked={settings.autoReduce}
                onChange={autoReduce => onUpdateSettings({ autoReduce })}
                aria-label={t('autoReduceStock')}
              />
            </div>
          </div>

          {/* Destructive Action: Reset All */}
          <div>
            <button
              type="button"
              onClick={() => setShowResetAlert(true)}
              className="w-full h-11 text-[14px] text-danger font-medium hover:bg-danger/10 rounded-control transition-colors focus-visible:ring-2 focus-visible:ring-focus"
            >
              {t('resetAllData')}
            </button>
          </div>
        </div>
      </ModalShell>

      <AlertDialog
        isOpen={showResetAlert}
        onClose={() => setShowResetAlert(false)}
        onConfirm={() => {
          onResetAllData();
          onClose();
        }}
        title={t('confirmResetDataTitle')}
        message={t('confirmResetDataMessage')}
        confirmLabel={t('reset')}
        isDestructive={true}
      />
    </>
  );
};

import React, { useState } from 'react';
import { Volume2, VolumeX, Maximize2, Minimize2, Settings as SettingsIcon } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';

interface HeaderProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  soundEnabled,
  onToggleSound,
  isFullscreen,
  onToggleFullscreen,
  onOpenSettings,
}) => {
  const { t } = useI18n();
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full min-h-[56px] sm:min-h-[64px] bg-[var(--header-bg)] border-b border-black/10 dark:border-white/[0.06] flex items-center justify-between px-4 sm:px-6 pt-[env(safe-area-inset-top)] select-none">
      {/* Brand Monogram + Title */}
      <div className="flex items-center gap-3">
        {!logoFailed ? (
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-chip p-0.5 flex items-center justify-center shadow-sm">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Logo"
              onError={() => setLogoFailed(true)}
              className="w-full h-full object-contain rounded-[6px]"
            />
          </div>
        ) : null}

        {logoFailed && (
          <div
            aria-hidden="true"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-chip bg-white text-brand flex items-center justify-center font-bold text-[17px] sm:text-[18px] select-none shadow-sm"
          >
            T
          </div>
        )}

        <span className="font-semibold text-[18px] sm:text-[19px] text-white dark:text-[#F1F5FB] tracking-tight">
          {t('appTitle')}
        </span>
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-1">
        {/* Sound Toggle */}
        <button
          type="button"
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute sound' : 'Enable sound'}
          aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
          className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-control text-white/90 hover:text-white hover:bg-white/[0.14] active:bg-white/[0.22] dark:text-[#F1F5FB]/90 dark:hover:text-[#F1F5FB] dark:hover:bg-white/10 dark:active:bg-white/15 transition-colors focus-visible:ring-2 focus-visible:ring-white"
        >
          {soundEnabled ? <Volume2 size={20} strokeWidth={1.75} /> : <VolumeX size={20} strokeWidth={1.75} />}
        </button>

        {/* Fullscreen / Presentation Mode */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          title={isFullscreen ? t('exitPresentation') : t('presentationMode')}
          aria-label={isFullscreen ? t('exitPresentation') : t('presentationMode')}
          className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-control text-white/90 hover:text-white hover:bg-white/[0.14] active:bg-white/[0.22] dark:text-[#F1F5FB]/90 dark:hover:text-[#F1F5FB] dark:hover:bg-white/10 dark:active:bg-white/15 transition-colors focus-visible:ring-2 focus-visible:ring-white"
        >
          {isFullscreen ? <Minimize2 size={20} strokeWidth={1.75} /> : <Maximize2 size={20} strokeWidth={1.75} />}
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={onOpenSettings}
          title={t('settings')}
          aria-label={t('settings')}
          className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-control text-white/90 hover:text-white hover:bg-white/[0.14] active:bg-white/[0.22] dark:text-[#F1F5FB]/90 dark:hover:text-[#F1F5FB] dark:hover:bg-white/10 dark:active:bg-white/15 transition-colors focus-visible:ring-2 focus-visible:ring-white"
        >
          <SettingsIcon size={20} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
};

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { useSpinnerState } from './hooks/useSpinnerState';
import { useDeviceType } from './hooks/useMediaQuery';
import { useI18n, I18nProvider } from './i18n/useI18n';
import { Header } from './components/Header';
import { Wheel } from './components/Wheel';
import { SpinButton } from './components/SpinButton';
import { SegmentedControl } from './components/SegmentedControl';
import { PrizeList } from './components/PrizeList';
import { HistoryList } from './components/HistoryList';
import { PrizeFormDialog } from './components/PrizeFormDialog';
import { ResultDialog } from './components/ResultDialog';
import { SettingsSheet } from './components/SettingsSheet';
import { AlertDialog } from './components/AlertDialog';
import { TabBar, type MobileTab } from './components/TabBar';
import { Legend } from './components/Legend';
import type { Item, SpinnerStyle, PaletteType } from './types';

interface AppContentProps {
  state: ReturnType<typeof useSpinnerState>;
}

export const AppContent: React.FC<AppContentProps> = ({ state }) => {
  const { t } = useI18n();
  const { isMobile } = useDeviceType();

  const {
    items,
    settings,
    history,
    slices,
    totalUnits,
    capExceeded,
    rotation,
    flickAngle,
    isSpinning,
    winningSliceId,
    resultModalData,
    toast,
    addItem,
    updateItem,
    deleteItem,
    adjustQuantity,
    clearAllItems,
    loadSampleData,
    resetStock,
    updateSettings,
    resetAllData,
    confirmWin,
    undoLastWin,
    clearHistory,
    spin,
    shuffleWheel,
  } = state;

  // Navigation & View States
  const [mobileTab, setMobileTab] = useState<MobileTab>('wheel');
  const [panelTab, setPanelTab] = useState<'prizes' | 'history'>('prizes');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Dialog States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPrizeFormOpen, setIsPrizeFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if any dialog is open
  const isAnyDialogOpen =
    isSettingsOpen ||
    isPrizeFormOpen ||
    alertConfig.isOpen ||
    resultModalData !== null;

  // Keyboard Shortcuts (Space, F, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (isInput) return;

      // Esc closes presentation mode if open and no dialog is open
      if (e.key === 'Escape' && isFullscreen && !isAnyDialogOpen) {
        e.preventDefault();
        setIsFullscreen(false);
        return;
      }

      // F toggles Presentation Mode
      if ((e.key === 'f' || e.key === 'F') && !isAnyDialogOpen) {
        e.preventDefault();
        setIsFullscreen(prev => !prev);
        return;
      }

      // SPACE spins wheel
      if (e.key === ' ' || e.code === 'Space') {
        if (e.repeat) return;
        if (isAnyDialogOpen) return;
        if (isSpinning || totalUnits === 0) return;

        e.preventDefault();
        if (target.tagName === 'BUTTON') {
          target.blur();
        }
        spin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, isAnyDialogOpen, isSpinning, totalUnits, spin]);

  // JSON Export / Import
  const handleExportJson = useCallback(() => {
    const jsonStr = JSON.stringify(items, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tvri-spinner-inventory-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [items]);

  const handleImportJson = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          parsed.forEach(it => {
            if (it && typeof it.name === 'string') {
              addItem(it.name, typeof it.qty === 'number' ? it.qty : 1, it.color);
            }
          });
        }
      } catch {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // CSV Export for History
  const handleExportCsv = useCallback(() => {
    if (history.length === 0) return;
    const rows = [
      ['Spin', 'Prize', 'Winner', 'Timestamp'],
      ...history.map(h => [
        h.spinNo,
        `"${h.itemName.replace(/"/g, '""')}"`,
        `"${(h.winnerName || '').replace(/"/g, '""')}"`,
        h.at,
      ]),
    ];
    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tvri-spinner-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [history]);

  // Alert Dialog trigger helpers
  const requestClearAll = () => {
    setAlertConfig({
      isOpen: true,
      title: t('confirmClearAllTitle'),
      message: t('confirmClearAllMessage'),
      confirmLabel: t('clear'),
      onConfirm: () => clearAllItems(),
    });
  };

  const requestDeletePrize = (id: string) => {
    setAlertConfig({
      isOpen: true,
      title: t('confirmDeletePrizeTitle'),
      message: t('confirmDeletePrizeMessage'),
      confirmLabel: t('delete'),
      onConfirm: () => deleteItem(id),
    });
  };

  const requestClearHistory = () => {
    setAlertConfig({
      isOpen: true,
      title: t('confirmClearHistoryTitle'),
      message: t('confirmClearHistoryMessage'),
      confirmLabel: t('clear'),
      onConfirm: () => clearHistory(),
    });
  };

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col selection:bg-brand-soft">
      {/* Hidden file input for JSON import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header (hidden in presentation mode) */}
      {!isFullscreen && (
        <Header
          soundEnabled={settings.sound}
          onToggleSound={() => updateSettings({ sound: !settings.sound })}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 flex flex-col ${
          isFullscreen
            ? 'p-6 sm:p-12 items-center justify-center relative'
            : 'max-w-[1240px] w-full mx-auto px-4 sm:px-6 py-4 sm:py-8'
        }`}
      >
        {/* Presentation mode exit floating button */}
        {isFullscreen && (
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            title={t('exitPresentation')}
            aria-label={t('exitPresentation')}
            className="absolute top-6 right-6 w-11 h-11 flex items-center justify-center rounded-full bg-surface-2/90 text-text hover:bg-surface-2 transition-all shadow-floating focus-visible:ring-2 focus-visible:ring-focus z-20"
          >
            <X size={20} strokeWidth={2} />
          </button>
        )}

        {/* 200 Slice Cap Friendly Warning */}
        {capExceeded && settings.style === 'individual' && (
          <div className="mb-4 p-3 bg-brand-soft text-brand text-[13px] rounded-control border border-brand/20 text-center font-medium">
            {t('individualCapNotice')}
          </div>
        )}

        {/* PRESENTATION MODE: Large Centered Wheel */}
        {isFullscreen ? (
          <div className="flex flex-col items-center justify-center w-full max-w-[800px] my-auto">
            <Wheel
              slices={slices}
              totalUnits={totalUnits}
              rotation={rotation}
              flickAngle={flickAngle}
              winningSliceId={winningSliceId}
              isSpinning={isSpinning}
              onSpin={spin}
              theme={`${settings.appearance}-${settings.palette}`}
            />

            <div className="mt-8 flex flex-col items-center gap-3">
              <SpinButton
                isSpinning={isSpinning}
                disabled={totalUnits === 0}
                onClick={spin}
                onShuffle={shuffleWheel}
                isShuffleDisabled={isSpinning || isAnyDialogOpen || slices.length < 2}
              />
            </div>
          </div>
        ) : (
          /* STANDARD RESPONSIVE VIEWS */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT / CENTER COLUMN: Wheel Focal Stage */}
            <section
              aria-label="Wheel Section"
              className={`flex flex-col items-center ${
                isMobile && mobileTab !== 'wheel' ? 'hidden' : 'lg:col-span-7 xl:col-span-7'
              }`}
            >
              {/* Wheel sits directly on background with no card or box */}
              <div className="w-full flex justify-center py-2 sm:py-4">
                <Wheel
                  slices={slices}
                  totalUnits={totalUnits}
                  rotation={rotation}
                  flickAngle={flickAngle}
                  winningSliceId={winningSliceId}
                  isSpinning={isSpinning}
                  onSpin={spin}
                  theme={`${settings.appearance}-${settings.palette}`}
                />
              </div>

              {/* Controls directly under the wheel */}
              <div className="w-full max-w-[560px] flex flex-col items-center gap-4 mt-3">
                {/* Style & Wheel Colors Controls: Neat responsive rows preventing word wrap */}
                <div className="flex items-center justify-center gap-3 sm:gap-6 w-full flex-wrap">
                  {/* Style Control */}
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-text-2 font-medium">
                      {t('style')}
                    </span>
                    <SegmentedControl
                      size="sm"
                      disabled={isSpinning}
                      value={settings.style}
                      onChange={(style: SpinnerStyle) => updateSettings({ style })}
                      options={[
                        { value: 'grouped', label: t('styleGrouped') },
                        { value: 'individual', label: t('styleIndividual') },
                      ]}
                    />
                  </div>

                  {/* Wheel Colors Control */}
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-text-2 font-medium">
                      {t('wheelColors')}
                    </span>
                    <SegmentedControl
                      size="sm"
                      disabled={isSpinning}
                      value={settings.palette}
                      onChange={(palette: PaletteType) => updateSettings({ palette })}
                      options={[
                        { value: 'blue', label: t('colorBlue') },
                        { value: 'colorful', label: t('colorColorful') },
                      ]}
                    />
                  </div>
                </div>

                {/* Primary 56px SPIN Button + Shuffle Button */}
                <div className="w-full flex justify-center mt-2">
                  <SpinButton
                    isSpinning={isSpinning}
                    disabled={totalUnits === 0}
                    onClick={spin}
                    onShuffle={shuffleWheel}
                    isShuffleDisabled={isSpinning || isAnyDialogOpen || slices.length < 2}
                    fullWidth={isMobile}
                    hideSpaceHint={isMobile}
                  />
                </div>

                {/* Optional visual legend or accessible sr-only fallback */}
                <Legend
                  items={items}
                  palette={settings.palette}
                  totalUnits={totalUnits}
                  showVisual={settings.showLegend && !isFullscreen}
                />
              </div>
            </section>

            {/* RIGHT COLUMN / MOBILE PANELS: Inset Grouped Surface */}
            <aside
              aria-label="Inventory and History Panel"
              className={`lg:col-span-5 xl:col-span-5 ${
                isMobile && mobileTab === 'wheel' ? 'hidden' : 'block w-full'
              }`}
            >
              <div className={`bg-surface rounded-panel border border-hairline p-5 sm:p-6 shadow-sm sticky top-20 min-h-[480px] max-h-[calc(100vh-100px)] flex flex-col ${isMobile ? 'pb-24' : ''}`}>
                {/* Segmented Control at top of panel: Size LG (44px desktop / 48px mobile, 15px/16px font) */}
                {!isMobile && (
                  <div className="mb-4">
                    <SegmentedControl
                      size="lg"
                      className="w-full flex"
                      value={panelTab}
                      onChange={val => setPanelTab(val as 'prizes' | 'history')}
                      options={[
                        { value: 'prizes', label: t('prizes') },
                        { value: 'history', label: t('history') },
                      ]}
                    />
                  </div>
                )}

                {/* Content: Prizes or History */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  {(isMobile ? mobileTab === 'prizes' : panelTab === 'prizes') ? (
                    <PrizeList
                      items={items}
                      palette={settings.palette}
                      isSpinning={isSpinning}
                      onAddItem={() => {
                        setEditingItem(null);
                        setIsPrizeFormOpen(true);
                      }}
                      onEditItem={item => {
                        setEditingItem(item);
                        setIsPrizeFormOpen(true);
                      }}
                      onDeleteItem={requestDeletePrize}
                      onAdjustQty={adjustQuantity}
                      onLoadSampleData={loadSampleData}
                      onExportJson={handleExportJson}
                      onImportJson={handleImportJson}
                      onClearAll={requestClearAll}
                      onResetStock={resetStock}
                    />
                  ) : (
                    <HistoryList
                      history={history}
                      onClearHistory={requestClearHistory}
                      onExportCsv={handleExportCsv}
                    />
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* Mobile Translucent Bottom Tab Bar */}
      {!isFullscreen && (
        <TabBar activeTab={mobileTab} onChangeTab={setMobileTab} />
      )}

      {/* Dialogs and Sheets */}
      <PrizeFormDialog
        isOpen={isPrizeFormOpen}
        onClose={() => {
          setIsPrizeFormOpen(false);
          setEditingItem(null);
        }}
        item={editingItem}
        palette={settings.palette}
        existingItems={items}
        onSave={(name, qty, color) => {
          if (editingItem) {
            updateItem(editingItem.id, { name, qty, color });
          } else {
            addItem(name, qty, color);
          }
        }}
        onDelete={id => requestDeletePrize(id)}
      />

      <ResultDialog
        isOpen={resultModalData !== null}
        isFullscreen={isFullscreen}
        item={resultModalData?.item || null}
        slice={resultModalData?.slice || null}
        spinNo={resultModalData?.spinNo || 1}
        onConfirm={winnerName => {
          if (resultModalData) {
            confirmWin(resultModalData.item, winnerName);
          }
        }}
        onConfirmAndSpinAgain={winnerName => {
          if (resultModalData) {
            confirmWin(resultModalData.item, winnerName);
            setTimeout(() => {
              spin();
            }, 100);
          }
        }}
        onUndo={() => {
          undoLastWin();
        }}
        onClose={() => {
          if (resultModalData) {
            confirmWin(resultModalData.item);
          }
        }}
      />

      <SettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        onResetAllData={resetAllData}
      />

      <AlertDialog
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={alertConfig.onConfirm}
        title={alertConfig.title}
        message={alertConfig.message}
        confirmLabel={alertConfig.confirmLabel}
      />

      {/* Bottom Center Floating Toast with optional Action button */}
      {toast && (
        <div className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-text text-surface px-4 py-2.5 rounded-control shadow-floating border border-hairline text-[14px] font-medium animate-in fade-in slide-in-from-bottom-2 flex items-center gap-3">
          <span>{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              onClick={toast.action.onClick}
              className="font-semibold text-brand hover:underline focus:outline-none cursor-pointer"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const state = useSpinnerState();

  return (
    <I18nProvider language={state.settings.language}>
      <AppContent state={state} />
    </I18nProvider>
  );
}

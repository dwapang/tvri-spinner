import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Item, Settings, HistoryEntry, Slice } from '../types';
import {
  loadStoredData,
  saveStoredData,
  DEFAULT_ITEMS,
  DEFAULT_SETTINGS,
} from '../lib/storage';
import {
  computeSlices,
  pickWinner,
  computeFinalRotation,
  countBoundaryCrossings,
} from '../lib/wheelMath';
import {
  createInitialPointerState,
  updatePointerSimulation,
  isPointerAtRest,
  type PointerState,
} from '../lib/pointerPhysics';
import { playTickSound, playWinSound } from '../lib/sound';

export interface ToastData {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useSpinnerState() {
  const [data, setData] = useState(() => loadStoredData());
  const [rotation, setRotation] = useState(() => data.rotation);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [flickAngle, setFlickAngle] = useState(0);
  const [winningSliceId, setWinningSliceId] = useState<string | null>(null);
  const [resultModalData, setResultModalData] = useState<{
    item: Item;
    slice: Slice;
    spinNo: number;
  } | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  const animationRef = useRef<number | null>(null);
  const pointerStateRef = useRef<PointerState>(createInitialPointerState());
  const previousShuffleSeedRef = useRef<number | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync to localStorage
  useEffect(() => {
    saveStoredData({
      version: 2,
      items: data.items,
      settings: data.settings,
      history: data.history,
      nextColorIndex: data.nextColorIndex,
      rotation,
    });
  }, [data, rotation]);

  // Handle Appearance (Theme) and <meta name="theme-color"> sync
  useEffect(() => {
    const appearance = data.settings.appearance;
    const applyTheme = () => {
      let isDark = false;
      if (appearance === 'dark') {
        isDark = true;
      } else if (appearance === 'light') {
        isDark = false;
      } else {
        isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.remove('dark');
      }

      // Sync meta theme-color to header color: #0A4DA2 (light) or #05080F (dark)
      let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
      }
      meta.content = isDark ? '#05080F' : '#0A4DA2';
    };

    applyTheme();

    if (appearance === 'system' && window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [data.settings.appearance]);

  // Compute active slices
  const { slices, totalUnits, capExceeded } = useMemo(() => {
    return computeSlices(
      data.items,
      data.settings.style,
      data.settings.arrangement,
      data.settings.palette,
      data.settings.shuffleSeed
    );
  }, [
    data.items,
    data.settings.style,
    data.settings.arrangement,
    data.settings.palette,
    data.settings.shuffleSeed,
  ]);

  // Toast helper
  const showToast = useCallback((message: string, action?: { label: string; onClick: () => void }, durationMs = 3000) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, action });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, durationMs);
  }, []);

  const hideToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast(null);
  }, []);

  // Inventory actions
  const addItem = useCallback((name: string, qty: number, color?: string) => {
    setData(prev => {
      const newItem: Item = {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim().slice(0, 40),
        qty: Math.max(0, Math.min(999, Math.floor(qty))),
        color: color && color.startsWith('#') ? color : undefined,
        colorIndex: prev.nextColorIndex,
      };
      return {
        ...prev,
        items: [...prev.items, newItem],
        nextColorIndex: prev.nextColorIndex + 1,
      };
    });
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<Omit<Item, 'id' | 'colorIndex'>>) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map(it => {
        if (it.id !== id) return it;
        return {
          ...it,
          name: updates.name !== undefined ? updates.name.trim().slice(0, 40) : it.name,
          qty: updates.qty !== undefined ? Math.max(0, Math.min(999, Math.floor(updates.qty))) : it.qty,
          color: updates.color !== undefined ? updates.color : it.color,
        };
      }),
    }));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      items: prev.items.filter(it => it.id !== id),
    }));
  }, []);

  const adjustQuantity = useCallback((id: string, delta: number) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map(it => {
        if (it.id !== id) return it;
        const newQty = Math.max(0, Math.min(999, it.qty + delta));
        return { ...it, qty: newQty };
      }),
    }));
  }, []);

  const clearAllItems = useCallback(() => {
    setData(prev => ({
      ...prev,
      items: [],
    }));
  }, []);

  const loadSampleData = useCallback(() => {
    setData(prev => ({
      ...prev,
      items: DEFAULT_ITEMS,
      nextColorIndex: Math.max(prev.nextColorIndex, DEFAULT_ITEMS.length),
    }));
  }, []);

  const resetStock = useCallback(() => {
    setData(prev => ({
      ...prev,
      items: prev.items.map(it => ({
        ...it,
        qty: it.qty === 0 ? 5 : it.qty, // restore out of stock items
      })),
    }));
  }, []);

  // Settings action
  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
  }, []);

  const resetAllData = useCallback(() => {
    setData({
      version: 2,
      items: DEFAULT_ITEMS,
      settings: DEFAULT_SETTINGS,
      history: [],
      nextColorIndex: DEFAULT_ITEMS.length,
      rotation: 0,
    });
    setRotation(0);
    setWinningSliceId(null);
    setResultModalData(null);
  }, []);

  // History & Undo actions
  const confirmWin = useCallback(
    (winnerItem: Item, winnerName?: string) => {
      const spinNo = data.history.length + 1;
      const entry: HistoryEntry = {
        id: `win-${Date.now()}`,
        spinNo,
        itemId: winnerItem.id,
        itemName: winnerItem.name,
        winnerName: winnerName?.trim() || undefined,
        at: new Date().toISOString(),
      };

      setData(prev => {
        const nextItems = prev.settings.autoReduce
          ? prev.items.map(it => (it.id === winnerItem.id ? { ...it, qty: Math.max(0, it.qty - 1) } : it))
          : prev.items;

        return {
          ...prev,
          items: nextItems,
          history: [entry, ...prev.history],
        };
      });

      // Clear highlight & modal
      setWinningSliceId(null);
      setResultModalData(null);
    },
    [data.history.length]
  );

  const undoLastWin = useCallback(() => {
    if (data.history.length === 0) return;

    setData(prev => {
      const [last, ...remainingHistory] = prev.history;
      const nextItems = prev.settings.autoReduce
        ? prev.items.map(it => (it.id === last.itemId ? { ...it, qty: Math.min(999, it.qty + 1) } : it))
        : prev.items;

      return {
        ...prev,
        items: nextItems,
        history: remainingHistory,
      };
    });

    setWinningSliceId(null);
    setResultModalData(null);
    showToast('Win undone');
  }, [data.history, showToast]);

  const clearHistory = useCallback(() => {
    setData(prev => ({
      ...prev,
      history: [],
    }));
  }, []);

  // Shuffle actions
  const undoShuffle = useCallback(() => {
    const prevSeed = previousShuffleSeedRef.current;
    updateSettings({ shuffleSeed: prevSeed });
    hideToast();
  }, [updateSettings, hideToast]);

  const shuffleWheel = useCallback(() => {
    if (isSpinning || isShuffling || slices.length < 2) return;

    // Generate new deterministic seed using crypto
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const newSeed = buf[0];
    previousShuffleSeedRef.current = data.settings.shuffleSeed;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      updateSettings({ shuffleSeed: newSeed });
      showToast(
        data.settings.language === 'id' ? 'Roda diacak' : 'Wheel shuffled',
        {
          label: data.settings.language === 'id' ? 'Urungkan' : 'Undo',
          onClick: undoShuffle,
        },
        5000
      );
      return;
    }

    // Standard 600ms animation: half-turn (PI rad) with cubic-bezier(0.2, 0.8, 0.2, 1)
    setIsShuffling(true);
    const startRot = rotation;
    const deltaRot = Math.PI; // quick half turn
    const startTime = performance.now();
    const duration = 600;
    let seedApplied = false;

    // Cubic-bezier(0.2, 0.8, 0.2, 1) solver helper
    const easeBezier = (t: number) => {
      // Approximate cubic-bezier(0.2, 0.8, 0.2, 1)
      const ts = t * t;
      const tc = ts * t;
      return 3 * 0.8 * (1 - t) * (1 - t) * t + 3 * 1 * (1 - t) * ts + tc;
    };

    const animateShuffle = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeBezier(progress);

      setRotation(startRot + deltaRot * eased);

      // Apply new seed at midpoint (300ms) for cross-fade transition
      if (progress >= 0.5 && !seedApplied) {
        seedApplied = true;
        updateSettings({ shuffleSeed: newSeed });
      }

      if (progress < 1) {
        requestAnimationFrame(animateShuffle);
      } else {
        setIsShuffling(false);
        setRotation(startRot + deltaRot);
        showToast(
          data.settings.language === 'id' ? 'Roda diacak' : 'Wheel shuffled',
          {
            label: data.settings.language === 'id' ? 'Urungkan' : 'Undo',
            onClick: undoShuffle,
          },
          5000
        );
      }
    };

    requestAnimationFrame(animateShuffle);
  }, [
    isSpinning,
    isShuffling,
    slices.length,
    data.settings.shuffleSeed,
    data.settings.language,
    rotation,
    updateSettings,
    showToast,
    undoShuffle,
  ]);

  // Spin engine with realistic pointer physics
  const spin = useCallback(() => {
    if (isSpinning || isShuffling || totalUnits === 0 || slices.length === 0) return;

    // Pick winner deterministically from current slices AFTER final layout
    const { winnerItem, targetSlice } = pickWinner(slices, data.items);
    const { finalRotation } = computeFinalRotation(rotation, targetSlice);

    setIsSpinning(true);
    setWinningSliceId(null);
    setResultModalData(null);
    pointerStateRef.current = createInitialPointerState();

    const startRotation = rotation;
    const totalDelta = finalRotation - startRotation;

    // Respect reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const duration = prefersReducedMotion ? 1200 : data.settings.durationMs;
    const startTime = performance.now();
    let lastFrameTime = startTime;
    let prevRotation = startRotation;
    let wheelStopped = false;
    let wheelStopTime = 0;

    const animate = (now: number) => {
      const deltaMs = Math.min(50, Math.max(1, now - lastFrameTime));
      lastFrameTime = now;

      if (!wheelStopped) {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);

        // Quintic ease-out: 1 - (1 - t)^5
        const ease = 1 - Math.pow(1 - t, 5);
        const currentRot = startRotation + totalDelta * ease;
        const wheelOmega = (currentRot - prevRotation) / (deltaMs / 1000);

        // Accurate closed-form boundary crossings
        const crossings = countBoundaryCrossings(slices, prevRotation, currentRot);

        // Step damped spring flapper physics
        const { nextState, hits } = updatePointerSimulation(
          pointerStateRef.current,
          deltaMs,
          crossings,
          wheelOmega,
          undefined,
          prefersReducedMotion
        );
        pointerStateRef.current = nextState;

        // Rate-capped audio tick
        if (hits.length > 0) {
          playTickSound(data.settings.sound, hits[0].speedFraction);
        }

        prevRotation = currentRot;
        setRotation(currentRot);
        setFlickAngle(nextState.theta);

        if (t >= 1) {
          wheelStopped = true;
          wheelStopTime = now;
          setRotation(finalRotation);
        }

        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Wheel stopped: pointer oscillates to rest before win dialog opens
        const settlingElapsed = now - wheelStopTime;

        const { nextState } = updatePointerSimulation(
          pointerStateRef.current,
          deltaMs,
          0,
          0,
          undefined,
          prefersReducedMotion
        );
        pointerStateRef.current = nextState;
        setFlickAngle(nextState.theta);

        const pointerRest = isPointerAtRest(nextState);

        // Ensure at least 200ms settling pause AND pointer comes to complete rest (or max 400ms timeout)
        if ((pointerRest && settlingElapsed >= 200) || settlingElapsed >= 400) {
          // Pointer is fully at rest
          setIsSpinning(false);
          setFlickAngle(0);
          setWinningSliceId(targetSlice.id);

          // Play win sound
          playWinSound(data.settings.sound);

          // Confetti burst
          if (!prefersReducedMotion) {
            import('canvas-confetti').then(confettiModule => {
              const confetti = confettiModule.default || confettiModule;
              confetti({
                particleCount: 45,
                spread: 60,
                origin: { y: 0.6 },
                colors: ['#0A4DA2', '#1E78E0', '#FFFFFF', '#F5B301'],
                ticks: 200,
                gravity: 1.1,
                scalar: 0.9,
                disableForReducedMotion: true,
              });
            }).catch(() => {});
          }

          // Open Result Dialog
          setResultModalData({
            item: winnerItem,
            slice: targetSlice,
            spinNo: data.history.length + 1,
          });
          return;
        }

        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [
    isSpinning,
    isShuffling,
    totalUnits,
    slices,
    data.items,
    data.settings,
    data.history.length,
    rotation,
  ]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  return {
    items: data.items,
    settings: data.settings,
    history: data.history,
    slices,
    totalUnits,
    capExceeded,
    rotation,
    flickAngle,
    isSpinning,
    isShuffling,
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
    undoShuffle,
    setWinningSliceId,
    setResultModalData,
    showToast,
    hideToast,
  };
}

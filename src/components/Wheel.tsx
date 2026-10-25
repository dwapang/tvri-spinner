import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Slice } from '../types';

interface WheelProps {
  slices: Slice[];
  totalUnits: number;
  rotation: number;
  flickAngle: number;
  winningSliceId: string | null;
  isSpinning: boolean;
  onSpin: () => void;
  size?: number;
  theme?: string;
}

export const Wheel: React.FC<WheelProps> = ({
  slices,
  totalUnits,
  rotation,
  flickAngle,
  winningSliceId,
  isSpinning,
  onSpin,
  theme,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [diameter, setDiameter] = useState(480);
  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';

  // ResizeObserver to dynamically adapt to container width
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          // Clamp diameter between 280 and 560
          const clamped = Math.min(Math.floor(width), 560);
          setDiameter(Math.max(280, clamped));
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update offscreen pre-rendered bitmap whenever slices, diameter, or winningSliceId changes
  useEffect(() => {
    const dpr = window.devicePixelRatio || 1;
    const size = diameter * dpr;
    const radius = size / 2;
    const cx = radius;
    const cy = radius;

    let offscreen = offscreenCanvasRef.current;
    if (!offscreen) {
      offscreen = document.createElement('canvas');
      offscreenCanvasRef.current = offscreen;
    }
    offscreen.width = size;
    offscreen.height = size;

    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);

    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gapColor = dark ? '#0B1220' : '#F5F7FA';

    if (slices.length === 0 || totalUnits === 0) {
      // Empty neutral placeholder
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 10 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = dark ? '#1B2740' : '#EEF2F7';
      ctx.fill();
      return;
    }

    const rimWidth = 8 * dpr;
    const sliceRadius = radius - rimWidth;

    // Draw slices
    slices.forEach(slice => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, sliceRadius, slice.startAngle, slice.endAngle);
      ctx.closePath();

      // Flat slice fill
      ctx.fillStyle = slice.color;
      ctx.fill();

      // Gap between slices
      ctx.lineWidth = 2 * dpr;
      ctx.strokeStyle = gapColor;
      ctx.stroke();

      // If winningSliceId is active, dim non-winning slices to 35%
      if (winningSliceId && slice.id !== winningSliceId) {
        ctx.fillStyle = dark ? 'rgba(11, 18, 32, 0.65)' : 'rgba(245, 247, 250, 0.65)';
        ctx.fill();
      }

      // Draw radial labels if visible
      if (slice.labelVisible && (!winningSliceId || slice.id === winningSliceId)) {
        ctx.save();
        const midAngle = slice.startAngle + slice.angle / 2;
        ctx.translate(cx, cy);
        ctx.rotate(midAngle);

        // Position text radially outwards from center
        const hubRadius = radius * 0.18;
        const textRadius = hubRadius + (sliceRadius - hubRadius) * 0.62;
        ctx.translate(textRadius, 0);

        // Max available text width
        const maxTextWidth = (sliceRadius - hubRadius) * 0.68;
        const fontSize = Math.max(11, Math.min(14, Math.floor(13 * (diameter / 440)))) * dpr;

        ctx.font = `500 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI Variable Text", "Segoe UI", Inter, Roboto, sans-serif`;
        ctx.fillStyle = slice.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Truncate label if necessary
        let labelText = slice.name;
        if (ctx.measureText(labelText).width > maxTextWidth) {
          while (labelText.length > 3 && ctx.measureText(labelText + '…').width > maxTextWidth) {
            labelText = labelText.slice(0, -1);
          }
          labelText += '…';
        }

        ctx.fillText(labelText, 0, 0);
        ctx.restore();
      }

      ctx.restore();
    });
  }, [slices, totalUnits, diameter, winningSliceId, theme]);

  // Main canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const size = diameter * dpr;
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);

    const radius = size / 2;
    const cx = radius;
    const cy = radius;
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';

    // 1. Draw rotated slices offscreen bitmap
    const offscreen = offscreenCanvasRef.current;
    if (offscreen) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.drawImage(offscreen, -radius, -radius);
      ctx.restore();
    }

    // 2. Draw 8px Rim Ring with 1px hairline border
    const rimWidth = 8 * dpr;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius - rimWidth / 2, 0, Math.PI * 2);
    ctx.lineWidth = rimWidth;
    ctx.strokeStyle = dark ? '#1B2740' : '#FFFFFF';
    ctx.stroke();

    // Hairline outer border
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 0.5 * dpr, 0, Math.PI * 2);
    ctx.lineWidth = 1 * dpr;
    ctx.strokeStyle = dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 27, 45, 0.08)';
    ctx.stroke();
    ctx.restore();

    // 3. Center Hub Socket (18% diameter)
    const hubRadius = radius * 0.18;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, hubRadius, 0, Math.PI * 2);

    // Subtle soft ground shadow for hub socket
    ctx.shadowColor = 'rgba(15, 27, 45, 0.12)';
    ctx.shadowBlur = 10 * dpr;
    ctx.shadowOffsetY = 2 * dpr;
    ctx.fillStyle = dark ? '#121C2E' : '#FFFFFF';
    ctx.fill();

    // Hub hairline ring
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 1 * dpr;
    ctx.strokeStyle = dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 27, 45, 0.08)';
    ctx.stroke();
    ctx.restore();
  }, [diameter, rotation, slices, winningSliceId, totalUnits, theme]);

  // Click on Center Hub via Canvas fallback
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isSpinning || totalUnits === 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = diameter / 2;
      const cy = diameter / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const hubRadius = (diameter / 2) * 0.18;

      if (dist <= hubRadius + 12) {
        onSpin();
      }
    },
    [diameter, isSpinning, onSpin, totalUnits]
  );

  // Dynamic shadow offset based on flapper deflection angle
  const shadowX = Math.sin(flickAngle) * 5;
  const shadowY = Math.cos(flickAngle) * 3 + 2;

  // Center hub size
  const hubSizePx = Math.round(diameter * 0.18);
  const hubFontSizePx = Math.max(13, Math.floor(hubSizePx * 0.22));

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center w-full max-w-[560px] mx-auto select-none"
      style={{ minHeight: `${diameter}px` }}
    >
      {/* Canvas has cursor-default: hovering slices or rim does NOT turn into pointer */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        aria-label="TVRI Prize Wheel"
        role="img"
        tabIndex={-1}
        className="rounded-full cursor-default"
        style={{
          width: `${diameter}px`,
          height: `${diameter}px`,
          boxShadow: '0 8px 30px rgba(15, 27, 45, 0.08), 0 2px 6px rgba(15, 27, 45, 0.04)',
        }}
      />

      {/* Interactive Center Hub Button: Pops a bit on hover and changes cursor to pointer ONLY at center */}
      <button
        type="button"
        disabled={isSpinning || totalUnits === 0}
        onClick={onSpin}
        aria-label="Spin wheel"
        style={{
          width: `${hubSizePx}px`,
          height: `${hubSizePx}px`,
          fontSize: `${hubFontSizePx}px`,
        }}
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 rounded-full flex items-center justify-center font-semibold select-none border transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isSpinning || totalUnits === 0
            ? 'cursor-default opacity-85 pointer-events-none'
            : 'cursor-pointer hover:scale-[1.10] active:scale-[0.94] hover:shadow-[0_8px_24px_rgba(10,77,162,0.22)] active:shadow-sm'
        } ${
          isDark
            ? 'bg-[#121C2E] text-[#2F6FDB] border-white/10 shadow-[0_4px_14px_rgba(0,0,0,0.5)]'
            : 'bg-white text-[#0A4DA2] border-[rgba(15,27,45,0.08)] shadow-[0_4px_14px_rgba(15,27,45,0.12)]'
        }`}
      >
        Spin
      </button>

      {/* Realistic Pointer Flapper Layer above canvas */}
      <div
        className="absolute top-0 pointer-events-none select-none z-10 flex justify-center"
        style={{
          width: `${diameter}px`,
          height: `${diameter}px`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '4px',
            transformOrigin: '50% 5px',
            transform: `rotate(${flickAngle}rad)`,
            filter: `drop-shadow(${shadowX}px ${shadowY}px 4px rgba(15, 27, 45, 0.28))`,
            willChange: 'transform, filter',
          }}
        >
          <svg
            width="24"
            height="34"
            viewBox="0 0 24 34"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="overflow-visible"
          >
            {/* Needle Body */}
            <path
              d="M12 32 L3 6 C2.5 3 4.5 1 7.5 1 L16.5 1 C19.5 1 21.5 3 21 6 L12 32 Z"
              fill={isDark ? '#F1F5FB' : '#0F1B2D'}
              stroke={isDark ? '#0F1B2D' : '#FFFFFF'}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Top Pivot Pin */}
            <circle
              cx="12"
              cy="5"
              r="2.5"
              fill={isDark ? '#0F1B2D' : '#FFFFFF'}
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

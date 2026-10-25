import { useRef, useLayoutEffect, useEffect, useState } from 'react';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  className = '',
  size = 'md',
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [thumbStyle, setThumbStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  const isFullWidth = className.includes('w-full');

  const updateThumb = () => {
    if (!containerRef.current) return;
    const activeIndex = options.findIndex(opt => opt.value === value);
    if (activeIndex === -1) return;

    const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('button');
    const activeButton = buttons[activeIndex];
    if (activeButton) {
      setThumbStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      });
    }
  };

  useLayoutEffect(() => {
    updateThumb();
  }, [value, options, size]);

  // Keep thumb dynamically updated on resize, font loading, or translations
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      updateThumb();
    });
    observer.observe(containerRef.current);
    const buttons = containerRef.current.querySelectorAll('button');
    buttons.forEach(b => observer.observe(b));
    return () => observer.disconnect();
  }, [options, value]);

  const heightClass =
    size === 'lg'
      ? 'h-12 sm:h-11' // 48px on mobile, 44px on desktop
      : size === 'sm'
      ? 'h-9'
      : 'h-10';

  const thumbRadius = size === 'lg' ? 'rounded-[10px]' : 'rounded-[9px]';

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      className={`relative inline-flex items-center p-[3px] bg-surface-2 rounded-control select-none border border-hairline shrink-0 overflow-hidden ${heightClass} ${
        disabled ? 'opacity-60 pointer-events-none' : ''
      } ${className}`}
    >
      {/* Sliding Thumb */}
      <div
        className={`absolute top-[3px] bottom-[3px] bg-surface ${thumbRadius} shadow-thumb transition-all duration-[180ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]`}
        style={{
          left: `${thumbStyle.left}px`,
          width: `${thumbStyle.width}px`,
        }}
      />

      {options.map(opt => {
        const isSelected = opt.value === value;
        const fontClass =
          size === 'lg'
            ? 'text-[16px] sm:text-[15px] font-semibold'
            : size === 'sm'
            ? 'text-[13px] sm:text-[14px] font-medium'
            : 'text-[14px] font-medium';

        // When full-width, divide space equally (flex-1).
        // When inline, size naturally to text + padding (shrink-0 min-w-[60px]) so long text never overflows the track!
        const widthClass = isFullWidth
          ? 'flex-1 min-w-0 px-3'
          : 'shrink-0 min-w-[60px] px-3.5';

        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`relative z-10 h-full flex items-center justify-center py-1 whitespace-nowrap leading-none transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus ${thumbRadius} ${fontClass} ${widthClass} ${
              isSelected ? 'text-text font-semibold' : 'text-text-2 hover:text-text'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

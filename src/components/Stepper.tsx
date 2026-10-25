import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const Stepper: React.FC<StepperProps> = ({
  value,
  min = 0,
  max = 999,
  onChange,
  disabled = false,
}) => {
  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || value <= min) return;
    onChange(value - 1);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || value >= max) return;
    onChange(value + 1);
  };

  return (
    <div
      className={`inline-flex items-center bg-surface-2 border border-hairline rounded-full p-0.5 select-none ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        onClick={handleDecrement}
        className="flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 rounded-full text-text-2 hover:text-text hover:bg-surface active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent transition-all focus-visible:ring-2 focus-visible:ring-focus"
      >
        <Minus size={14} strokeWidth={2} />
      </button>

      <span className="w-8 text-center text-[14px] font-medium text-text tabular-nums leading-none">
        {value}
      </span>

      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={handleIncrement}
        className="flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 rounded-full text-text-2 hover:text-text hover:bg-surface active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent transition-all focus-visible:ring-2 focus-visible:ring-focus"
      >
        <Plus size={14} strokeWidth={2} />
      </button>
    </div>
  );
};

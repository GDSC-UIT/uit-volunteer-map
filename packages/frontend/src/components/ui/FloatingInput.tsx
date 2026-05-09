import clsx from 'clsx';
import { useState } from 'react';

interface FloatingInputProps {
  label: string;
  value: string;
  type?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export default function FloatingInput({
  label,
  value,
  type = 'text',
  disabled,
  onChange,
}: FloatingInputProps) {

  const [isFocused, setIsFocused] = useState(false);

  const isActive = isFocused || value.length > 0;

  return (
    <div className="relative w-140 h-12.5">
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={clsx(
          'relative z-10 w-full h-12.5 rounded-lg border-2 px-4 outline-none text-[16px] leading-[22.4px] text-black placeholder:text-gray-400',
          isActive ? 'border-[#00AEEF]' : 'border-[#9E9E9E]',
          disabled && 'opacity-50'
        )}
      />

      <div
        className={clsx(
          'absolute left-4 px-2 bg-white pointer-events-none transition-all z-20',
          isActive
            ? '-top-3 text-[18px] font-bold text-[#00AEEF]'
            : 'top-1/2 -translate-y-1/2 text-[16px] text-[#9E9E9E]'
        )}
      >
        {label}
      </div>
    </div>
  );
}

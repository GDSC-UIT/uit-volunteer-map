import clsx from 'clsx';
import { useId, useState } from 'react';

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
  const id = useId();

  const isActive = isFocused || value.length > 0;

  return (
    <div className="relative w-full min-w-0 h-12.5">
      <input
        id={id}
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={clsx(
          'relative z-10 w-full h-12.5 rounded-lg border-2 pl-4 pr-14 outline-none focus-visible:ring-2 focus-visible:ring-[#023A54] focus-visible:ring-offset-2 text-[16px] leading-[22.4px] text-black placeholder:text-gray-400',
          isActive ? 'border-[#00AEEF]' : 'border-[#9E9E9E]',
          disabled && 'opacity-50'
        )}
      />

      <label
        htmlFor={id}
        className={clsx(
          'absolute left-4 px-2 bg-white pointer-events-none transition-all z-20',
          isActive
            ? '-top-3 text-[18px] font-bold text-[#00AEEF]'
            : 'top-1/2 -translate-y-1/2 text-[16px] text-[#9E9E9E]'
        )}
      >
        {label}
      </label>
    </div>
  );
}

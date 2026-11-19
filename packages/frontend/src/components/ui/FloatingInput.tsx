import clsx from 'clsx';
import { useId, useState, type HTMLInputAutoCompleteAttribute } from 'react';

interface FloatingInputProps {
  label: string;
  value: string;
  type?: string;
  disabled?: boolean;
  autoComplete?: HTMLInputAutoCompleteAttribute;
  name?: string;
  error?: string;
  describedBy?: string;
  required?: boolean;
  onChange: (value: string) => void;
}

export default function FloatingInput({
  label,
  value,
  type = 'text',
  disabled,
  autoComplete,
  name,
  error,
  describedBy,
  required,
  onChange,
}: FloatingInputProps) {

  const [isFocused, setIsFocused] = useState(false);
  const id = useId();

  const isActive = isFocused || value.length > 0;

  return (
    <div className="relative w-full min-w-0">
      <input
        id={id}
        type={type}
        name={name}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={[error ? `${id}-error` : null, describedBy].filter(Boolean).join(" ") || undefined}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={clsx(
          'relative z-10 w-full h-12.5 rounded-lg border-2 pl-4 pr-14 outline-none focus-visible:ring-2 focus-visible:ring-[#023A54] focus-visible:ring-offset-2 text-[16px] leading-[22.4px] text-black placeholder:text-gray-400',
          isActive ? 'border-[#023A54]' : 'border-[#9E9E9E]',
          disabled && 'opacity-50'
        )}
      />

      <label
        htmlFor={id}
        className={clsx(
          'absolute left-4 px-2 bg-white pointer-events-none transition-all z-20',
          isActive
            ? '-top-3 text-[18px] font-bold text-[#023A54]'
            : 'top-6.25 -translate-y-1/2 text-[16px] text-[#595959]'
        )}
      >
        {label}
      </label>
      {error && <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-[#8B0000]">{error}</p>}
    </div>
  );
}

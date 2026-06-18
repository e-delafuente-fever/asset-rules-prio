'use client';

import { InputHTMLAttributes } from 'react';

interface FloatingLabelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
}

export function FloatingLabelInput({ label, helperText, value, onChange, ...props }: FloatingLabelInputProps) {
  const hasValue = Boolean(value);

  return (
    <div className="flex flex-col gap-1">
      <div
        className={[
          'relative flex items-center h-14 px-3 rounded-lg border transition-colors cursor-text',
          hasValue ? 'border-[#CCD2D8]' : 'border-[#CCD2D8] focus-within:border-[#0079CA] focus-within:ring-1 focus-within:ring-[#0079CA]',
        ].join(' ')}
      >
        <div className="flex flex-col flex-1 justify-center gap-0.5">
          <span
            className={[
              'text-[#536B75] transition-all leading-none',
              hasValue ? 'text-xs' : 'text-base opacity-0 h-0 overflow-hidden',
            ].join(' ')}
          >
            {label}
          </span>
          <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={!hasValue ? label : ''}
            className={[
              'bg-transparent outline-none text-[#282828] text-base placeholder:text-[#8FA8B0] w-full',
              hasValue ? '' : 'placeholder:text-base',
            ].join(' ')}
            {...props}
          />
        </div>
      </div>
      {helperText && (
        <p className="text-xs text-[#536B75] pl-1">{helperText}</p>
      )}
    </div>
  );
}

'use client';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={[
        'relative inline-flex items-center flex-shrink-0',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      ].join(' ')}
    >
      <div
        className={[
          'relative w-12 h-7 rounded-full transition-colors duration-200 shadow-[0_2px_4px_rgba(6,35,44,0.16)]',
          checked ? 'bg-[#22C55E]' : 'bg-[#CCD2D8]',
        ].join(' ')}
      >
        <div
          className={[
            'absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 flex items-center justify-center',
            checked ? 'translate-x-6' : 'translate-x-1',
          ].join(' ')}
        >
          {checked && (
            <i className="fa-solid fa-check text-[#22C55E] text-[10px]" />
          )}
        </div>
      </div>
    </button>
  );
}

import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'tertiary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const VARIANT_STYLES = {
  primary: 'bg-[#0079CA] text-white hover:bg-[#006AB0] disabled:bg-[#CCD2D8] disabled:text-[#8FA8B0] disabled:cursor-not-allowed',
  secondary: 'border border-[#CCD2D8] text-[#282828] bg-white hover:bg-[#F2F3F3]',
  ghost: 'text-[#0079CA] hover:bg-[#E6F3FB]',
  tertiary: 'text-[#0079CA] hover:bg-[#E6F3FB] bg-transparent',
  danger: 'text-red-500 hover:bg-red-50',
};

const SIZE_STYLES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2 text-sm',
  lg: 'px-6 py-3 text-sm',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0079CA] ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

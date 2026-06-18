'use client';

interface AlertProps {
  title: string;
  description?: string;
  onClose?: () => void;
}

export function Alert({ title, description, onClose }: AlertProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 w-full rounded-lg overflow-hidden bg-[#E6F4EA] border border-[#A7D7B5] shadow-[0_12px_12px_rgba(0,70,121,0.2)]"
    >
      <div className="w-1 self-stretch bg-[#065F46] flex-shrink-0" />

      <div className="flex flex-1 items-start gap-3 py-3 pl-1 pr-2 min-w-0">
        <i className="fa-solid fa-check text-[#065F46] text-sm mt-0.5 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#065F46] leading-5">{title}</p>
          {description && (
            <p className="text-sm text-[#065F46] leading-6 mt-0.5">{description}</p>
          )}
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss alert"
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-[#282828] hover:text-[#031419] transition-colors rounded"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        )}
      </div>
    </div>
  );
}

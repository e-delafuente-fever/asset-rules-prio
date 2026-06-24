import { assetGroupsCopy } from '@/content/asset-groups';

interface BadgeProps {
  status: 'Active' | 'Inactive' | 'Invalid';
}

const STATUS_STYLES: Record<BadgeProps['status'], string> = {
  Active: 'border border-[#22C55E] text-[#16A34A] bg-[#F0FDF4]',
  Inactive: 'border border-[#CCD2D8] text-[#536B75] bg-[#F2F3F3]',
  Invalid: 'border border-[#FDBA74] text-[#C2410C] bg-[#FFF7ED]',
};

export function Badge({ status }: BadgeProps) {
  const isInvalid = status === 'Invalid';

  return (
    <span className="relative inline-flex group">
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold ${STATUS_STYLES[status]}`}
        title={isInvalid ? assetGroupsCopy.form.status.invalidTooltip : undefined}
      >
        {isInvalid && <span className="h-1.5 w-1.5 rounded-full bg-[#F97316]" />}
        {status}
      </span>
      {isInvalid && (
        <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#031419] px-3 py-2 text-xs font-medium text-white shadow-lg group-hover:block">
          {assetGroupsCopy.form.status.invalidTooltip}
        </span>
      )}
    </span>
  );
}

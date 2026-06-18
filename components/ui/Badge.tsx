interface BadgeProps {
  status: 'Active' | 'Inactive' | 'Archived';
}

const STATUS_STYLES: Record<BadgeProps['status'], string> = {
  Active: 'border border-[#22C55E] text-[#16A34A] bg-[#F0FDF4]',
  Inactive: 'border border-[#F97316] text-[#EA580C] bg-[#FFF7ED]',
  Archived: 'border border-[#CCD2D8] text-[#536B75] bg-[#F2F3F3]',
};

export function Badge({ status }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

'use client';

import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  onCreateClick: () => void;
}

export function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-20">
      <div className="flex flex-col items-center gap-3 text-center max-w-[520px]">
        <p className="text-[#031419] text-base font-semibold leading-6">
          Group assets that should be allocated together
        </p>
        <p className="text-[#031419] text-base font-normal leading-6">
          Asset groups help the system assign the right combination of assets when a booking requires more than one.
        </p>
        <p className="text-[#536B75] text-base font-normal leading-6">
          For example, you can group adjacent bowling lanes, connected rooms, or equipment that is usually booked together.
        </p>
        <div className="mt-2">
          <Button onClick={onCreateClick} size="lg">
            Create asset group
          </Button>
        </div>
      </div>
    </div>
  );
}

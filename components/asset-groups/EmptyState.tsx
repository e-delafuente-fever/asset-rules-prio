'use client';

import { Button } from '@/components/ui/Button';
import { assetGroupsCopy } from '@/content/asset-groups';

interface EmptyStateProps {
  onCreateClick: () => void;
}

export function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-20">
      <div className="flex flex-col items-center gap-3 text-center max-w-[520px]">
        <p className="text-[#031419] text-base font-semibold leading-6">
          {assetGroupsCopy.emptyState.title}
        </p>
        <p className="text-[#031419] text-base font-normal leading-6">
          {assetGroupsCopy.emptyState.description}
        </p>
        <div className="mt-2">
          <Button onClick={onCreateClick} size="lg">
            {assetGroupsCopy.actions.createRule}
          </Button>
        </div>
      </div>
    </div>
  );
}

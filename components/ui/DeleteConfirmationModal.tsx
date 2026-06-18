'use client';

import { Button } from './Button';

interface DeleteConfirmationModalProps {
  title: string;
  description: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmationModal({
  title,
  description,
  confirmLabel = 'Delete group',
  onCancel,
  onConfirm,
}: DeleteConfirmationModalProps) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(6,35,44,0.88)] p-14">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        className="relative flex w-full max-w-[480px] flex-col items-end gap-6 rounded-2xl bg-white p-6 shadow-[0_24px_24px_rgba(0,70,121,0.2)]"
      >
        <div className="flex h-10 max-h-10 w-full flex-col items-center gap-4">
          <div className="flex w-full items-center justify-center px-8">
            <h2
              id="delete-modal-title"
              className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-center text-[16px] font-bold leading-5 text-[#031419]"
            >
              {title}
            </h2>
          </div>
          <div className="h-px w-full bg-[#CCD2D8]" />
        </div>

        <p className="w-full text-center text-[16px] leading-6 text-[#031419]">
          {description}
        </p>

        <div className="flex w-full gap-4">
          <Button variant="secondary" size="lg" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={onConfirm}
            className="flex-1 bg-[#E90052] hover:bg-[#C90046] focus-visible:ring-[#E90052]"
          >
            {confirmLabel}
          </Button>
        </div>

        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="absolute right-3.5 top-3.5 flex h-11 w-11 items-center justify-center text-[#031419] transition-colors hover:text-[#536B75]"
        >
          <i className="fa-solid fa-xmark text-sm" />
        </button>
      </div>
    </div>
  );
}

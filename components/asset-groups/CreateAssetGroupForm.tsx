'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { ToastAlert } from '@/components/ui/ToastAlert';
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput';
import { Badge } from '@/components/ui/Badge';
import { assetGroupsCopy } from '@/content/asset-groups';
import { AssetSelector, Asset } from './AssetSelector';

type GroupType = 'consecutive' | 'fixed' | 'flexible' | null;

export interface AssetGroupFormData {
  name: string;
  isActive: boolean;
  groupType: GroupType;
  selectedAssets: Asset[];
}

interface StatusAlert {
  title: string;
  description: string;
}

interface CreateAssetGroupFormProps {
  isEdit?: boolean;
  initialData?: Partial<AssetGroupFormData>;
  onSave: (data: AssetGroupFormData) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const GROUP_TYPES = [
  {
    id: 'consecutive' as const,
    label: assetGroupsCopy.form.assignmentMethod.options.consecutive.label,
    description: assetGroupsCopy.form.assignmentMethod.options.consecutive.description,
  },
  {
    id: 'fixed' as const,
    label: assetGroupsCopy.form.assignmentMethod.options.fixed.label,
    description: assetGroupsCopy.form.assignmentMethod.options.fixed.description,
  },
  {
    id: 'flexible' as const,
    label: assetGroupsCopy.form.assignmentMethod.options.flexible.label,
    description: assetGroupsCopy.form.assignmentMethod.options.flexible.description,
  },
];

const GROUP_TYPE_SUBTITLE = assetGroupsCopy.form.assignmentMethod.description;

function assetsEqual(a: Asset[], b: Asset[]) {
  if (a.length !== b.length) return false;
  return a.every((asset, i) => asset.id === b[i]?.id);
}

export function CreateAssetGroupForm({ isEdit = false, initialData, onSave, onCancel, onDelete }: CreateAssetGroupFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [groupType, setGroupType] = useState<GroupType>(initialData?.groupType ?? null);
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>(initialData?.selectedAssets ?? []);
  const [statusAlert, setStatusAlert] = useState<StatusAlert | null>(null);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);

  const canSave = groupType !== null && selectedAssets.length >= 2;
  const showAssetPanel = groupType !== null;
  const isInvalidRule = isEdit && selectedAssets.length < 2;
  const statusLabel = isInvalidRule
    ? assetGroupsCopy.form.status.invalid
    : isActive
      ? assetGroupsCopy.form.status.active
      : assetGroupsCopy.form.status.inactive;
  const statusDescription = isInvalidRule
    ? assetGroupsCopy.form.status.invalidDescription
    : isActive
      ? assetGroupsCopy.form.status.activeDescription
      : assetGroupsCopy.form.status.inactiveDescription;
  const hasChanges = isEdit
    ? name !== (initialData?.name ?? '') ||
      isActive !== (initialData?.isActive ?? true) ||
      groupType !== (initialData?.groupType ?? null) ||
      !assetsEqual(selectedAssets, initialData?.selectedAssets ?? [])
    : name.trim().length > 0 || !isActive || groupType !== null || selectedAssets.length > 0;
  const canSubmit = canSave && hasChanges;

  const leaveForm = () => {
    setShowUnsavedChangesModal(false);
    onCancel();
  };

  const requestLeaveForm = () => {
    if (hasChanges) {
      setShowUnsavedChangesModal(true);
      return;
    }
    onCancel();
  };

  const handleStatusChange = (checked: boolean) => {
    setIsActive(checked);
    setStatusAlert(
      checked
        ? {
            title: assetGroupsCopy.form.status.enabledToastTitle,
            description: assetGroupsCopy.form.status.enabledToastDescription,
          }
        : {
            title: assetGroupsCopy.form.status.disabledToastTitle,
            description: assetGroupsCopy.form.status.disabledToastDescription,
          }
    );
  };

  const handleSave = () => {
    if (!canSubmit || groupType === null) return;
    const resolvedName = name.trim() || selectedAssets.map((a) => a.name).join(', ');
    onSave({ name: resolvedName, isActive, groupType, selectedAssets });
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Breadcrumb */}
      <div className="mb-6">
        <p className="text-sm text-[#536B75]">
          <button type="button" onClick={requestLeaveForm} className="hover:underline text-[#0079CA]">Hubs</button>
          <span className="mx-1">/</span>
          <button type="button" onClick={requestLeaveForm} className="hover:underline text-[#0079CA]">Chadstone</button>
        </p>
        <h1 className="text-2xl font-bold text-[#031419] mt-1">
          {isEdit ? assetGroupsCopy.form.title.edit : assetGroupsCopy.form.title.create}
        </h1>
      </div>

      {statusAlert && (
        <ToastAlert
          title={statusAlert.title}
          description={statusAlert.description}
          onClose={() => setStatusAlert(null)}
        />
      )}

      {/* Group name */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-[#282828] mb-2">{assetGroupsCopy.form.ruleName.sectionTitle}</label>
        <FloatingLabelInput
          label={assetGroupsCopy.form.ruleName.label}
          value={name}
          onChange={(e) => setName(e.target.value)}
          helperText={assetGroupsCopy.form.ruleName.helperText}
        />
      </div>

      {/* Two-column layout (or single column before type is selected) */}
      <div className={`flex gap-4 flex-1 ${showAssetPanel ? '' : ''}`}>
        {/* Settings panel */}
        <div className={`${showAssetPanel ? 'w-[420px] flex-shrink-0' : 'w-full max-w-[500px]'}`}>
          <div className="border border-[#CCD2D8] rounded-lg p-6 bg-white">
            <h2 className="text-base font-semibold text-[#282828] mb-5">{assetGroupsCopy.form.settings}</h2>

            {isInvalidRule && (
              <div className="mb-5 flex w-full items-start gap-3 rounded-lg border border-[#FDBA74] bg-[#FFF7ED] px-4 py-3">
                <i className="fa-solid fa-triangle-exclamation mt-0.5 flex-shrink-0 text-sm text-[#F97316]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-5 text-[#9A3412]">
                    {assetGroupsCopy.form.status.invalidWarning.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-4 text-[#C2410C]">
                    {assetGroupsCopy.form.status.invalidWarning.description}
                  </p>
                </div>
              </div>
            )}

            {/* Status toggle */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-semibold text-[#282828]">
                  {assetGroupsCopy.form.status.label}{!isInvalidRule ? `: ${statusLabel}` : ''}
                </p>
                <p className="text-xs text-[#536B75] mt-0.5">
                  {statusDescription}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {isInvalidRule && <Badge status="Invalid" />}
                <Switch checked={isActive} onChange={handleStatusChange} disabled={isInvalidRule} />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#CCD2D8] mb-5" />

            {/* Group type */}
            <div>
              <p className="text-sm font-semibold text-[#282828] mb-1">{assetGroupsCopy.form.assignmentMethod.label}</p>
              <p className="text-xs text-[#536B75] mb-0.5">{GROUP_TYPE_SUBTITLE}</p>
              <p className="text-xs font-semibold text-[#282828] mb-4">{assetGroupsCopy.form.assignmentMethod.lockedHint}</p>

              <div className="flex flex-col gap-3">
                {GROUP_TYPES.map((type) => {
                  const isSelected = groupType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setGroupType(type.id)}
                      className={[
                        'flex items-start gap-3 p-4 rounded-lg border text-left transition-all',
                        isSelected
                          ? 'border-[#0079CA] bg-white shadow-[0_0_0_1px_#0079CA]'
                          : 'border-[#CCD2D8] hover:border-[#536B75]',
                      ].join(' ')}
                    >
                      {/* Radio dot */}
                      <div className={[
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                        isSelected ? 'border-[#0079CA]' : 'border-[#CCD2D8]',
                      ].join(' ')}>
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#0079CA]" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#282828]">{type.label}</p>
                        <p className="text-xs text-[#536B75] mt-0.5">{type.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Asset selector panel */}
        {showAssetPanel && (
          <div className="flex-1 border border-[#CCD2D8] rounded-lg p-6 bg-white flex flex-col min-h-[520px]">
            <AssetSelector
              selectedAssets={selectedAssets}
              onSelectedChange={setSelectedAssets}
              groupType={groupType!}
            />
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="fixed bottom-0 left-[256px] right-0 bg-white border-t border-[#CCD2D8] px-8 py-4 flex items-center justify-between gap-3 z-30">
        <div>
          {isEdit && onDelete && (
            <Button variant="danger" onClick={onDelete}>
              <i className="fa-solid fa-trash-can text-xs" />
              {assetGroupsCopy.actions.deleteRule}
            </Button>
          )}
        </div>
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={requestLeaveForm}>
            {assetGroupsCopy.actions.cancel}
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!canSubmit}>
            {assetGroupsCopy.actions.save}
          </Button>
        </div>
      </div>

      {showUnsavedChangesModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(6,35,44,0.88)] p-14">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="unsaved-changes-title"
            className="relative flex w-full max-w-[480px] flex-col items-end gap-6 rounded-2xl bg-white p-6 shadow-[0_24px_24px_rgba(0,70,121,0.2)]"
          >
            <div className="flex h-10 max-h-10 w-full flex-col items-center gap-4">
              <div className="flex w-full items-center justify-center px-8">
                <h2
                  id="unsaved-changes-title"
                  className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-center text-[16px] font-bold leading-5 text-[#031419]"
                >
                  {assetGroupsCopy.modals.unsavedChanges.title}
                </h2>
              </div>
              <div className="h-px w-full bg-[#CCD2D8]" />
            </div>

            <p className="w-full text-center text-[16px] leading-6 text-[#031419]">
              {assetGroupsCopy.modals.unsavedChanges.description}
            </p>

            <div className="flex w-full gap-4">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setShowUnsavedChangesModal(false)}
                className="flex-1"
              >
                {assetGroupsCopy.modals.unsavedChanges.continueEditingLabel}
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={leaveForm}
                className="flex-1"
              >
                {assetGroupsCopy.modals.unsavedChanges.leaveLabel}
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setShowUnsavedChangesModal(false)}
              aria-label="Close"
              className="absolute right-3.5 top-3.5 flex h-11 w-11 items-center justify-center text-[#031419] transition-colors hover:text-[#536B75]"
            >
              <i className="fa-solid fa-xmark text-sm" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

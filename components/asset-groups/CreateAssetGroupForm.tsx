'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { ToastAlert } from '@/components/ui/ToastAlert';
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput';
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
  onBackToHub?: () => void;
}

const GROUP_TYPES = [
  {
    id: 'consecutive' as const,
    label: 'Consecutive assets',
    description: 'Use assets in sequence based on their order in the group',
  },
  {
    id: 'fixed' as const,
    label: 'Fixed group',
    description: 'Always assign all assets in this group together',
  },
  {
    id: 'flexible' as const,
    label: 'Flexible combination',
    description: 'Allow any mix of assets from this group to be assigned together',
  },
];

const GROUP_TYPE_SUBTITLE = 'Determines how the system selects assets from this group.';

function assetsEqual(a: Asset[], b: Asset[]) {
  if (a.length !== b.length) return false;
  return a.every((asset, i) => asset.id === b[i]?.id);
}

export function CreateAssetGroupForm({ isEdit = false, initialData, onSave, onCancel, onBackToHub }: CreateAssetGroupFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [groupType, setGroupType] = useState<GroupType>(initialData?.groupType ?? null);
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>(initialData?.selectedAssets ?? []);
  const [statusAlert, setStatusAlert] = useState<StatusAlert | null>(null);

  const canSave = groupType !== null && selectedAssets.length >= 2;
  const showAssetPanel = groupType !== null;
  const hasChanges = isEdit
    ? name !== (initialData?.name ?? '') ||
      isActive !== (initialData?.isActive ?? true) ||
      groupType !== (initialData?.groupType ?? null) ||
      !assetsEqual(selectedAssets, initialData?.selectedAssets ?? [])
    : true;
  const canSubmit = canSave && hasChanges;

  const handleStatusChange = (checked: boolean) => {
    setIsActive(checked);
    setStatusAlert(
      checked
        ? {
            title: 'Group enabled',
            description: 'This group is available for automatic allocation again',
          }
        : {
            title: 'Group disabled',
            description: 'This group is no longer used during automatic allocation.',
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
          <button type="button" onClick={onBackToHub} className="hover:underline text-[#0079CA]">Hubs</button>
          <span className="mx-1">/</span>
          <button type="button" onClick={onBackToHub} className="hover:underline text-[#0079CA]">Funlab Chadstone</button>
        </p>
        <h1 className="text-2xl font-bold text-[#031419] mt-1">
          {isEdit ? 'Edit asset group' : 'Create asset group'}
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
        <label className="block text-sm font-semibold text-[#282828] mb-2">Group name</label>
        <FloatingLabelInput
          label="Group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          helperText="Used internally only. Customers won't see this name."
        />
      </div>

      {/* Two-column layout (or single column before type is selected) */}
      <div className={`flex gap-4 flex-1 ${showAssetPanel ? '' : ''}`}>
        {/* Settings panel */}
        <div className={`${showAssetPanel ? 'w-[420px] flex-shrink-0' : 'w-full max-w-[500px]'}`}>
          <div className="border border-[#CCD2D8] rounded-lg p-6 bg-white">
            <h2 className="text-base font-semibold text-[#282828] mb-5">Settings</h2>

            {/* Status toggle */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-semibold text-[#282828]">
                  Status: {isActive ? 'Active' : 'Inactive'}
                </p>
                <p className="text-xs text-[#536B75] mt-0.5">
                  When turned off, the system won&apos;t use this group when assigning bookings.
                </p>
              </div>
              <Switch checked={isActive} onChange={handleStatusChange} />
            </div>

            {/* Divider */}
            <div className="border-t border-[#CCD2D8] mb-5" />

            {/* Group type */}
            <div>
              <p className="text-sm font-semibold text-[#282828] mb-1">Group type</p>
              <p className="text-xs text-[#536B75] mb-0.5">{GROUP_TYPE_SUBTITLE}</p>
              <p className="text-xs font-semibold text-[#282828] mb-4">This setting can&apos;t be changed after saving.</p>

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
        <div />
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!canSubmit}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { EmptyState } from '@/components/asset-groups/EmptyState';
import { AssetGroupList, AssetGroup, INITIAL_GROUPS, sortAssetGroups } from '@/components/asset-groups/AssetGroupList';
import { CreateAssetGroupForm, AssetGroupFormData } from '@/components/asset-groups/CreateAssetGroupForm';
import { Button } from '@/components/ui/Button';
import { ToastAlert } from '@/components/ui/ToastAlert';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import { assetGroupsCopy } from '@/content/asset-groups';
import { AVAILABLE_ASSETS, getAssetGroupContributionPax } from '@/components/asset-groups/AssetSelector';

type View = 'empty' | 'create' | 'list' | 'edit';
type Tab = 'venues' | 'assets' | 'asset-groups' | 'activities' | 'activity-packs' | 'translations';

const TABS: { id: Tab; label: string }[] = [
  { id: 'venues', label: assetGroupsCopy.navigation.tabs.venues },
  { id: 'assets', label: assetGroupsCopy.navigation.tabs.assets },
  { id: 'asset-groups', label: assetGroupsCopy.navigation.tabs.allocationRules },
  { id: 'activities', label: assetGroupsCopy.navigation.tabs.activities },
  { id: 'activity-packs', label: assetGroupsCopy.navigation.tabs.activityPacks },
  { id: 'translations', label: assetGroupsCopy.navigation.tabs.translations },
];

function typeToGroupType(type: AssetGroup['type']): 'consecutive' | 'fixed' | 'flexible' {
  if (type === 'Inline') return 'consecutive';
  if (type === 'Exact') return 'fixed';
  return 'flexible';
}

function groupTypeToType(gt: 'consecutive' | 'fixed' | 'flexible'): AssetGroup['type'] {
  if (gt === 'consecutive') return 'Inline';
  if (gt === 'fixed') return 'Exact';
  return 'Flexible';
}

function assetsFromList(assetList: string) {
  const names = assetList.split(',').map((n) => n.trim()).filter(Boolean);
  return names.map((name, index) => {
    const found = AVAILABLE_ASSETS.find((a) => a.name === name);
    if (found) return found;
    return byGroup(`asset-${index}-${name}`, name, 1, 2, 5);
  });
}

function byGroup(
  id: string,
  name: string,
  groupsCount: number,
  minPax: number,
  maxPax: number
) {
  return { id, name, group: 'By group' as const, groupsCount, minPax, maxPax };
}

export default function Home() {
  const [view, setView] = useState<View>('list');
  const [activeTab, setActiveTab] = useState<Tab>('asset-groups');
  const [groups, setGroups] = useState<AssetGroup[]>(() => sortAssetGroups(INITIAL_GROUPS));
  const [editingGroup, setEditingGroup] = useState<AssetGroup | null>(null);
  const [nextId, setNextId] = useState(INITIAL_GROUPS.length + 1);
  const [listAlert, setListAlert] = useState<string | null>(null);
  const [groupPendingDelete, setGroupPendingDelete] = useState<AssetGroup | null>(null);

  const handleCreateClick = () => {
    setEditingGroup(null);
    setView('create');
  };

  const handleSave = (data: AssetGroupFormData) => {
    if (editingGroup) {
      setGroups((prev) =>
        sortAssetGroups(
          prev.map((g) =>
            g.id === editingGroup.id
              ? {
                  ...g,
                  name: data.name,
                  status: data.isActive ? 'Active' : 'Inactive',
                  type: groupTypeToType(data.groupType!),
                  assetList: data.selectedAssets.map((a) => a.name).join(', '),
                  combinedCapacity: `${data.selectedAssets.reduce((sum, a) => sum + getAssetGroupContributionPax(a), 0)} pax`,
                }
              : g
          )
        )
      );
      setListAlert(assetGroupsCopy.list.updatedToast);
    } else {
      const newGroup: AssetGroup = {
        id: nextId,
        order: groups.length + 1,
        name: data.name,
        status: data.isActive ? 'Active' : 'Inactive',
        type: groupTypeToType(data.groupType!),
        assetList: data.selectedAssets.map((a) => a.name).join(', '),
        combinedCapacity: `${data.selectedAssets.reduce((sum, a) => sum + getAssetGroupContributionPax(a), 0)} pax`,
      };
      setGroups((prev) => sortAssetGroups([...prev, newGroup]));
      setNextId((n) => n + 1);
      setListAlert(assetGroupsCopy.list.createdToast);
    }
    setEditingGroup(null);
    setView('list');
  };

  const handleCancel = () => {
    setEditingGroup(null);
    setView(groups.length > 0 ? 'list' : 'empty');
  };

  const handleEdit = (group: AssetGroup) => {
    setEditingGroup(group);
    setView('edit');
  };

  const handleDeleteRequest = (id: number) => {
    setGroupPendingDelete(groups.find((g) => g.id === id) ?? null);
  };

  const handleConfirmDelete = () => {
    if (!groupPendingDelete) return;
    const next = sortAssetGroups(groups.filter((g) => g.id !== groupPendingDelete.id));
    setGroups(next);
    setEditingGroup(null);
    if (next.length === 0) {
      setView('empty');
    } else if (view === 'edit') {
      setView('list');
    }
    setGroupPendingDelete(null);
  };

  const handleReorder = (reordered: AssetGroup[]) => {
    setGroups(sortAssetGroups(reordered));
  };

  const isCreateOrEdit = view === 'create' || view === 'edit';

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Sidebar />

      <main className="ml-[256px] pt-[72px] min-h-screen">
        <div className={`px-8 flex flex-col min-h-[calc(100vh-72px)] ${isCreateOrEdit ? 'py-6 pb-24' : 'py-6'}`}>
          {!isCreateOrEdit && (
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-sm text-[#536B75]">
                  <button
                    type="button"
                    onClick={() => setView(groups.length > 0 ? 'list' : 'empty')}
                    className="hover:underline text-[#0079CA]"
                  >
                    Hubs
                  </button>
                </p>
                <h1 className="text-2xl font-bold text-[#031419]">
                  {assetGroupsCopy.navigation.hubName}
                </h1>
              </div>
              {(view === 'list' || view === 'empty') && (
                <div className="flex items-center gap-3">
                  {view === 'list' && (
                    <Button onClick={handleCreateClick} size="lg">
                      <i className="fa-solid fa-plus text-xs" />
                      {assetGroupsCopy.actions.createRule}
                    </Button>
                  )}
                  {view === 'empty' && (
                    <Button variant="secondary" size="lg">
                      {assetGroupsCopy.actions.actions}
                      <i className="fa-solid fa-chevron-down text-xs" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {!isCreateOrEdit && (
            <div className="flex items-end border-b border-[#CCD2D8] mb-6 gap-0">
              {TABS.map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={[
                      'px-3 py-2 text-sm whitespace-nowrap transition-colors -mb-px',
                      isActive
                        ? 'border-b-2 border-[#0079CA] text-[#0079CA] font-semibold'
                        : 'border-b border-transparent text-[#031419] hover:text-[#0079CA]',
                    ].join(' ')}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}

          {view === 'empty' && <EmptyState onCreateClick={handleCreateClick} />}

          {view === 'list' && (
            <>
              {listAlert && (
                <ToastAlert
                  title={listAlert}
                  onClose={() => setListAlert(null)}
                />
              )}
              <AssetGroupList
                groups={groups}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
                onReorder={handleReorder}
              />
            </>
          )}

          {isCreateOrEdit && (
            <CreateAssetGroupForm
              isEdit={view === 'edit'}
              initialData={
                editingGroup
                  ? {
                      name: editingGroup.name,
                      isActive: editingGroup.status === 'Active',
                      groupType: typeToGroupType(editingGroup.type),
                      selectedAssets: assetsFromList(editingGroup.assetList),
                    }
                  : undefined
              }
              onSave={handleSave}
              onCancel={handleCancel}
              onDelete={editingGroup ? () => handleDeleteRequest(editingGroup.id) : undefined}
            />
          )}

          {groupPendingDelete && (
            <DeleteConfirmationModal
              title={assetGroupsCopy.modals.deleteRule.title}
              description={assetGroupsCopy.modals.deleteRule.description}
              confirmLabel={assetGroupsCopy.modals.deleteRule.confirmLabel}
              onCancel={() => setGroupPendingDelete(null)}
              onConfirm={handleConfirmDelete}
            />
          )}
        </div>
      </main>
    </div>
  );
}

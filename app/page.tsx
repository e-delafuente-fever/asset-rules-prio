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
import { AVAILABLE_ASSETS } from '@/components/asset-groups/AssetSelector';

type View = 'empty' | 'create' | 'list' | 'archived' | 'edit';
type Tab = 'venues' | 'assets' | 'asset-groups' | 'activities' | 'activity-packs' | 'translations';

const TABS: { id: Tab; label: string }[] = [
  { id: 'venues', label: 'Venues' },
  { id: 'assets', label: 'Assets' },
  { id: 'asset-groups', label: 'Asset groups' },
  { id: 'activities', label: 'Activities' },
  { id: 'activity-packs', label: 'Activity packs' },
  { id: 'translations', label: 'Translations' },
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
    const found = AVAILABLE_ASSETS.find(
      (a) => a.name === name || a.name.startsWith(name) || name.startsWith(a.name)
    );
    if (found) return found;
    return {
      id: `asset-${index}-${name}`,
      name,
      group: 'By group',
      capacity: '1 group',
      pax: 5,
    };
  });
}

export default function Home() {
  const [view, setView] = useState<View>('list');
  const [activeTab, setActiveTab] = useState<Tab>('asset-groups');
  const [groups, setGroups] = useState<AssetGroup[]>(() => sortAssetGroups(INITIAL_GROUPS));
  const [editingGroup, setEditingGroup] = useState<AssetGroup | null>(null);
  const [nextId, setNextId] = useState(INITIAL_GROUPS.length + 1);
  const [listAlert, setListAlert] = useState<string | null>(null);
  const [groupPendingDelete, setGroupPendingDelete] = useState<AssetGroup | null>(null);

  const visibleGroups = groups.filter((group) => group.status !== 'Archived');
  const archivedGroups = groups.filter((group) => group.status === 'Archived');
  const hasArchivedGroups = archivedGroups.length > 0;

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
                  combinedCapacity: `${data.selectedAssets.reduce((sum, a) => sum + a.pax, 0)} pax`,
                }
              : g
          )
        )
      );
    } else {
      const newGroup: AssetGroup = {
        id: nextId,
        order: groups.length + 1,
        name: data.name,
        status: data.isActive ? 'Active' : 'Inactive',
        type: groupTypeToType(data.groupType!),
        assetList: data.selectedAssets.map((a) => a.name).join(', '),
        combinedCapacity: `${data.selectedAssets.reduce((sum, a) => sum + a.pax, 0)} pax`,
      };
      setGroups((prev) => sortAssetGroups([...prev, newGroup]));
      setNextId((n) => n + 1);
      setListAlert('Asset group created');
    }
    setEditingGroup(null);
    setView('list');
  };

  const handleCancel = () => {
    setEditingGroup(null);
    setView(visibleGroups.length > 0 ? 'list' : 'empty');
  };

  const handleBackToHub = () => {
    setEditingGroup(null);
    setView(visibleGroups.length > 0 ? 'list' : 'empty');
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
    if (next.filter((g) => g.status !== 'Archived').length === 0 && view !== 'archived') {
      setView('empty');
    }
    if (view === 'archived' && next.filter((g) => g.status === 'Archived').length === 0) {
      setView(next.some((g) => g.status !== 'Archived') ? 'list' : 'empty');
    }
    setGroupPendingDelete(null);
  };

  const handleArchive = (id: number) => {
    setGroups((prev) =>
      sortAssetGroups(
        prev.map((g) => (g.id === id ? { ...g, status: 'Archived' as const } : g))
      )
    );
    setListAlert('Asset group archived');
  };

  const handleUnarchive = (id: number) => {
    const next = sortAssetGroups(
      groups.map((g) => (g.id === id ? { ...g, status: 'Active' as const } : g))
    );
    setGroups(next);
    if (view === 'archived' && !next.some((g) => g.status === 'Archived')) {
      setView('list');
    }
  };

  const handleArchiveFromEdit = () => {
    if (!editingGroup) return;
    const next = sortAssetGroups(
      groups.map((g) => (g.id === editingGroup.id ? { ...g, status: 'Archived' as const } : g))
    );
    setGroups(next);
    setEditingGroup(null);
    setListAlert('Asset group archived');
    setView(next.some((g) => g.status !== 'Archived') ? 'list' : 'empty');
  };

  const handleUnarchiveFromEdit = () => {
    if (!editingGroup) return;
    const next = sortAssetGroups(
      groups.map((g) => (g.id === editingGroup.id ? { ...g, status: 'Active' as const } : g))
    );
    setGroups(next);
    setEditingGroup(null);
    setView('list');
  };

  const handleReorder = (reordered: AssetGroup[]) => {
    setGroups(sortAssetGroups([...reordered, ...archivedGroups]));
  };

  const isCreateOrEdit = view === 'create' || view === 'edit';
  const isArchivedView = view === 'archived';

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
                    onClick={() => setView(visibleGroups.length > 0 ? 'list' : 'empty')}
                    className="hover:underline text-[#0079CA]"
                  >
                    Hubs
                  </button>
                </p>
                <h1 className="text-2xl font-bold text-[#031419]">
                  {isArchivedView ? 'Archived asset groups' : 'Funlab Chadstone'}
                </h1>
              </div>
              {(view === 'list' || view === 'empty') && (
                <div className="flex items-center gap-3">
                  {hasArchivedGroups && (
                    <Button variant="secondary" onClick={() => setView('archived')} size="lg">
                      <i className="fa-regular fa-box-open text-xs" />
                      Archive
                    </Button>
                  )}
                  {view === 'list' && (
                    <Button onClick={handleCreateClick} size="lg">
                      <i className="fa-solid fa-plus text-xs" />
                      Create asset group
                    </Button>
                  )}
                  {view === 'empty' && (
                    <Button variant="secondary" size="lg">
                      Actions
                      <i className="fa-solid fa-chevron-down text-xs" />
                    </Button>
                  )}
                </div>
              )}
              {view === 'archived' && (
                <Button variant="secondary" onClick={() => setView(visibleGroups.length > 0 ? 'list' : 'empty')} size="lg">
                  <i className="fa-solid fa-angle-left text-xs" />
                  Back to asset groups
                </Button>
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
                groups={visibleGroups}
                onCreateClick={handleCreateClick}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
                onReorder={handleReorder}
              />
            </>
          )}

          {view === 'archived' && (
            <AssetGroupList
              groups={archivedGroups}
              onCreateClick={handleCreateClick}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
              onArchive={handleArchive}
              onUnarchive={handleUnarchive}
              onReorder={handleReorder}
              mode="archived"
            />
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
              onArchive={editingGroup && editingGroup.status !== 'Archived' ? handleArchiveFromEdit : undefined}
              onUnarchive={editingGroup && editingGroup.status === 'Archived' ? handleUnarchiveFromEdit : undefined}
              onBackToHub={handleBackToHub}
            />
          )}

          {groupPendingDelete && (
            <DeleteConfirmationModal
              title="Delete asset group?"
              description="Deleting this group won't affect existing bookings. Future allocations will no longer consider this group."
              confirmLabel="Delete group"
              onCancel={() => setGroupPendingDelete(null)}
              onConfirm={handleConfirmDelete}
            />
          )}
        </div>
      </main>
    </div>
  );
}

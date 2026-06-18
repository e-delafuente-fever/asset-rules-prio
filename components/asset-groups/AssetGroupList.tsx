'use client';

import { useState, useRef } from 'react';
import { Badge } from '@/components/ui/Badge';

export interface AssetGroup {
  id: number;
  order: number;
  name: string;
  status: 'Active' | 'Inactive' | 'Archived';
  type: 'Inline' | 'Exact' | 'Flexible';
  assetList: string;
  combinedCapacity: string;
}

function isInactiveGroup(group: AssetGroup) {
  return group.status === 'Inactive';
}

function isArchivedGroup(group: AssetGroup) {
  return group.status === 'Archived';
}

export function sortAssetGroups(groups: AssetGroup[]): AssetGroup[] {
  const active = groups
    .filter((g) => !isInactiveGroup(g) && !isArchivedGroup(g))
    .sort((a, b) => a.order - b.order)
    .map((group, index) => ({ ...group, order: index + 1 }));
  const inactive = groups
    .filter((g) => isInactiveGroup(g))
    .sort((a, b) => a.order - b.order)
    .map((group) => ({ ...group, order: 0 }));
  const archived = groups
    .filter((g) => isArchivedGroup(g))
    .map((group) => ({ ...group, order: 0 }));
  return [...active, ...inactive, ...archived];
}

const INITIAL_GROUPS: AssetGroup[] = [
  { id: 1, order: 1, name: 'Base lanes', status: 'Active', type: 'Inline', assetList: 'Lane 1, Lane 2, Lane 3', combinedCapacity: '15 pax' },
  { id: 2, order: 2, name: 'Lanes VIP', status: 'Active', type: 'Exact', assetList: 'Lane 7, Lane 8', combinedCapacity: '10 pax' },
  { id: 3, order: 3, name: 'F&B Tables', status: 'Active', type: 'Inline', assetList: 'Table 1, Table 2, Table 3 and 2...', combinedCapacity: '40 pax' },
  { id: 4, order: 4, name: 'Tables VIP', status: 'Active', type: 'Exact', assetList: 'Table 8, Table 9', combinedCapacity: '24 pax' },
  { id: 5, order: 0, name: 'First floor lanes', status: 'Inactive', type: 'Inline', assetList: 'Lane 4, Lane 5, Lane 6', combinedCapacity: '15 pax' },
];

interface AssetGroupListProps {
  groups: AssetGroup[];
  onCreateClick: () => void;
  onEdit: (group: AssetGroup) => void;
  onDelete: (id: number) => void;
  onArchive: (id: number) => void;
  onUnarchive: (id: number) => void;
  onReorder: (groups: AssetGroup[]) => void;
  mode?: 'default' | 'archived';
}

export function AssetGroupList({ groups, onCreateClick, onEdit, onDelete, onArchive, onUnarchive, onReorder, mode = 'default' }: AssetGroupListProps) {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [page] = useState(1);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);
  const dragNode = useRef<number | null>(null);

  const isArchivedMode = mode === 'archived';
  const total = groups.length;
  const perPage = 10;

  const toggleMenu = (id: number) => setOpenMenuId(openMenuId === id ? null : id);

  // Move a group up or down by one step (active groups only)
  const moveGroup = (id: number, dir: 'up' | 'down') => {
    const activeGroups = groups.filter((g) => !isInactiveGroup(g) && !isArchivedGroup(g));
    const idx = activeGroups.findIndex((g) => g.id === id);
    if (idx === -1) return;
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= activeGroups.length) return;
    const next = [...activeGroups];
    [next[idx], next[target]] = [next[target], next[idx]];
    // Reassign order based on new position before sorting
    const reordered = next.map((g, i) => ({ ...g, order: i + 1 }));
    const inactive = groups.filter((g) => isInactiveGroup(g));
    onReorder(sortAssetGroups([...reordered, ...inactive]));
  };

  // Drag handlers — only active groups are draggable
  const handleDragStart = (e: React.DragEvent, id: number) => {
    dragNode.current = id;
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Slight delay so the ghost renders before we dim the source
    setTimeout(() => setDraggingId(id), 0);
  };

  const handleDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = groups.find((g) => g.id === id);
    if (id !== dragNode.current && target && !isInactiveGroup(target) && !isArchivedGroup(target)) {
      setDropTargetId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    const fromId = dragNode.current;
    if (!fromId || fromId === targetId) return;

    const activeGroups = groups.filter((g) => !isInactiveGroup(g) && !isArchivedGroup(g));
    const fromIdx = activeGroups.findIndex((g) => g.id === fromId);
    const toIdx = activeGroups.findIndex((g) => g.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const next = [...activeGroups];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);

    // Reassign order based on new position before sorting
    const reordered = next.map((g, i) => ({ ...g, order: i + 1 }));
    const inactive = groups.filter((g) => isInactiveGroup(g));
    onReorder(sortAssetGroups([...reordered, ...inactive]));
    resetDrag();
  };

  const resetDrag = () => {
    dragNode.current = null;
    setDraggingId(null);
    setDropTargetId(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Description + pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#536B75]">
          Assets are the resources needed to run activities, such as rooms, equipment, or guides.
        </p>
        <div className="flex items-center gap-2 text-sm text-[#536B75]">
          <span>{(page - 1) * perPage + 1} – {Math.min(page * perPage, total)} of {total}</span>
          <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-[#F2F3F3] disabled:opacity-30" disabled>
            <i className="fa-solid fa-angle-left text-xs" />
          </button>
          <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-[#F2F3F3] disabled:opacity-30" disabled>
            <i className="fa-solid fa-angle-right text-xs" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-visible bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#CCD2D8]">
              {!isArchivedMode && (
                <>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-[#031419] w-14">Order</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-[#031419] w-16">Prio</th>
                </>
              )}
              <th className="text-left px-4 py-3 text-sm font-semibold text-[#031419]">Name</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-[#031419] w-24">Status</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-[#031419] w-24">Type</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-[#031419]">Asset list</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-[#031419] w-36">Combined capacity</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-[#031419] w-16">Actions</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const inactive = isInactiveGroup(group);
              const archived = isArchivedGroup(group);
              const canReorder = !inactive && !archived && !isArchivedMode;
              const isDragging = draggingId === group.id;
              const isDropTarget = dropTargetId === group.id;

              return (
                <tr
                  key={group.id}
                  draggable={canReorder}
                  onClick={() => onEdit(group)}
                  onDragStart={canReorder ? (e) => handleDragStart(e, group.id) : undefined}
                  onDragOver={canReorder ? (e) => handleDragOver(e, group.id) : undefined}
                  onDrop={canReorder ? (e) => handleDrop(e, group.id) : undefined}
                  onDragEnd={resetDrag}
                  className={[
                    'border-b border-[#CCD2D8] last:border-b-0 transition-colors',
                    isDragging ? 'opacity-40 bg-[#F2F3F3]' : 'hover:bg-[#FAFAFA]',
                    isDropTarget ? 'border-t-2 border-t-[#0079CA]' : '',
                    'cursor-pointer',
                  ].join(' ')}
                >
                  {!isArchivedMode && (
                    <>
                      {/* Order column: arrows + drag affordance */}
                      <td
                        className="px-3 py-[14px] select-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {canReorder && (
                          <div
                            className="flex items-center gap-1 group/order"
                            title="Drag to reorder"
                          >
                            {/* Drag handle affordance — visible on hover of the cell */}
                            <div
                              className={[
                                'flex flex-col gap-0.5 transition-colors',
                                draggingId === null ? 'cursor-grab active:cursor-grabbing' : 'cursor-grabbing',
                              ].join(' ')}
                            >
                              <button
                                type="button"
                                onClick={() => moveGroup(group.id, 'up')}
                                className="text-[#CCD2D8] group-hover/order:text-[#536B75] hover:!text-[#282828] transition-colors disabled:opacity-30"
                                disabled={group.order === 1}
                                title="Move up"
                              >
                                <i className="fa-solid fa-angle-up text-xs block" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveGroup(group.id, 'down')}
                                className="text-[#CCD2D8] group-hover/order:text-[#536B75] hover:!text-[#282828] transition-colors disabled:opacity-30"
                                disabled={groups.filter((g) => !isInactiveGroup(g) && !isArchivedGroup(g)).at(-1)?.id === group.id}
                                title="Move down"
                              >
                                <i className="fa-solid fa-angle-down text-xs block" />
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-[14px] text-sm text-[#031419]">{inactive ? '–' : group.order}</td>
                    </>
                  )}
                  <td className="px-3 py-[14px] text-sm font-semibold text-[#031419]">{group.name}</td>
                  <td className="px-3 py-[14px]">
                    <Badge status={group.status} />
                  </td>
                  <td className="px-3 py-[14px] text-sm text-[#031419]">{group.type}</td>
                  <td className="px-3 py-[14px] text-sm text-[#536B75] max-w-[200px] truncate">{group.assetList}</td>
                  <td className="px-3 py-[14px] text-sm text-[#031419]">{group.combinedCapacity}</td>
                  <td className="px-3 py-[14px] relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => toggleMenu(group.id)}
                      className="w-8 h-8 rounded flex items-center justify-center hover:bg-[#F2F3F3] transition-colors"
                    >
                      <i className="fa-solid fa-ellipsis-vertical text-[#536B75]" />
                    </button>
                    {openMenuId === group.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 top-10 w-40 bg-white border border-[#CCD2D8] rounded-lg shadow-lg z-30 py-1 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => { onEdit(group); setOpenMenuId(null); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#282828] hover:bg-[#F2F3F3] transition-colors"
                          >
                            <i className="fa-solid fa-pen-to-square text-[#536B75] w-4" />
                            Edit
                          </button>
                          {!archived && (
                            <button
                              type="button"
                              onClick={() => { onArchive(group.id); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#282828] hover:bg-[#F2F3F3] transition-colors"
                            >
                              <i className="fa-regular fa-box-open text-[#536B75] w-4" />
                              Archive
                            </button>
                          )}
                          {archived && (
                            <button
                              type="button"
                              onClick={() => { onUnarchive(group.id); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#282828] hover:bg-[#F2F3F3] transition-colors"
                            >
                              <i className="fa-solid fa-box-open text-[#536B75] w-4" />
                              Unarchive
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => { onDelete(group.id); setOpenMenuId(null); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <i className="fa-solid fa-trash-can text-red-500 w-4" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { INITIAL_GROUPS };

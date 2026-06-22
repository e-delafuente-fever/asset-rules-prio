'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export type Asset =
  | {
      id: string;
      name: string;
      group: 'By group';
      groupsCount: number;
      minPax: number;
      maxPax: number;
    }
  | {
      id: string;
      name: string;
      group: 'By people';
      maxCapacity: number;
    };

export function formatByGroupCapacity(groupsCount: number, minPax: number, maxPax: number): string {
  const label = groupsCount === 1 ? 'group' : 'groups';
  return `${groupsCount} ${label} (${minPax}-${maxPax} pax)`;
}

export function formatAssetCapacity(asset: Asset): string {
  if (asset.group === 'By people') {
    return `${asset.maxCapacity} pax`;
  }
  return formatByGroupCapacity(asset.groupsCount, asset.minPax, asset.maxPax);
}

export function formatAssetSubtitle(asset: Asset): string {
  return `${asset.group} · ${formatAssetCapacity(asset)}`;
}

/** Max pax contributed when an asset is included in an asset group (sum of per-asset max). */
export function getAssetGroupContributionPax(asset: Asset): number {
  if (asset.group === 'By people') {
    return asset.maxCapacity;
  }
  return asset.groupsCount * asset.maxPax;
}

function byGroup(
  id: string,
  name: string,
  groupsCount: number,
  minPax: number,
  maxPax: number
): Extract<Asset, { group: 'By group' }> {
  return { id, name, group: 'By group', groupsCount, minPax, maxPax };
}

function byPeople(id: string, name: string, maxCapacity: number): Extract<Asset, { group: 'By people' }> {
  return { id, name, group: 'By people', maxCapacity };
}

export const AVAILABLE_ASSETS: Asset[] = [
  byGroup('1', 'Bowling line 1', 1, 2, 5),
  byGroup('2', 'Bowling line 2', 1, 2, 5),
  byGroup('3', 'Bowling line 3', 1, 2, 5),
  byGroup('4', 'Bowling line 4', 1, 2, 5),
  byGroup('5', 'Bowling line 5', 1, 2, 5),
  byGroup('6', 'Bowling line 6', 1, 2, 5),
  byGroup('7', 'Lane 1', 1, 2, 5),
  byGroup('8', 'Lane 2', 1, 2, 5),
  byGroup('9', 'Lane 3', 1, 2, 5),
  byGroup('10', 'Lane 4', 1, 2, 5),
  byGroup('11', 'Lane 5', 1, 2, 5),
  byGroup('12', 'Lane 6', 1, 2, 5),
  byGroup('13', 'Lane 7', 1, 2, 5),
  byGroup('14', 'Lane 8', 1, 2, 5),
  byGroup('15', 'Table 1', 1, 2, 8),
  byGroup('16', 'Table 2', 1, 2, 8),
  byGroup('17', 'Table 3', 1, 2, 8),
  byGroup('18', 'Table 8', 1, 2, 12),
  byGroup('19', 'Table 9', 1, 2, 12),
  byPeople('20', 'Trampoline area', 50),
  byPeople('21', 'Soft play zone', 30),
];

interface AssetSelectorProps {
  selectedAssets: Asset[];
  onSelectedChange: (assets: Asset[]) => void;
  groupType: 'consecutive' | 'fixed' | 'flexible';
}

type FilterGroup = 'By group' | 'By people';

const FILTER_OPTIONS: FilterGroup[] = ['By group', 'By people'];
const FILTER_LABEL = 'Filter by groups or by people';

export function AssetSelector({ selectedAssets, onSelectedChange, groupType }: AssetSelectorProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterValue, setFilterValue] = useState<FilterGroup>('By group');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [assetPendingTypeChange, setAssetPendingTypeChange] = useState<Asset | null>(null);
  const dragAsset = useRef<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterOpen && !searchOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterOpen, searchOpen]);

  const totalPax = selectedAssets.reduce((sum, a) => sum + getAssetGroupContributionPax(a), 0);
  const isConsecutive = groupType === 'consecutive';

  const filteredAssets = AVAILABLE_ASSETS.filter((a) => a.group === filterValue);

  const toggleAsset = (asset: Asset) => {
    const exists = selectedAssets.find((a) => a.id === asset.id);
    if (exists) {
      onSelectedChange(selectedAssets.filter((a) => a.id !== asset.id));
    } else if (selectedAssets.some((selectedAsset) => selectedAsset.group !== asset.group)) {
      setAssetPendingTypeChange(asset);
    } else {
      onSelectedChange([...selectedAssets, asset]);
    }
  };

  const confirmCapacityTypeChange = () => {
    if (!assetPendingTypeChange) return;
    onSelectedChange([assetPendingTypeChange]);
    setAssetPendingTypeChange(null);
  };

  const moveAsset = (idx: number, dir: 'up' | 'down') => {
    const next = [...selectedAssets];
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onSelectedChange(next);
  };

  // Drag handlers for consecutive asset ordering
  const handleDragStart = (e: React.DragEvent, id: string) => {
    dragAsset.current = id;
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== dragAsset.current) setDropTargetId(id);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const fromId = dragAsset.current;
    if (!fromId || fromId === targetId) return;

    const fromIdx = selectedAssets.findIndex((a) => a.id === fromId);
    const toIdx = selectedAssets.findIndex((a) => a.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const next = [...selectedAssets];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onSelectedChange(next);
    resetDrag();
  };

  const resetDrag = () => {
    dragAsset.current = null;
    setDraggingId(null);
    setDropTargetId(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-1">
        <h3 className="text-sm font-semibold text-[#282828]">Select assets</h3>
        <p className="text-xs text-[#536B75] mt-0.5">
          Choose the assets that belong to this group. At least 2 assets are required.
        </p>
      </div>

      {/* Filter dropdown */}
      <div className="relative mt-4" ref={filterRef}>
        <label className="block text-sm font-semibold text-[#282828] mb-2">{FILTER_LABEL}</label>
        <button
          type="button"
          onClick={() => { setFilterOpen(!filterOpen); setSearchOpen(false); }}
          className="w-full flex items-center justify-between px-4 py-3 border border-[#CCD2D8] rounded-lg bg-white text-sm text-[#282828] hover:border-[#536B75] transition-colors"
        >
          <span>{filterValue}</span>
          <i className="fa-solid fa-chevron-down text-[#536B75] text-xs" />
        </button>
        {filterOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#CCD2D8] rounded-lg shadow-lg z-10 overflow-hidden">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { setFilterValue(opt); setFilterOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#F2F3F3] transition-colors ${filterValue === opt ? 'text-[#0079CA] font-semibold' : 'text-[#282828]'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search / asset list dropdown */}
      <div className="relative mt-3" ref={searchRef}>
        <button
          type="button"
          onClick={() => { setSearchOpen(!searchOpen); setFilterOpen(false); }}
          className="w-full flex items-center justify-between px-4 py-3 border border-[#CCD2D8] rounded-lg bg-white text-sm hover:border-[#536B75] transition-colors"
        >
          <span className={selectedAssets.length > 0 ? 'text-[#282828]' : 'text-[#536B75]'}>
            {selectedAssets.length > 0 ? `${selectedAssets.length} assets selected` : 'Search assets by name'}
          </span>
          <i className="fa-solid fa-chevron-down text-[#536B75] text-xs" />
        </button>
        {searchOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#CCD2D8] rounded-lg shadow-lg z-10 overflow-hidden max-h-64 overflow-y-auto">
            {filteredAssets.map((asset) => {
              const isSelected = !!selectedAssets.find((a) => a.id === asset.id);
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => toggleAsset(asset)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F2F3F3] transition-colors text-left"
                >
                  <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-[#0079CA] border-[#0079CA]' : 'border-[#CCD2D8]'}`}>
                    {isSelected && <i className="fa-solid fa-check text-white text-[9px]" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#282828]">{asset.name}</p>
                    <p className="text-xs text-[#536B75]">{formatAssetSubtitle(asset)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected assets list */}
      <div className="flex-1 mt-3 border border-[#CCD2D8] rounded-2xl overflow-hidden flex flex-col">
        {selectedAssets.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10 text-center px-4">
            <p className="text-sm font-semibold text-[#031419]">No assets selected</p>
            <p className="text-xs text-[#536B75] mt-1">
              Selected assets will be used to calculate the group&apos;s total capacity
            </p>
          </div>
        ) : (
          <>
            {/* Info banner for consecutive */}
            {isConsecutive && (
              <div className="bg-[#EFF6FF] border-b border-[#BFDBFE] px-4 py-3 flex items-start gap-2">
                <i className="fa-solid fa-circle-info text-[#0079CA] text-sm mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#1E40AF]">Asset order</p>
                  <p className="text-xs text-[#1D4ED8]">
                    Drag items or use the arrows to set the order. Bookings will use assets in this order whenever possible.
                  </p>
                </div>
              </div>
            )}

            {/* List items */}
            <div className="flex-1 overflow-y-auto">
              {selectedAssets.map((asset, idx) => {
                const isDragging = draggingId === asset.id;
                const isDropTarget = dropTargetId === asset.id;
                const isFirst = idx === 0;
                const isLast = idx === selectedAssets.length - 1;

                return (
                  <div key={asset.id}>
                    {/* Drop indicator */}
                    {isDropTarget && (
                      <div className="h-0.5 bg-[#0079CA] mx-4" />
                    )}
                    <div
                      draggable={isConsecutive}
                      onDragStart={isConsecutive ? (e) => handleDragStart(e, asset.id) : undefined}
                      onDragOver={isConsecutive ? (e) => handleDragOver(e, asset.id) : undefined}
                      onDrop={isConsecutive ? (e) => handleDrop(e, asset.id) : undefined}
                      onDragEnd={isConsecutive ? resetDrag : undefined}
                      className={[
                        'flex items-center gap-4 px-4 py-3 transition-colors',
                        isDragging ? 'opacity-40 bg-[#F6F7F7]' : 'hover:bg-[#FAFAFA]',
                        isConsecutive && !draggingId ? 'cursor-grab' : '',
                        draggingId && isConsecutive ? 'cursor-grabbing' : '',
                      ].join(' ')}
                    >
                      {/* Drag / reorder controls — only for consecutive */}
                      {isConsecutive && (
                        <div
                          className="flex flex-col gap-0.5 flex-shrink-0 group/arrows"
                          title="Drag or use arrows to reorder"
                        >
                          <button
                            type="button"
                            onClick={() => moveAsset(idx, 'up')}
                            className="text-[#CCD2D8] group-hover/arrows:text-[#536B75] hover:!text-[#031419] transition-colors disabled:opacity-30"
                            disabled={isFirst}
                            title="Move up"
                          >
                            <i className="fa-solid fa-angle-up text-xs" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveAsset(idx, 'down')}
                            className="text-[#CCD2D8] group-hover/arrows:text-[#536B75] hover:!text-[#031419] transition-colors disabled:opacity-30"
                            disabled={isLast}
                            title="Move down"
                          >
                            <i className="fa-solid fa-angle-down text-xs" />
                          </button>
                        </div>
                      )}

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold leading-[20px] text-[#031419] truncate">{asset.name}</p>
                        <p className="text-[12px] leading-[16px] text-[#536B75] truncate">{formatAssetSubtitle(asset)}</p>
                      </div>

                      {/* Trailing: remove button */}
                      <button
                        type="button"
                        onClick={() => toggleAsset(asset)}
                        className="flex-shrink-0 text-[#536B75] hover:text-red-500 transition-colors p-1"
                        title="Remove"
                      >
                        <i className="fa-solid fa-xmark text-sm" />
                      </button>
                    </div>

                    {/* Divider — not after last item */}
                    {!isLast && (
                      <div className="h-px bg-[#CCD2D8] mx-4" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-[#CCD2D8] flex items-center justify-between bg-white">
              <p className="text-xs text-[#536B75]">{selectedAssets.length} assets selected</p>
              <p className="text-xs text-[#536B75]">Total capacity: {totalPax} pax</p>
            </div>
          </>
        )}
      </div>

      {assetPendingTypeChange && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(6,35,44,0.88)] p-14">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="capacity-type-change-title"
            className="relative flex w-full max-w-[520px] flex-col items-end gap-6 rounded-2xl bg-white p-6 shadow-[0_24px_24px_rgba(0,70,121,0.2)]"
          >
            <div className="flex h-10 max-h-10 w-full flex-col items-center gap-4">
              <div className="flex w-full items-center justify-center px-8">
                <h2
                  id="capacity-type-change-title"
                  className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-center text-[16px] font-bold leading-5 text-[#031419]"
                >
                  Change capacity type?
                </h2>
              </div>
              <div className="h-px w-full bg-[#CCD2D8]" />
            </div>

            <p className="w-full text-center text-[16px] leading-6 text-[#031419]">
              Adding a {assetPendingTypeChange.group} asset will remove the assets currently selected in this list. Do you want to continue?
            </p>

            <div className="flex w-full gap-4">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setAssetPendingTypeChange(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={confirmCapacityTypeChange}
                className="flex-1"
              >
                Continue
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setAssetPendingTypeChange(null)}
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

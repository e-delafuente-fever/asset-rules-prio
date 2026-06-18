# **GAME-822 – Asset Group Types, Group Capacity & Priority-Ordered Allocation (HLD)**

| Status       | Not started                                                             |
| :----------- | :---------------------------------------------------------------------- |
| Jira Task    | https://feverup.atlassian.net/browse/GAME-822                           |
| Author(s)    | dmytro.babenko                                                          |
| Reviewer(s)  |                                                                         |
| Updated      | 2026-06-16                                                              |
| Repositories | [https://github.com/Feverup/fever2](https://github.com/Feverup/fever2)  |

> HLD for the **new** part of Asset Group Prioritisation: typed asset groups (data model), where group capacity lives, and the algorithm that walks the groups during booking. All claims about the existing engine were verified directly in the fever2 code — links inline.

---

## 💬 **Background**

The PRD ("Asset Group Prioritisation Rules", June 2026) asks for admin-configured asset groups tried in priority order before the engine's default allocation. Investigation of the current engine surfaced two findings that shape this design:

1. **One group shape does not fit all venues.** A flat "enumerated set of assets" group (PRD as-is) explodes combinatorially for adjacency cases — 8 bowling lanes need ~28 overlapping groups per activity, duplicated for every activity sharing the lanes. Yet for other cases (a VIP suite = rooms 9+10, a square of 4 tables where any two can be joined) an explicit set is exactly right.
2. **The engine already knows how to allocate within a subset.** [`SingleActivityCapacityService.reserve_capacity_in_assets`](https://github.com/Feverup/fever2/blob/master/src/core/domain/capacity/asset_based/single_activity_capacity_service.py#L136) runs the full engine restricted to `destination_asset_ids`, and the base solver exposes [`is_feasible`](https://github.com/Feverup/fever2/blob/master/src/core/domain/capacity/asset_based/asset_assignment_solver/asset_assignment_solver.py#L42) for pre-checks. What is missing is only the *group catalogue* and the *loop over it*.

The resolution proposed here: **one `AssetGroup` table whose behaviour is driven by two orthogonal data axes — a per-member `order` (contiguity) and an all-or-nothing `requires_all_members` flag (atomicity) — not by a stored `group_type` discriminator and not by per-type strategy classes.** This keeps the schema small, lets the bowling case be O(N) configuration instead of O(N²) rows, and still supports fixed bundles. The three logical "types" below are kept **purely as a UI vocabulary**: the back-office may present them as named presets, but each one simply *compiles down to the two axes* — the database and the engine never branch on a type.

### The three group types (UI vocabulary → data axes)

These names are an optional front-end convenience for operators; they are **not stored as a functional column**. Each maps deterministically to the two stored axes:

| UI preset (optional) | Business meaning | Example | member `order` | `requires_all_members` |
|---|---|---|---|---|
| `INLINE_PRIORITY` | Members form an ordered line; parties should occupy **consecutive** members of that line. | A bank of 8 bowling lanes; karaoke rooms along a corridor. | **set** (unique within the group) | `false` |
| `ANY_TO_ANY` | Members are mutually combinable; **any subset** of the group works equally well operationally. | A square of 4 joinable tables — each pairs with any other. | `NULL` | `false` |
| `EXACT` | The group is **all-or-nothing**: exactly these assets together, never a sub-part. | "VIP suite" = room 9 + room 10; a private mezzanine sold as one unit. | `NULL` | `true` |

The candidate-generation logic that reads these two axes (contiguous-window enumeration for ordered groups, best-fit for the rest, full-set for atomic groups) lives in a single parameterized component — detailed in §3. Adding a behaviour later (e.g. `ZONE` / adjacency) is a new axis or flag plus a branch in that one component — typically additive, no per-type class and usually no schema change.

---

## 📝 **Proposal**

### 1. Data model

Two new tables in the `asset_based` domain ([`src/core/domain/availability/asset_based/`](https://github.com/Feverup/fever2/tree/master/src/core/domain/availability/asset_based)), following the existing model conventions (`core_*` table names). Indexes are intentionally not specified at this stage — they will be decided with the read queries during implementation.

The behaviour is stored as **two data axes**, not a type discriminator: an all-or-nothing boolean `requires_all_members` on the header (atomicity) and a nullable `order` on each membership row (contiguity). Both follow house practice for the `asset_based` domain — a plain boolean and a nullable positive int, no lookup table. The logical `group_type` names from the Background are **not** persisted as a functional column; they live in the UI/API layer only (a back-office designer may keep them as presets, or expose the two fields directly).

#### `core_asset_group` — the group header

| Column | Type / constraint | Description |
|---|---|---|
| `id` | PK | — |
| `name` | varchar(255) | Operator-facing label ("Lanes bank A", "VIP suite"). |
| `description` | text, nullable | Free-form operator notes. |
| `requires_all_members` | bool, default `false` | **Atomicity axis.** `true` → the group is all-or-nothing (the `EXACT` preset): the only candidate is the full member set, and a failed attempt is terminal (no fallback — see §3). `false` → sub-parts of the group may be used. |
| `assets_hub` | FK → `AssetsHub`, CASCADE | Venue scope — the hub whose assets this group groups, and the **single** place the hub is referenced in this design. |
| `priority` | positive int | Order in which groups are tried during booking; **lower = tried first**. Not forced unique — ties broken deterministically by `id` (see algorithm §3). |
| `enabled` | bool, default true | Disabled groups are invisible to the engine. Acts as the safe kill-switch per group. |
| `created_at` / `updated_at` | timestamps | Audit. |
| `created_by` / `updated_by` | FK → backoffice user, nullable | Audit (PRD requirement). |

> No `group_type` column. If the back-office wants to *display* a named preset, it is derived from the two axes (`requires_all_members=true` → `EXACT`; else `order` present → `INLINE_PRIORITY`; else `ANY_TO_ANY`) or stored as a non-functional label the engine ignores — designer's choice.

#### `core_asset_group_asset` — membership junction

This table is filled for **every** group regardless of behaviour. It is the only place a group's members are defined: without its rows the engine cannot know *which* two rooms form the VIP suite (atomic) or *which* four tables are mutually joinable — a hub typically holds more assets (lanes *and* tables) than any one group. The only behaviour-specific part is the optional `order` column (the contiguity axis).

| Column | Type / constraint | Description |
|---|---|---|
| `id` | PK | — |
| `asset_group` | FK → `AssetGroup`, CASCADE | — |
| `asset` | FK → `Asset`, CASCADE | Member asset; must belong to the group's hub (validation rule 2). |
| `order` | positive int, **nullable** | **Contiguity axis.** When set, the members form an ordered line and parties prefer **consecutive** members (the `INLINE_PRIORITY` preset). Unique within the group; contiguity is defined over the members' *rank* (sorted `order`), so sparse values (10, 20, 30) are allowed and a lane can be inserted later without renumbering. Left `NULL` when the group has no intrinsic order (`ANY_TO_ANY`) or is atomic (`EXACT`). Enforced by a partial unique constraint `(asset_group, order) WHERE order IS NOT NULL` plus the validation below. Caveat: `order` is a reserved SQL keyword — safe through the ORM (Django quotes identifiers), but raw SQL must write `"order"`; `member_order` is the fallback name if that proves annoying. |

Unique constraint: `(asset_group, asset)`.

#### Validation rules (application layer, on write)

1. Membership rows exist for every group; minimum 2 members (a 1-asset group is meaningless — single assets are already tried first by the engine).
2. Members belong to the group's `assets_hub` — checked in the write handler via the member's `AssetsHubAsset` link (each asset has exactly one hub).
3. **Contiguity is all-or-none:** either *every* member has an `order` (unique within the group) or *no* member does. Partial ordering is rejected.
4. **Atomicity ignores order:** when `requires_all_members = true`, members carry no `order` (left `NULL`) — the full set is taken regardless of sequence.
5. Deleting an `Asset` cascades membership; a group left with < 2 members is auto-disabled (not deleted) and surfaced in back-office.

The PRD's write-time rule "group assets ⊆ activity assets" becomes a **booking-time filter** instead: since groups are activity-agnostic, the engine simply skips a group whose members are not all in the current activity's pool (§3 step 1).

#### Example data — one hub, 4 assets, all three behaviours

Hub 1 owns two bowling lanes and two joinable dining tables. Activity *Bowling* uses the lanes; activity *Dining* uses the tables.

`core_asset` (existing):

| id | name | max capacity |
|---|---|---|
| 101 | Lane 1 | 5 |
| 102 | Lane 2 | 5 |
| 201 | Table 5 | 8 |
| 202 | Table 6 | 8 |

`core_asset_group` (new) — **no `group_type` column**; behaviour is the `requires_all_members` axis plus the members' `order` below. The *(UI preset)* column is shown only to relate the rows back to the Background vocabulary; it is **not stored**:

| id | name | assets_hub | priority | enabled | requires_all_members | *(UI preset — derived, not stored)* |
|---|---|---|---|---|---|---|
| 1 | Lanes bank | 1 | 10 | true | `false` | *INLINE_PRIORITY* (members ordered) |
| 2 | Private dining corner | 1 | 10 | true | `true` | *EXACT* (atomic) |
| 3 | Joinable tables | 1 | 20 | true | `false` | *ANY_TO_ANY* (no order) |

`core_asset_group_asset` (new):

| id | asset_group | asset | order |
|---|---|---|---|
| 1 | 1 | 101 (Lane 1) | 1 |
| 2 | 1 | 102 (Lane 2) | 2 |
| 3 | 2 | 201 (Table 5) | — |
| 4 | 2 | 202 (Table 6) | — |
| 5 | 3 | 201 (Table 5) | — |
| 6 | 3 | 202 (Table 6) | — |

How the engine reads these rows (the two axes alone — no type lookup):

- **Group 1** has ordered members and `requires_all_members=false` → behaves as inline. A **Bowling** party of 8 takes Lanes 1+2, consecutive by `order`. (Groups 2 and 3 have members outside the Bowling pool → skipped by the activity filter.)
- **Group 2** has `requires_all_members=true` → all-or-nothing. A **Dining** party of 12 tries it first (priority 10): both tables free and 12 ≤ 16 → booked together as the private corner. If Table 6 is blocked it is infeasible and, being atomic, **does not fall back** through this group (see §3).
- **Group 3** has no order and `requires_all_members=false` → best-fit over its members. If group 2 didn't apply, a party of 12 here combines both tables (8 < 12 ≤ 16).
- Groups 2 and 3 deliberately share the same two assets with different behaviour: **overlap is allowed**, `priority` decides which is tried first.

#### Alternative considered — store the inline `order` on `core_assets_hub_asset_catalog_metadata`

Scope of this alternative: it replaces **only the `order` column** of `core_asset_group_asset` — nothing more. Both group tables are still required (they are what defines members, `requires_all_members`, priority, enabled). The idea: keep one hub-wide ordering as a new nullable column (e.g. `allocation_order`) on the existing [`AssetsHubAssetCatalogMetadata`](https://github.com/Feverup/fever2/blob/master/src/core/domain/availability/asset_based/assets_hub_asset_catalog_metadata.py) (OneToOne per hub-asset, today holding `sort_order` + `is_hidden`), and have ordered (inline) groups read their members' order from there instead of carrying their own.

| | `order` on the group junction (chosen) | `allocation_order` on catalog metadata |
|---|---|---|
| Ordering scope | per group — two inline groups over the same assets may order them differently | one shared ordering per hub asset |
| Self-containment | a group is fully described by its own rows | group semantics depend on a row owned by another feature |
| Responsibility | allocation data stays in the booking aggregate | mixes allocation data into a table owned by the FeverZone/B2B **catalog listing** feature (`sort_order` and `is_hidden` are presentation fields written by `SaveHubAssetsCatalogCommand`) |

Verdict: rejected — saving one junction column is not worth the cross-feature coupling and the loss of per-group ordering.

### 2. Group capacity — stored or computed?

**Nothing new is stored — group capacity is a sum computed in memory at booking time**, over per-asset values the engine already has:

| Quantity | How the group value is obtained | Used for |
|---|---|---|
| **Static max capacity** | Σ `asset.max_capacity` over members — members are already loaded, the sum is free. | Cheap pre-filter ("can this group *ever* fit a party of 8?") and back-office display (annotated in the read query). |
| **Effective capacity at the requested timeslot** | Σ of the per-asset effective values resolved for the reservation (capacity rules + live occupancy). | The real feasibility check during allocation. |

A stored/denormalized capacity column was rejected: the effective number is stale the moment a concurrent cart reserves, and even the static sum would need invalidation on every membership or asset-size edit — all to avoid adding up ≤ ~10 integers already in memory.

### 3. The allocation algorithm (booking hot path) (NOT READY FOR REVIEW)

> _This section will be reworked in a separate deep dev design. It now lags the §1 data model: references below to a `group_type` discriminator, `GroupTypeStrategy` per-type classes, and the `is_feasible`-then-reserve two-pass are **superseded** by the two-axis model (`order` + `requires_all_members`) read by a single parameterized candidate generator, with a single restricted solve per candidate and a terminal (no-fallback) outcome for atomic groups. Treat the pseudocode here as illustrative of intent only until that design lands._

A new domain service — `AssetGroupCandidateSelector`, in `src/core/domain/capacity/asset_based/` — is called inside [`SingleActivityCapacityService.__reserve_capacity`](https://github.com/Feverup/fever2/blob/master/src/core/domain/capacity/asset_based/single_activity_capacity_service.py#L172), the single choke point every asset-based reservation already passes through: after per-asset effective capacities are resolved and before the assignment engine runs. It is enabled per partner via a constance gate (the rollout pattern already used by [`AssetAssignmentOptimizedEngineGate`](https://github.com/Feverup/fever2/blob/master/src/core/infrastructure/capacity/asset_assignment_optimized_engine_gate.py)), and when no group applies the engine runs exactly as today — rollout is risk-free.

Group traversal is **hybrid**: load all groups once, pre-filter them all with cheap in-memory checks, then deep-check lazily in priority order and stop at the first feasible group — the expensive feasibility work never runs for groups behind the winner.

```text
reserve_capacity(activity, party_size, timeslot):

  # existing steps, unchanged
  assets    = activity pool, sorted, effective capacity resolved per asset   (already done today)
  occupancy = per-asset timetable for the window                             (already read today)

  # NEW — step 0: load the group catalogue                       [1–2 queries, cacheable]
  groups = enabled AssetGroups for the activity's hub,
           members prefetched, ordered by (priority, id)

  # NEW — step 1: cheap in-memory pre-filter over ALL groups      [no I/O]
  candidates = [g for g in groups
                if members ⊆ activity pool                        # groups are hub-scoped, activity-agnostic
                and Σ effective_capacity(member) ≥ party_size     # group can fit *now*
                and no member is blocked (effective capacity 0)]  # PRD "skip group if any asset blocked"

  # NEW — step 2: lazy deep check, first feasible wins            [stops at the winner]
  for group in candidates:                                        # already (priority, id)-ordered
      subsets = GroupTypeStrategy[group.group_type]
                  .candidate_subsets(group.ordered_members)       # per-type logic, in code
      for subset in subsets:                                      # per-type preference order
          if solver.is_feasible(subset, party_size, timeslot):    # existing oracle + occupancy
              return reserve_in_assets(subset)                    # existing subset-reservation path

  # step 3: fallback — today's engine on the full pool, untouched
  return existing_engine(assets)
```

Per-type `candidate_subsets` (the code-defined logic):

- `EXACT` → `[all_members]` (1 candidate).
- `INLINE_PRIORITY` → contiguous windows over the members' `order`, smallest size first, then leftmost: for k = ceil-needed … M, windows `(M − k + 1)` each. ≤ M(M+1)/2 candidates total; M ≤ ~10 in practice.
- `ANY_TO_ANY` → no enumeration of its own: delegate to the existing best-fit solver restricted to members (`is_feasible` / `reserve_capacity_in_assets`) — it already searches subsets by (fewest assets, smallest capacity).

#### Why this shape does not degrade the hot path

| Concern | Mitigation |
|---|---|
| Extra DB round-trips | One query for groups + one prefetch for members (constant, not per group). Group config is low-churn → cacheable per hub with invalidation on admin writes if profiling ever demands it. |
| Per-group capacity computation | All sums are over the **already-resolved** per-asset effective capacities — the selector receives the same in-memory map the engine uses today; zero additional capacity/occupancy reads. |
| Wasted work on losing groups | Deep feasibility (split search + occupancy window walk) is the expensive part — it runs **lazily** and stops at the first feasible group. The cheap static/effective pre-filter (step 1) runs for all groups but is pure in-memory arithmetic. Computing *deep* feasibility for all groups upfront would be strictly worse. |
| Concurrency | Unchanged: group selection only narrows the candidate asset list; the single write-serialization point remains `SELECT … FOR UPDATE` in [`AssetOccupancyService.reserve_occupancy`](https://github.com/Feverup/fever2/blob/master/src/core/domain/capacity/asset_based/asset_occupancy_service.py). A race (group looked feasible, lock reveals it is not) falls through to the next group / fallback, same as today's retry semantics. |
| Worst case | No feasible group → exactly today's behaviour plus one cached read and an in-memory scan of G groups (G expected < ~20 per activity). |

#### Availability read path (V1)

`get_available_tickets` stays on the full pool. Groups only re-order *which* assets host a party; with the full-pool fallback the ticket counts are identical, so no read-path change and no projector change. (If a future version wants groups to *restrict* capacity — e.g. EXACT-only activities — that is a deliberate product change to the available-tickets strategies, out of scope here.)

#### Observability

Emit a structured log/analytics event per reservation: groups evaluated, group chosen (or `fallback`), skip reason per evaluated group (`blocked_member`, `insufficient_capacity`, `occupancy_conflict`). This covers the PRD's `asset_group_allocation_fallback_used` analytics event; the current engine exposes no skip reasons, so this is new instrumentation.

### 4. APIs (back-office, B2B)

Conventions follow the existing hub endpoints in [`assets_hub_assets_view.py`](https://github.com/Feverup/fever2/blob/master/src/b2b/infrastructure/assets_hub/views/assets_hub_assets_view.py): controller prefix `/b2b/3.0/partners`, `partner_that([...])` auth, `B2BApiResponse` envelope (`data` on success), `400` for validation errors / `404` for unknown partner-hub-group. Disabling (`PATCH enabled=false`, 4.3) is the reversible alternative to deletion (4.4).

#### 4.1 Get all asset groups of a hub

```text
GET /b2b/3.0/partners/{partner_id}/assets_hubs/{hub_id}/asset_groups/
```

The API speaks the **two axes** (`requires_all_members` on the group, `order` per asset). The named preset is a UI concern: the back-office may map a chosen preset to these fields client-side, and `group_type` below is an **optional derived label** for display — it is not stored and not required on write.

Response `200`:

```jsonc
{
  "data": [
    {
      "id": 1,
      "name": "Lanes bank",
      "description": null,
      "requires_all_members": false,           // atomicity axis (true = EXACT)
      "group_type": "INLINE_PRIORITY",         // derived UI label only — not stored
      "priority": 10,
      "enabled": true,
      "max_capacity": 10,                      // computed Σ member max_capacity (§2), never stored
      "assets": [
        { "asset_id": 101, "name": "Lane 1", "order": 1 },
        { "asset_id": 102, "name": "Lane 2", "order": 2 }   // "order" null when group is unordered / atomic
      ]
    }
  ]
}
```

#### 4.2 Create asset group

```text
POST /b2b/3.0/partners/{partner_id}/assets_hubs/{hub_id}/asset_groups/
```

Request — the two axes directly (the UI maps its chosen preset to these):

```jsonc
{
  "name": "Lanes bank",
  "description": null,                         // optional
  "requires_all_members": false,               // optional, default false; true = atomic (EXACT preset)
  "priority": 10,
  "enabled": true,                             // optional, default true
  "assets": [                                  // ≥ 2 items, all assets of {hub_id} (validation rules §1)
    { "asset_id": 101, "order": 1 },           // set "order" on ALL members (ordered/INLINE) or NONE
    { "asset_id": 102, "order": 2 }            // omit "order" entirely for unordered / atomic groups
  ]
}
```

Response `200`: the created group, same object shape as 4.1. `400` lists per-field validation errors (member outside hub, partial/duplicated `order`, `order` set on an atomic group, < 2 members).

#### 4.3 Edit asset group

```text
PATCH /b2b/3.0/partners/{partner_id}/assets_hubs/{hub_id}/asset_groups/{asset_group_id}/
```

Partial update: a field that is `null` or not present stays unchanged. `assets`, when present, **replaces** the full membership (add/remove/reorder in one shot — simpler contract than per-member sub-endpoints, and membership lists are small). Both axes are editable since they are plain data (`requires_all_members` and the members' `order`); the validation rules of §1 still apply (e.g. an atomic group may not carry `order`).

Request — change membership and order:

```jsonc
{
  "name": null,                                // null / absent → unchanged
  "requires_all_members": null,
  "priority": null,
  "enabled": null,
  "assets": [                                  // full replace of members
    { "asset_id": 102, "order": 1 },           // removed 101, reordered 102, added 103
    { "asset_id": 103, "order": 2 }
  ]
}
```

Request — change only the priority (all other params null or not specified):

```jsonc
{
  "priority": 5
}
```

Response `200`: the updated group, same object shape as 4.1.

#### 4.4 Delete asset group(s)

One call deletes one or many groups — ids in the query string, no request body (`DELETE` bodies are unreliable across HTTP clients/proxies):

```text
DELETE /b2b/3.0/partners/{partner_id}/assets_hubs/{hub_id}/asset_groups/?ids=1,3
```

Semantics:

- **Atomic** — all listed groups are deleted, or none: any id unknown / not belonging to `{hub_id}` → `404`, nothing deleted (prevents a half-applied cleanup of a venue reconfiguration).
- **Hard delete** — safe by design: bookings hold no reference to groups (allocation is ephemeral, §3), so existing `BookedSlot`s are untouched. Membership rows cascade.

Response `200`:

```jsonc
{
  "data": { "deleted_ids": [1, 3] }
}
```

---

## 🎯 **Actions**

### Repository: fever2

PR planning not yet discussed. Expected shape (to confirm):

| Pull Request Nº | Description | Branch |
| :-------------- | :---------- | :----- |
| PR #1 | Add `AssetGroup` (with `requires_all_members`) + `AssetGroupAsset` (with nullable `order`) models, the two-axis validations, migrations, and the B2B endpoints of §4 (Has migrations 🚚) | TBD |
| PR #2 | Add the single parameterized candidate generator over the two axes + `AssetGroupCandidateSelector`; wire into `SingleActivityCapacityService.__reserve_capacity` behind a constance partner gate, with full-pool fallback (and terminal no-fallback for atomic groups). Detailed in the §3 deep dev design | TBD |
| PR #3 | Add skip-reason / fallback analytics event + structured logging | TBD |
# **PRD: Asset Group Prioritisation Rules**

| Property | Value |
| :---- | :---- |
| **Date** | June 2026 |
| **Product Manager** | Roberto Avila |
| **Requirement reference** | 1.15: Asset bundling rules with proximity based capacity grouping |
| **Status** | Draft for Product and Engineering review |
| **Related workstream** | In venue booking management |
| **Related existing capability** | Asset Based Capacity and Concurrent Sessions |

# **Prototype**

You can access the prototype here: [https://assetgroups.lovable.app/assets/hubs](https://assetgroups.lovable.app/assets/hubs)  
The existing asset engine already supports asset based capacity for venues where the real constraint is not heads, but physical units like lanes, rooms, teams or playable areas. The current asset PRD frames this as a core need for FEC and game center venues.

# **Overview, problem and opportunity**

FunLab needs bookings for larger groups to be assigned to assets that are operationally sensible together. Today, the asset engine can calculate whether there is enough availability and split a booking across multiple assets when the party size exceeds the capacity of one asset. The existing tracker already confirms that availability based on assets, minimum capacity, partial capacity, and splitting bookings above capacity are part of the current asset based booking scope.

The missing layer is not capacity calculation. It is allocation preference. Example: A booking for 8 people cannot fit in a single asset with capacity 5\. The engine should split the group, but it should first try to split the group into assets that have been configured as operationally preferred together. This matters because FunLab does not want guests arriving together to be split across assets located across the venue when there are better combinations available. The goal is not to build a visual venue map. The goal is to let FeverZone users configure asset groups and priority rules per venue, so the engine can attempt a better automatic allocation before falling back to the current asset allocation logic.

# **Product thesis**

When a booking requires more than one asset for the same activity, the allocation engine should first try to assign the smallest valid configured asset group based on prioritisation rules. If no configured group can satisfy the booking because assets are unavailable, blocked or already booked, the engine should fall back to the current asset allocation behaviour.

# **What this is**

This is a configuration layer for asset allocation. It allows FeverZone users to define which assets should be considered together when a booking needs to be split across more than one asset. It applies to all booking channels that create bookings against activity linked assets. It works through asset groups, not physical maps. It respects existing asset capacity, availability and blocking logic.

# **What this is not**

This is not a floorplan. This is not a physical distance calculator. This is not manual drag and drop. This is not a coordinator override feature. This is not God Mode. This is not run sheet generation. This is not reporting on asset group usage. This is not a new capacity model.

# **Problem**

The existing engine can decide whether capacity exists and can allocate multiple assets when needed, but it does not yet have a configurable way to prefer better asset combinations. This creates the risk that a group booking may technically fit but be operationally poor. Example: A group of 12 people is split across two 6 person lanes. The engine may find two available lanes, but without prioritisation it may select lane 1 and lane 8 instead of lane 1 and lane 2\. That creates a bad guest experience and more operational pressure onsite.

# **Opportunity**

Add a simple configuration page where operators can create asset groups per venue and per activity. These asset groups become prioritised candidates for the allocation engine. The system should try:

1. Single asset that fits  
2. Smallest valid configured asset group  
3. Next valid configured asset group by priority  
4. Current asset allocation logic if no configured group works

This gives FunLab a better operational allocation without building a venue map.

# **Goals and KPIs**

## **Goals**

1. Allow FeverZone users to configure asset groups per venue.  
2. Allow asset groups to be linked to assets that belong to the same activity.  
3. Allow assets to belong to more than one group.  
4. Allow groups to be prioritised so the allocation engine knows which combination to try first.  
5. Ensure group capacity is calculated from the sum of the capacities of the included assets.  
6. Ensure blocked or unavailable assets are respected.  
7. Ensure the allocation engine falls back to existing behaviour if no asset group is valid.  
8. Apply this behaviour automatically across all booking channels using activity linked assets.

## **KPIs**

* Percentage of multi asset bookings allocated through configured asset groups.  
* Percentage of multi asset bookings falling back to current engine logic.  
* Booking allocation success rate.  
* Booking failure rate due to insufficient capacity.  
* Number of venues with configured asset groups.  
* Number of configuration errors caught before saving.  
* Reduction in operational complaints about split groups, if this can be tracked later.

# **Audience and assumptions**

## **Primary users**

* FeverZone configuration users  
* FunLab operations managers  
* Fever operations teams configuring venues  
* Booking engine as the system consumer of the rules

## **Secondary users**

* Guests  
* Venue staff viewing bookings in the asset calendar

## **Assumptions**

* Fever does not model physical venue layouts.  
* We should not use the word "proximity" in the product UI.  
* The rule is based on configured asset groups and priority, not distance.  
* Assets are linked to activities.  
* The configuration should happen per venue.  
* Asset groups should be created from assets that belong to the same activity.  
* The group capacity is the sum of the capacities of the included assets.  
* Existing asset availability, blocking and booking conflicts must be respected.  
* If an asset in a group is blocked or unavailable, the engine should try the next valid group.  
* If no group is valid, the engine should use the current asset allocation logic.  
* This applies only to automatic allocation.  
* Manual move and override are out of scope for this PRD.

# **Existing engine context**

The existing asset engine already models asset based capacity through fields such as total units, minimum and maximum group size, overflow mode, global capacity and exclusivity. It also defines whether a booking should split into more assets or be rejected when it exceeds one unit capacity.

The current engine also supports concurrent session handling, where the system deducts capacity from overlapping presence windows, not only the purchased start time.

This PRD should not replace those rules. It should sit on top of them as an allocation preference layer. The existing PRD also identifies FunLab as the phase where bookings need to be assigned to specific assets, not only deducted from a generic pool.

# **Product decision**

The feature should be built as: Asset Group Prioritisation Rules  
Not: **Asset Proximity Rules**

**Reason:** Fever does not know the physical layout of the venue. The system only knows configured assets, activities, capacities, availability and bookings. The product should let users explicitly configure which assets should be grouped together and in which priority order.

# **Core behaviour**

## **Allocation priority**

When a booking is created for an activity linked to assets, the engine should evaluate allocation in this order:

1. If a single asset can fit the full group, assign the single asset.  
2. If no single asset can fit, evaluate configured asset groups for that activity and venue.  
3. Select the smallest valid asset group that can fit the booking.  
4. If multiple valid asset groups can fit, use priority order.  
5. If a group includes a blocked or unavailable asset, skip that group and try the next group.  
6. If no configured group can satisfy the booking, fall back to current asset allocation logic.  
7. If the current engine cannot allocate either, the booking should fail following existing engine rules.

## **Blocking behaviour**

The rule itself is blocking inside its own evaluation. Meaning: If a configured group cannot be used because one asset is blocked or unavailable, the engine should not partially use that group. It should move to the next valid configured group. However, the overall booking should not fail only because no configured group works. It should fall back to the current allocation engine. So the practical behaviour is: Configured groups are enforced while evaluating group candidates. But asset group prioritisation is not the final booking blocker. The final blocker remains actual capacity and availability.

## **Capacity behaviour**

Asset group capacity is the sum of the capacities of its included assets. Example: Lane 1 capacity 5, Lane 2 capacity 5, Group capacity 10\. No custom group capacity should be needed for V1. Minimum and maximum behaviour should continue to come from the asset level configuration. If the asset configuration allows partial use, that existing asset behaviour should continue to apply.

# **Scope**

## **In scope**

* Create Asset Group configuration page.  
* Configure asset groups per venue.  
* Select assets that belong to the same activity.  
* Allow one asset to belong to multiple asset groups.  
* Add priority order to groups.  
* Preview group configuration before saving.  
* Use asset groups in automatic allocation.  
* Respect existing asset capacity, availability, bookings and blocks.  
* Fall back to current allocation logic when no group is valid.  
* Apply to all channels that create bookings against activity linked assets.

## **Out of scope**

* Venue map or visual floorplan.  
* Physical distance calculation.  
* Manual asset move.  
* Drag and drop.  
* Coordinator override.  
* God Mode.  
* Audit log for overrides.  
* Run sheet changes.  
* Confirmation email changes.  
* Reporting on asset group usage.  
* Customer facing display of assigned asset group.  
* New asset opening hours logic.  
* New asset type categorisation.  
* Custom combined group capacity.

# **UX flow**

## **Flow 1: Configure asset groups**

**Primary user:** FeverZone configuration user  
**Goal:** Define preferred asset combinations for one venue and activity.

1. User opens FeverZone.  
2. User navigates to Venue configuration.  
3. User opens Asset Groups.  
4. User selects an Activity.  
5. System shows the list of assets linked to that Activity in that Venue.  
6. User creates a new Asset Group.  
7. User selects the assets that belong to the group.  
8. User sets priority order for the group.  
9. User repeats this for additional groups.  
10. User opens preview.  
11. System shows the configured groups and calculated total capacity.  
12. User saves.

**Result:** The allocation engine can now use these groups when a booking for that activity requires more than one asset.

## **Flow 2: Booking fits in one asset**

Primary user: Guest or coordinator through any booking channel  
Goal: Keep the current best case behaviour.

1. Booking request is created.  
2. Engine checks activity linked assets.  
3. One asset can fit the full booking.  
4. Engine assigns the booking to that single asset.

**Result:** Asset group rules are not needed.

## **Flow 3: Booking needs multiple assets and a configured group is available**

Primary user: Guest or coordinator through any booking channel  
Goal: Keep the group together through configured asset grouping.

1. Booking request is created.  
2. No single asset can fit the booking.  
3. Engine checks configured asset groups for that venue and activity.  
4. Engine filters out groups where one or more assets are unavailable, blocked or already booked.  
5. Engine calculates group capacity using the sum of asset capacities.  
6. Engine selects the smallest valid group that fits.  
7. If more than one group fits, engine applies priority order.  
8. Booking is assigned to the selected asset group.

**Result:** The booking is split across assets that were configured to be used together.

## **Flow 4: Configured group is blocked or unavailable**

Primary user: System  
Goal: Avoid bad allocation while respecting existing blocks.

1. Booking request is created.  
2. Engine identifies a preferred asset group.  
3. One asset in that group is blocked or already booked.  
4. Engine skips that group.  
5. Engine checks the next configured group by priority.  
6. If another valid group exists, booking is assigned to it.  
7. If no group exists, engine falls back to current allocation logic.

Result: Blocked assets are respected, and the booking still has a chance to complete.

## **Flow 5: No configured group can satisfy the booking**

Primary user: System  
Goal: Avoid failing bookings unnecessarily.

1. Booking request is created.  
2. No single asset can fit.  
3. No configured asset group is valid.  
4. Engine falls back to current asset allocation logic.  
5. If current allocation logic finds valid assets, booking is created.  
6. If current allocation logic cannot find valid assets, booking fails under existing engine rules.

**Result:** Asset Group Prioritisation improves allocation quality but does not reduce sellable capacity unnecessarily.

# **Configuration model**

## **Asset Group**

A configured set of assets that should be considered together by the allocation engine. Suggested fields:

1. Asset Group ID  
2. Venue ID  
3. Activity ID  
4. Asset Group name  
5. Included Asset IDs  
6. Priority order  
7. Enabled or disabled  
8. Created by   
9. Last updated by   
10. Last updated date Date

## **Asset group rules**

1. Asset groups are configured per venue.  
2. Asset groups are linked to one activity.  
3. Asset groups can only include assets linked to that activity.  
4. One asset can belong to multiple groups.  
5. Group capacity is calculated from the sum of included asset capacities.  
6. Priority defines which group should be tried first when multiple groups are valid.  
7. Disabled groups are ignored by the allocation engine.  
8. Deleted groups should not affect past bookings.

## **Asset group lifecycle**

Asset groups have two lifecycle actions only:

1. **Enable or disable:** controlled by the status switch inside the asset group. Disabled groups remain stored and editable, but the allocation engine ignores them. This is the reversible way to stop a group from being used.  
2. **Delete:** permanently removes the group configuration. Deleted groups are not recoverable from the configuration UI and must not affect existing bookings.

There is no archived state or archive list in V1. If a group should be kept for later, users should disable it. If it is no longer needed, users should delete it.

# **Preview before save**

Before saving, the UI should show:

* Group name  
* Activity  
* Included assets  
* Calculated group capacity  
* Priority order  
* Any duplicate or overlapping asset usage across groups  
* Any validation error

The preview does not need to simulate every possible booking scenario in V1. It only needs to help the user verify the group setup before saving.

# **Validation rules**

1. A group must belong to a venue.  
2. A group must belong to an activity.  
3. A group must include at least two assets.  
4. Assets in the group must belong to the selected activity.  
5. A group must have priority order.  
6. Priority order can be duplicated only if Engineering confirms deterministic tie breaking exists. Otherwise it should be unique.  
7. Disabled assets should not be selectable, or should trigger a warning.  
8. The UI should prevent saving a group with no valid assets.

# **Engine logic**

## **High level logic**

When booking size exceeds what one asset can support, the engine should evaluate Asset Group Prioritisation before falling back to default split behaviour. Suggested order:

1. Check existing capacity and availability rules.  
2. Check whether a single asset fits.  
3. If single asset fits, assign it.  
4. If no single asset fits, fetch asset groups for venue plus activity.  
5. Filter out groups with unavailable, blocked or already booked assets.  
6. Filter out groups that do not meet capacity requirements.  
7. Sort valid groups by smallest capacity that fits.  
8. If tied, sort by configured priority.  
9. Assign booking to selected group.  
10. If no group works, use current engine allocation.

## **Tie logic**

If two groups can fit the booking:

1. Prefer the smallest valid group that fits the booking.  
2. If both groups have the same capacity, use priority order.  
3. If both groups have same priority, Engineering should define deterministic fallback, for example oldest created group or lowest group ID.

# **Example**

**Assets:**

1. Lane 1, capacity 5  
2. Lane 2, capacity 5  
3. Lane 3, capacity 5  
4. Lane 4, capacity 5

**Configured groups:**

1. Group A: Lane 1 plus Lane 2, capacity 10, priority 1  
2. Group B: Lane 3 plus Lane 4, capacity 10, priority 2

**Booking:** 8 guests  
**Expected result:** The system assigns Lane 1 plus Lane 2 if both are available. If Lane 2 is blocked, Group A is skipped. The system checks Group B. If Group B is available, it assigns Lane 3 plus Lane 4\. If no group is available, it falls back to current engine allocation.

# **Permissions**

## **Can view**

* FeverZone users with venue configuration access  
* Fever operations users  
* Product and Engineering as needed

## **Can create and edit**

* Admin users  
* FZ Venue Manager users  
* Fever operations users with asset configuration permissions

Exact role mapping should follow current FeverZone permissions for asset configuration.

## **Can use rules in allocation**

All booking channels using activity linked assets should use the rules automatically. No manual user action is required at booking time.

# **Affected products**

* FeverZone venue configuration  
* FeverZone asset configuration  
* Asset allocation engine  
* Activity linked asset setup  
* Calendar view, only because it already reflects assigned assets

No customer facing surfaces need to change for V1.

# **Acceptance criteria**

## **Configuration**

1. A user can create an Asset Group for a venue.  
2. A user can select an activity.  
3. The system shows only assets linked to that activity.  
4. A user can select two or more assets for the group.  
5. A user can assign priority order.  
6. A user can create multiple groups for the same activity.  
7. A single asset can belong to multiple groups.  
8. The system calculates group capacity as the sum of included asset capacities.  
9. The user can preview the group before saving.  
10. The user can save, edit, enable, disable or delete a group.

## **Allocation**

1. If one asset can fit the booking, the engine assigns one asset.  
2. If no single asset can fit, the engine evaluates configured asset groups.  
3. The engine skips groups with blocked, booked or unavailable assets.  
4. The engine selects the smallest valid group that fits.  
5. If multiple groups are equally valid, the engine uses priority order.  
6. If no asset group is valid, the engine falls back to current asset allocation logic.  
7. If fallback allocation succeeds, the booking is created.  
8. If fallback allocation fails, the booking fails using existing engine behaviour.

## **Channels**

1. Asset group logic applies to all channels that create bookings against activity linked assets.  
2. The same logic applies to B2C purchase flow, B2B reservations and onsite booking flows if they use the same activity linked assets.  
3. The user does not need to manually select an asset group during booking.

## **Blocks and availability**

1. If an asset is blocked, any group containing that asset is not valid for that timeslot.  
2. If an asset is unavailable due to existing bookings, any group containing that asset is not valid for that timeslot.  
3. The engine should try the next valid group.  
4. If no group is valid, fallback logic applies.

# **Out of scope for V1**

* Visual floor map.  
* Physical proximity or distance calculation.  
* Manual override.  
* Manual asset move.  
* Drag and drop.  
* Custom group capacity.  
* Reporting on asset group usage.  
* Audit logs for override decisions.  
* Run sheet updates.  
* Customer facing assigned area copy.  
* Asset opening hours.  
* New asset categories or asset types.

# **Analytics**

Minimum analytics can be lightweight because this is mostly configuration and engine behaviour. Suggested events:

1. `asset_group_created`  
2. `asset_group_updated`  
3. `asset_group_disabled`  
4. `asset_group_deleted`  
5. `asset_group_allocation_used`  
6. `asset_group_allocation_fallback_used`

**Useful properties:**

* Venue ID  
* Activity ID  
* Asset Group ID  
* Number of assets in group  
* Calculated capacity  
* Booking ID  
* Booking channel  
* Booking party size  
* Fallback reason

# **Risks and dependencies**

## **Risk 1: Overcomplicating the model**

The dev discussion already pointed towards a simplified prioritisation or ordering system rather than a full venue map.

## **Risk 2: Group rules accidentally reduce availability**

If configured groups are treated as the only valid allocation path, bookings could fail unnecessarily.  
**Mitigation:** Use group rules first, then fall back to current engine allocation if no group is valid.

## **Risk 3: Confusing "proximity" with physical distance**

If the product uses proximity language, users may expect maps or distances.  
**Mitigation:** Use "Asset Group Prioritisation" in internal docs.

## **Risk 4: Rule conflicts**

An asset can belong to multiple groups, which is needed, but may create overlapping priorities.  
**Mitigation:** Preview group setup before saving and make priority order explicit.

# **Open engineering validations**

1. Can Asset Group Prioritisation be implemented as a layer before current fallback allocation?  
2. Should priority be stored at group level only, or should there also be asset level ordering inside the group?  
3. How should deterministic tie breaking work if two valid groups have the same priority and same capacity?  
4. What happens to existing future bookings if asset groups are edited or deleted?  
5. Does the engine already expose the reason why a group candidate was skipped?


export const assetGroupsCopy = {
  navigation: {
    hubName: 'Chadstone',
    tabs: {
      venues: 'Venues',
      assets: 'Assets',
      allocationRules: 'Allocation rules',
      activities: 'Activities',
      activityPacks: 'Activity packs',
      translations: 'Translations',
    },
  },
  actions: {
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    deleteRule: 'Delete allocation rule',
    createRule: 'Create allocation rule',
    actions: 'Actions',
  },
  emptyState: {
    title: 'No allocation rules yet',
    description:
      'Create allocation rules to control which assets are assigned together when a booking needs multiple assets.',
  },
  list: {
    description:
      'Allocation rules tell the system which assets should be assigned together and how they should be selected.',
    createdToast: 'Allocation rule created',
    updatedToast: 'Allocation rule updated',
    columns: {
      order: 'Order',
      priority: 'Priority',
      ruleName: 'Rule name',
      status: 'Status',
      assignmentMethod: 'Assignment method',
      assetList: 'Asset list',
      combinedCapacity: 'Combined capacity',
      actions: 'Actions',
    },
  },
  form: {
    title: {
      create: 'Create allocation rule',
      edit: 'Edit allocation rule',
    },
    ruleName: {
      sectionTitle: 'Rule name',
      label: 'Rule name',
      helperText: 'Used for internal identification. Not visible to customers.',
    },
    settings: 'Settings',
    status: {
      label: 'Status',
      active: 'Active',
      inactive: 'Inactive',
      invalid: 'Invalid',
      activeDescription: 'This rule is available for automatic allocation.',
      inactiveDescription: 'This rule is ignored during automatic allocation.',
      enabledToastTitle: 'Rule enabled',
      enabledToastDescription: 'This rule is available for automatic allocation again.',
      disabledToastTitle: 'Rule disabled',
      disabledToastDescription: 'This rule is no longer used during automatic allocation.',
      invalidDescription: 'Add at least 2 assets to activate this rule.',
      invalidWarning: {
        title: 'This rule is invalid',
        description:
          'One of its assets no longer exists, so it now has fewer than 2. Add another asset to reactivate it.',
      },
      invalidTooltip: 'One of its assets no longer exists',
    },
    assignmentMethod: {
      label: 'Assignment method',
      description: 'Determines how assets are selected when this rule is applied.',
      lockedHint: "This setting can't be changed after saving.",
      options: {
        consecutive: {
          label: 'In order',
          description: 'Assign consecutive assets following the order defined in the list.',
        },
        fixed: {
          label: 'Exact set',
          description: 'Always assign all assets included in this rule.',
        },
        flexible: {
          label: 'Flexible',
          description: 'Assign any available combination of assets from this rule.',
        },
      },
    },
  },
  selector: {
    title: 'Select assets',
    description: 'Choose the assets that belong to this rule. At least 2 assets are required.',
    filterLabel: 'Filter by booking type',
    searchPlaceholder: 'Search assets by name',
    noAssetsTitle: 'No assets selected',
    noAssetsDescription: "Selected assets will be used to calculate the rule's total capacity",
    selectedAssets: (count: number) => `${count} ${count === 1 ? 'asset' : 'assets'} selected`,
    totalCapacity: (capacity: number) => `Total capacity: ${capacity} pax`,
    inOrderAlert: {
      title: 'Drag to set the order assets are assigned in',
      description: 'Bookings will use assets in this order whenever possible.',
    },
  },
  modals: {
    deleteRule: {
      title: 'Delete allocation rule?',
      description: 'This action is permanent and cannot be undone.',
      confirmLabel: 'Delete rule',
    },
    unsavedChanges: {
      title: 'Unsaved changes',
      description: 'Your changes will be lost if you leave this page.',
      continueEditingLabel: 'Continue editing',
      leaveLabel: 'Leave without saving',
    },
    bookingTypeChange: {
      title: 'Selected assets will be removed',
      description:
        'A rule can only contain one booking type, so changing it will remove the assets you have selected.',
      changeTypeLabel: 'Change type',
      keepTypeLabel: 'Keep type',
    },
  },
} as const;

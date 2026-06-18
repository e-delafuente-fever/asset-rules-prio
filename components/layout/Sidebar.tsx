'use client';

const NAV_ITEMS = [
  { label: 'Events', icon: 'fa-solid fa-calendar-days', hasChevron: true },
  { label: 'Asset-Based', icon: 'fa-solid fa-building-columns', hasChevron: false },
  { label: 'Hubs', icon: 'fa-solid fa-building-columns', hasChevron: false, isActive: true, isSubItem: false },
  { label: 'Calendar', icon: 'fa-regular fa-calendar', hasChevron: false, isSubItem: true },
  { label: 'Validation', icon: 'fa-solid fa-ticket', hasChevron: false },
  { label: 'Orders', icon: 'fa-solid fa-receipt', hasChevron: true },
  { label: 'Reservations', icon: 'fa-solid fa-calendar-check', hasChevron: true },
  { label: 'Marketing', icon: 'fa-solid fa-circle-dollar-to-slot', hasChevron: true },
  { label: 'Affiliations', icon: 'fa-solid fa-shop', hasChevron: true },
  { label: 'Memberships', icon: 'fa-solid fa-address-card', hasChevron: true },
  { label: 'Box Office', icon: 'fa-solid fa-cash-register', hasChevron: true },
  { label: 'Kiosks', icon: 'fa-solid fa-mobile-screen', hasChevron: false },
  { label: 'Reports', icon: 'fa-solid fa-file-lines', hasChevron: false },
  { label: 'Finance', icon: 'fa-solid fa-piggy-bank', hasChevron: false },
  { label: 'Settings', icon: 'fa-solid fa-gear', hasChevron: true },
  { label: 'Organizations', icon: 'fa-solid fa-city', hasChevron: false },
  { label: 'Log out', icon: 'fa-solid fa-arrow-right-from-bracket', hasChevron: false, isDivider: true },
];

export function Sidebar() {
  return (
    <aside className="fixed top-[72px] left-0 bottom-0 w-[256px] bg-[#06232C] border-r border-[#2C4751] overflow-y-auto z-40 flex flex-col">
      <nav className="flex-1 px-6 py-6 flex flex-col gap-1">
        {NAV_ITEMS.map((item, idx) => {
          if (item.isDivider) {
            return (
              <div key={idx}>
                <div className="my-3 border-t border-[#2C4751]" />
                <NavItem item={item} />
              </div>
            );
          }
          return <NavItem key={idx} item={item} />;
        })}
      </nav>
    </aside>
  );
}

function NavItem({ item }: { item: (typeof NAV_ITEMS)[number] }) {
  return (
    <div
      className={[
        'flex items-center gap-3 h-10 px-3 rounded-lg cursor-pointer transition-colors',
        item.isActive ? 'bg-[#2C4751]' : 'hover:bg-white/5',
        item.isSubItem ? 'pl-9' : '',
      ].join(' ')}
    >
      {!item.isSubItem && (
        <i className={`${item.icon} text-white/80 w-5 text-sm flex-shrink-0`} />
      )}
      <span className="text-white text-sm flex-1 truncate">{item.label}</span>
      {item.hasChevron && (
        <i className="fa-solid fa-angle-down text-white/50 text-xs" />
      )}
    </div>
  );
}

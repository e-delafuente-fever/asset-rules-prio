'use client';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-[72px] px-6 bg-[#06232C] border-b border-[#2C4751]">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div className="bg-white rounded p-1 flex items-center justify-center w-7 h-7">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect width="16" height="16" rx="2" fill="#06232C" />
              <path d="M2 4h5v2H2V4zm0 6h5v2H2v-2zM9 7h5v2H9V7z" fill="white" />
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-white font-bold text-sm tracking-tight">fever</span>
            <span className="text-[#8FA8B0] text-[9px] font-semibold tracking-widest uppercase">zone</span>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <button className="border border-white text-white text-sm font-semibold rounded-full px-5 py-2 hover:bg-white/10 transition-colors">
          Create event
        </button>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-white text-sm font-semibold leading-tight">John Doe</p>
            <p className="text-[#8FA8B0] text-xs leading-tight">SO Test</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#2C4751] flex items-center justify-center">
            <i className="fa-regular fa-circle-user text-white text-lg" />
          </div>
        </div>
      </div>
    </header>
  );
}

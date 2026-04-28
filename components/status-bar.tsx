"use client"

export function StatusBar() {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#111111]">
      <div className="flex items-center gap-2 text-white text-sm font-medium">
        <span>10:30</span>
      </div>
      <div className="flex items-center gap-1.5 text-white text-xs">
        <span className="text-gray-300">4月22日</span>
        <span className="text-gray-500 mx-1">|</span>
        <span>5G</span>
        <div className="flex items-center ml-1">
          <div className="flex items-center gap-px">
            <div className="w-[3px] h-[6px] bg-white/90 rounded-sm" />
            <div className="w-[3px] h-[8px] bg-white/90 rounded-sm" />
            <div className="w-[3px] h-[10px] bg-white/90 rounded-sm" />
            <div className="w-[3px] h-[12px] bg-white/90 rounded-sm" />
          </div>
        </div>
        <div className="ml-1.5 flex items-center gap-0.5 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
            <rect x="20" y="9" width="2" height="6" rx="1" fill="currentColor"/>
            <rect x="4" y="8" width="10" height="8" rx="1" fill="currentColor" opacity="0.7"/>
          </svg>
          <span>70</span>
        </div>
      </div>
    </div>
  )
}

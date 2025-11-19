import React from 'react';
import { useLocation } from 'react-router-dom';
import { BellIcon, MagnifyingGlassIcon, CommandLineIcon } from '@heroicons/react/24/outline';

const TopBar: React.FC = () => {
  const location = useLocation();

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return 'HOME';
    const parts = path.substring(1).split('/');
    return parts.map(p => p.replace(/-/g, ' ')).join('  /  ').toUpperCase();
  };

  return (
    <header className="bg-white border-b border-gray-300 sticky top-0 z-20 px-6 py-3 flex items-center justify-between h-16 transition-colors">
      
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center text-xs font-semibold text-gray-700 tracking-wide uppercase">
          <span className="mr-2 text-gray-500">PATH:</span>
          {getBreadcrumb()}
        </div>
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex items-center justify-center flex-1">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
          </div>

          <input
            type="text"
            placeholder="Search…"
            className="bg-gray-100 border border-gray-300 text-gray-800 text-xs rounded-lg w-full py-2 pl-10 pr-4 
                       focus:outline-none focus:border-black focus:ring-1 focus:ring-black placeholder-gray-500"
          />

          <div className="absolute right-2 top-2 text-[10px] text-gray-500 font-mono">
            CMD+K
          </div>
        </div>
      </div>

      {/* Right: System + Profile */}
      <div className="flex items-center gap-4 flex-1 justify-end">

        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full border border-gray-300 bg-gray-100">
          <div className="w-1.5 h-1.5 bg-green-500 animate-pulse rounded-full"></div>
          <span className="text-[10px] font-mono text-gray-500">SYSTEM OK</span>
        </div>

        <button className="p-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded relative transition">
          <BellIcon className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-black rounded-full"></span>
        </button>

        <div className="h-6 w-px bg-gray-300 mx-1"></div>

        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-gray-700">User</div>
            <div className="text-[10px] text-gray-500 font-mono">Standard Access</div>
          </div>

          <div className="w-8 h-8 bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-600 hover:border-black hover:text-black transition">
            <CommandLineIcon className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;

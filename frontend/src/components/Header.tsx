import React from 'react';
import type { UserRole } from '../types';
import { Radio, MessageSquare, BarChart3, FlaskConical, User, ShieldCheck, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  unreadTotal: number;
  isSocketConnected: boolean;
  activeTab: 'inbox' | 'dashboard' | 'simulation';
  onTabChange: (tab: 'inbox' | 'dashboard' | 'simulation') => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  unreadTotal,
  isSocketConnected,
  activeTab,
  onTabChange,
  isDarkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 font-extrabold text-lg">
            OS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-lg">
                OmniSync
              </span>
              <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                CRM
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              Rancaekek Supply Co. • Omnichannel Outdoor Retail
            </p>
          </div>
        </div>

        {/* Center Navigation */}
        <nav className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => onTabChange('inbox')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'inbox'
                ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Unified Inbox</span>
            {unreadTotal > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-xs font-bold ${
                  activeTab === 'inbox' ? 'bg-emerald-400 text-slate-950' : 'bg-emerald-600 text-white'
                }`}
              >
                {unreadTotal}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Dashboard Manager & Analitik Penjualan (Tahap 5)"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono">
              T5
            </span>
          </button>

          <button
            onClick={() => onTabChange('simulation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'simulation'
                ? 'bg-slate-900 dark:bg-teal-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Simulation Lab Webhook & Auto Engine"
          >
            <FlaskConical className="w-4 h-4" />
            <span className="hidden sm:inline">Simulasi</span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">
              Lab
            </span>
          </button>
        </nav>

        {/* Right Actions: Theme Toggle, Realtime Status & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isDarkMode ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* Socket status */}
          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            title={isSocketConnected ? 'Socket.io Aktif & Terhubung' : 'Menghubungkan Socket...'}
          >
            <Radio
              className={`w-3.5 h-3.5 ${
                isSocketConnected ? 'text-emerald-500 animate-pulse' : 'text-amber-500'
              }`}
            />
            <span className="text-[11px] font-medium">
              {isSocketConnected ? 'Real-time On' : 'Connecting'}
            </span>
          </div>

          {/* Switch Role Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => onRoleChange('cs')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentRole === 'cs'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>CS Rep</span>
            </button>
            <button
              onClick={() => onRoleChange('manager')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentRole === 'manager'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Manager</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import type { ChatSession } from '../types';
import { getPlatformConfig, formatRelativeTime } from '../utils/formatters';
import { Search, ArrowUpDown, Flame, Inbox, RefreshCw } from 'lucide-react';

interface InboxListProps {
  sessions: ChatSession[];
  selectedSessionId: number | null;
  onSelectSession: (session: ChatSession) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedPlatform: string;
  onPlatformChange: (p: string) => void;
  sortBy: 'recent' | 'urgency';
  onSortChange: (sort: 'recent' | 'urgency') => void;
  loading: boolean;
  onRefresh: () => void;
}

const PLATFORM_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'shopee', label: 'Shopee' },
  { key: 'tokopedia', label: 'Tokopedia' },
  { key: 'lazada', label: 'Lazada' },
  { key: 'blibli', label: 'Blibli' },
];

export const InboxList: React.FC<InboxListProps> = ({
  sessions,
  selectedSessionId,
  onSelectSession,
  searchQuery,
  onSearchChange,
  selectedPlatform,
  onPlatformChange,
  sortBy,
  onSortChange,
  loading,
  onRefresh,
}) => {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors">
      {/* Top Header: Title, Search & Refresh */}
      <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Kotak Masuk Terpadu</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {sessions.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Sort Toggle */}
            <button
              onClick={() => onSortChange(sortBy === 'recent' ? 'urgency' : 'recent')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                sortBy === 'urgency'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              title={sortBy === 'recent' ? 'Urutkan berdasarkan Urgensi' : 'Urutkan berdasarkan Terbaru'}
            >
              {sortBy === 'urgency' ? (
                <>
                  <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Urgensi</span>
                </>
              ) : (
                <>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>Terbaru</span>
                </>
              )}
            </button>

            <button
              onClick={onRefresh}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Perbarui daftar chat"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Cari pelanggan, no. HP, pesan..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Platform Horizontal Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          {PLATFORM_FILTERS.map((f) => {
            const isActive = selectedPlatform === f.key;
            return (
              <button
                key={f.key}
                onClick={() => onPlatformChange(f.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        {loading && sessions.length === 0 ? (
          // Loading Skeletons
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl animate-pulse bg-slate-50 dark:bg-slate-800/40">
                <div className="w-11 h-11 bg-slate-200 dark:bg-slate-700 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded-sm w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-sm w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          // Empty State
          <div className="h-64 flex flex-col items-center justify-center p-6 text-center text-slate-400 dark:text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-2">
              <Inbox className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Tidak ada percakapan</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Coba ganti filter platform atau kata kunci pencarian.
            </p>
          </div>
        ) : (
          // Active Sessions
          sessions.map((session) => {
            const isSelected = selectedSessionId === session.id;
            const pConfig = getPlatformConfig(session.platform);
            const isUrgent = session.urgency === 'high';

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session)}
                className={`flex items-start gap-3 p-3.5 cursor-pointer transition-all border-l-3 select-none ${
                  isSelected
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-600 dark:border-emerald-500 shadow-2xs'
                    : 'border-transparent hover:bg-slate-50/80 dark:hover:bg-slate-800/60 bg-white dark:bg-slate-900'
                }`}
              >
                {/* Avatar with Platform Indicator */}
                <div className="relative shrink-0">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs"
                  >
                    {session.customer_name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <span
                    className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${pConfig.dotBg}`}
                    title={pConfig.name}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`text-xs font-bold truncate ${
                        isSelected
                          ? 'text-slate-900 dark:text-white font-extrabold'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {session.customer_name}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0 font-medium">
                      {formatRelativeTime(session.last_message_at)}
                    </span>
                  </div>

                  <p
                    className={`text-xs truncate ${
                      session.unread_count > 0
                        ? 'text-slate-900 dark:text-slate-100 font-semibold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {session.last_message || 'Tidak ada pesan'}
                  </p>

                  {/* Customer Tags Chips */}
                  {session.customer_tags && session.customer_tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {session.customer_tags.slice(0, 2).map((t, idx) => (
                        <span
                          key={idx}
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            t === 'VIP'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              : t === 'Suka Retur'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                              : t === 'Pending Payment'
                              ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-900 dark:text-orange-300 border border-orange-300 dark:border-orange-800'
                              : t === 'New Customer'
                              ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {t}
                        </span>
                      ))}
                      {session.customer_tags.length > 2 && (
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">
                          +{session.customer_tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Badges: Platform + Urgency + Unread */}
                  <div className="flex items-center justify-between mt-2 pt-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Platform Badge */}
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${pConfig.badgeBg}`}
                      >
                        {pConfig.name}
                      </span>

                      {/* Urgency Badge */}
                      {isUrgent && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 animate-pulse">
                          <Flame className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                          <span>Penting</span>
                        </span>
                      )}
                    </div>

                    {/* Unread Pill */}
                    {session.unread_count > 0 && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                        {session.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

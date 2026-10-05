import React from 'react';
import { formatRupiah } from '../../utils/formatters';
import {
  DollarSign,
  ShoppingCart,
  MessageSquare,
  Clock,
  Zap,
} from 'lucide-react';

interface DashboardSummaryCardsProps {
  summary: {
    total_revenue: number;
    total_orders: number;
    successful_orders: number;
    pending_orders: number;
    returned_orders: number;
    open_chats: number;
    resolved_chats: number;
    total_chats?: number;
    avg_response_time_sec: number;
    total_cs_replies: number;
  };
}

export const DashboardSummaryCards: React.FC<DashboardSummaryCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Penjualan */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Penjualan</span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatRupiah(summary.total_revenue)}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{summary.successful_orders} pesanan</span>
            <span>berhasil terverifikasi</span>
          </div>
        </div>
      </div>

      {/* Card 2: Total Pesanan */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Pesanan</span>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <ShoppingCart className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {summary.total_orders} Order
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="text-amber-600 dark:text-amber-400 font-semibold">{summary.pending_orders} pending</span>
            <span>•</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">{summary.returned_orders} retur</span>
          </div>
        </div>
      </div>

      {/* Card 3: Chat Open */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Antrean Chat Aktif</span>
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {summary.open_chats} Sesi Open
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{summary.resolved_chats} resolved</span>
            <span>dari total {summary.total_chats} percakapan</span>
          </div>
        </div>
      </div>

      {/* Card 4: Rata-Rata Waktu Respons CS */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Rata-rata Respon CS</span>
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <span>{summary.avg_response_time_sec} Detik</span>
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span>{summary.total_cs_replies} pesan CS terkirim</span>
          </div>
        </div>
      </div>
    </div>
  );
};

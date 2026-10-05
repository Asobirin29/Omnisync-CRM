import React from 'react';
import { getPlatformConfig } from '../../utils/formatters';
import type { Platform } from '../../types';
import { AlertTriangle } from 'lucide-react';

interface LowStockAlertsProps {
  lowStockAlerts: any[];
  filterLowStockOnly: boolean;
  onFilterToggle: () => void;
}

export const LowStockAlerts: React.FC<LowStockAlertsProps> = ({
  lowStockAlerts,
  filterLowStockOnly,
  onFilterToggle,
}) => {
  if (lowStockAlerts.length === 0) return null;

  return (
    <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-4 sm:p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-xs">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-rose-900 dark:text-rose-200 text-sm">
              Peringatan Stok Kritis ({lowStockAlerts.length} SKU Menipis)
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-300">
              Stok di bawah batas ambang (&le; 5 pcs). Segera lakukan restock gudang untuk mencegah overselling.
            </p>
          </div>
        </div>

        <button
          onClick={onFilterToggle}
          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all whitespace-nowrap cursor-pointer"
        >
          {filterLowStockOnly ? 'Tampilkan Semua Stok' : 'Filter Tabel ke Stok Kritis'}
        </button>
      </div>

      {/* Alert cards carousel/grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
        {lowStockAlerts.slice(0, 4).map((al: any) => {
          const pConfig = getPlatformConfig(al.platform as Platform);
          return (
            <div
              key={al.channel_id}
              className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-rose-200/90 dark:border-rose-900/60 shadow-2xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[11px] text-slate-800 dark:text-slate-200">{al.sku}</span>
                <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${pConfig.badgeBg}`}>
                  {pConfig.name}
                </span>
              </div>
              <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">{al.product_name}</h5>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">{al.color} ({al.size})</span>
                <span className="font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
                  Sisa: {al.stock} pcs
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { formatRupiah, getPlatformConfig } from '../../utils/formatters';
import type { Platform } from '../../types';
import {
  AlertTriangle,
  CheckCircle2,
  Search,
  Flame,
} from 'lucide-react';

interface SkuStockTableProps {
  skuStockTable: any[];
  skuSearch: string;
  onSkuSearchChange: (value: string) => void;
  filterLowStockOnly: boolean;
  onFilterToggle: () => void;
}

export const SkuStockTable: React.FC<SkuStockTableProps> = ({
  skuStockTable,
  skuSearch,
  onSkuSearchChange,
  filterLowStockOnly,
  onFilterToggle,
}) => {
  const renderStockBadge = (ch: any) => {
    if (!ch) return <span className="text-slate-300 dark:text-slate-600">-</span>;
    const isLow = ch.is_low_stock;
    return (
      <span
        className={`inline-block px-2 py-0.5 rounded-md font-mono font-bold text-[11px] ${
          isLow
            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
        }`}
      >
        {ch.stock}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Monitoring Inventori Stok Multi-Platform</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Sinkronisasi stok riil per SKU lintas Shopee, Tokopedia, Lazada, dan Blibli</p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Cari SKU, produk, warna..."
              value={skuSearch}
              onChange={(e) => onSkuSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={onFilterToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap cursor-pointer ${
              filterLowStockOnly
                ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Stok Kritis Saja</span>
          </button>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
              <th className="py-3 px-4">SKU & Produk</th>
              <th className="py-3 px-3">Varian</th>
              <th className="py-3 px-3 text-center">Shopee</th>
              <th className="py-3 px-3 text-center">Tokopedia</th>
              <th className="py-3 px-3 text-center">Lazada</th>
              <th className="py-3 px-3 text-center">Blibli</th>
              <th className="py-3 px-3 text-center">Total Stok</th>
              <th className="py-3 px-4 text-right">Harga</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {skuStockTable.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  Tidak ada produk yang cocok dengan filter pencarian.
                </td>
              </tr>
            ) : (
              skuStockTable.map((item: any) => {
                const shopeeStock = item.channels.find((c: any) => c.platform === 'shopee');
                const tokpedStock = item.channels.find((c: any) => c.platform === 'tokopedia');
                const lazadaStock = item.channels.find((c: any) => c.platform === 'lazada');
                const blibliStock = item.channels.find((c: any) => c.platform === 'blibli');

                return (
                  <tr
                    key={item.variant_id}
                    className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                      item.has_low_stock ? 'bg-rose-50/20 dark:bg-rose-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">{item.sku}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[200px]">
                        {item.product_name}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      <span className="font-semibold">{item.color}</span> - {item.size}
                    </td>
                    <td className="py-3 px-3 text-center">{renderStockBadge(shopeeStock)}</td>
                    <td className="py-3 px-3 text-center">{renderStockBadge(tokpedStock)}</td>
                    <td className="py-3 px-3 text-center">{renderStockBadge(lazadaStock)}</td>
                    <td className="py-3 px-3 text-center">{renderStockBadge(blibliStock)}</td>
                    <td className="py-3 px-3 text-center font-bold font-mono text-slate-900 dark:text-white text-sm">
                      {item.total_stock}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatRupiah(item.price)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {item.has_low_stock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                          <span>Kritis</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Aman</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

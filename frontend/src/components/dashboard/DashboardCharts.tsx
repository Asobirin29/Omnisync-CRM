import React, { useMemo } from 'react';
import { formatRupiah, getPlatformConfig } from '../../utils/formatters';
import type { Platform } from '../../types';
import { TrendingUp } from 'lucide-react';

interface DashboardChartsProps {
  channelSales: any[];
  salesTrend: any[];
  totalRevenue: number;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  channelSales,
  salesTrend,
  totalRevenue,
}) => {
  const trendMaxRev = useMemo(() => {
    const max = Math.max(...salesTrend.map((d: any) => d.revenue), 1000000);
    return max;
  }, [salesTrend]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left Chart: Channel Sales Percentage Comparison (5 Columns) */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Distribusi Penjualan Antar Platform</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Persentase omzet dari seluruh channel penjualan</p>
            </div>
          </div>

          {/* Platform Horizontal Percentage Bars */}
          <div className="space-y-3.5 my-2">
            {channelSales.map((ch: any) => {
              const pConfig = getPlatformConfig(ch.platform as Platform);
              return (
                <div key={ch.platform} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${pConfig.dotBg}`} />
                      <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{pConfig.name}</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">({ch.order_count} order)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 dark:text-white">{ch.percentage}%</span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">({formatRupiah(ch.revenue)})</span>
                    </div>
                  </div>

                  {/* Progress Bar Track */}
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${pConfig.badgeBg}`}
                      style={{ width: `${Math.min(100, Math.max(2, ch.percentage))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Dihitung otomatis dari tabel <code>orders</code></span>
          <span className="font-bold text-slate-900 dark:text-white">Total: {formatRupiah(totalRevenue)}</span>
        </div>
      </div>

      {/* Right Chart: 30-Day Sales Trend (7 Columns) */}
      <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Tren Penjualan 30 Hari Terakhir</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Akumulasi pendapatan harian seluruh saluran</p>
            </div>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md">
              30 Hari
            </span>
          </div>

          {/* Native SVG Bar/Trend Chart */}
          <div className="h-52 w-full pt-4 flex items-end gap-1.5 sm:gap-2">
            {salesTrend.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
                Tidak ada riwayat penjualan 30 hari terakhir.
              </div>
            ) : (
              salesTrend.slice(-20).map((d: any, idx: number) => {
                const heightPct = Math.max(10, Math.round((d.revenue / trendMaxRev) * 100));
                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center group relative h-full justify-end cursor-pointer"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 dark:bg-slate-800 text-white text-[10px] py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-md border border-slate-700">
                      <div className="font-bold">{d.date}</div>
                      <div>{formatRupiah(d.revenue)} ({d.orders} ord)</div>
                    </div>

                    {/* Bar Pillar */}
                    <div
                      className="w-full rounded-t-md bg-emerald-500 group-hover:bg-emerald-600 dark:bg-emerald-600 dark:group-hover:bg-emerald-500 transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />

                    {/* Date label (sparse) */}
                    {idx % 4 === 0 && (
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 whitespace-nowrap">
                        {d.date.slice(5)}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Rata-rata pendapatan harian</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {formatRupiah(Math.round(totalRevenue / Math.max(1, salesTrend.length)))} / hari
          </span>
        </div>
      </div>
    </div>
  );
};

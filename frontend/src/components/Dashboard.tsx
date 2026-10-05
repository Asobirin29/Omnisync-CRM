import React, { useState, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { DashboardSummaryCards } from './dashboard/DashboardSummaryCards';
import { LowStockAlerts } from './dashboard/LowStockAlerts';
import { DashboardCharts } from './dashboard/DashboardCharts';
import { SkuStockTable } from './dashboard/SkuStockTable';

interface DashboardProps {
  analyticsData: any;
  loading: boolean;
  onRefresh: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ analyticsData, loading, onRefresh }) => {
  const [skuSearch, setSkuSearch] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  const summary = analyticsData?.summary || {
    total_revenue: 0,
    total_orders: 0,
    successful_orders: 0,
    pending_orders: 0,
    returned_orders: 0,
    open_chats: 0,
    resolved_chats: 0,
    avg_response_time_sec: 0,
    total_cs_replies: 0,
  };

  const channelSales = analyticsData?.channel_sales || [];
  const salesTrend = analyticsData?.sales_trend || [];
  const lowStockAlerts = analyticsData?.low_stock_alerts || [];
  const skuStockTable = analyticsData?.sku_stock_table || [];

  // Filter SKU table
  const filteredSkuTable = useMemo(() => {
    return skuStockTable.filter((item: any) => {
      const matchSearch =
        item.sku.toLowerCase().includes(skuSearch.toLowerCase()) ||
        item.product_name.toLowerCase().includes(skuSearch.toLowerCase()) ||
        item.color.toLowerCase().includes(skuSearch.toLowerCase()) ||
        item.category.toLowerCase().includes(skuSearch.toLowerCase());

      const matchLowStock = filterLowStockOnly ? item.has_low_stock : true;
      return matchSearch && matchLowStock;
    });
  }, [skuStockTable, skuSearch, filterLowStockOnly]);

  return (
    <div className="space-y-6 pb-12 transition-colors">
      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Executive Dashboard</h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 uppercase tracking-wide">
              Store Manager
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitoring performa omnichannel, sinkronisasi stok, dan kecepatan respon CS Rancaekek Supply Co.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 1. Summary Cards */}
      <DashboardSummaryCards summary={summary} />

      {/* 2. Low-Stock Alerts Banner */}
      <LowStockAlerts
        lowStockAlerts={lowStockAlerts}
        filterLowStockOnly={filterLowStockOnly}
        onFilterToggle={() => setFilterLowStockOnly(!filterLowStockOnly)}
      />

      {/* 3. Charts Section */}
      <DashboardCharts
        channelSales={channelSales}
        salesTrend={salesTrend}
        totalRevenue={summary.total_revenue}
      />

      {/* 4. SKU Stock Table */}
      <SkuStockTable
        skuStockTable={filteredSkuTable}
        skuSearch={skuSearch}
        onSkuSearchChange={setSkuSearch}
        filterLowStockOnly={filterLowStockOnly}
        onFilterToggle={() => setFilterLowStockOnly(!filterLowStockOnly)}
      />
    </div>
  );
};

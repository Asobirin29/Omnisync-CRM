import React, { useState } from 'react';
import type { Platform, Product, Customer } from '../../types';
import { getPlatformConfig, formatRupiah } from '../../utils/formatters';
import { sendMockOrder } from '../../services/api';
import {
  ShoppingCart,
  AlertTriangle,
  Zap,
  Send,
  RefreshCw,
} from 'lucide-react';

interface VariantOption {
  sku: string;
  productName: string;
  color: string;
  size: string;
  price: number;
  stocks: { [platform: string]: number };
}

interface OrderSimulatorProps {
  allVariants: VariantOption[];
  customers: Customer[];
  onRefreshAll?: () => void;
}

export const OrderSimulator: React.FC<OrderSimulatorProps> = ({
  allVariants,
  customers,
  onRefreshAll,
}) => {
  const [orderPlatform, setOrderPlatform] = useState<Platform>('shopee');
  const [orderCustName, setOrderCustName] = useState('Budi Santoso');
  const [orderCustPhone, setOrderCustPhone] = useState('081234567890');
  const [selectedSku, setSelectedSku] = useState(allVariants[0]?.sku || '');
  const [orderQty, setOrderQty] = useState(1);
  const [orderStatus, setOrderStatus] = useState('paid');
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<{
    latency_ms: number;
    payload: any;
    response: any;
    status: number;
    isOk: boolean;
  } | null>(null);

  // Auto-select first SKU when variants become available
  React.useEffect(() => {
    if (allVariants.length > 0 && !selectedSku) {
      setSelectedSku(allVariants[0].sku);
    }
  }, [allVariants]);

  const handleSelectOrderCustomer = (custId: string) => {
    const c = customers.find((cust) => cust.id.toString() === custId);
    if (c) {
      setOrderCustName(c.name);
      setOrderCustPhone(c.phone_number);
    }
  };

  const handleSendOrder = async () => {
    if (!selectedSku || orderQty <= 0) return;
    setOrderLoading(true);

    const extId = `SIM-${orderPlatform.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-6)}`;
    const payload = {
      external_order_id: extId,
      customer: {
        name: orderCustName.trim() || 'Pelanggan Demo',
        phone: orderCustPhone.trim() || '081234567890',
      },
      items: [{ sku: selectedSku, qty: Number(orderQty) }],
      status: orderStatus,
    };

    const t0 = performance.now();
    try {
      const res = await sendMockOrder(orderPlatform, payload);
      const latency = Math.round(performance.now() - t0);

      setOrderResult({
        latency_ms: latency,
        payload,
        response: res.data,
        status: res.status,
        isOk: res.ok,
      });

      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      const latency = Math.round(performance.now() - t0);
      setOrderResult({
        latency_ms: latency,
        payload,
        response: { error: err.message || 'Network error' },
        status: 500,
        isOk: false,
      });
    } finally {
      setOrderLoading(false);
    }
  };

  const currentVariant = allVariants.find((v) => v.sku === selectedSku);
  const currentPlatformStock = currentVariant ? (currentVariant.stocks[orderPlatform] ?? 0) : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between space-y-5">
      <div className="space-y-4">
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Simulasi Order Masuk</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">POST /api/webhooks/:platform/order</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
            ACID Transaction
          </span>
        </div>

        {/* Platform Selector Buttons */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Pilih Saluran / Platform:</label>
          <div className="grid grid-cols-5 gap-2">
            {(['shopee', 'tokopedia', 'lazada', 'blibli', 'whatsapp'] as Platform[]).map((p) => {
              const pConfig = getPlatformConfig(p);
              const isSelected = orderPlatform === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setOrderPlatform(p)}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${pConfig.dotBg}`} />
                  <span className="capitalize text-[11px] truncate w-full text-center">{pConfig.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Customer Selection / Quick Fill */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pelanggan:</label>
            {customers.length > 0 && (
              <select
                onChange={(e) => handleSelectOrderCustomer(e.target.value)}
                className="text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5 text-slate-600 dark:text-slate-300 focus:outline-none"
              >
                <option value="">-- Pilih dari 50 Pelanggan --</option>
                {customers.slice(0, 20).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone_number})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Nama Pembeli"
              value={orderCustName}
              onChange={(e) => setOrderCustName(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <input
              type="text"
              placeholder="Nomor Telepon"
              value={orderCustPhone}
              onChange={(e) => setOrderCustPhone(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>
        </div>

        {/* SKU & Quantity Picker */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Pilih Produk & SKU:</label>
          <select
            value={selectedSku}
            onChange={(e) => setSelectedSku(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
          >
            {allVariants.map((v) => (
              <option key={v.sku} value={v.sku}>
                [{v.sku}] {v.productName} ({v.color} - {v.size}) — {formatRupiah(v.price)} | Stok {orderPlatform}: {v.stocks[orderPlatform] ?? 0}
              </option>
            ))}
          </select>

          {/* Variant Stock Indicator & Qty Input */}
          <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">Stok di {orderPlatform}:</span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                  currentPlatformStock <= 5
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                {currentPlatformStock} pcs
              </span>
              {currentPlatformStock <= 5 && (
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Low Stock
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Qty:</span>
              <input
                type="number"
                min={1}
                max={50}
                value={orderQty}
                onChange={(e) => setOrderQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-mono font-bold text-center text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Status Picker */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300">Status Awal Pesanan:</span>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="orderStatus"
                value="paid"
                checked={orderStatus === 'paid'}
                onChange={() => setOrderStatus('paid')}
                className="text-indigo-600"
              />
              <span>paid (Lunas)</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="orderStatus"
                value="pending_payment"
                checked={orderStatus === 'pending_payment'}
                onChange={() => setOrderStatus('pending_payment')}
                className="text-indigo-600"
              />
              <span>pending_payment</span>
            </label>
          </div>
        </div>
      </div>

      {/* Order Action Button */}
      <div className="space-y-4 pt-2">
        <button
          onClick={handleSendOrder}
          disabled={orderLoading || !selectedSku}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          {orderLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Memproses Webhook Order & Sinkronisasi Stok...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Kirim Webhook Order Masuk</span>
            </>
          )}
        </button>

        {/* Order Result: Latency Badge, Payload & Response Viewers */}
        {orderResult && (
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {/* Latency Metric Banner */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                orderResult.latency_ms < 2000
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                <Zap className="w-4 h-4" />
                <span>
                  Latensi Sinkronisasi Stok: {orderResult.latency_ms} ms
                </span>
              </div>
              <span
                className={`font-black text-[11px] px-2 py-0.5 rounded-full ${
                  orderResult.latency_ms < 2000
                    ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100'
                    : 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100'
                }`}
              >
                {orderResult.latency_ms < 2000 ? '⚡ Cepat (< 2000 ms)' : '⚠️ Lambat (≥ 2000 ms)'}
              </span>
            </div>

            {/* Status & Error notice if rejected */}
            {!orderResult.isOk && (
              <div className="p-2.5 bg-rose-100/70 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="font-medium">
                  Status {orderResult.status}: {orderResult.response?.message || 'Pesanan ditolak (Stok habis)'}
                </span>
              </div>
            )}

            {/* JSON Viewers */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Payload Dikirim:</span>
                <pre className="p-2 bg-slate-900 text-emerald-400 rounded-lg overflow-x-auto max-h-36 font-mono text-[10px] border border-slate-800">
                  {JSON.stringify(orderResult.payload, null, 2)}
                </pre>
              </div>
              <div>
                <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Response API:</span>
                <pre
                  className={`p-2 rounded-lg overflow-x-auto max-h-36 font-mono text-[10px] border border-slate-800 ${
                    orderResult.isOk ? 'bg-slate-900 text-slate-200' : 'bg-rose-950 text-rose-200'
                  }`}
                >
                  {JSON.stringify(orderResult.response, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

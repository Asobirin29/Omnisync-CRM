import React, { useState, useEffect } from 'react';
import type { ChatSession, Customer } from '../types';
import { fetchCustomer, updateOrderStatus } from '../services/api';
import { formatRupiah, formatRelativeTime, getPlatformConfig } from '../utils/formatters';
import {
  User,
  Phone,
  Tag,
  ShoppingCart,
  Clock,
  Sparkles,
  TrendingUp,
  PackageCheck,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import { CreateOrderModal } from './CreateOrderModal';

interface CustomerProfileProps {
  session: ChatSession | null;
  onOrderCreated?: (order: any) => void;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({ session, onOrderCreated }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const loadCustomerData = (customerId: number) => {
    setLoading(true);
    fetchCustomer(customerId)
      .then((data) => setCustomer(data))
      .catch((err) => console.error('Error fetching customer profile:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (session?.customer_id) {
      loadCustomerData(session.customer_id);
    } else {
      setCustomer(null);
    }
  }, [session?.customer_id]);

  if (!session) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
          <User className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-slate-800 dark:text-white text-sm">Profil Pelanggan</h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[200px] mt-1">
          Pilih salah satu percakapan di kolom kiri untuk melihat profil pelanggan.
        </p>
      </div>
    );
  }

  const pConfig = getPlatformConfig(session.platform);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      // Reload customer profile to refresh tags and recalculated LTV
      if (session.customer_id) {
        loadCustomerData(session.customer_id);
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getTagBadgeStyle = (tag: string) => {
    switch (tag) {
      case 'VIP':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-black';
      case 'Suka Retur':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-bold';
      case 'Pending Payment':
        return 'bg-orange-100 dark:bg-orange-950/60 text-orange-900 dark:text-orange-300 border-orange-300 dark:border-orange-800 font-bold';
      case 'New Customer':
        return 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800 font-bold';
      case 'Komunitas Trail':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'Fast Payer':
        return 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'paid':
        return 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      case 'shipped':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'pending_payment':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'returned':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'cancelled':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  // Up to 5 most recent orders
  const recentOrders = customer?.orders?.slice(0, 5) || [];
  const latestOrder = recentOrders[0];

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4 sm:p-5 transition-colors">
      <div className="space-y-5">
        {/* 1. Header Profil */}
        <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative inline-block mx-auto mb-2.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 dark:from-slate-800 dark:to-slate-700 text-white font-black text-lg flex items-center justify-center shadow-md border border-slate-700">
              {session.customer_name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <span
              className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold ${pConfig.badgeBg} shadow-2xs`}
            >
              {pConfig.name}
            </span>
          </div>

          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{session.customer_name}</h3>

          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span className="font-mono">{session.customer_phone}</span>
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              {customer?.loyalty_tier || session.loyalty_tier}
            </span>
            <span className="text-[11px] text-slate-400">•</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium capitalize">
              Preferensi: {customer?.preferred_platform || session.platform}
            </span>
          </div>
        </div>

        {/* 2. Customer Intelligence Metrics (LTV & Orders) */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Lifetime Value</span>
            </div>
            <div className="text-sm font-black text-emerald-700 dark:text-emerald-400 truncate">
              {formatRupiah(customer?.lifetime_value || 0)}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              <PackageCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span>Total Pesanan</span>
            </div>
            <div className="text-sm font-black text-slate-800 dark:text-slate-100">
              {customer?.purchase_history_count || 0}x Order
            </div>
          </div>
        </div>

        {/* 3. Automated Tagging Chips */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Tag className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Automated Tags</span>
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Rule-based AI</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {customer?.tags && customer.tags.length > 0 ? (
              customer.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded-lg text-xs border shadow-2xs flex items-center gap-1 ${getTagBadgeStyle(
                    tag
                  )}`}
                >
                  {tag === 'VIP' && <Sparkles className="w-3 h-3 text-amber-600" />}
                  {tag === 'Suka Retur' && <RotateCcw className="w-3 h-3 text-rose-600" />}
                  {tag === 'Pending Payment' && <Clock className="w-3 h-3 text-orange-600" />}
                  <span>{tag}</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500 italic">Belum ada label</span>
            )}
          </div>
        </div>

        {/* 4. TOMBOL UTAMA: CREATE ORDER */}
        <div>
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>+ Buat Pesanan Manual WhatsApp</span>
          </button>
        </div>

        {/* 5. Status Pesanan Terakhir */}
        {latestOrder && (
          <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Pesanan Terakhir
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                  getPlatformConfig(latestOrder.platform).badgeBg
                }`}
              >
                {latestOrder.platform}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                #{latestOrder.external_order_id}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize border ${getStatusBadgeStyle(
                  latestOrder.status
                )}`}
              >
                {latestOrder.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
              <span>{formatRelativeTime(latestOrder.created_at)}</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatRupiah(latestOrder.total)}</span>
            </div>
          </div>
        )}

        {/* 6. Riwayat 5 Order Terakhir dengan Status Switcher Dropdown */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              5 Riwayat Order Terakhir
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {recentOrders.length} dari {customer?.orders?.length || 0}
            </span>
          </div>

          {loading ? (
            <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">Memuat riwayat...</div>
          ) : recentOrders.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
              Belum ada riwayat order
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[11px] text-slate-800 dark:text-slate-200">
                      #{ord.external_order_id}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {formatRelativeTime(ord.created_at)}
                    </span>
                  </div>

                  {/* Items summary */}
                  {ord.items && ord.items.length > 0 && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1">
                      {ord.items.map((i: any) => `${i.product_name} (${i.size}) x${i.qty}`).join(', ')}
                    </div>
                  )}

                  {/* Price & Dropdown Status */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{formatRupiah(ord.total)}</span>

                    {/* Status Changer Dropdown */}
                    <div className="relative">
                      <select
                        value={ord.status}
                        disabled={updatingOrderId === ord.id}
                        onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                        className={`text-[10px] font-bold py-0.5 px-2 pr-5 rounded-md border appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 capitalize ${getStatusBadgeStyle(
                          ord.status
                        )}`}
                      >
                        <option value="paid">paid</option>
                        <option value="pending_payment">pending payment</option>
                        <option value="shipped">shipped</option>
                        <option value="completed">completed</option>
                        <option value="returned">returned</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                      <ChevronDown className="w-2.5 h-2.5 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Buat Pesanan */}
      <CreateOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        customer={customer}
        onOrderCreated={(newOrder) => {
          if (session.customer_id) {
            loadCustomerData(session.customer_id);
          }
          if (onOrderCreated) {
            onOrderCreated(newOrder);
          }
        }}
      />
    </div>
  );
};

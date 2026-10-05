import React, { useState, useEffect } from 'react';
import type { Customer, Product } from '../types';
import { fetchProducts, createManualOrder } from '../services/api';
import { formatRupiah } from '../utils/formatters';
import { X, ShoppingCart, Plus, Trash2, AlertTriangle, CheckCircle2, User, Phone } from 'lucide-react';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onOrderCreated: (order: any) => void;
}

interface OrderItemInput {
  productId: number;
  variantId: number;
  qty: number;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  customer,
  onOrderCreated,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItemInput[]>([]);
  const [orderStatus, setOrderStatus] = useState<string>('paid');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setLoadingProducts(true);
      fetchProducts()
        .then((data) => {
          setProducts(data);
          if (data.length > 0 && data[0].variants.length > 0) {
            setOrderItems([
              {
                productId: data[0].id,
                variantId: data[0].variants[0].id,
                qty: 1,
              },
            ]);
          }
        })
        .catch((err) => {
          console.error(err);
          setErrorMessage('Gagal memuat katalog produk');
        })
        .finally(() => setLoadingProducts(false));
    }
  }, [isOpen]);

  if (!isOpen || !customer) return null;

  const handleAddItem = () => {
    if (products.length > 0 && products[0].variants.length > 0) {
      setOrderItems((prev) => [
        ...prev,
        {
          productId: products[0].id,
          variantId: products[0].variants[0].id,
          qty: 1,
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems((prev) => prev.filter((_, idx) => idx !== index));
    }
  };

  const handleProductChange = (index: number, newProductId: number) => {
    const prod = products.find((p) => p.id === newProductId);
    if (!prod || prod.variants.length === 0) return;

    setOrderItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        productId: newProductId,
        variantId: prod.variants[0].id,
        qty: 1,
      };
      return copy;
    });
  };

  const handleVariantChange = (index: number, newVariantId: number) => {
    setOrderItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        variantId: newVariantId,
      };
      return copy;
    });
  };

  const handleQtyChange = (index: number, newQty: number) => {
    const safeQty = Math.max(1, newQty);
    setOrderItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        qty: safeQty,
      };
      return copy;
    });
  };

  // Calculate items summary and check available stock
  let hasStockError = false;
  let totalAmount = 0;

  const itemsSummary = orderItems.map((item) => {
    const prod = products.find((p) => p.id === item.productId);
    const variant = prod?.variants.find((v) => v.id === item.variantId);

    const price = variant?.price || 0;
    const subtotal = price * item.qty;
    totalAmount += subtotal;

    // Minimum stock across all platform channels
    let minChannelStock = 99999;
    if (variant && variant.channels) {
      variant.channels.forEach((ch) => {
        if (ch.stock < minChannelStock) {
          minChannelStock = ch.stock;
        }
      });
    } else {
      minChannelStock = 0;
    }

    const isOutOfStock = minChannelStock < item.qty;
    if (isOutOfStock) hasStockError = true;

    return {
      ...item,
      product: prod,
      variant,
      price,
      subtotal,
      minChannelStock,
      isOutOfStock,
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderItems.length === 0 || hasStockError || submitting) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        customer_id: customer.id,
        status: orderStatus,
        items: orderItems.map((it) => ({
          variant_id: it.variantId,
          qty: it.qty,
        })),
      };

      const result = await createManualOrder(payload);
      setSuccessMessage('Pesanan WhatsApp berhasil dibuat dan dikonfirmasi!');
      onOrderCreated(result);

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal membuat pesanan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Buat Pesanan Manual WhatsApp</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Order langsung diproses dan memotong stok di semua platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Pre-filled Card */}
        <div className="px-6 py-3 bg-emerald-50/50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{customer.name}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
              Pelanggan Terisi
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>{customer.phone_number}</span>
          </div>
        </div>

        {/* Error / Success Banners */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Item Pesanan
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Item</span>
              </button>
            </div>

            {loadingProducts ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">Memuat produk...</div>
            ) : orderItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                Belum ada produk yang dipilih. Klik "Tambah Item".
              </div>
            ) : (
              itemsSummary.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all ${
                    item.isOutOfStock
                      ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/40 ring-1 ring-rose-200 dark:ring-rose-800'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80'
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                    {/* Product Selector */}
                    <div className="sm:col-span-5">
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                        Produk
                      </label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductChange(idx, Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Variant Selector */}
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                        Varian & Warna
                      </label>
                      <select
                        value={item.variantId}
                        onChange={(e) => handleVariantChange(idx, Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {products
                          .find((p) => p.id === item.productId)
                          ?.variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.color} - {v.size} (Stok: {v.total_stock})
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Qty & Remove */}
                    <div className="sm:col-span-3 flex items-center justify-between gap-2">
                      <div className="w-20">
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                          Qty
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={item.qty}
                          onChange={(e) => handleQtyChange(idx, Number(e.target.value))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-bold text-slate-900 dark:text-white text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="pt-4">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={orderItems.length <= 1}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-30 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Hapus baris"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stock Alert or Subtotal */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
                    {item.isOutOfStock ? (
                      <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                        <AlertTriangle className="w-3 h-3" />
                        Stok tidak cukup! Minimal kanal: {item.minChannelStock} pcs, diminta: {item.qty}
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Harga satuan: {formatRupiah(item.price)} (Stok aman: {item.minChannelStock} pcs)
                      </span>
                    )}
                    <span className="font-bold text-slate-900 dark:text-white">{formatRupiah(item.subtotal)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Status Selector & Total Summary */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Status Pembayaran Awal
                </label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="paid">PAID (Lunas via Transfer)</option>
                  <option value="pending_payment">PENDING PAYMENT (Menunggu Transfer)</option>
                </select>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Pesanan</span>
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">{formatRupiah(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || hasStockError || orderItems.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{submitting ? 'Memproses...' : 'Konfirmasi & Buat Pesanan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

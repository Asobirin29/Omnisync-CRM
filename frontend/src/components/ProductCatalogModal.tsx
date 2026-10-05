import React, { useState, useEffect } from 'react';
import { X, Search, ShoppingBag, Send, AlertTriangle } from 'lucide-react';
import type { Product, ProductVariant } from '../types';
import { fetchProducts } from '../services/api';
import { formatRupiah } from '../utils/formatters';

interface ProductCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendProductCard: (cardPayload: string) => void;
}

export const ProductCatalogModal: React.FC<ProductCatalogModalProps> = ({
  isOpen,
  onClose,
  onSendProductCard,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchProducts()
        .then((data) => {
          setProducts(data);
          if (data.length > 0) {
            setSelectedProduct(data[0]);
            setSelectedVariant(data[0].variants[0] || null);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.variants.some((v) => v.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setSelectedVariant(prod.variants[0] || null);
  };

  const handleSend = () => {
    if (!selectedProduct || !selectedVariant) return;

    // Send formatted structured product card tag
    const payload = `[PRODUK_KATALOG]${JSON.stringify({
      name: selectedProduct.name,
      category: selectedProduct.category,
      color: selectedVariant.color,
      size: selectedVariant.size,
      price: selectedVariant.price,
      sku: selectedVariant.sku,
    })}`;

    onSendProductCard(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Katalog Produk & Stok</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pilih varian untuk dibagikan sebagai kartu produk ke chat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Cari jaket, fleece, carrier, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Content: 2 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 h-[380px] divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {/* Left: Product list */}
          <div className="overflow-y-auto p-3 space-y-1.5">
            {loading ? (
              <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">Memuat katalog produk...</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">Produk tidak ditemukan</div>
            ) : (
              filtered.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => handleSelectProduct(prod)}
                  className={`w-full text-left p-3 rounded-xl transition-all border cursor-pointer ${
                    selectedProduct?.id === prod.id
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-500 dark:border-emerald-500 shadow-2xs'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                    {prod.category}
                  </span>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mt-1 line-clamp-1">{prod.name}</h4>
                  <div className="flex items-center justify-between mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>{prod.variants.length} Varian</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatRupiah(prod.variants[0]?.price || 0)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Right: Variant selector & preview */}
          <div className="overflow-y-auto p-4 flex flex-col justify-between bg-slate-50/30 dark:bg-slate-900/60">
            {selectedProduct ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{selectedProduct.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{selectedProduct.description}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Pilih Varian (Ukuran & Warna)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProduct.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                          selectedVariant?.id === v.id
                            ? 'bg-white dark:bg-slate-800 border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{v.color}</div>
                        <div className="text-slate-500 dark:text-slate-400 mt-0.5 flex justify-between">
                          <span>Size: {v.size}</span>
                          <span
                            className={`font-semibold ${
                              v.total_stock <= 5 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            Stok: {v.total_stock}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedVariant && (
                  <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Harga Satuan</span>
                      <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(selectedVariant.price)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-700 pt-2 text-slate-500 dark:text-slate-400">
                      <span>SKU</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">{selectedVariant.sku}</span>
                    </div>
                    {selectedVariant.total_stock <= 5 && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 p-2 rounded-lg border border-amber-200 dark:border-amber-800">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>Stok menipis! Total sisa {selectedVariant.total_stock} pcs lintas channel.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">Pilih produk di sisi kiri</div>
            )}

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
              <button
                disabled={!selectedVariant}
                onClick={handleSend}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-xs transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Kartu Produk ke Chat</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Search, Check, Send, Sparkles } from 'lucide-react';

interface QuickRepliesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (text: string, sendImmediately?: boolean) => void;
}

interface TemplateItem {
  id: string;
  title: string;
  category: string;
  text: string;
}

const TEMPLATES: TemplateItem[] = [
  {
    id: 'stok-tersedia',
    title: 'Stok Tersedia',
    category: 'Produk & Stok',
    text: 'Halo Kak! Produk yang ditanyakan masih ready stok ya kak. Silakan langsung dicheckout sebelum kehabisan karena perputaran stok toko kami cukup cepat.'
  },
  {
    id: 'jam-operasional',
    title: 'Jam Operasional & Pengiriman',
    category: 'Layanan Toko',
    text: 'Halo! Jam operasional CS Rancaekek Supply Co. aktif setiap hari pukul 08.00 - 21.00 WIB. Pesanan yang terverifikasi sebelum jam 15.00 WIB akan dikirim pada hari yang sama ya kak.'
  },
  {
    id: 'konfirmasi-pesanan',
    title: 'Konfirmasi Pesanan Diterima',
    category: 'Transaksi',
    text: 'Terima kasih banyak atas pesanannya Kak! Pesanan Kakak sudah kami terima dan sedang disiapkan oleh tim gudang untuk proses packing aman.'
  },
  {
    id: 'info-pengiriman',
    title: 'Info Pengiriman & Nomor Resi',
    category: 'Ekspedisi',
    text: 'Paket pesanan Anda sudah diserahkan ke kurir ekspedisi. Status pengiriman dan nomor resi akan otomatis terupdate di aplikasi malam ini sekitar pukul 20.00 WIB.'
  },
  {
    id: 'terima-kasih',
    title: 'Terima Kasih & Salam Lestari',
    category: 'Penutup',
    text: 'Sama-sama Kak! Terima kasih telah berbelanja di Rancaekek Supply Co. Jika ada kendala atau pertanyaan lain mengenai perlengkapan hiking, jangan ragu untuk chat kembali. Salam lestari! 🌲'
  },
  {
    id: 'panduan-ukuran',
    title: 'Panduan Ukuran (Size Chart)',
    category: 'Produk & Stok',
    text: 'Untuk panduan ukuran jaket & celana hiking kami: Tinggi 160-170cm (BB 55-65kg) disarankan Size M; Tinggi 170-180cm (BB 65-75kg) disarankan Size L; Tinggi >175cm (BB >75kg) disarankan Size XL ya kak.'
  }
];

export const QuickRepliesModal: React.FC<QuickRepliesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = TEMPLATES.filter(
    (t) =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (text: string, id: string, sendImmediately = false) => {
    setCopiedId(id);
    onSelectTemplate(text, sendImmediately);
    setTimeout(() => {
      onClose();
      setCopiedId(null);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Template Balasan Cepat</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pilih template pesan untuk respon CS kilat</p>
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
              placeholder="Cari template jawaban..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* Templates list */}
        <div className="max-h-[380px] overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
              Tidak ada template yang cocok dengan "{searchTerm}"
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="group p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all bg-white dark:bg-slate-800 shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-white text-sm">{item.title}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {item.category}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 mb-3">
                  "{item.text}"
                </p>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => handleSelect(item.text, item.id, false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Dimasukkan</span>
                      </>
                    ) : (
                      <span>Gunakan di Input</span>
                    )}
                  </button>
                  <button
                    onClick={() => handleSelect(item.text, item.id, true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Langsung</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

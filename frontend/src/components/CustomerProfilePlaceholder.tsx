import React from 'react';
import type { ChatSession } from '../types';
import { getPlatformConfig } from '../utils/formatters';
import { User, Phone, Tag, ShoppingCart, Sparkles, Clock } from 'lucide-react';

interface CustomerProfilePlaceholderProps {
  session: ChatSession | null;
}

export const CustomerProfilePlaceholder: React.FC<CustomerProfilePlaceholderProps> = ({ session }) => {
  if (!session) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-white border-l border-slate-200">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <User className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-slate-800 text-sm">Profil Pelanggan</h4>
        <p className="text-xs text-slate-400 max-w-[200px] mt-1">
          Pilih salah satu percakapan di kolom kiri untuk melihat profil pelanggan.
        </p>
      </div>
    );
  }

  const pConfig = getPlatformConfig(session.platform);

  return (
    <div className="h-full overflow-y-auto bg-white border-l border-slate-200 flex flex-col justify-between p-5">
      <div className="space-y-6">
        {/* Customer Header Card */}
        <div className="text-center pb-5 border-b border-slate-100">
          <div className="relative inline-block mx-auto mb-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-600 text-white font-black text-xl flex items-center justify-center shadow-md">
              {session.customer_name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <span
              className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${pConfig.badgeBg} shadow-xs`}
            >
              {pConfig.name}
            </span>
          </div>

          <h3 className="font-extrabold text-slate-900 text-base">{session.customer_name}</h3>

          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mt-1">
            <Phone className="w-3.5 h-3.5" />
            <span className="font-mono">{session.customer_phone}</span>
          </div>

          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-amber-50 text-amber-700 border border-amber-200">
              {session.loyalty_tier} Member
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                session.status === 'open'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {session.status}
            </span>
          </div>
        </div>

        {/* Customer Tags */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
            <Tag className="w-3.5 h-3.5 text-emerald-600" />
            <span>Label & Minat Pelanggan</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {session.customer_tags && session.customer_tags.length > 0 ? (
              session.customer_tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                >
                  #{tag}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">Belum ada label khusus</span>
            )}
          </div>
        </div>

        {/* Placeholder Tahap 4: Order History & Manual Order */}
        <div className="space-y-3 pt-2">
          <div className="p-4 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 text-left">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-1">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Modul Tahap 4: Riwayat Order 360°</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Daftar seluruh pesanan pelanggan ini di Shopee, Tokopedia, Lazada, Blibli, dan WhatsApp akan ditampilkan di sini pada tahap berikutnya.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-left">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs mb-1">
              <ShoppingCart className="w-4 h-4 text-slate-600" />
              <span>Modul Tahap 4: Buat Pesanan Manual WA</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Form pemesanan manual dari chat WhatsApp (pilih produk, hitung ongkir otomatis, simpan ke database) akan diaktifkan di sini.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>ID Pelanggan #{session.customer_id}</span>
        </span>
        <span>OmniSync 360° Profile</span>
      </div>
    </div>
  );
};

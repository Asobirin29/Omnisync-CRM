import React, { useState } from 'react';
import { X, Truck, Send, MapPin, Scale } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

interface ShippingCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendShippingQuote: (quoteText: string) => void;
}

interface CourierRate {
  courier: string;
  service: string;
  etd: string;
  cost: number;
}

const DESTINATION_CITIES = [
  'Jakarta Selatan, DKI Jakarta',
  'Bandung, Jawa Barat',
  'Surabaya, Jawa Timur',
  'Semarang, Jawa Tengah',
  'Yogyakarta, DI Yogyakarta',
  'Malang, Jawa Timur',
  'Medan, Sumatera Utara',
  'Denpasar, Bali',
  'Makassar, Sulawesi Selatan',
  'Palembang, Sumatera Selatan',
];

export const ShippingCalculatorModal: React.FC<ShippingCalculatorModalProps> = ({
  isOpen,
  onClose,
  onSendShippingQuote,
}) => {
  const [destination, setDestination] = useState('Jakarta Selatan, DKI Jakarta');
  const [weightKg, setWeightKg] = useState<number>(1);

  if (!isOpen) return null;

  // Base shipping multipliers based on destination and weight
  const getRates = (): CourierRate[] => {
    let baseRate = 12000;
    if (destination.includes('Jakarta') || destination.includes('Bandung')) {
      baseRate = 11000;
    } else if (destination.includes('Surabaya') || destination.includes('Semarang') || destination.includes('Yogyakarta') || destination.includes('Malang')) {
      baseRate = 16000;
    } else if (destination.includes('Bali')) {
      baseRate = 22000;
    } else {
      baseRate = 28000;
    }

    const w = Math.max(1, weightKg);

    return [
      {
        courier: 'JNE',
        service: 'REG (Reguler)',
        etd: '2 - 3 Hari',
        cost: baseRate * w,
      },
      {
        courier: 'JNE',
        service: 'YES (Yakin Esok Sampai)',
        etd: '1 Hari (Besok)',
        cost: Math.round(baseRate * 1.9 * w),
      },
      {
        courier: 'J&T Express',
        service: 'EZ (Standard)',
        etd: '2 - 3 Hari',
        cost: (baseRate + 1000) * w,
      },
      {
        courier: 'SiCepat',
        service: 'SIUNTUNG',
        etd: '2 Hari',
        cost: (baseRate - 1000) * w,
      },
      {
        courier: 'SiCepat',
        service: 'BEST (Besok Sampai Tujuan)',
        etd: '1 Hari (Besok)',
        cost: Math.round(baseRate * 1.8 * w),
      },
    ];
  };

  const rates = getRates();

  const handleSend = () => {
    const lines = [
      `📦 ESTIMASI ONGKIR (Asal: Gudang Rancaekek Bandung)`,
      `📍 Tujuan: ${destination}`,
      `⚖️ Berat: ${weightKg} kg`,
      `---------------------------------`,
      ...rates.map(
        (r) => `• ${r.courier} ${r.service} (${r.etd}): ${formatRupiah(r.cost)}`
      ),
      `---------------------------------`,
      `Pemberitahuan: Estimasi ongkir dapat berubah sewaktu-waktu sesuai ketentuan ekspedisi.`
    ];

    onSendShippingQuote(lines.join('\n'));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Cek Estimasi Ongkos Kirim</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hitung tarif kurir ekspedisi dari gudang Rancaekek</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Kota Tujuan</span>
            </label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {DESTINATION_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Berat Paket (Kg)</span>
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={weightKg}
              onChange={(e) => setWeightKg(Math.max(1, Number(e.target.value) || 1))}
              className="w-full py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Results Comparison List */}
        <div className="max-h-[300px] overflow-y-auto p-4 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Perbandingan Tarif 3 Ekspedisi (JNE, J&T, SiCepat)
          </div>
          {rates.map((r, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 dark:text-white text-xs">{r.courier}</span>
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">{r.service}</span>
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Estimasi: {r.etd}</div>
              </div>
              <div className="text-right">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">{formatRupiah(r.cost)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Action */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">Asal: Rancaekek, Kab. Bandung</span>
          <button
            onClick={handleSend}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim Ringkasan ke Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
};

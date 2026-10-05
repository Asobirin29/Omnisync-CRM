import React, { useState } from 'react';
import type { Platform, Customer } from '../../types';
import { getPlatformConfig } from '../../utils/formatters';
import { sendMockMessage } from '../../services/api';
import {
  MessageSquare,
  Sparkles,
  Zap,
  Send,
  RefreshCw,
} from 'lucide-react';

const REALISTIC_INDONESIAN_QUERIES = [
  'Kak, jaket gunung Rinjani Waterproof ini ready ukuran L warna Navy?',
  'Pesanan saya di Shopee no resi JP82910 kok belum bergerak ya dari Bandung?',
  'Tas carrier Merbabu 60L muat untuk tenda kap 4 orang sama matras gak kak?',
  'Bisa COD gak min untuk pengiriman ke Garut Jawa Barat?',
  'Kaos quick dry bahan dry-fit nya adem gak buat lari trail running?',
  'Kak mau tukar ukuran celana cargo hiking, kemarin salah pilih size M kekecilan.',
  'Min, celana cargo nya ada saku waterproof gak untuk simpan HP waktu hujan?',
  'Halo admin, ada voucher diskon atau gratis ongkir untuk order hari ini?',
  'Kak, sarung tangan polar windproof ini aman gak buat suhu 5 derajat di Semeru?',
  'Saya sudah transfer lewat BCA min, tolong dicek pembayarannya ya.',
  'Topi rimba nya ada tali pengencang dagu gak kak biar gak terbang kena angin?',
  'Min, ini barangnya original buatan Rancaekek Supply Co. kan? Ada garansi resleting?',
  'Kak paket saya belum sampai, padahal estimasi kemarin harusnya udah tiba.',
  'Ada rekomendasi jaket yang cocok buat summit attack di Bromo?',
  'Bisa kirim hari ini pakai kurir instan Gosend/GrabExpress gak kak?',
  'Min, kalau beli 3 pcs kaos quick-dry dapat potongan harga grosir gak?',
];

interface MessageSimulatorProps {
  customers: Customer[];
  onRefreshAll?: () => void;
}

export const MessageSimulator: React.FC<MessageSimulatorProps> = ({
  customers,
  onRefreshAll,
}) => {
  const [msgPlatform, setMsgPlatform] = useState<Platform>('tokopedia');
  const [msgCustName, setMsgCustName] = useState('Siti Nurhaliza');
  const [msgCustPhone, setMsgCustPhone] = useState('081298765432');
  const [msgBody, setMsgBody] = useState(REALISTIC_INDONESIAN_QUERIES[0]);
  const [msgUrgency, setMsgUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgResult, setMsgResult] = useState<{
    latency_ms: number;
    payload: any;
    response: any;
    status: number;
  } | null>(null);

  const handleSelectMsgCustomer = (custId: string) => {
    const c = customers.find((cust) => cust.id.toString() === custId);
    if (c) {
      setMsgCustName(c.name);
      setMsgCustPhone(c.phone_number);
    }
  };

  const handlePickRandomMessage = () => {
    const rand = REALISTIC_INDONESIAN_QUERIES[Math.floor(Math.random() * REALISTIC_INDONESIAN_QUERIES.length)];
    setMsgBody(rand);
  };

  const handleSendMessage = async () => {
    if (!msgBody.trim()) return;
    setMsgLoading(true);

    const payload = {
      customer: {
        name: msgCustName.trim() || 'Pelanggan Demo',
        phone: msgCustPhone.trim() || '081298765432',
      },
      message: msgBody.trim(),
      urgency: msgUrgency,
    };

    const t0 = performance.now();
    try {
      const res = await sendMockMessage(msgPlatform, payload.customer, payload.message, payload.urgency);
      const latency = Math.round(performance.now() - t0);

      setMsgResult({
        latency_ms: latency,
        payload,
        response: res,
        status: 201,
      });

      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      const latency = Math.round(performance.now() - t0);
      setMsgResult({
        latency_ms: latency,
        payload,
        response: { error: err.message || 'Network error' },
        status: 500,
      });
    } finally {
      setMsgLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between space-y-5">
      <div className="space-y-4">
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Simulasi Pesan Masuk</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">POST /api/webhooks/:platform/message</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
            Unified Inbox
          </span>
        </div>

        {/* Platform Selector Buttons */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Pilih Saluran / Platform:</label>
          <div className="grid grid-cols-5 gap-2">
            {(['shopee', 'tokopedia', 'lazada', 'blibli', 'whatsapp'] as Platform[]).map((p) => {
              const pConfig = getPlatformConfig(p);
              const isSelected = msgPlatform === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setMsgPlatform(p)}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 shadow-xs'
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
                onChange={(e) => handleSelectMsgCustomer(e.target.value)}
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
              placeholder="Nama Pengirim"
              value={msgCustName}
              onChange={(e) => setMsgCustName(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <input
              type="text"
              placeholder="Nomor Telepon"
              value={msgCustPhone}
              onChange={(e) => setMsgCustPhone(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
          </div>
        </div>

        {/* Message Textarea & Random Prompt Picker */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Isi Pesan Pelanggan:</label>
            <button
              type="button"
              onClick={handlePickRandomMessage}
              className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 px-2 py-0.5 rounded-md transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800"
            >
              <Sparkles className="w-3 h-3" />
              <span>Pilih Acak (16+ Contoh)</span>
            </button>
          </div>

          <textarea
            rows={3}
            value={msgBody}
            onChange={(e) => setMsgBody(e.target.value)}
            placeholder="Tulis pertanyaan atau keluhan pelanggan..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none leading-relaxed"
          />
        </div>

        {/* Urgency Level */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300">Tingkat Urgensi:</span>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            {(['low', 'medium', 'high'] as const).map((urg) => (
              <label key={urg} className="flex items-center gap-1 cursor-pointer capitalize">
                <input
                  type="radio"
                  name="msgUrgency"
                  value={urg}
                  checked={msgUrgency === urg}
                  onChange={() => setMsgUrgency(urg)}
                  className="text-emerald-600"
                />
                <span>{urg}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Message Action Button */}
      <div className="space-y-4 pt-2">
        <button
          onClick={handleSendMessage}
          disabled={msgLoading || !msgBody.trim()}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          {msgLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Meneruskan Pesan ke Unified Inbox...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Kirim Webhook Pesan Masuk</span>
            </>
          )}
        </button>

        {/* Message Result: Latency Badge & JSON Response */}
        {msgResult && (
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="p-3 rounded-xl border bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold">
                <Zap className="w-4 h-4" />
                <span>Latensi Pengiriman Pesan: {msgResult.latency_ms} ms</span>
              </div>
              <span className="font-black text-[11px] px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100">
                ⚡ Masuk ke Inbox
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Payload Dikirim:</span>
                <pre className="p-2 bg-slate-900 text-emerald-400 rounded-lg overflow-x-auto max-h-36 font-mono text-[10px] border border-slate-800">
                  {JSON.stringify(msgResult.payload, null, 2)}
                </pre>
              </div>
              <div>
                <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Response API:</span>
                <pre className="p-2 bg-slate-900 text-slate-200 rounded-lg overflow-x-auto max-h-36 font-mono text-[10px] border border-slate-800">
                  {JSON.stringify(msgResult.response, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

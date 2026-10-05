import { useState, useEffect, useRef } from 'react';
import type { Platform, Product, Customer } from '../types';
import { fetchProducts, fetchCustomers, sendMockOrder, sendMockMessage } from '../services/api';

const SAMPLE_REALISTIC_QUERIES = [
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

export interface SimLogEntry {
  id: number;
  time: string;
  type: 'ORDER' | 'CHAT';
  platform: string;
  detail: string;
  latency_ms: number;
  status: number;
}

export function useAutoSimulation() {
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const [autoSimLogs, setAutoSimLogs] = useState<SimLogEntry[]>([]);
  const autoSimTimerRef = useRef<any>(null);
  const simProductsRef = useRef<Product[]>([]);
  const simCustomersRef = useRef<Customer[]>([]);

  // Cache products and customers for auto simulation
  useEffect(() => {
    Promise.all([fetchProducts(), fetchCustomers()])
      .then(([prods, custs]) => {
        simProductsRef.current = prods;
        simCustomersRef.current = custs;
      })
      .catch((err) => console.error('Failed to pre-cache simulation data:', err));
  }, []);

  // Auto Simulation Engine Loop (Every 6-8 seconds)
  useEffect(() => {
    if (!isAutoSimulating) {
      if (autoSimTimerRef.current) {
        clearInterval(autoSimTimerRef.current);
        autoSimTimerRef.current = null;
      }
      return;
    }

    const runSimulationStep = async () => {
      const platforms: Platform[] = ['shopee', 'tokopedia', 'lazada', 'blibli', 'whatsapp'];
      const chosenPlatform = platforms[Math.floor(Math.random() * platforms.length)];

      const prods = simProductsRef.current;
      const custs = simCustomersRef.current;

      // Extract all SKUs
      const availableSkus: string[] = [];
      prods.forEach((p) => {
        p.variants.forEach((v) => {
          availableSkus.push(v.sku);
        });
      });

      // 50% chance: Random Order, 50% chance: Random Message
      const isOrder = Math.random() > 0.45;

      const randomCust =
        custs.length > 0
          ? custs[Math.floor(Math.random() * custs.length)]
          : { name: 'Pelanggan Rancaekek', phone_number: '081234567890' };

      const timeStr = new Date().toLocaleTimeString('id-ID', { hour12: false });
      const t0 = performance.now();

      if (isOrder && availableSkus.length > 0) {
        // Fire simulated order webhook
        const sku = availableSkus[Math.floor(Math.random() * availableSkus.length)];
        const extId = `AUTO-${chosenPlatform.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-5)}`;
        const payload = {
          external_order_id: extId,
          customer: {
            name: randomCust.name,
            phone: randomCust.phone_number,
          },
          items: [{ sku, qty: 1 }],
          status: 'paid',
        };

        try {
          const res = await sendMockOrder(chosenPlatform, payload);
          const latency = Math.round(performance.now() - t0);
          const newLog: SimLogEntry = {
            id: Date.now() + Math.random(),
            time: timeStr,
            type: 'ORDER',
            platform: chosenPlatform,
            detail: `Order ${extId} (${sku} x1) oleh ${randomCust.name}`,
            latency_ms: latency,
            status: res.status,
          };
          setAutoSimLogs((prev) => [newLog, ...prev.slice(0, 49)]);
        } catch (err: any) {
          const latency = Math.round(performance.now() - t0);
          const newLog: SimLogEntry = {
            id: Date.now() + Math.random(),
            time: timeStr,
            type: 'ORDER',
            platform: chosenPlatform,
            detail: `Order ${extId} gagal: ${err.message}`,
            latency_ms: latency,
            status: 409,
          };
          setAutoSimLogs((prev) => [newLog, ...prev.slice(0, 49)]);
        }
      } else {
        // Fire simulated message webhook
        const query =
          SAMPLE_REALISTIC_QUERIES[Math.floor(Math.random() * SAMPLE_REALISTIC_QUERIES.length)];
        const urgencies: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
        const urg = urgencies[Math.floor(Math.random() * urgencies.length)];

        try {
          await sendMockMessage(
            chosenPlatform,
            { name: randomCust.name, phone: randomCust.phone_number },
            query,
            urg
          );
          const latency = Math.round(performance.now() - t0);
          const newLog: SimLogEntry = {
            id: Date.now() + Math.random(),
            time: timeStr,
            type: 'CHAT',
            platform: chosenPlatform,
            detail: `"${query.slice(0, 40)}..." oleh ${randomCust.name}`,
            latency_ms: latency,
            status: 201,
          };
          setAutoSimLogs((prev) => [newLog, ...prev.slice(0, 49)]);
        } catch (err: any) {
          const latency = Math.round(performance.now() - t0);
          const newLog: SimLogEntry = {
            id: Date.now() + Math.random(),
            time: timeStr,
            type: 'CHAT',
            platform: chosenPlatform,
            detail: `Pesan gagal: ${err.message}`,
            latency_ms: latency,
            status: 500,
          };
          setAutoSimLogs((prev) => [newLog, ...prev.slice(0, 49)]);
        }
      }
    };

    // Run first step after 1s, then every 7s
    const initialTimeout = setTimeout(runSimulationStep, 1000);
    const interval = setInterval(runSimulationStep, 7000);
    autoSimTimerRef.current = interval;

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      autoSimTimerRef.current = null;
    };
  }, [isAutoSimulating]);

  const toggleAutoSim = () => setIsAutoSimulating((prev) => !prev);
  const clearLogs = () => setAutoSimLogs([]);

  return {
    isAutoSimulating,
    autoSimLogs,
    toggleAutoSim,
    clearLogs,
  };
}

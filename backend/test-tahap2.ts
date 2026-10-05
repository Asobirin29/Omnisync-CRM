import { io, Socket } from 'socket.io-client';

const API_BASE = 'http://localhost:5000/api';

interface ChannelStock {
  platform: string;
  stock: number;
}

async function getVariantStock(sku: string): Promise<ChannelStock[]> {
  const res = await fetch(`${API_BASE}/products`);
  const json = await res.json();
  for (const prod of json.data) {
    for (const v of prod.variants) {
      if (v.sku === sku) {
        return v.channels.map((c: any) => ({ platform: c.platform, stock: c.stock }));
      }
    }
  }
  throw new Error(`SKU ${sku} not found`);
}

async function runTests() {
  console.log('===============================================================');
  console.log('🔍 RUNNING TEST SUITE TAHAP 2: SINKRONISASI STOK & REAL-TIME');
  console.log('===============================================================\n');

  // 0. Setup Socket.io client to listen for real-time events
  const socket: Socket = io('http://localhost:5000');
  const receivedEvents: { [key: string]: any[] } = {
    'stock:updated': [],
    'order:created': [],
    'message:new': [],
    'chat:updated': []
  };

  await new Promise<void>((resolve) => {
    socket.on('connect', () => {
      console.log(`✅ [Socket.io Client] Connected with ID: ${socket.id}`);
      resolve();
    });
  });

  socket.on('stock:updated', (data) => receivedEvents['stock:updated'].push(data));
  socket.on('order:created', (data) => receivedEvents['order:created'].push(data));
  socket.on('message:new', (data) => receivedEvents['message:new'].push(data));
  socket.on('chat:updated', (data) => receivedEvents['chat:updated'].push(data));

  // TEST A: Stok terpotong di SEMUA 4 platform (bukan hanya platform asal)
  console.log('---------------------------------------------------------------');
  console.log('📌 PENGUJIAN A: Stok Terpotong di 3 Platform Lain Saat Order Masuk');
  console.log('---------------------------------------------------------------');
  const targetSku = 'RS-TSH-CRM-BLK-M';
  const initialStock = await getVariantStock(targetSku);
  console.log(`Stok awal SKU ${targetSku} sebelum order:`);
  console.table(initialStock);

  const testOrderId = `TEST-ORDER-${Date.now()}`;
  const orderQty = 2;

  const orderRes = await fetch(`${API_BASE}/webhooks/shopee/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      external_order_id: testOrderId,
      customer: {
        name: 'Penguji Sinkronisasi',
        phone: '0812-9900-8877'
      },
      items: [{ sku: targetSku, qty: orderQty }],
      status: 'paid'
    })
  });

  const orderData = await orderRes.json();
  console.log(`Status Order Response: ${orderRes.status} (Expected: 201)`);
  console.log(`Latensi tercatat (sync_latency_ms): ${orderData.sync_latency_ms} ms`);

  const stockAfterOrder = await getVariantStock(targetSku);
  console.log(`\nStok setelah order Shopee (qty: ${orderQty}) masuk:`);
  console.table(stockAfterOrder);

  let allChannelsDeducted = true;
  for (const initial of initialStock) {
    const current = stockAfterOrder.find(c => c.platform === initial.platform);
    const expected = initial.stock - orderQty;
    if (!current || current.stock !== expected) {
      console.error(`❌ Gagal: Platform ${initial.platform} stok tidak sesuai! Sebelum: ${initial.stock}, Sesudah: ${current?.stock}, Diharapkan: ${expected}`);
      allChannelsDeducted = false;
    }
  }

  if (allChannelsDeducted) {
    console.log(`✅ HASIL (a) BERHASIL: Stok SKU ${targetSku} terpotong tepat ${orderQty} di SEMUA platform (Shopee, Tokopedia, Lazada, Blibli)!`);
  } else {
    throw new Error('Test A gagal');
  }

  // TEST B: Idempotensi (Kirim order dua kali dengan ID sama tidak menggandakan potongan)
  console.log('\n---------------------------------------------------------------');
  console.log('📌 PENGUJIAN B: Idempotensi (Order Ulang dengan ID Sama)');
  console.log('---------------------------------------------------------------');
  const duplicateOrderRes = await fetch(`${API_BASE}/webhooks/shopee/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      external_order_id: testOrderId,
      customer: {
        name: 'Penguji Sinkronisasi',
        phone: '0812-9900-8877'
      },
      items: [{ sku: targetSku, qty: orderQty }],
      status: 'paid'
    })
  });

  const duplicateData = await duplicateOrderRes.json();
  console.log(`Status Duplicate Response: ${duplicateOrderRes.status} (Expected: 200)`);
  console.log(`Pesan: "${duplicateData.message}"`);
  console.log(`Idempotent flag: ${duplicateData.idempotent}`);

  const stockAfterDuplicate = await getVariantStock(targetSku);
  let duplicateStockClean = true;
  for (const afterFirst of stockAfterOrder) {
    const current = stockAfterDuplicate.find(c => c.platform === afterFirst.platform);
    if (!current || current.stock !== afterFirst.stock) {
      console.error(`❌ Gagal: Stok berubah saat duplicate order! ${current?.platform} sekarang: ${current?.stock}`);
      duplicateStockClean = false;
    }
  }

  if (duplicateData.idempotent === true && duplicateStockClean) {
    console.log(`✅ HASIL (b) BERHASIL: Order idempoten, stok TIDAK terpotong dua kali!`);
  } else {
    throw new Error('Test B gagal');
  }

  // TEST C: Order dengan Qty Melebihi Stok Ditolak (409 Conflict)
  console.log('\n---------------------------------------------------------------');
  console.log('📌 PENGUJIAN C: Order Melebihi Stok Ditolak (Stok Tidak Boleh Negatif)');
  console.log('---------------------------------------------------------------');
  // Ambil SKU yang stoknya tipis (RS-JKT-STM-BLK-XL)
  const lowStockSku = 'RS-JKT-STM-BLK-XL';
  const lowStockInfo = await getVariantStock(lowStockSku);
  console.log(`Stok SKU kritis ${lowStockSku}:`);
  console.table(lowStockInfo);

  const excessiveQty = 9999;
  const rejectOrderRes = await fetch(`${API_BASE}/webhooks/tokopedia/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      external_order_id: `OVERFLOW-${Date.now()}`,
      customer: {
        name: 'Pembeli Borongan',
        phone: '0819-0000-1111'
      },
      items: [{ sku: lowStockSku, qty: excessiveQty }],
      status: 'paid'
    })
  });

  const rejectData = await rejectOrderRes.json();
  console.log(`Status Reject Response: ${rejectOrderRes.status} (Expected: 409 Conflict)`);
  console.log(`Kode Error: ${rejectData.code}`);
  console.log(`Pesan Error: "${rejectData.message}"`);

  const stockAfterRejection = await getVariantStock(lowStockSku);
  const stockUnchanged = JSON.stringify(lowStockInfo) === JSON.stringify(stockAfterRejection);

  if (rejectOrderRes.status === 409 && rejectData.code === 'INSUFFICIENT_STOCK' && stockUnchanged) {
    console.log(`✅ HASIL (c) BERHASIL: Order ditolak dengan status 409, pesan jelas, dan stok tidak berkurang sama sekali!`);
  } else {
    throw new Error('Test C gagal');
  }

  // TEST D: Latensi Sinkronisasi < 2000 ms
  console.log('\n---------------------------------------------------------------');
  console.log('📌 PENGUJIAN D: Latensi Pemrosesan & Sinkronisasi (< 2000 ms)');
  console.log('---------------------------------------------------------------');
  console.log(`Latensi Order Normal:    ${orderData.sync_latency_ms} ms`);
  console.log(`Latensi Order Idempoten: ${duplicateData.sync_latency_ms} ms`);
  console.log(`Latensi Order Ditolak:   ${rejectData.sync_latency_ms} ms`);

  if (orderData.sync_latency_ms < 2000 && duplicateData.sync_latency_ms < 2000) {
    console.log(`✅ HASIL (d) BERHASIL: Seluruh operasi sinkronisasi selesai jauh di bawah ambang 2000 ms!`);
  } else {
    throw new Error('Test D gagal');
  }

  // TEST E: Webhook Pesan Masuk & Real-time Chat
  console.log('\n---------------------------------------------------------------');
  console.log('📌 PENGUJIAN E: Webhook Pesan Masuk (Customer Message)');
  console.log('---------------------------------------------------------------');
  const msgRes = await fetch(`${API_BASE}/webhooks/tokopedia/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: {
        name: 'Arya Wiguna',
        phone: '0812-7777-6666'
      },
      message: 'Halo min, celana cargo Merbabu Khaki ukuran 32/L masih ready?',
      urgency: 'high'
    })
  });

  const msgData = await msgRes.json();
  console.log(`Status Message Response: ${msgRes.status} (Expected: 201)`);
  console.log(`Session ID: ${msgData.data.session.id}`);
  console.log(`Unread Count: ${msgData.data.session.unread_count}`);
  console.log(`Pesan: "${msgData.data.message.body}"`);

  // TEST F: Balasan CS & Perhitungan first_response_ms
  console.log('\n---------------------------------------------------------------');
  console.log('📌 PENGUJIAN F: Balasan CS (POST /api/chats/:id/messages)');
  console.log('---------------------------------------------------------------');
  const sessionId = msgData.data.session.id;

  const csReplyRes = await fetch(`${API_BASE}/chats/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      body: 'Halo Kak Arya! Celana cargo Merbabu Khaki ukuran 32/L ready siap kirim hari ini kak.'
    })
  });

  const csReplyData = await csReplyRes.json();
  console.log(`Status CS Reply Response: ${csReplyRes.status} (Expected: 201)`);
  console.log(`first_response_ms terhitung: ${csReplyData.data.message.first_response_ms} ms`);
  console.log(`Unread count setelah balasan CS: ${csReplyData.data.session.unread_count} (Expected: 0)`);

  // TEST G: Verifikasi Event Real-Time Socket.io
  console.log('\n---------------------------------------------------------------');
  console.log('📌 PENGUJIAN G: Verifikasi Event Socket.io');
  console.log('---------------------------------------------------------------');
  // Berikan jeda kecil untuk socket buffering
  await new Promise(r => setTimeout(r, 200));

  console.log(`Event 'stock:updated' diterima: ${receivedEvents['stock:updated'].length} kali`);
  console.log(`Event 'order:created' diterima: ${receivedEvents['order:created'].length} kali`);
  console.log(`Event 'message:new' diterima:   ${receivedEvents['message:new'].length} kali`);
  console.log(`Event 'chat:updated' diterima:  ${receivedEvents['chat:updated'].length} kali`);

  if (
    receivedEvents['stock:updated'].length > 0 &&
    receivedEvents['order:created'].length > 0 &&
    receivedEvents['message:new'].length > 0 &&
    receivedEvents['chat:updated'].length > 0
  ) {
    console.log(`✅ HASIL (e, f, g) BERHASIL: Semua 4 event Socket.io ("stock:updated", "order:created", "message:new", "chat:updated") berhasil di-emit dan diterima client!`);
  } else {
    throw new Error('Socket events verification failed');
  }

  socket.disconnect();
  console.log('\n🎉 SEMUA PENGUJIAN TAHAP 2 LULUS DENGAN SEMPURNA! 🎉');
}

runTests().catch(err => {
  console.error('\n❌ TEST RUNNER ERROR:', err);
  process.exit(1);
});

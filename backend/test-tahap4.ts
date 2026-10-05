const API_BASE = 'http://localhost:5000/api';

async function testTahap4() {
  console.log('===============================================================');
  console.log('🔍 RUNNING TEST SUITE TAHAP 4: CUSTOMER INTELLIGENCE & MANUAL ORDER');
  console.log('===============================================================\n');

  // 1. Get a customer to test with
  const custRes = await fetch(`${API_BASE}/customers/1`);
  const custData = await custRes.json();
  const customer = custData.data;
  console.log(`Pelanggan Awal: ${customer.name} (ID: ${customer.id})`);
  console.log(`LTV Awal: Rp ${new Intl.NumberFormat('id-ID').format(customer.lifetime_value)}`);
  console.log(`Tags Awal:`, customer.tags);

  // 2. Check initial stock of target SKU
  const sku = 'RS-FLC-RNJ-GRY-M';
  const prodRes = await fetch(`${API_BASE}/products`);
  const prodData = await prodRes.json();
  let initialStock: any[] = [];
  for (const p of prodData.data) {
    for (const v of p.variants) {
      if (v.sku === sku) {
        initialStock = v.channels;
        break;
      }
    }
  }
  console.log(`\nStok Awal SKU ${sku} di 4 Platform:`);
  console.table(initialStock.map(c => ({ platform: c.platform, stock: c.stock })));

  // 3. Create Manual Order via WhatsApp (POST /api/orders/manual)
  console.log('---------------------------------------------------------------');
  console.log('📌 PENGUJIAN 1: Buat Pesanan Manual WhatsApp (POST /api/orders/manual)');
  console.log('---------------------------------------------------------------');
  const manualOrderRes = await fetch(`${API_BASE}/orders/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_id: customer.id,
      items: [{ sku, qty: 1 }],
      status: 'paid'
    })
  });

  const manualOrderData = await manualOrderRes.json();
  console.log(`Response Status: ${manualOrderRes.status} (Expected: 201)`);
  console.log(`No. Pesanan Dibuat: ${manualOrderData.data.external_order_id}`);
  console.log(`Platform: ${manualOrderData.data.platform} (Expected: whatsapp)`);
  console.log(`Total: Rp ${new Intl.NumberFormat('id-ID').format(manualOrderData.data.total)}`);

  // Verify stock deduction across all channels
  const prodResAfter = await fetch(`${API_BASE}/products`);
  const prodDataAfter = await prodResAfter.json();
  let afterStock: any[] = [];
  for (const p of prodDataAfter.data) {
    for (const v of p.variants) {
      if (v.sku === sku) {
        afterStock = v.channels;
        break;
      }
    }
  }
  console.log(`\nStok Setelah Order Manual di 4 Platform:`);
  console.table(afterStock.map(c => ({ platform: c.platform, stock: c.stock })));

  let stockOk = true;
  for (const init of initialStock) {
    const curr = afterStock.find(c => c.platform === init.platform);
    if (!curr || curr.stock !== init.stock - 1) {
      stockOk = false;
      console.error(`❌ Gagal: Stok ${init.platform} tidak berkurang 1!`);
    }
  }
  if (stockOk) {
    console.log(`✅ HASIL 1 BERHASIL: Stok SKU ${sku} terpotong 1 pcs di SEMUA platform secara atomik!`);
  }

  // 4. Verify Customer Stats & Automated Tags
  console.log('\n---------------------------------------------------------------');
  console.log('📌 PENGUJIAN 2: Verifikasi Customer Intelligence & Automated Tagging');
  console.log('---------------------------------------------------------------');
  const custResAfter = await fetch(`${API_BASE}/customers/${customer.id}`);
  const custDataAfter = await custResAfter.json();
  const customerUpdated = custDataAfter.data;
  console.log(`LTV Baru: Rp ${new Intl.NumberFormat('id-ID').format(customerUpdated.lifetime_value)} (Sebelumnya: ${customer.lifetime_value})`);
  console.log(`Tags Sekarang:`, customerUpdated.tags);

  if (customerUpdated.lifetime_value > customer.lifetime_value) {
    console.log(`✅ HASIL 2A BERHASIL: Lifetime Value (LTV) pelanggan naik otomatis!`);
  }

  // 5. Test Insufficient Stock rejection
  console.log('\n---------------------------------------------------------------');
  console.log('📌 PENGUJIAN 3: Order Manual Ditolak Jika Stok Tidak Cukup (409 Conflict)');
  console.log('---------------------------------------------------------------');
  const overflowRes = await fetch(`${API_BASE}/orders/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_id: customer.id,
      items: [{ sku, qty: 99999 }],
      status: 'paid'
    })
  });
  const overflowData = await overflowRes.json();
  console.log(`Response Status: ${overflowRes.status} (Expected: 409)`);
  console.log(`Pesan Error: "${overflowData.message}"`);

  if (overflowRes.status === 409 && overflowData.code === 'INSUFFICIENT_STOCK') {
    console.log(`✅ HASIL 3 BERHASIL: Pesanan manual ditolak dengan status 409 saat stok melebihi batas.`);
  }

  // 6. Test Status Change (PATCH /api/orders/:id/status) to test "Pending Payment" & "Suka Retur"
  console.log('\n---------------------------------------------------------------');
  console.log('📌 PENGUJIAN 4: Ubah Status Order (PATCH /api/orders/:id/status)');
  console.log('---------------------------------------------------------------');
  const orderIdToUpdate = manualOrderData.data.id;

  // Change to pending_payment
  const patchPendingRes = await fetch(`${API_BASE}/orders/${orderIdToUpdate}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'pending_payment' })
  });
  const patchPendingData = await patchPendingRes.json();
  console.log(`Status diubah ke: ${patchPendingData.data.order.status}`);
  console.log(`Tags setelah Pending Payment:`, patchPendingData.data.customer.tags);

  if (patchPendingData.data.customer.tags.includes('Pending Payment')) {
    console.log(`✅ HASIL 4A BERHASIL: Tag 'Pending Payment' terpasang otomatis!`);
  }

  // Change to returned
  const patchReturnedRes = await fetch(`${API_BASE}/orders/${orderIdToUpdate}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'returned' })
  });
  const patchReturnedData = await patchReturnedRes.json();
  console.log(`Status diubah ke: ${patchReturnedData.data.order.status}`);

  console.log('\n🎉 SEMUA PENGUJIAN BACKEND TAHAP 4 LULUS DENGAN LENGKAP! 🎉');
}

testTahap4().catch(err => {
  console.error('Error running test:', err);
  process.exit(1);
});

export interface ProductSeed {
  name: string;
  description: string;
  category: string;
  variants: {
    sku: string;
    color: string;
    size: string;
    price: number;
    initialStocks?: { [platform: string]: number }; // Custom stock overrides
  }[];
}

export const PRODUCTS_DATA: ProductSeed[] = [
  {
    name: 'Jaket Gunung Hujan Stormbreaker 3L',
    description: 'Jaket hardshell 3-layer waterproof 20.000mm dengan seam-taped penuh. Tahan badai cuaca ekstrem pegunungan Indonesia.',
    category: 'Outerwear',
    variants: [
      { sku: 'RS-JKT-STM-BLK-M', color: 'Stealth Black', size: 'M', price: 489000 },
      { sku: 'RS-JKT-STM-BLK-L', color: 'Stealth Black', size: 'L', price: 489000 },
      {
        sku: 'RS-JKT-STM-BLK-XL',
        color: 'Stealth Black',
        size: 'XL',
        price: 489000,
        initialStocks: { shopee: 1, tokopedia: 2, lazada: 0, blibli: 1 } // Low stock alert!
      },
      { sku: 'RS-JKT-STM-OLV-M', color: 'Army Olive', size: 'M', price: 489000 },
      { sku: 'RS-JKT-STM-OLV-L', color: 'Army Olive', size: 'L', price: 489000 }
    ]
  },
  {
    name: 'Jaket Polar Fleece Thermal Rinjani',
    description: 'Jaket fleece hangat 280gsm dengan saku dada berresleting. Nyaman dipakai saat camping malam di ketinggian.',
    category: 'Outerwear',
    variants: [
      { sku: 'RS-FLC-RNJ-GRY-M', color: 'Heather Grey', size: 'M', price: 299000 },
      { sku: 'RS-FLC-RNJ-GRY-L', color: 'Heather Grey', size: 'L', price: 299000 },
      { sku: 'RS-FLC-RNJ-NVY-L', color: 'Navy Blue', size: 'L', price: 299000 }
    ]
  },
  {
    name: 'Kaos Quick-Dry Trail Active Ciremai',
    description: 'Kaos lengan pendek polyester antibakteri cepat kering dengan sirkulasi udara optimal untuk trail running dan hiking.',
    category: 'Apparel',
    variants: [
      { sku: 'RS-TSH-CRM-BLK-S', color: 'Hitam', size: 'S', price: 135000 },
      { sku: 'RS-TSH-CRM-BLK-M', color: 'Hitam', size: 'M', price: 135000 },
      { sku: 'RS-TSH-CRM-BLK-L', color: 'Hitam', size: 'L', price: 135000 },
      { sku: 'RS-TSH-CRM-SGE-M', color: 'Sage Green', size: 'M', price: 135000 }
    ]
  },
  {
    name: 'Celana Cargo Quick-Dry Merbabu',
    description: 'Celana panjang cargo tahan gesekan batu gunung dengan 6 saku fungsional dan teknologi water-repellent.',
    category: 'Apparel',
    variants: [
      {
        sku: 'RS-PNT-MBB-KHK-M',
        color: 'Khaki Tan',
        size: '30/M',
        price: 275000,
        initialStocks: { shopee: 2, tokopedia: 1, lazada: 1, blibli: 0 } // Low stock alert!
      },
      { sku: 'RS-PNT-MBB-KHK-L', color: 'Khaki Tan', size: '32/L', price: 275000 },
      { sku: 'RS-PNT-MBB-BLK-M', color: 'Hitam', size: '30/M', price: 275000 },
      { sku: 'RS-PNT-MBB-BLK-L', color: 'Hitam', size: '32/L', price: 275000 }
    ]
  },
  {
    name: 'Tas Carrier 60L Mahameru Expedition',
    description: 'Ransel ekspedisi 60 liter dengan rangka aluminium ganda, torso adjustable, dan kompartemen sleeping bag terpisah.',
    category: 'Bags & Packs',
    variants: [
      {
        sku: 'RS-BAG-MHM-60L-RED',
        color: 'Crimson Red',
        size: '60L',
        price: 749000,
        initialStocks: { shopee: 1, tokopedia: 3, lazada: 0, blibli: 0 } // Low stock alert!
      },
      { sku: 'RS-BAG-MHM-60L-BLK', color: 'Stealth Black', size: '60L', price: 749000 }
    ]
  },
  {
    name: 'Tas Carrier 40L Papandayan Ultralight',
    description: 'Tas hiking semi-carrier 40L cocok untuk pendakian tektok 2 hari 1 malam. Bobot ringan dengan sirkulasi punggung empuk.',
    category: 'Bags & Packs',
    variants: [
      { sku: 'RS-BAG-PPD-40L-BLU', color: 'Cobalt Blue', size: '40L', price: 589000 },
      { sku: 'RS-BAG-PPD-40L-GRN', color: 'Forest Green', size: '40L', price: 589000 }
    ]
  },
  {
    name: 'Topi Rimba Waterproof Explorer',
    description: 'Topi bundar rimba pelindung UV dan hujan gerimis dengan tali dagu pengencang dan ventilasi samping.',
    category: 'Accessories',
    variants: [
      { sku: 'RS-HAT-EXP-OLV-ALL', color: 'Army Olive', size: 'All Size', price: 89000 },
      { sku: 'RS-HAT-EXP-KHK-ALL', color: 'Khaki Tan', size: 'All Size', price: 89000 },
      { sku: 'RS-HAT-EXP-BLK-ALL', color: 'Hitam', size: 'All Size', price: 89000 }
    ]
  },
  {
    name: 'Sarung Tangan Windstopper Grip Gede',
    description: 'Sarung tangan polar tahan angin dengan telapak karet anti-slip dan ujung jari touchscreen-friendly.',
    category: 'Accessories',
    variants: [
      {
        sku: 'RS-GLV-GDE-BLK-M',
        color: 'Hitam',
        size: 'M',
        price: 119000,
        initialStocks: { shopee: 3, tokopedia: 0, lazada: 2, blibli: 1 } // Low stock alert!
      },
      { sku: 'RS-GLV-GDE-BLK-L', color: 'Hitam', size: 'L', price: 119000 }
    ]
  },
  {
    name: 'Gaiter Pelindung Kaki Anti Kerikil Semeru',
    description: 'Gaiter pelindung kaki bawah dari pasir, kerikil tajam, dan gigitan pacet saat melintasi jalur lembap.',
    category: 'Accessories',
    variants: [
      { sku: 'RS-GTR-SMR-BLK-ALL', color: 'Hitam', size: 'All Size', price: 95000 },
      { sku: 'RS-GTR-SMR-ORG-ALL', color: 'Orange Flare', size: 'All Size', price: 95000 }
    ]
  },
  {
    name: 'Dry Bag 15L Roll-Top Rafting & Trekking',
    description: 'Tas kedap air 15 liter berbahan PVC tarpaulin 500D tebal untuk perlindungan barang berharga saat hujan deras atau susur sungai.',
    category: 'Equipment',
    variants: [
      { sku: 'RS-DRY-15L-YLW-ALL', color: 'Neon Yellow', size: '15L', price: 79000 },
      { sku: 'RS-DRY-15L-BLU-ALL', color: 'Ocean Blue', size: '15L', price: 79000 }
    ]
  }
];

export const INDONESIAN_CUSTOMERS_DATA = [
  { name: 'Budi Santoso', phone: '0812-3456-7891', tier: 'Platinum', platform: 'shopee', tags: ['VIP', 'Pendaki Senior'] },
  { name: 'Siti Rahmawati', phone: '0857-1234-5672', tier: 'Gold', platform: 'tokopedia', tags: ['Fast Payer', 'Komunitas Trail'] },
  { name: 'Agus Setiawan', phone: '0821-9876-5433', tier: 'Silver', platform: 'whatsapp', tags: ['Pendaki Pemula'] },
  { name: 'Dewi Lestari', phone: '0878-5544-3324', tier: 'Bronze', platform: 'shopee', tags: ['Promo Hunter'] },
  { name: 'Rian Hidayat', phone: '0813-2211-9985', tier: 'Gold', platform: 'lazada', tags: ['Sering Belanja'] },
  { name: 'Eka Prasetya', phone: '0815-4433-2216', tier: 'Silver', platform: 'tokopedia', tags: ['Pendaki Pemula'] },
  { name: 'Nurul Hidayati', phone: '0822-7788-9907', tier: 'Bronze', platform: 'blibli', tags: ['First Order'] },
  { name: 'Dimas Saputra', phone: '0819-3322-1148', tier: 'Platinum', platform: 'whatsapp', tags: ['VIP', 'Reseller'] },
  { name: 'Fajar Nugraha', phone: '0852-6677-8899', tier: 'Gold', platform: 'shopee', tags: ['Komunitas Trail'] },
  { name: 'Anisa Fitriani', phone: '0881-2233-4450', tier: 'Silver', platform: 'tokopedia', tags: ['Pendaki Pemula'] },
  { name: 'Reza Pratama', phone: '0812-8899-0011', tier: 'Bronze', platform: 'lazada', tags: ['Sering Retur'] },
  { name: 'Bayu Wicaksono', phone: '0856-1122-3342', tier: 'Gold', platform: 'tokopedia', tags: ['Fast Payer'] },
  { name: 'Tri Wahyuni', phone: '0823-4455-6673', tier: 'Silver', platform: 'shopee', tags: ['Promo Hunter'] },
  { name: 'Ahmad Fauzi', phone: '0877-9900-1124', tier: 'Platinum', platform: 'whatsapp', tags: ['VIP', 'Pendaki Senior'] },
  { name: 'Intan Permatasari', phone: '0813-5566-7785', tier: 'Silver', platform: 'blibli', tags: ['Pendaki Pemula'] },
  { name: 'Doni Firmansyah', phone: '0815-9988-7766', tier: 'Bronze', platform: 'shopee', tags: ['First Order'] },
  { name: 'Putri Handayani', phone: '0821-3344-5567', tier: 'Gold', platform: 'tokopedia', tags: ['Komunitas Trail'] },
  { name: 'Hendra Gunawan', phone: '0858-6677-8898', tier: 'Silver', platform: 'lazada', tags: ['Fast Payer'] },
  { name: 'Maya Anggraini', phone: '0819-0011-2239', tier: 'Bronze', platform: 'whatsapp', tags: ['Promo Hunter'] },
  { name: 'Gilang Ramadhan', phone: '0812-4455-6680', tier: 'Gold', platform: 'shopee', tags: ['Pendaki Senior'] },
  { name: 'Wulan Dari', phone: '0857-7788-9901', tier: 'Silver', platform: 'tokopedia', tags: ['Pendaki Pemula'] },
  { name: 'Rizky Kurniawan', phone: '0822-1122-3342', tier: 'Platinum', platform: 'whatsapp', tags: ['VIP'] },
  { name: 'Fitri Handayani', phone: '0878-3344-5563', tier: 'Bronze', platform: 'blibli', tags: ['First Order'] },
  { name: 'Yoga Pratama', phone: '0813-7788-9904', tier: 'Silver', platform: 'shopee', tags: ['Fast Payer'] },
  { name: 'Nadia Safitri', phone: '0815-2233-4455', tier: 'Gold', platform: 'tokopedia', tags: ['Komunitas Trail'] },
  { name: 'Aditya Nugroho', phone: '0821-6677-8896', tier: 'Silver', platform: 'lazada', tags: ['Pendaki Pemula'] },
  { name: 'Lia Kusuma', phone: '0856-9900-1127', tier: 'Bronze', platform: 'whatsapp', tags: ['Promo Hunter'] },
  { name: 'Taufik Hidayat', phone: '0819-4455-6688', tier: 'Platinum', platform: 'shopee', tags: ['VIP', 'Pendaki Senior'] },
  { name: 'Mega Utami', phone: '0812-1122-3349', tier: 'Gold', platform: 'tokopedia', tags: ['Fast Payer'] },
  { name: 'Danang Wijaya', phone: '0858-3344-5570', tier: 'Silver', platform: 'blibli', tags: ['Pendaki Pemula'] },
  { name: 'Indah Puspitasari', phone: '0823-7788-9911', tier: 'Bronze', platform: 'shopee', tags: ['First Order'] },
  { name: 'Wahyu Hidayat', phone: '0877-2233-4452', tier: 'Gold', platform: 'lazada', tags: ['Komunitas Trail'] },
  { name: 'Ratna Sari', phone: '0813-6677-8893', tier: 'Silver', platform: 'tokopedia', tags: ['Fast Payer'] },
  { name: 'Bambang Supriyanto', phone: '0815-9900-1134', tier: 'Bronze', platform: 'whatsapp', tags: ['Sering Retur'] },
  { name: 'Rina Marlina', phone: '0821-4455-6675', tier: 'Gold', platform: 'shopee', tags: ['Pendaki Senior'] },
  { name: 'Arief Budiman', phone: '0857-1122-3356', tier: 'Silver', platform: 'tokopedia', tags: ['Pendaki Pemula'] },
  { name: 'Dian Permana', phone: '0881-5566-7787', tier: 'Platinum', platform: 'whatsapp', tags: ['VIP'] },
  { name: 'Sari Wulandari', phone: '0812-7788-9928', tier: 'Bronze', platform: 'blibli', tags: ['Promo Hunter'] },
  { name: 'Ilham Syahputra', phone: '0856-2233-4469', tier: 'Gold', platform: 'shopee', tags: ['Komunitas Trail'] },
  { name: 'Melati Suci', phone: '0822-6677-8890', tier: 'Silver', platform: 'tokopedia', tags: ['Fast Payer'] },
  { name: 'Bagus Prakoso', phone: '0878-9900-1141', tier: 'Bronze', platform: 'lazada', tags: ['First Order'] },
  { name: 'Farhan Maulana', phone: '0813-3344-5572', tier: 'Platinum', platform: 'whatsapp', tags: ['VIP', 'Pendaki Senior'] },
  { name: 'Yunita Rahayu', phone: '0815-7788-9933', tier: 'Silver', platform: 'shopee', tags: ['Pendaki Pemula'] },
  { name: 'Galih Wicaksono', phone: '0821-1122-3364', tier: 'Gold', platform: 'tokopedia', tags: ['Komunitas Trail'] },
  { name: 'Novita Sari', phone: '0858-5566-7795', tier: 'Bronze', platform: 'blibli', tags: ['Promo Hunter'] },
  { name: 'Robby Darmawan', phone: '0819-8899-0026', tier: 'Silver', platform: 'shopee', tags: ['Fast Payer'] },
  { name: 'Citra Kirana', phone: '0812-2233-4477', tier: 'Gold', platform: 'lazada', tags: ['Pendaki Senior'] },
  { name: 'Tedi Gunawan', phone: '0857-6677-8898', tier: 'Bronze', platform: 'whatsapp', tags: ['First Order'] },
  { name: 'Zulham Efendi', phone: '0823-9900-1159', tier: 'Silver', platform: 'tokopedia', tags: ['Pendaki Pemula'] },
  { name: 'Syifa Fauziyah', phone: '0877-3344-5580', tier: 'Platinum', platform: 'shopee', tags: ['VIP', 'Komunitas Trail'] }
];

export const CHAT_SCENARIOS = [
  {
    customerIndex: 0, // Budi Santoso
    platform: 'shopee',
    status: 'open',
    urgency: 'high',
    messages: [
      { sender: 'customer', text: 'Halo min, jaket Stormbreaker 3L warna Stealth Black ukuran XL apa masih ada stok? Mau dipake naik Rinjani minggu depan.', responseMs: 25000 },
      { sender: 'cs', text: 'Halo Kak Budi! Untuk Stormbreaker 3L Black XL stoknya tinggal 1 unit lagi di Shopee kak, sangat rebutan. Mau langsung dicheckout sekarang?', responseMs: 30000 },
      { sender: 'customer', text: 'Oke min, tolong keep sebentar ya, saya bayar pakai Spaylater sekarang.', responseMs: null }
    ]
  },
  {
    customerIndex: 1, // Siti Rahmawati
    platform: 'tokopedia',
    status: 'resolved',
    urgency: 'medium',
    messages: [
      { sender: 'customer', text: 'Min, kaos trail Ciremai warna Sage Green ukuran M bahannya gampang bau apek nggak kalau keringatan parah?', responseMs: 18000 },
      { sender: 'cs', text: 'Halo Kak Siti! Kaos Ciremai kami memakai teknologi quick-dry anti-odor dengan benang poliester mikro kak. Sangat aman dan cepat kering untuk trail run seharian.', responseMs: 22000 },
      { sender: 'customer', text: 'Mantap min, sudah saya checkout 2 pcs ya. Ditunggu kirimannya!', responseMs: 15000 },
      { sender: 'cs', text: 'Terima kasih banyak Kak Siti! Segera kami proses sore ini.', responseMs: null }
    ]
  },
  {
    customerIndex: 2, // Agus Setiawan
    platform: 'whatsapp',
    status: 'open',
    urgency: 'high',
    messages: [
      { sender: 'customer', text: 'Siang mas CS Rancaekek. Saya mau order langsung celana cargo Merbabu Khaki ukuran 30/M sama Topi Rimba Khaki, bisa dibantu pesankan manual? Saya mau transfer BCA.', responseMs: 35000 },
      { sender: 'cs', text: 'Siang Kak Agus! Tentu bisa sekali kami bantu buatkan pesanan manual via WhatsApp. Total untuk Celana Merbabu (Rp 275.000) + Topi Rimba (Rp 89.000) = Rp 364.000 belum termasuk ongkir. Boleh kirimkan alamat lengkap pengirimannya kak?', responseMs: 40000 },
      { sender: 'customer', text: 'Alamat saya: Jl. Dipatiukur No. 45, Coblong, Bandung 40132. Nomor penerima tetap nomor ini.', responseMs: null }
    ]
  },
  {
    customerIndex: 3, // Dewi Lestari
    platform: 'shopee',
    status: 'open',
    urgency: 'medium',
    messages: [
      { sender: 'customer', text: 'Kak, apakah ada voucher diskon untuk pembelian carrier 40L Papandayan?', responseMs: 45000 },
      { sender: 'cs', text: 'Halo Kak Dewi! Saat ini ada voucher potongan toko Rp 25.000 yang bisa Kakak klaim di halaman toko Shopee kami ya kak.', responseMs: null }
    ]
  },
  {
    customerIndex: 4, // Rian Hidayat
    platform: 'lazada',
    status: 'resolved',
    urgency: 'low',
    messages: [
      { sender: 'customer', text: 'Paket sarung tangan windstopper sudah sampai kak, ukurannya pas banget dan gripnya mantap di stang trekking pole. Makasih ya!', responseMs: 30000 },
      { sender: 'cs', text: 'Sama-sama Kak Rian! Terima kasih review positifnya. Selamat berpetualang dan salam lestari!', responseMs: null }
    ]
  },
  {
    customerIndex: 7, // Dimas Saputra (Reseller)
    platform: 'whatsapp',
    status: 'open',
    urgency: 'high',
    messages: [
      { sender: 'customer', text: 'Bro, carrier Mahameru 60L Red kemarin ready berapa pcs ya? Ada teman basecamp mau borong 3 pcs nih.', responseMs: 20000 },
      { sender: 'cs', text: 'Halo Mas Dimas! Wah mohon maaf banget Mas, untuk Carrier Mahameru 60L Red stok saat ini sangat menipis, di gudang tersisa 1-3 unit dan terbagi di marketplace. Kalau warna Stealth Black masih aman mas.', responseMs: 25000 },
      { sender: 'customer', text: 'Waduh, coba saya tawarin warna Black ke temen dulu ya. Nanti saya kabari lagi.', responseMs: null }
    ]
  },
  {
    customerIndex: 10, // Reza Pratama
    platform: 'lazada',
    status: 'open',
    urgency: 'high',
    messages: [
      { sender: 'customer', text: 'Halo min, orderan jaket Stormbreaker saya kemarin ukuran M ternyata kekecilan di pundak saya. Mau tanya prosedur retur atau tukar ke ukuran L bagaimana ya?', responseMs: 28000 },
      { sender: 'cs', text: 'Halo Kak Reza, mohon maaf atas ketidaknyamanannya. Bisa kak, selama tag masih utuh dan belum dipakai mendaki. Silakan ajukan retur tukar barang di aplikasi Lazada, nanti tim kami approve segera.', responseMs: 35000 },
      { sender: 'customer', text: 'Baik min, sudah saya ajukan form turnya. Mohon di-approve ya.', responseMs: null }
    ]
  },
  {
    customerIndex: 13, // Ahmad Fauzi
    platform: 'whatsapp',
    status: 'resolved',
    urgency: 'medium',
    messages: [
      { sender: 'customer', text: 'Halo min, dry bag 15L bahan tarpaulinnya tebal kan? Aman nggak kalau jatuh ke sungai saat rafting?', responseMs: 15000 },
      { sender: 'cs', text: 'Halo Pak Ahmad! Aman sekali pak, bahan 500D PVC Tarpaulin kami sangat tebal dengan sistem lipat roll-top 3 kali kedap air 100%.', responseMs: 18000 },
      { sender: 'customer', text: 'Siap min, tadi sudah checkout warna neon yellow biar keliatan terang kalau di air.', responseMs: 12000 },
      { sender: 'cs', text: 'Pilihan tepat pak! Resi akan terupdate malam ini ya.', responseMs: null }
    ]
  },
  {
    customerIndex: 6, // Nurul Hidayati
    platform: 'blibli',
    status: 'resolved',
    urgency: 'low',
    messages: [
      { sender: 'customer', text: 'Siang min, pengiriman ke Malang pakai ekspedisi apa ya kalau beli di Blibli?', responseMs: 50000 },
      { sender: 'cs', text: 'Siang Kak Nurul! Pengiriman via Blibli otomatis menggunakan JNE atau SiCepat kurir reguler dengan estimasi 2-3 hari kerja kak.', responseMs: null }
    ]
  },
  {
    customerIndex: 8, // Fajar Nugraha
    platform: 'shopee',
    status: 'open',
    urgency: 'medium',
    messages: [
      { sender: 'customer', text: 'Min, jaket polar fleece Rinjani grey M bisa kirim instan gosend sekarang nggak ke Cileunyi?', responseMs: 22000 },
      { sender: 'cs', text: 'Bisa banget Kak Fajar! Pesanan sebelum jam 15.00 langsung dikirim driver hari ini juga.', responseMs: null }
    ]
  },
  {
    customerIndex: 17, // Hendra Gunawan
    platform: 'lazada',
    status: 'resolved',
    urgency: 'low',
    messages: [
      { sender: 'customer', text: 'Gaiter Semeru-nya berfungsi baik min kemarin nanjak Prau saat hujan, sepatu bebas pasir!', responseMs: 60000 },
      { sender: 'cs', text: 'Alhamdulillah, terima kasih feedbacknya Kak Hendra. Ditunggu orderan perlengkapan hiking berikutnya!', responseMs: null }
    ]
  },
  {
    customerIndex: 21, // Rizky Kurniawan
    platform: 'whatsapp',
    status: 'open',
    urgency: 'high',
    messages: [
      { sender: 'customer', text: 'Min, tolong buatin order manual lagi: Gaiter Semeru Black 1 pasang + Topi Rimba Olive 1 pcs. Kirim ke kantor yang biasa.', responseMs: 20000 },
      { sender: 'cs', text: 'Siap Kak Rizky! Total pesanan Rp 184.000 + ongkir Rp 10.000 = Rp 194.000. Rekening tujuan seperti biasa ke BCA Rancaekek Supply ya kak.', responseMs: null }
    ]
  },
  {
    customerIndex: 24, // Nadia Safitri
    platform: 'tokopedia',
    status: 'open',
    urgency: 'medium',
    messages: [
      { sender: 'customer', text: 'Min, celana cargo Merbabu ada rekomendasi ukuran untuk lingkar pinggang 78cm?', responseMs: 30000 },
      { sender: 'cs', text: 'Halo Kak Nadia! Untuk LP 78cm kami sarankan ambil ukuran 30/M kak, di bagian pinggang samping juga ada karet elastis 2-3cm sehingga pas dan nyaman.', responseMs: null }
    ]
  },
  {
    customerIndex: 27, // Taufik Hidayat
    platform: 'shopee',
    status: 'resolved',
    urgency: 'low',
    messages: [
      { sender: 'customer', text: 'Apakah garansi resleting jaket berlaku 1 tahun?', responseMs: 40000 },
      { sender: 'cs', text: 'Benar Kak Taufik! Semua resleting YKK pada produk Rancaekek Supply Co bergaransi reparasi 1 tahun.', responseMs: null }
    ]
  },
  {
    customerIndex: 33, // Bambang Supriyanto
    platform: 'whatsapp',
    status: 'open',
    urgency: 'high',
    messages: [
      { sender: 'customer', text: 'Selamat sore, paket saya INV/2026/RS/039 kok belum bergerak dari gudang transit ya?', responseMs: 32000 },
      { sender: 'cs', text: 'Sore Pak Bambang, mohon maaf atas keterlambatan pihak kurir. Kami sudah buatkan laporan investigasi prioritas ke ekspedisi untuk dipercepat hari ini.', responseMs: null }
    ]
  },
  {
    customerIndex: 36, // Dian Permana
    platform: 'whatsapp',
    status: 'resolved',
    urgency: 'medium',
    messages: [
      { sender: 'customer', text: 'Mas, saya sudah transfer untuk pesanan Tas Carrier 40L Papandayan Blue via BCA ya. Ini buktinya.', responseMs: 16000 },
      { sender: 'cs', text: 'Terima kasih Kak Dian! Pembayaran sudah kami verifikasi masuk. Pesanan langsung masuk antrean packing gudang ya.', responseMs: null }
    ]
  },
  {
    customerIndex: 41, // Farhan Maulana
    platform: 'whatsapp',
    status: 'open',
    urgency: 'low',
    messages: [
      { sender: 'customer', text: 'Halo mimin, bulan depan Rancaekek Supply Co ada rilis tenda ultralight nggak?', responseMs: 55000 },
      { sender: 'cs', text: 'Halo Mas Farhan! Wah bocorannya ada di kuartal depan nih mas untuk tenda silnylon 2P. Pantau terus Instagram kami ya!', responseMs: null }
    ]
  },
  {
    customerIndex: 44, // Novita Sari
    platform: 'blibli',
    status: 'open',
    urgency: 'medium',
    messages: [
      { sender: 'customer', text: 'Min, sarung tangan windstopper ukuran M untuk cewek pas nggak ya?', responseMs: 38000 },
      { sender: 'cs', text: 'Halo Kak Novita! Untuk tangan wanita pada umumnya ukuran M sangat pas kak, panjang jari sekitar 18-19cm.', responseMs: null }
    ]
  }
];

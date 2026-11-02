// Kamus Data & Initial Seed Data sesuai Bab IV Perancangan Sistem STO Telkom Akses

export const initialUsers = [
  {
    id: 1,
    nama_lengkap: "Ir. Bambang Sudirman, M.T.",
    role: "pimpinan",
    email: "pimpinan@gmail.com",
    password: "123456",
    jabatan: "Manager STO Wilayah",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: 2,
    nama_lengkap: "Teknisi Lapangan",
    role: "teknisi",
    email: "teknisi@gmail.com",
    password: "123456",
    jabatan: "Teknisi Lapangan STO",
    phone: "0812-8921-3341",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: 4,
    nama_lengkap: "Petugas Gudang",
    role: "gudang",
    email: "gudang@gmail.com",
    password: "123456",
    jabatan: "Staff Logistik & Inventaris",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
  }
];

export const initialBarang = [
  {
    id: 1,
    nama_barang: "Kabel FO Drop Core 1-Core 150M Pre-Conn",
    stok: 1250,
    satuan: "meter",
    kode: "MAT-DC-1C-150",
    kategori: "Kabel & Serat Optik"
  },
  {
    id: 2,
    nama_barang: "Kabel FO Drop Core 2-Core Aerial Drum",
    stok: 3000,
    satuan: "meter",
    kode: "MAT-DC-2C-DRM",
    kategori: "Kabel & Serat Optik"
  },
  {
    id: 3,
    nama_barang: "Modem ONT ZTE F670L Dual Band GPON",
    stok: 48,
    satuan: "unit",
    kode: "EQP-ONT-ZTE-F670",
    kategori: "Perangkat Aktif"
  },
  {
    id: 4,
    nama_barang: "Modem ONT Fiberhome HG6243C AC1200",
    stok: 35,
    satuan: "unit",
    kode: "EQP-ONT-FH-6243",
    kategori: "Perangkat Aktif"
  },
  {
    id: 5,
    nama_barang: "Modem ONT Huawei HG8245H5 GPON",
    stok: 22,
    satuan: "unit",
    kode: "EQP-ONT-HW-8245",
    kategori: "Perangkat Aktif"
  },
  {
    id: 6,
    nama_barang: "Roset Fiber Optic 1-Port SC/UPC Indoor",
    stok: 120,
    satuan: "pcs",
    kode: "ACC-ROS-1P",
    kategori: "Aksesoris Indoor"
  },
  {
    id: 7,
    nama_barang: "Roset Fiber Optic 2-Port Dual Shutter",
    stok: 65,
    satuan: "pcs",
    kode: "ACC-ROS-2P",
    kategori: "Aksesoris Indoor"
  },
  {
    id: 8,
    nama_barang: "Patch Cord SC/UPC - SC/UPC 2M Simplex",
    stok: 215,
    satuan: "pcs",
    kode: "ACC-PC-SC2M",
    kategori: "Aksesoris Indoor"
  },
  {
    id: 9,
    nama_barang: "Patch Cord SC/APC - SC/UPC 3M Simplex",
    stok: 90,
    satuan: "pcs",
    kode: "ACC-PC-APC3M",
    kategori: "Aksesoris Indoor"
  },
  {
    id: 10,
    nama_barang: "Fast Connector SC/UPC Biru Quick Assembly",
    stok: 310,
    satuan: "pcs",
    kode: "ACC-FC-SC-BLU",
    kategori: "Aksesoris"
  },
  {
    id: 11,
    nama_barang: "Fast Connector SC/APC Hijau Quick Assembly",
    stok: 180,
    satuan: "pcs",
    kode: "ACC-FC-SC-GRN",
    kategori: "Aksesoris"
  },
  {
    id: 12,
    nama_barang: "Protection Sleeve Splicing 60mm",
    stok: 650,
    satuan: "pcs",
    kode: "ACC-SLV-60",
    kategori: "Consumable"
  },
  {
    id: 13,
    nama_barang: "Splitter PLC 1:8 SC/UPC Box Type ODP",
    stok: 35,
    satuan: "unit",
    kode: "PAS-SPL-18",
    kategori: "Perangkat Pasif"
  },
  {
    id: 14,
    nama_barang: "Splitter PLC 1:16 SC/UPC Modul ODC",
    stok: 18,
    satuan: "unit",
    kode: "PAS-SPL-116",
    kategori: "Perangkat Pasif"
  },
  {
    id: 15,
    nama_barang: "Clamp Hook / S-Clamp Penarik Kabel Tiang",
    stok: 420,
    satuan: "pcs",
    kode: "ACC-SCLAMP-01",
    kategori: "Aksesoris"
  },
  {
    id: 16,
    nama_barang: "Suspension Clamp FO Aerial (Penggantung)",
    stok: 140,
    satuan: "pcs",
    kode: "ACC-SUSP-CLP",
    kategori: "Aksesoris"
  },
  {
    id: 17,
    nama_barang: "Adaptor Power ONT 12V 1.5A EU Plug",
    stok: 55,
    satuan: "unit",
    kode: "ACC-PWR-12V",
    kategori: "Perangkat Aktif"
  },
  {
    id: 18,
    nama_barang: "Kabel UTP Cat5e Patch Cord 1.5M RJ45",
    stok: 130,
    satuan: "pcs",
    kode: "ACC-UTP-15M",
    kategori: "Aksesoris Indoor"
  },
  {
    id: 19,
    nama_barang: "Pigtail SC/UPC 0.9mm 1.5M Singlemode",
    stok: 260,
    satuan: "pcs",
    kode: "ACC-PIG-SC",
    kategori: "Kabel & Serat Optik"
  },
  {
    id: 20,
    nama_barang: "Alkohol 95% & Tissue Kimwipes Fiber",
    stok: 45,
    satuan: "box",
    kode: "CNS-CLEAN-KIT",
    kategori: "Consumable"
  }
];

export const initialTugas = [
  {
    id: 101,
    nomor_tiket: "TKT-PYK-2026-001",
    pimpinan_id: 1,
    teknisi_id: 2,
    jenis_kerja: "Pasang Baru",
    lokasi: "Jl. Soekarno Hatta No. 45, Koto Nan IV, Payakumbuh Barat",
    pelanggan_nama: "Bpk. Hendra Wijaya",
    pelanggan_telp: "0812-7711-2233",
    status: "Progress",
    keterangan: "Pemasangan Baru IndiHome Paket 100 Mbps + Indibiz. Penarikan kabel FO dari ODP-PYK-08 tiang 3.",
    target_lat: -0.2272,
    target_lng: 100.6318,
    foto_bukti: null,
    waktu_buat: "2026-09-17 08:30"
  },
  {
    id: 102,
    nomor_tiket: "TKT-PYK-2026-002",
    pimpinan_id: 1,
    teknisi_id: 2,
    jenis_kerja: "Gangguan",
    lokasi: "Balai Nan Duo, Koto Nan IV, Payakumbuh Barat",
    pelanggan_nama: "Ibu Nurhayati",
    pelanggan_telp: "0813-8822-4455",
    status: "Open",
    keterangan: "Laporan LOS (Red blink). Redaman optik melebihi -32 dBm, indikasi kabel putus tertimpa dahan pohon.",
    target_lat: -0.2310,
    target_lng: 100.6355,
    foto_bukti: null,
    waktu_buat: "2026-09-17 09:15"
  },
  {
    id: 103,
    nomor_tiket: "TKT-PYK-2026-003",
    pimpinan_id: 1,
    teknisi_id: 3,
    jenis_kerja: "ODP",
    lokasi: "Jl. Jenderal Sudirman, Labuh Basilang, Payakumbuh",
    pelanggan_nama: "Titik ODP-PYK-14 (Kawasan Pertokoan)",
    pelanggan_telp: "0821-9933-5566",
    status: "Done",
    keterangan: "Maintenance ODP & perapihan port splitter 1:8 yang longgar. Redaman kembali normal (-18.42 dBm).",
    target_lat: -0.2245,
    target_lng: 100.6380,
    foto_bukti: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80",
    waktu_buat: "2026-09-16 13:00",
    waktu_selesai: "2026-09-16 16:30"
  },
  {
    id: 104,
    nomor_tiket: "TKT-PYK-2026-004",
    pimpinan_id: 1,
    teknisi_id: 3,
    jenis_kerja: "Pasang Baru",
    lokasi: "Kawasan Pasar Ibuh, Payakumbuh Barat",
    pelanggan_nama: "Kedai Kopi Nan Duo",
    pelanggan_telp: "0812-9988-1234",
    status: "Done",
    keterangan: "Instalasi IndiHome Bisnis 200 Mbps selesai dipasang dan lolos tes ping/latency stabil 4ms.",
    target_lat: -0.2260,
    target_lng: 100.6362,
    foto_bukti: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80",
    waktu_buat: "2026-09-15 10:00",
    waktu_selesai: "2026-09-15 14:15"
  }
];

export const initialPermohonan = [
  {
    id: 501,
    tugas_id: 101,
    status: "Approved",
    waktu_request: "2026-09-17 08:45",
    catatan_teknisi: "Kebutuhan penarikan kabel drop core sepanjang 150m dan ONT baru"
  },
  {
    id: 502,
    tugas_id: 102,
    status: "Pending",
    waktu_request: "2026-09-17 09:30",
    catatan_teknisi: "Pergantian drop core putus dan protection sleeve"
  },
  {
    id: 503,
    tugas_id: 103,
    status: "Released",
    waktu_request: "2026-09-16 13:10",
    catatan_teknisi: "Splitter pengganti untuk ODP dan protection sleeve"
  },
  {
    id: 504,
    tugas_id: 104,
    status: "Released",
    waktu_request: "2026-09-15 10:15",
    catatan_teknisi: "Material pasang baru lengkap paket cafe"
  }
];

export const initialDetailPermohonan = [
  // Detail untuk Permohonan 501 (Tugas 101)
  { id: 1, permohonan_id: 501, barang_id: 1, jumlah_minta: 150 }, // Kabel FO Drop Core 150m
  { id: 2, permohonan_id: 501, barang_id: 2, jumlah_minta: 1 },   // Modem ZTE 1 pcs
  { id: 3, permohonan_id: 501, barang_id: 3, jumlah_minta: 1 },   // Roset 1 pcs
  { id: 4, permohonan_id: 501, barang_id: 4, jumlah_minta: 1 },   // Patch cord 1 pcs

  // Detail untuk Permohonan 502 (Tugas 102) - Pending Approval
  { id: 5, permohonan_id: 502, barang_id: 1, jumlah_minta: 100 },  // Kabel FO Drop Core 100m
  { id: 6, permohonan_id: 502, barang_id: 7, jumlah_minta: 6 },    // Protection sleeve 6 pcs
  { id: 7, permohonan_id: 502, barang_id: 8, jumlah_minta: 4 },    // Fast connector 4 pcs

  // Detail untuk Permohonan 503 (Tugas 103) - Released
  { id: 8, permohonan_id: 503, barang_id: 6, jumlah_minta: 1 },   // Splitter 1:8 1 pcs
  { id: 9, permohonan_id: 503, barang_id: 7, jumlah_minta: 8 },   // Protection sleeve 8 pcs

  // Detail untuk Permohonan 504 (Tugas 104) - Released
  { id: 10, permohonan_id: 504, barang_id: 1, jumlah_minta: 100 }, // Kabel FO 100m
  { id: 11, permohonan_id: 504, barang_id: 2, jumlah_minta: 1 },  // Modem ZTE 1 pcs
  { id: 12, permohonan_id: 504, barang_id: 3, jumlah_minta: 1 }   // Roset 1 pcs
];

// Kantor Pusat STO Telkom Akses Payakumbuh - Koto Nan IV (Anchor Point)
export const STO_COORDINATES = {
  name: "STO Telkom Payakumbuh (Koto Nan IV)",
  lat: -0.2285,
  lng: 100.6335,
  alamat: "Jl. Soekarno Hatta No. 12, Koto Nan IV, Payakumbuh Barat, Kota Payakumbuh, Sumatera Barat 26224"
};

// Data Titik ODP (Optical Distribution Point) Telkom Akses Payakumbuh untuk WebGIS Normal
export const initialOdp = [
  {
    id: 1,
    kode_odp: "ODP-PYK-FA/001",
    nama_lokasi: "Jl. Soekarno Hatta No. 14, Koto Nan IV (Depan STO)",
    latitude: -0.2285,
    longitude: 100.6335,
    kapasitas_port: 8,
    port_terpakai: 6,
    redaman_dbm: -17.80,
    status: "Tersedia",
    keterangan: "Distribusi feeder utama jalur STO - Kantor Pemerintahan"
  },
  {
    id: 2,
    kode_odp: "ODP-PYK-FA/002",
    nama_lokasi: "Balai Nan Duo, Payakumbuh Barat (Tiang FO 04)",
    latitude: -0.2310,
    longitude: 100.6355,
    kapasitas_port: 8,
    port_terpakai: 8,
    redaman_dbm: -19.40,
    status: "Penuh",
    keterangan: "Kawasan pemukiman padat penduduk - Port penuh terisi pelanggan"
  },
  {
    id: 3,
    kode_odp: "ODP-PYK-FA/003",
    nama_lokasi: "Jl. Jenderal Sudirman, Labuh Basilang (Kawasan Ruko)",
    latitude: -0.2245,
    longitude: 100.6380,
    kapasitas_port: 16,
    port_terpakai: 11,
    redaman_dbm: -18.25,
    status: "Tersedia",
    keterangan: "Splitter 1:16 melayani pelanggan IndiHome Bisnis dan Cafe"
  },
  {
    id: 4,
    kode_odp: "ODP-PYK-FA/004",
    nama_lokasi: "Kawasan Pasar Ibuh, Payakumbuh Barat",
    latitude: -0.2260,
    longitude: 100.6362,
    kapasitas_port: 8,
    port_terpakai: 5,
    redaman_dbm: -18.90,
    status: "Tersedia",
    keterangan: "Tiang distribusi sentra pertokoan pasar"
  },
  {
    id: 5,
    kode_odp: "ODP-PYK-FA/005",
    nama_lokasi: "Simpang Benteng, Payolansek, Payakumbuh",
    latitude: -0.2215,
    longitude: 100.6305,
    kapasitas_port: 8,
    port_terpakai: 3,
    redaman_dbm: -17.20,
    status: "Tersedia",
    keterangan: "Kondisi redaman sangat bagus, port cadangan memadai"
  },
  {
    id: 6,
    kode_odp: "ODP-PYK-FA/006",
    nama_lokasi: "Kelurahan Tiakar, Payakumbuh Timur",
    latitude: -0.2335,
    longitude: 100.6410,
    kapasitas_port: 8,
    port_terpakai: 7,
    redaman_dbm: -26.50,
    status: "Maintenance",
    keterangan: "Redaman tinggi (> -24 dBm), dijadwalkan perbaikan adapter ODP"
  }
];



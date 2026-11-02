const express = require('express');
const cors = require('cors');

// Mengimpor modul rute (Routes)
const authRoutes = require('./routes/authRoutes');
const tugasRoutes = require('./routes/tugasRoutes');
const permohonanRoutes = require('./routes/permohonanRoutes');
const laporanRoutes = require('./routes/laporanRoutes');
const barangRoutes = require('./routes/barangRoutes');
const odpRoutes = require('./routes/odpRoutes');

// Inisialisasi aplikasi Express
const app = express();

// Middleware 1: CORS agar aplikasi frontend (React di port 5173) diizinkan mengakses API ini
app.use(cors());

// Middleware 2: JSON Parser agar backend bisa membaca body request format JSON
app.use(express.json());

// Rute Dasar: Pengecekan server hidup/aktif
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    pesan: 'Server API STO Telkom Akses Payakumbuh Aktif!',
    waktu: new Date().toISOString()
  });
});

// Mendaftarkan Rute-Rute API Resmi Sistem STO
app.use('/api/auth', authRoutes);               // Autentikasi akun & login
app.use('/api/tugas', tugasRoutes);             // Tiket pekerjaan lapangan
app.use('/api/barang', barangRoutes);           // Inventaris & stok gudang
app.use('/api/permohonan', permohonanRoutes);   // Permohonan material ke gudang
app.use('/api/odp', odpRoutes);                 // Pemetaan Titik ODP / Jaringan FO
app.use('/api/laporan', laporanRoutes);         // Berita acara & audit laporan

// Mengekspor objek app agar bisa dijalankan oleh server.js
module.exports = app;

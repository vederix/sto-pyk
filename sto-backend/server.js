/**
 * ============================================================================
 * SERVER UTAMA (BACKEND API TELKOM AKSES STO PAYAKUMBUH)
 * ============================================================================
 * Penjelasan Teknis Operasional:
 * File ini adalah titik awal (entry point) untuk menjalankan server backend Node.js.
 * 
 * CARA KERJA:
 * 1. Membaca file konfigurasi lingkungan (.env) menggunakan package 'dotenv'.
 * 2. Mengimpor aplikasi Express dari folder './src/app'.
 * 3. Menjalankan server pada port yang ditentukan (default: port 5000).
 * 
 * CARA MENJALANKAN SERVER:
 * - Buka terminal di folder sto-backend lalu jalankan: `npm run dev` atau `npm start`
 * - Server akan aktif dan dapat diakses di http://localhost:5000
 * ============================================================================
 */

// 1. Memuat variabel lingkungan dari file .env (seperti URL Supabase, API Key, PORT, Telegram)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// 2. Mengimpor konfigurasi rute dan middleware dari file app.js
const app = require('./src/app');
const telegramBotWorker = require('./src/services/telegramBotWorker');

// 3. Menentukan port server (gunakan dari .env jika ada, atau default ke 5000)
const PORT = process.env.PORT || 5000;

// 4. Memulai server HTTP untuk menerima request dari frontend
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Server Backend STO Telkom Akses Berhasil Berjalan!`);
  console.log(`📍 Alamat API: http://localhost:${PORT}`);
  console.log(`📡 Terhubung dengan database Supabase Cloud`);
  console.log(`====================================================`);

  // Jalankan background worker Telegram bot listener
  telegramBotWorker.start();
});

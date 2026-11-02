const https = require('https');

/**
 * Escape string untuk format HTML Telegram
 */
function esc(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Helper kirim request ke Telegram Bot API
 */
function postTelegram(endpoint, payload) {
  return new Promise((resolve) => {
    const token = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN;
    if (!token) {
      console.warn('[Telegram Service] TELEGRAM_BOT_TOKEN belum diset di .env');
      return resolve({ ok: false, error: 'Token tidak ditemukan' });
    }

    const postData = JSON.stringify(payload);
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${token}/${endpoint}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000 // 10 detik timeout
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch {
          resolve({ ok: false, raw: data });
        }
      });
    });

    req.on('error', (err) => {
      console.warn('[Telegram Service] Request error:', err.message);
      resolve({ ok: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      console.warn('[Telegram Service] Request timeout');
      resolve({ ok: false, error: 'Request timeout' });
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Kirim pesan ke Grup Telegram Resmi
 */
async function kirimKeGrup(pesan, options = {}) {
  const chatId = options.chat_id || process.env.TELEGRAM_GROUP_ID || process.env.TELEGRAM_CHAT_ID;
  if (!chatId) {
    console.warn('[Telegram Service] TELEGRAM_GROUP_ID tidak diset di .env');
    return { ok: false, error: 'Chat ID tidak ditemukan' };
  }

  const payload = {
    chat_id: chatId,
    text: pesan,
    parse_mode: 'HTML',
    disable_web_page_preview: options.disable_web_page_preview !== undefined ? options.disable_web_page_preview : true,
    ...options
  };

  return await postTelegram('sendMessage', payload);
}

/**
 * Alias kirim pesan
 */
async function sendTelegramMessage(pesan, options = {}) {
  return await kirimKeGrup(pesan, options);
}

/**
 * Template Check-In Teknisi di Lokasi (SOP 3)
 */
function templateCheckIn(params = {}) {
  const t = params.tugas || {};
  const id = params.id || t.id || '-';
  const teknisi = params.teknisi || params.teknisiNama || 'Teknisi Lapangan';
  const odp = params.odp || t.odp_kode || 'ODP-PYK';
  const lokasi = params.lokasi || t.lokasi || 'Koto Nan IV Payakumbuh';
  const lat = params.latitude || -0.2289;
  const lng = params.longitude || 100.6322;
  const waktuStr = params.waktuWib || (params.waktu ? new Date(params.waktu).toLocaleTimeString('id-ID') : new Date().toLocaleTimeString('id-ID'));

  return [
    `📍 <b>[TELKOM AKSES — CHECK-IN TEKNISI LAPANGAN]</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📋 <b>No. Tiket:</b> #${esc(id)}`,
    `👷 <b>Teknisi:</b> ${esc(teknisi)}`,
    `🔌 <b>Titik ODP:</b> <code>${esc(odp)}</code>`,
    `📌 <b>Lokasi:</b> ${esc(lokasi)}`,
    `📡 <b>Koordinat GPS:</b> <code>${lat}, ${lng}</code>`,
    `⏰ <b>Waktu Tiba:</b> ${esc(waktuStr)} WIB`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `✅ <i>Teknisi telah tiba di lokasi pelanggan dan mulai melakukan inspeksi fisik & kabel optik.</i>`
  ].join('\n');
}

/**
 * Template Closing BASTP / Penyelesaian Tiket (SOP 4 / BASTP Digital)
 */
function templateClosingBastp(params = {}) {
  const t = params.tugas || {};
  const id = params.id || t.id || '-';
  const bastp = params.bastpNo || `BASTP/TA-PYK/2026/${String(id).padStart(4, '0')}`;
  const pelanggan = t.pelanggan_nama || params.pelanggan || 'Pelanggan Telkom';
  const odpKode = params.odp?.kode_odp || params.odp || t.odp_kode || 'ODP-PYK-FA/001';
  const redaman = params.redamanDbm || -18.50;
  const sn = params.snOnt || 'ZTEGC8B90112';
  const portBaru = params.portBaru || params.odp?.port_terpakai || 1;
  const kapasitas = params.kapasitasPort || params.odp?.kapasitas_port || 8;
  const statusOdp = params.statusOdp || params.odp?.status || 'Tersedia';

  return [
    `🎉 <b>[WORK ORDER RESOLVED — BERITA ACARA BASTP DIGITAL]</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📄 <b>No. BASTP:</b> <code>${esc(bastp)}</code>`,
    `📋 <b>No. Tiket:</b> #${esc(id)}`,
    `👤 <b>Pelanggan:</b> ${esc(pelanggan)}`,
    `🔌 <b>Titik ODP:</b> <code>${esc(odpKode)}</code>`,
    `📊 <b>Utilisasi Port ODP:</b> ${esc(portBaru)} / ${esc(kapasitas)} Port (Status: ${esc(statusOdp)})`,
    `📶 <b>Hasil Ukur Redaman:</b> <b>${esc(redaman)} dBm</b> (Lolos Standar QA)`,
    `📟 <b>SN Modem ONT:</b> <code>${esc(sn)}</code> (Status: Active)`,
    `⏰ <b>Waktu Closing:</b> ${new Date().toLocaleString('id-ID')} WIB`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `✨ <i>Pekerjaan selesai 100%. Sinyal optik stabil, data terupdate otomatis di sistem WebGIS STO Payakumbuh.</i>`
  ].join('\n');
}

/**
 * Template Rilis / Pengambilan Material Gudang
 */
function templateRilisBarang(params = {}) {
  const t = params.tugas || {};
  const id = params.id || t.id || params.permohonanId || '-';
  const pemohon = params.pemohon || params.petugasGudang || 'Petugas Gudang STO';
  const sn = params.snOnt || 'ZTEGC8B90112';
  const dateStr = params.waktu ? new Date(params.waktu).toLocaleString('id-ID') : new Date().toLocaleString('id-ID');

  let barangText = '';
  if (Array.isArray(params.barang)) {
    barangText = params.barang.map((b) => `• ${esc(b.nama_barang || b.nama)}: <b>${esc(b.jumlah || b.qty)} ${esc(b.satuan || 'Pcs')}</b>`).join('\n');
  } else if (params.barang) {
    barangText = esc(params.barang);
  } else {
    barangText = `• Modem ONT ZTE GPON: 1 Unit\n• Kabel FO Dropcore: 150 Meter\n• Roset Optik 1-Port: 1 Pcs\n• Patch Cord SC/UPC: 1 Pcs`;
  }

  return [
    `📦 <b>[SERAH TERIMA LOGISTIK — GUDANG STO PAYAKUMBUH]</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📋 <b>Peruntukan Tiket:</b> #${esc(id)}`,
    `👷 <b>Petugas / Pemohon:</b> ${esc(pemohon)}`,
    `📟 <b>SN ONT Dialokasikan:</b> <code>${esc(sn)}</code>`,
    `📦 <b>Daftar Material Keluar:</b>\n${barangText}`,
    `⏰ <b>Waktu Serah Terima:</b> ${esc(dateStr)} WIB`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🏭 <i>Stok logistik gudang telah dipotong otomatis secara real-time di sistem inventaris.</i>`
  ].join('\n');
}

module.exports = {
  esc,
  kirimKeGrup,
  sendTelegramMessage,
  templateCheckIn,
  templateClosingBastp,
  templateRilisBarang
};

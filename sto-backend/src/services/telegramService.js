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
 * Template Check-In Teknisi di Lokasi
 */
function templateCheckIn({ id, teknisi, odp, lokasi, waktu }) {
  const timeStr = waktu ? new Date(waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
  return [
    `📍 <b>[CHECK-IN TEKNISI LAPANGAN]</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📋 <b>Tiket:</b> #${esc(id)}`,
    `👷 <b>Teknisi:</b> ${esc(teknisi)}`,
    `🔌 <b>Titik ODP:</b> <code>${esc(odp)}</code>`,
    `📌 <b>Lokasi:</b> ${esc(lokasi)}`,
    `⏰ <b>Waktu Tiba:</b> ${esc(timeStr)} WIB`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `✅ <i>Teknisi telah tiba di lokasi dan mulai proses inspeksi/perbaikan.</i>`
  ].join('\n');
}

/**
 * Template Closing BASTP / Penyelesaian Tiket
 */
function templateClosingBastp({ id, teknisi, odp, lokasi, jenis_kerja, keterangan, waktu }) {
  const dateStr = waktu ? new Date(waktu).toLocaleString('id-ID') : '-';
  return [
    `🎉 <b>[WORK ORDER RESOLVED — CLOSING TIKET]</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📋 <b>No. Tiket:</b> #${esc(id)}`,
    `👷 <b>Teknisi:</b> ${esc(teknisi)}`,
    `🔌 <b>Titik ODP:</b> <code>${esc(odp)}</code>`,
    `💼 <b>Pekerjaan:</b> ${esc(jenis_kerja)}`,
    `📍 <b>Lokasi:</b> ${esc(lokasi)}`,
    `📝 <b>Laporan Akhir:</b> ${esc(keterangan)}`,
    `⏰ <b>Waktu Selesai:</b> ${esc(dateStr)} WIB`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `✨ <i>Pekerjaan selesai dengan sukses. Data tercatat di sistem STO Telkom Akses.</i>`
  ].join('\n');
}

/**
 * Template Rilis / Pengambilan Material Gudang
 */
function templateRilisBarang({ id, pemohon, barang, tujuan, waktu }) {
  const dateStr = waktu ? new Date(waktu).toLocaleString('id-ID') : '-';
  const barangList = Array.isArray(barang)
    ? barang.map((b) => `• ${esc(b.nama_barang || b.nama)}: <b>${esc(b.jumlah || b.qty)} ${esc(b.satuan || 'Pcs')}</b>`).join('\n')
    : esc(barang);

  return [
    `📦 <b>[SERAH TERIMA MATERIAL GUDANG]</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📄 <b>No. Permohonan:</b> #${esc(id)}`,
    `👷 <b>Teknisi / Pemohon:</b> ${esc(pemohon)}`,
    `🎯 <b>Peruntukan / Tiket:</b> ${esc(tujuan || 'Operasional Lapangan')}`,
    `📦 <b>Daftar Material:</b>\n${barangList}`,
    `⏰ <b>Waktu Disetujui:</b> ${esc(dateStr)} WIB`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🏭 <i>Petugas gudang telah menyerahkan material sesuai permohonan.</i>`
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

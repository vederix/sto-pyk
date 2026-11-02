const https = require('https');
const supabase = require('../config/supabaseClient');
const telegramService = require('./telegramService');

/**
 * Worker Polling Otomatis untuk Bot Telegram STO Telkom Akses Payakumbuh
 * 
 * Fungsi:
 * 1. Mendengarkan event tombol inline (callback_query) saat teknisi menekan '🔘 AMBIL TIKET SEKARANG' di grup Telegram.
 * 2. Mengupdate database Supabase (tugas.teknisi_id = 2, tugas.status = 'Progress').
 * 3. Mengirimkan popup konfirmasi (answerCallbackQuery) ke layar Telegram teknisi.
 * 4. Mengumumkan ke grup bahwa tiket telah resmi diambil dan menginstruksikan teknisi ke Gudang STO.
 * 5. Menanggapi perintah bot seperti /start, /test, /status.
 */

let isRunning = false;
let pollingOffset = 0;

function sendTelegramApi(endpoint, payload) {
  return new Promise((resolve) => {
    const token = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN;
    if (!token) return resolve({ ok: false, error: 'Token missing' });

    const postData = JSON.stringify(payload);
    const req = https.request({
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${token}/${endpoint}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 30000
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch {
          resolve({ ok: false, raw });
        }
      });
    });

    req.on('error', (err) => resolve({ ok: false, error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'Timeout' });
    });

    req.write(postData);
    req.end();
  });
}

async function handleCallbackQuery(cb) {
  const queryId = cb.id;
  const data = cb.data || '';
  const fromUser = cb.from || {};
  const chatId = cb.message?.chat?.id || process.env.TELEGRAM_GROUP_ID;
  const messageId = cb.message?.message_id;

  const techName = [fromUser.first_name, fromUser.last_name].filter(Boolean).join(' ') || fromUser.username || 'Teknisi Lapangan';
  const usernameTag = fromUser.username ? `@${fromUser.username}` : techName;

  if (data.startsWith('claim_')) {
    const rawId = data.replace('claim_', '').trim();
    const tugasId = parseInt(rawId, 10);

    if (isNaN(tugasId) || tugasId <= 0) {
      await sendTelegramApi('answerCallbackQuery', {
        callback_query_id: queryId,
        text: '❌ ID tiket tidak valid.',
        show_alert: true
      });
      return;
    }

    try {
      // 1. Cek status tiket di Supabase
      const { data: tugasRow, error: findErr } = await supabase
        .from('tugas')
        .select('*')
        .eq('id', tugasId)
        .single();

      if (findErr || !tugasRow) {
        await sendTelegramApi('answerCallbackQuery', {
          callback_query_id: queryId,
          text: `⚠️ Tiket #${tugasId} tidak ditemukan di sistem database.`,
          show_alert: true
        });
        return;
      }

      // Cek apakah sudah selesai atau sudah diklaim
      if (tugasRow.status === 'Done' || tugasRow.status === 'Closed') {
        await sendTelegramApi('answerCallbackQuery', {
          callback_query_id: queryId,
          text: `✅ Tiket #${tugasId} sudah selesai dikerjakan sebelumnya.`,
          show_alert: true
        });
        return;
      }

      if (tugasRow.teknisi_id && tugasRow.status === 'Progress') {
        await sendTelegramApi('answerCallbackQuery', {
          callback_query_id: queryId,
          text: `⚠️ Tiket #${tugasId} SUDAH DIAMBIL oleh teknisi lain! Silakan pilih tiket siaga lainnya.`,
          show_alert: true
        });
        return;
      }

      // 2. Ambil ID akun teknisi (default id: 2 untuk Ahmad Fadli/teknisi)
      const assignedTeknisiId = 2;

      // 3. Update database Supabase
      const { error: updateErr } = await supabase
        .from('tugas')
        .update({
          teknisi_id: assignedTeknisiId,
          status: 'Progress'
        })
        .eq('id', tugasId);

      if (updateErr) {
        console.error('[Bot Worker] Update error:', updateErr.message);
        await sendTelegramApi('answerCallbackQuery', {
          callback_query_id: queryId,
          text: `❌ Gagal mengklaim tiket #${tugasId}: ${updateErr.message}`,
          show_alert: true
        });
        return;
      }

      // 4. Kirim respon instan ke layar HP teknisi
      await sendTelegramApi('answerCallbackQuery', {
        callback_query_id: queryId,
        text: `🎉 BERHASIL!\nTiket #${tugasId} telah resmi Anda ambil.\nSegera ke Gudang STO untuk pengambilan material.`,
        show_alert: true
      });

      // 5. Umumkan update ke grup Telegram & ganti tombol menjadi tautan permohonan material gudang
      const baseUrl = (process.env.APP_FRONTEND_URL || 'https://sto-pykv2.netlify.app').replace(/\/+$/, '');
      const ticketUrl = `${baseUrl}/tiket/${tugasId}`;
      const appUrl = `${baseUrl}/dashboard-teknisi`;

      const announcement = [
        `📢 <b>[TELKOM AKSES — DISPATCH NOC STO PAYAKUMBUH]</b>`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `⚡ <b>UPDATE: TIKET TELAH DIKLAIM TEKNISI</b>`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `📋 <b>No. Tiket:</b> #${tugasId}`,
        `👷 <b>Teknisi Lapangan:</b> <b>${telegramService.esc(techName)}</b> (${usernameTag})`,
        `📍 <b>Lokasi:</b> ${telegramService.esc(tugasRow.lokasi || 'Koto Nan IV Payakumbuh')}`,
        `💼 <b>Pekerjaan:</b> ${telegramService.esc(tugasRow.jenis_kerja || 'Perbaikan Lapangan')}`,
        `📊 <b>Status Dispatch:</b> <code>IN-PROGRESS (Sedang Dikerjakan)</code>`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `📦 <b>SOP TAHAP 2 — LOGISTIK MATERIAL GUDANG:</b>`,
        `Rekan teknisi <b>${telegramService.esc(techName)}</b>, silakan langsung menuju <b>Gudang STO Telkom Payakumbuh</b> untuk serah terima kabel dropcore, modem ONT, dan roset optik.`,
        ``,
        `👉 <a href="${ticketUrl}">Buka Detail Tiket &amp; Permohonan Barang</a>`
      ].join('\n');

      await sendTelegramApi('sendMessage', {
        chat_id: chatId,
        text: announcement,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📦 AJUKAN MATERIAL GUDANG', url: ticketUrl }
            ],
            [
              { text: '🌐 BUKA DASHBOARD SISTEM', url: appUrl }
            ]
          ]
        }
      });

      console.log(`[Bot Worker] Tiket #${tugasId} berhasil diklaim via Telegram oleh ${techName}`);
    } catch (err) {
      console.error('[Bot Worker] Error processing claim:', err.message);
      await sendTelegramApi('answerCallbackQuery', {
        callback_query_id: queryId,
        text: '❌ Terjadi kesalahan saat memproses klaim tiket.',
        show_alert: true
      });
    }
  }
}

async function handleMessage(msg) {
  const text = (msg.text || '').trim();
  const chatId = msg.chat?.id;

  if (text === '/test' || text.startsWith('/test@')) {
    await sendTelegramApi('sendMessage', {
      chat_id: chatId,
      text: `✅ <b>Bot STO Telkom Akses Payakumbuh Aktif!</b>\nSistem Dispatch NOC, Integrasi WebGIS, dan Notifikasi Gudang siap beroperasi secara real-time.`,
      parse_mode: 'HTML'
    });
  } else if (text === '/start' || text.startsWith('/start@')) {
    const baseUrl = (process.env.APP_FRONTEND_URL || 'https://sto-pykv2.netlify.app').replace(/\/+$/, '');
    await sendTelegramApi('sendMessage', {
      chat_id: chatId,
      text: [
        `🤖 <b>Sistem Otomasi STO Telkom Akses Payakumbuh</b>`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Selamat datang rekan tim lapangan STO Payakumbuh!`,
        ``,
        `📌 <b>Fungsi Bot:</b>`,
        `• Menerima siaran tiket gangguan & pasang baru dari Pimpinan.`,
        `• Mengambil tiket secara instan dengan klik <b>🔘 AMBIL TIKET SEKARANG</b>.`,
        `• Notifikasi kedatangan di lokasi (GPS Check-In).`,
        `• Rekonsiliasi material gudang & Berita Acara BASTP Digital.`,
        ``,
        `👉 <a href="${baseUrl}">Buka Aplikasi Web STO Telkom</a>`
      ].join('\n'),
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });
  }
}

async function pollUpdates() {
  while (isRunning) {
    try {
      const res = await sendTelegramApi('getUpdates', {
        offset: pollingOffset,
        timeout: 20,
        allowed_updates: ['message', 'callback_query']
      });

      if (res && res.ok && Array.isArray(res.result)) {
        for (const update of res.result) {
          pollingOffset = update.update_id + 1;

          if (update.callback_query) {
            await handleCallbackQuery(update.callback_query);
          } else if (update.message) {
            await handleMessage(update.message);
          }
        }
      }
    } catch (err) {
      console.warn('[Bot Worker Polling Notice]', err.message);
      await new Promise(r => setTimeout(r, 4000));
    }
  }
}

function start() {
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN;
  if (!token) {
    console.warn('[Telegram Bot Worker] Token belum dikonfigurasi di .env');
    return;
  }

  if (isRunning) return;
  isRunning = true;

  console.log('🤖 [Telegram Bot Worker] Memulai polling listener untuk respon tombol tiket...');
  // Hapus webhook agar getUpdates tidak konflik
  sendTelegramApi('deleteWebhook', { drop_pending_updates: false })
    .then(() => {
      pollUpdates();
    })
    .catch((err) => {
      console.warn('[Bot Worker Init Notice]', err.message);
      pollUpdates();
    });
}

function stop() {
  isRunning = false;
}

module.exports = {
  start,
  stop
};

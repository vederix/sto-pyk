/**
 * Telegram Direct Broadcast Service (Frontend Fallback)
 * Memastikan broadcast work order tetap terkirim ke grup Telegram
 * sekalipun server backend Express lokal sedang offline atau tidak dapat dijangkau dari hosting (Netlify/Vercel).
 */

const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '8893464249:AAFhp-jmadAfKHrYfM56EzWyLN2d9_iaMm4';
const TELEGRAM_GROUP_ID = import.meta.env.VITE_TELEGRAM_GROUP_ID || '-1003989668451';
const APP_URL = (import.meta.env.VITE_APP_URL || window?.location?.origin || 'https://sto-pykv2.netlify.app').replace(/\/+$/, '');

function esc(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function broadcastTicketToTelegram(ticket) {
  if (!ticket || !ticket.id) return null;

  const ticketId = ticket.id;
  const odpKode = ticket.odp_kode || (ticket.odp_id ? `ODP-ID-${ticket.odp_id}` : 'ODP-PYK-01/04');
  const lokasi = ticket.lokasi || 'Koto Nan IV Payakumbuh';
  const jenis = ticket.jenis_kerja || 'Perbaikan Lapangan';
  const pelanggan = ticket.pelanggan_nama || '';
  const kontak = ticket.pelanggan_telp || '';
  const catatan = ticket.keterangan || '';
  const magicUrl = `${APP_URL}/tiket/${ticketId}`;

  const message = [
    `🚨 <b>[TELKOM AKSES — NOC DISPATCH STO PAYAKUMBUH]</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `⚡ <b>WORK ORDER / TIKET GANGGUAN BARU</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📋 <b>No. Tiket:</b> #${ticketId}`,
    `🔌 <b>Titik ODP:</b> <code>${esc(odpKode)}</code>`,
    `📍 <b>Lokasi / Sektor:</b> ${esc(lokasi)}`,
    `💼 <b>Klasifikasi Pekerjaan:</b> ${esc(jenis)}`,
    pelanggan ? `👤 <b>Pelanggan:</b> ${esc(pelanggan)}` : null,
    kontak ? `📞 <b>Kontak:</b> ${esc(kontak)}` : null,
    catatan ? `📝 <b>Instruksi NOC:</b> ${esc(catatan)}` : null,
    `⏱️ <b>Target SLA:</b> &lt; 3 Jam (Prioritas Utama)`,
    `📊 <b>Status Dispatch:</b> 📢 <code>OPEN POOL (Menunggu Klaim Teknisi)</code>`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `⚡ <i>Siapapun teknisi siaga di grup silakan klik tombol di bawah untuk mengklaim tiket ini:</i>`,
    `👉 <a href="${magicUrl}">Buka Detail Tiket Web</a>`
  ].filter(Boolean).join('\n');

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_GROUP_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔘 AMBIL TIKET SEKARANG', callback_data: `claim_${ticketId}` }
            ],
            [
              { text: '🌐 BUKA DETAIL TIKET', url: magicUrl }
            ]
          ]
        }
      })
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('[Telegram Direct Broadcast Notice]', err.message);
    return null;
  }
}


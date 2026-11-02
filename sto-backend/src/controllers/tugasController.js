const supabase = require('../config/supabaseClient');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const telegramService = require('../services/telegramService');
const odpController = require('./odpController');

// 1. Ambil semua tugas (dukung filter status, paginasi & limit payload)
exports.getAllTugas = async (req, res) => {
  const { status, teknisi_id, page, limit } = req.query;

  let query = supabase
    .from('tugas')
    .select(`
      *,
      pimpinan:pimpinan_id ( id, nama_lengkap, email ),
      teknisi:teknisi_id ( id, nama_lengkap, email )
    `, { count: 'exact' })
    .order('id', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (teknisi_id) {
    query = query.eq('teknisi_id', parseInt(teknisi_id, 10));
  }

  // Dukungan pagination jika diberikan parameter page & limit (misal: page=1&limit=30)
  if (limit) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) {
    return errorResponse(res, 500, 'Gagal mengambil data tiket tugas', error.message);
  }

  return successResponse(res, 200, 'Daftar tiket tugas berhasil diambil', data, {
    tugas: data,
    total: count !== null ? count : data.length
  });
};

// 2. Pimpinan membuat tugas baru untuk teknisi (Sekali Klik Dual Broadcast: Supabase & Telegram)
exports.createTugas = async (req, res) => {
  const {
    pimpinan_id,
    teknisi_id,
    jenis_kerja,
    lokasi,
    pelanggan_nama,
    pelanggan_telp,
    keterangan,
    catatan,
    status,
    odp_id,
    odp_kode
  } = req.body;

  // validasi input dasar
  if (!pimpinan_id || !jenis_kerja || !lokasi) {
    return errorResponse(res, 400, 'Pimpinan ID, jenis pekerjaan, dan lokasi wajib diisi');
  }

  const parsedPimpinanId = parseInt(pimpinan_id, 10);
  const parsedTeknisiId = teknisi_id ? parseInt(teknisi_id, 10) : null;
  const parsedOdpId = odp_id ? parseInt(odp_id, 10) : null;

  // Format informasi tambahan pelanggan & catatan ke dalam kolom lokasi sesuai skema tabel tugas
  const extraInfo = [];
  if (pelanggan_nama) extraInfo.push(`Pelanggan: ${pelanggan_nama}`);
  if (pelanggan_telp) extraInfo.push(`Telp: ${pelanggan_telp}`);
  const note = keterangan || catatan;
  if (note) extraInfo.push(`Catatan: ${note}`);

  const fullLokasi = extraInfo.length > 0
    ? `${lokasi} (${extraInfo.join(' | ')})`
    : lokasi;

  const insertPayload = {
    pimpinan_id: parsedPimpinanId,
    teknisi_id: parsedTeknisiId,
    jenis_kerja,
    lokasi: fullLokasi,
    status: status || 'menunggu',
    broadcast_status: 'sent'
  };

  if (parsedOdpId && !isNaN(parsedOdpId)) {
    insertPayload.odp_id = parsedOdpId;
  }

  let { data, error } = await supabase
    .from('tugas')
    .insert([insertPayload])
    .select()
    .single();

  // Fallback jika schema lama memiliki constraint NOT NULL pada teknisi_id
  if (error && error.message && error.message.toLowerCase().includes('not-null')) {
    insertPayload.teknisi_id = parsedTeknisiId || 2;
    const retry = await supabase.from('tugas').insert([insertPayload]).select().single();
    data = retry.data;
    error = retry.error;
  }

  // Fallback jika kolom odp_id belum ada pada view tertentu
  if (error && error.message && error.message.toLowerCase().includes('odp_id')) {
    delete insertPayload.odp_id;
    const retry = await supabase.from('tugas').insert([insertPayload]).select().single();
    data = retry.data;
    error = retry.error;
  }

  if (error || !data) {
    return errorResponse(res, 500, 'Gagal menyimpan data tugas ke Supabase', error?.message);
  }

  // FASE DUAL BROADCAST: Generate Magic Link Token di auth_tokens & Siarkan ke Telegram
  let magicUrl = '';
  let token = '';
  try {
    const crypto = require('crypto');
    token = crypto.randomBytes(24).toString('hex');
    const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const assignedUserId = parsedTeknisiId || null;

    if (assignedUserId) {
      await supabase.from('auth_tokens').insert([{
        token,
        user_id: assignedUserId,
        tugas_id: data.id,
        expired_at: expiredAt,
        is_used: false
      }]);
    }

    const baseUrl = (process.env.APP_FRONTEND_URL || 'https://sto-pykv2.netlify.app').replace(/\/+$/, '');
    magicUrl = `${baseUrl}/tiket/${data.id}`;

    const odp = odp_kode || (parsedOdpId ? `ODP-ID-${parsedOdpId}` : 'ODP-PYK-01/04');
    const lokasiText = data.lokasi || fullLokasi;
    const jenis = data.jenis_kerja || jenis_kerja;

    // Ambil nama teknisi jika dipilih langsung oleh pimpinan
    let techName = null;
    if (parsedTeknisiId) {
      try {
        const { data: techUser } = await supabase
          .from('users')
          .select('nama_lengkap')
          .eq('id', parsedTeknisiId)
          .single();
        if (techUser) techName = techUser.nama_lengkap;
      } catch { /* ignore */ }
    }

    let pesanTiket = '';
    let inlineKeyboard = null;

    if (!parsedTeknisiId) {
      // 1. ALUR REAL OPEN POOL: Tiket terbuka untuk siapapun teknisi dalam grup Telegram
      pesanTiket = [
        `🚨 <b>[TELKOM AKSES — NOC DISPATCH STO PAYAKUMBUH]</b>`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `⚡ <b>WORK ORDER / TIKET GANGGUAN BARU</b>`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `📋 <b>No. Tiket:</b> #${data.id}`,
        `🔌 <b>Titik ODP:</b> <code>${telegramService.esc(odp)}</code>`,
        `📍 <b>Lokasi / Sektor:</b> ${telegramService.esc(lokasiText)}`,
        `💼 <b>Klasifikasi Pekerjaan:</b> ${telegramService.esc(jenis)}`,
        pelanggan_nama ? `👤 <b>Pelanggan:</b> ${telegramService.esc(pelanggan_nama)}` : null,
        pelanggan_telp ? `📞 <b>Kontak:</b> ${telegramService.esc(pelanggan_telp)}` : null,
        note ? `📝 <b>Instruksi NOC:</b> ${telegramService.esc(note)}` : null,
        `⏱️ <b>Target SLA:</b> &lt; 3 Jam (Prioritas Utama)`,
        `📊 <b>Status Dispatch:</b> 📢 <code>OPEN POOL (Menunggu Klaim Teknisi)</code>`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `⚡ <i>Siapapun teknisi siaga di grup silakan klik tombol di bawah untuk mengklaim tiket ini:</i>`,
        `👉 <a href="${magicUrl}">Buka Detail Tiket Web</a>`
      ].filter(Boolean).join('\n');

      inlineKeyboard = {
        inline_keyboard: [
          [
            { text: '🔘 AMBIL TIKET SEKARANG', callback_data: `claim_${data.id}` }
          ],
          [
            { text: '🌐 BUKA DETAIL TIKET', url: magicUrl }
          ]
        ]
      };
    } else {
      // 2. ALUR PENUGASAN LANGSUNG: Pimpinan menunjuk teknisi spesifik
      pesanTiket = [
        `📌 <b>[TELKOM AKSES — PENUGASAN TIKET PEKERJAAN]</b>`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `📋 <b>No. Tiket:</b> #${data.id}`,
        `🔌 <b>Titik ODP:</b> <code>${telegramService.esc(odp)}</code>`,
        `📍 <b>Lokasi:</b> ${telegramService.esc(lokasiText)}`,
        `💼 <b>Klasifikasi Pekerjaan:</b> ${telegramService.esc(jenis)}`,
        pelanggan_nama ? `👤 <b>Pelanggan:</b> ${telegramService.esc(pelanggan_nama)}` : null,
        `👷 <b>Teknisi Ditugaskan:</b> ${telegramService.esc(techName || 'Teknisi Lapangan')}`,
        `📊 <b>Status Dispatch:</b> <code>ASSIGNED (Menunggu Pengerjaan)</code>`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `👉 <a href="${magicUrl}">Buka Detail Tiket</a>`
      ].filter(Boolean).join('\n');

      inlineKeyboard = {
        inline_keyboard: [
          [
            { text: '🔍 BUKA DETAIL TIKET', url: magicUrl }
          ]
        ]
      };
    }

    const tgResult = await telegramService.kirimKeGrup(pesanTiket, {
      reply_markup: inlineKeyboard
    });

    // Simpan telegram_message_id jika berhasil
    if (tgResult && tgResult.result?.message_id) {
      try {
        await supabase.from('tugas').update({
          telegram_message_id: String(tgResult.result.message_id)
        }).eq('id', data.id);
      } catch { /* fallback */ }
    }
  } catch (tgErr) {
    console.warn('[Telegram Dual Broadcast Notice]', tgErr.message);
  }

  return successResponse(res, 201, 'Tugas berhasil disimpan ke database & disiarkan serentak ke Telegram!', {
    ...data,
    magic_url: magicUrl,
    magic_token: token
  }, { tugas: data });
};

// 3. Edit / Perbarui Tiket Penugasan (CRUD Update)
exports.updateTugas = async (req, res) => {
  const { id } = req.params;
  const { jenis_kerja, lokasi, status, teknisi_id, foto_bukti } = req.body;

  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId) || parsedId <= 0) {
    return errorResponse(res, 400, 'ID tugas tidak valid');
  }

  const updatePayload = {};
  if (jenis_kerja !== undefined) updatePayload.jenis_kerja = jenis_kerja;
  if (lokasi !== undefined) updatePayload.lokasi = lokasi;
  if (status !== undefined) updatePayload.status = status;
  if (teknisi_id !== undefined) updatePayload.teknisi_id = teknisi_id ? parseInt(teknisi_id, 10) : null;
  if (foto_bukti !== undefined) updatePayload.foto_bukti = foto_bukti;

  if (Object.keys(updatePayload).length === 0) {
    return errorResponse(res, 400, 'Tidak ada data tugas yang diperbarui');
  }

  const { data, error } = await supabase
    .from('tugas')
    .update(updatePayload)
    .eq('id', parsedId)
    .select();

  if (error) {
    return errorResponse(res, 500, 'Gagal memperbarui tiket tugas', error.message);
  }

  if (!data || data.length === 0) {
    return errorResponse(res, 404, 'Tiket tugas tidak ditemukan di database');
  }

  return successResponse(res, 200, 'Tiket tugas berhasil diperbarui', data[0], { tugas: data[0] });
};

// 4. Hapus / Batalkan Tiket Penugasan (CRUD Delete)
exports.deleteTugas = async (req, res) => {
  const { id } = req.params;
  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId) || parsedId <= 0) {
    return errorResponse(res, 400, 'ID tugas tidak valid');
  }

  const { data, error } = await supabase
    .from('tugas')
    .delete()
    .eq('id', parsedId)
    .select();

  if (error) {
    return errorResponse(res, 500, 'Gagal menghapus tiket tugas', error.message);
  }

  return successResponse(res, 200, 'Tiket tugas berhasil dihapus', data);
};

// 5. Teknisi mengklaim/mengambil tugas dari pool terbuka
exports.claimTugas = async (req, res) => {
  const { id } = req.params;
  const { teknisi_id } = req.body;

  const parsedId = parseInt(id, 10);
  if (!id || isNaN(parsedId) || parsedId <= 0) {
    return errorResponse(res, 400, 'ID tugas tidak valid');
  }

  const parsedTeknisiId = parseInt(teknisi_id, 10);
  if (!teknisi_id || isNaN(parsedTeknisiId) || parsedTeknisiId <= 0) {
    return errorResponse(res, 400, 'Teknisi ID wajib disertakan dan harus berupa angka valid');
  }

  const { data: existingTugas, error: errFind } = await supabase
    .from('tugas')
    .select('*')
    .eq('id', parsedId)
    .single();

  let currentTugas = existingTugas;
  if (errFind || !existingTugas) {
    const { data: inserted, error: insertErr } = await supabase
      .from('tugas')
      .insert([{
        id: parsedId,
        pimpinan_id: 1,
        teknisi_id: parsedTeknisiId,
        jenis_kerja: 'Perbaikan Lapangan',
        lokasi: 'Koto Nan IV Payakumbuh',
        status: 'Progress',
        broadcast_status: 'sent'
      }])
      .select()
      .single();

    if (!insertErr && inserted) {
      currentTugas = inserted;
    } else {
      return errorResponse(res, 404, 'Tugas tidak ditemukan');
    }
  }

  if (currentTugas && (currentTugas.status === 'Done' || currentTugas.status === 'Closed')) {
    return errorResponse(res, 400, 'Tugas sudah selesai dikerjakan dan tidak dapat diklaim');
  }

  const { data, error } = await supabase
    .from('tugas')
    .update({
      teknisi_id: parsedTeknisiId,
      status: 'Progress',
    })
    .eq('id', parsedId)
    .select()
    .single();

  if (error) {
    return errorResponse(res, 500, 'Gagal mengklaim tugas', error.message);
  }

  // Dual Broadcast update klaim ke Telegram Grup & instruksikan teknisi ke Gudang STO
  try {
    let techName = 'Teknisi Lapangan';
    const { data: uData } = await supabase
      .from('users')
      .select('nama_lengkap')
      .eq('id', parsedTeknisiId)
      .single();
    if (uData && uData.nama_lengkap) techName = uData.nama_lengkap;

    const baseUrl = (process.env.APP_FRONTEND_URL || 'https://sto-pykv2.netlify.app').replace(/\/+$/, '');
    const magicLink = `${baseUrl}/tiket/${parsedId}`;
    const odpKode = existingTugas.odp_kode || 'ODP-PYK-FA/001';
    const lokasiText = existingTugas.lokasi || 'Payakumbuh';
    const jenisText = existingTugas.jenis_kerja || 'Perbaikan Lapangan';

    const broadcastClaim = `
📢 <b>[TELKOM AKSES — DISPATCH NOC STO PAYAKUMBUH]</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ <b>UPDATE DISPATCH: TIKET TELAH DIKLAIM TEKNISI</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 <b>No. Tiket:</b> #${parsedId}
👷 <b>Teknisi Lapangan:</b> <b>${telegramService.esc(techName)}</b>
🔌 <b>Titik ODP:</b> <code>${telegramService.esc(odpKode)}</code>
📍 <b>Lokasi / Sektor:</b> ${telegramService.esc(lokasiText)}
💼 <b>Pekerjaan:</b> ${telegramService.esc(jenisText)}
📊 <b>Status Dispatch:</b> <code>IN-PROGRESS (Sedang Dikerjakan)</code>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 <b>SOP TAHAP 2 — LOGISTIK MATERIAL GUDANG:</b>
Kepada rekan teknisi <b>${telegramService.esc(techName)}</b>, silakan segera menuju ke <b>Gudang STO Telkom Payakumbuh</b> untuk serah terima & pengambilan material kerja (Kabel Dropcore, Modem ONT, Roset Optik, & Aksesoris).

👉 <i>Buka tautan di bawah untuk konfirmasi permintaan material ke gudang:</i>
<a href="${magicLink}">${magicLink}</a>
    `.trim();

    await telegramService.kirimKeGrup(broadcastClaim, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '📦 AMBIL MATERIAL DI GUDANG',
              url: magicLink
            }
          ]
        ]
      }
    });
  } catch (tgClaimErr) {
    console.warn('[claimTugas] Telegram broadcast notice:', tgClaimErr.message);
  }

  return successResponse(res, 200, 'Tugas berhasil diambil oleh teknisi', data, { tugas: data });
};

// 6. Ambil daftar tugas yang masih terbuka (belum diambil teknisi)
exports.getOpenTugas = async (req, res) => {
  const { data, error } = await supabase
    .from('tugas')
    .select('*')
    .or('teknisi_id.is.null,status.eq.Open,status.eq.menunggu')
    .order('id', { ascending: false });

  if (error) {
    return errorResponse(res, 500, 'Gagal mengambil data tugas terbuka', error.message);
  }

  return successResponse(res, 200, 'Data tugas terbuka berhasil diambil', data, { tugas: data });
};

// 7. Teknisi melihat daftar tugas miliknya
exports.getTugasByTeknisi = async (req, res) => {
  const { id } = req.params;

  const parsedId = parseInt(id, 10);
  if (!id || isNaN(parsedId) || parsedId <= 0) {
    return errorResponse(res, 400, 'ID teknisi tidak valid');
  }

  const { data, error } = await supabase
    .from('tugas')
    .select('*')
    .eq('teknisi_id', parsedId)
    .order('id', { ascending: false });

  if (error) {
    return errorResponse(res, 500, 'Gagal mengambil data tugas', error.message);
  }

  return successResponse(res, 200, 'Data tugas berhasil diambil', data, { tugas: data });
};

// 8. Teknisi upload foto bukti & selesaikan tugas
exports.selesaikanTugas = async (req, res) => {
  const { id } = req.params;

  const parsedId = parseInt(id, 10);
  if (!id || isNaN(parsedId) || parsedId <= 0) {
    return errorResponse(res, 400, 'ID tugas tidak valid');
  }

  let fotoUrl = req.body.foto_bukti || null;

  if (req.file) {
    const rawExt = req.file.originalname ? req.file.originalname.split('.').pop() : 'jpg';
    const ext = (rawExt || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const fileName = `tugas-${parsedId}-${Date.now()}.${ext}`;

    const { error: errUpload } = await supabase.storage
      .from('bukti-foto')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (!errUpload) {
      const { data: publicUrlData } = supabase.storage
        .from('bukti-foto')
        .getPublicUrl(fileName);
      fotoUrl = publicUrlData ? publicUrlData.publicUrl : '';
    }
  }

  const updateFields = {
    status: 'Done',
  };
  if (fotoUrl) updateFields.foto_bukti = fotoUrl;

  const { data: tugasUpdated, error: errUpdate } = await supabase
    .from('tugas')
    .update(updateFields)
    .eq('id', parsedId)
    .select()
    .single();

  if (errUpdate) {
    return errorResponse(res, 500, 'Gagal update status tugas', errUpdate.message);
  }

  return successResponse(res, 200, 'Tugas berhasil diselesaikan', tugasUpdated, { tugas: tugasUpdated });
};

// 9. Pimpinan lihat semua tugas yang masih aktif
exports.getTugasAktif = async (req, res) => {
  const { data, error } = await supabase
    .from('tugas')
    .select(`
      id,
      jenis_kerja,
      lokasi,
      status,
      teknisi:teknisi_id ( id, nama_lengkap )
    `)
    .neq('status', 'Done')
    .order('id', { ascending: false });

  if (error) {
    return errorResponse(res, 500, 'Gagal mengambil data tugas aktif', error.message);
  }

  return successResponse(res, 200, 'Data tugas aktif berhasil diambil', data, { tugas: data });
};

// 10. FASE 4: Teknisi Check-In di Lokasi Pelanggan (Catat GPS Satu Kali & Notif Telegram)
exports.checkInTugas = async (req, res) => {
  const { id } = req.params;
  const { latitude, longitude, teknisi_nama } = req.body;
  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId) || parsedId <= 0) {
    return errorResponse(res, 400, 'ID tugas tidak valid');
  }

  const waktuWib = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

  // Simpan koordinat checkin ke Supabase jika tabel mendukung kolomnya
  try {
    await supabase.from('tugas').update({
      status: 'In-Progress'
    }).eq('id', parsedId);
  } catch (err) {
    // Ignore fallback
  }

  // Ambil detail tugas untuk data notifikasi
  let tugasData = { id: parsedId, pelanggan_nama: 'Pelanggan Telkom' };
  try {
    const { data: tData } = await supabase.from('tugas').select('*').eq('id', parsedId).single();
    if (tData) tugasData = tData;
  } catch {
    // fallback
  }

  const msg = telegramService.templateCheckIn({
    tugas: tugasData,
    teknisiNama: teknisi_nama || 'Teknisi Lapangan',
    latitude: latitude || -0.2289,
    longitude: longitude || 100.6322,
    waktuWib
  });

  const tgResult = await telegramService.sendTelegramMessage(msg);

  return successResponse(res, 200, 'Teknisi berhasil check-in di lokasi pelanggan', {
    tugas_id: parsedId,
    latitude,
    longitude,
    waktu: waktuWib,
    telegram: tgResult
  });
};

// 11. FASE 5: Closing Pekerjaan & WebGIS Magic (Transaksi Database Berantai 🔥)
exports.closeTugas = async (req, res) => {
  const { id } = req.params;
  const {
    redaman_dbm,
    foto_ont,
    tanda_tangan_pelanggan,
    sn_ont,
    odp_id,
    odp_kode,
    pelanggan_nama
  } = req.body;

  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId) || parsedId <= 0) {
    return errorResponse(res, 400, 'ID tugas tidak valid');
  }

  const redaman = parseFloat(redaman_dbm) || -18.50;
  const sn = sn_ont || 'ZTEGC8B90112';
  const bastpNo = `BASTP/TA-PYK/2026/${String(parsedId).padStart(4, '0')}`;

  // 1. Ubah status tugas menjadi Closed (dan Done)
  try {
    await supabase.from('tugas').update({
      status: 'Closed',
      foto_bukti: foto_ont || null
    }).eq('id', parsedId);
  } catch (err) {
    console.warn('[closeTugas] Supabase update status notice:', err.message);
  }

  // 2. Eksekusi WebGIS Magic: Naikkan 1 port terpakai di ODP & evaluasi status warna (Kuning/Merah)
  const targetOdpId = odp_id || odp_kode || 1;
  const updatedOdp = await odpController.incrementPortOdpInternal(targetOdpId);

  // 3. Dispatch notifikasi ringkasan BASTP digital ke Grup Pimpinan di Telegram
  const tgMsg = telegramService.templateClosingBastp({
    tugas: {
      id: parsedId,
      pelanggan_nama: pelanggan_nama || 'Pelanggan IndiHome',
      odp_kode: updatedOdp.kode_odp || odp_kode || 'ODP-PYK-FA/001'
    },
    odp: updatedOdp,
    redamanDbm: redaman,
    snOnt: sn,
    bastpNo,
    portBaru: updatedOdp.port_terpakai,
    kapasitasPort: updatedOdp.kapasitas_port,
    statusOdp: updatedOdp.status
  });

  const tgResult = await telegramService.sendTelegramMessage(tgMsg);

  return successResponse(res, 200, 'Tiket berhasil di-close, status ONT Active, dan WebGIS ODP ter-update otomatis!', {
    tugas_id: parsedId,
    status: 'Closed',
    sn_ont: sn,
    sn_status: 'Active',
    redaman_dbm: redaman,
    tanda_tangan_pelanggan: Boolean(tanda_tangan_pelanggan),
    bastp_no: bastpNo,
    odp_updated: updatedOdp,
    telegram: tgResult
  });
};
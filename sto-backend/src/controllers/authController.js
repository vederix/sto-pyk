const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const supabase = require('../config/supabaseClient');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const telegramService = require('../services/telegramService');

/**
 * Helper Verifikasi Password Fleksibel:
 * Mendukung password yang sudah di-hash Bcrypt ($2a$, $2b$, $2y$),
 * hash MD5/SHA256, maupun teks biasa (legacy fallback).
 */
const verifyPassword = async (inputPassword, storedPassword) => {
  if (!inputPassword || !storedPassword) return false;

  const rawInput = String(inputPassword).trim();
  let rawStored = String(storedPassword).trim();

  // 1. Cek kecocokan teks biasa langsung (plain-text legacy)
  if (rawStored === rawInput) {
    return true;
  }

  // 2. Cek format hash Bcrypt ($2a$, $2b$, $2y$)
  if (/^\$2[aby]\$\d{2}\$/.test(rawStored)) {
    // Tangani jika hash tidak sengaja terduplikasi/tertempel berulang di DB (> 60 karakter)
    let cleanHash = rawStored;
    if (cleanHash.length > 60) {
      cleanHash = cleanHash.slice(0, 60);
    }

    try {
      const match = await bcrypt.compare(rawInput, cleanHash);
      if (match) return true;
    } catch (err) {
      console.warn('[Bcrypt Error]', err.message);
    }
  }

  // 3. Fallback cek format hash MD5 atau SHA-256 jika ada enkripsi bawaan DB lain
  try {
    const md5Hash = crypto.createHash('md5').update(rawInput).digest('hex');
    if (rawStored.toLowerCase() === md5Hash.toLowerCase()) return true;

    const sha256Hash = crypto.createHash('sha256').update(rawInput).digest('hex');
    if (rawStored.toLowerCase() === sha256Hash.toLowerCase()) return true;
  } catch {
    // abaikan fallback crypto jika gagal
  }

  return false;
};

// 1. Endpoint Login dengan Verifikasi Hash Bcrypt
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return errorResponse(res, 400, 'Email dan password wajib diisi');
  }

  const cleanEmail = String(email).toLowerCase().trim();

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', cleanEmail)
    .single();

  if (error || !user) {
    return errorResponse(res, 404, 'Email tidak ditemukan di sistem STO');
  }

  // Verifikasi kecocokan password dengan hash Bcrypt atau plain-text
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return errorResponse(res, 401, 'Password salah');
  }

  const userData = {
    id: user.id,
    nama_lengkap: user.nama_lengkap,
    role: user.role,
    email: user.email,
    telegram_chat_id: user.telegram_chat_id || null,
    username_telegram: user.username_telegram || null,
  };

  return successResponse(res, 200, 'Login berhasil', { user: userData }, { user: userData });
};

// 2. Endpoint Pendaftaran Akun Baru (Password Otomatis Di-hash Bcrypt)
exports.register = async (req, res) => {
  const { nama_lengkap, email, password, role } = req.body;

  if (!nama_lengkap || !email || !password) {
    return errorResponse(res, 400, 'Nama lengkap, email, dan password wajib diisi');
  }

  const cleanEmail = String(email).toLowerCase().trim();
  const validRole = ['pimpinan', 'teknisi', 'gudang'].includes(role) ? role : 'teknisi';

  // Cek apakah email sudah terdaftar
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .ilike('email', cleanEmail)
    .single();

  if (existingUser) {
    return errorResponse(res, 400, 'Email ini sudah terdaftar di sistem STO');
  }

  try {
    // Enkripsi password menggunakan salt rounds 10
    const hashedPassword = await bcrypt.hash(String(password).trim(), 10);

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          nama_lengkap: nama_lengkap.trim(),
          email: cleanEmail,
          password: hashedPassword,
          role: validRole
        }
      ])
      .select('id, nama_lengkap, email, role, telegram_chat_id, username_telegram')
      .single();

    if (insertError) {
      return errorResponse(res, 500, 'Gagal mendaftarkan user baru ke database', insertError.message);
    }

    // Broadcast Notifikasi Telegram jika yang didaftarkan adalah teknisi baru (SOP Telegram)
    try {
      if (newUser && newUser.role === 'teknisi') {
        const nama = newUser.nama_lengkap;
        await telegramService.kirimKeGrup(`👷 <b>TEKNISI BARU</b>\nNama: ${telegramService.esc(nama)}`);
      }
    } catch (tgErr) {
      console.warn('[Telegram New Tech Notice]', tgErr.message);
    }

    return successResponse(res, 201, 'Akun berhasil didaftarkan dengan password terenkripsi', { user: newUser });
  } catch (err) {
    return errorResponse(res, 500, 'Terjadi kendala saat enkripsi password', err.message);
  }
};

// Ambil daftar user dengan role teknisi (untuk dropdown pilih teknisi)
exports.getTeknisiList = async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, nama_lengkap')
    .eq('role', 'teknisi');

  if (error) {
    return errorResponse(res, 500, 'Gagal mengambil daftar teknisi', error.message);
  }

  return successResponse(res, 200, 'Daftar teknisi berhasil diambil', data, { teknisi: data });
};

// 3. Verifikasi token magic link Telegram untuk auto-login teknisi lapangan
exports.magicLogin = async (req, res) => {
  const token = req.query.token || req.body?.token;

  if (!token) {
    return errorResponse(res, 400, 'Token magic link wajib disertakan');
  }

  // 1. Cari token di tabel auth_tokens
  const { data: tokenRecord, error: errToken } = await supabase
    .from('auth_tokens')
    .select('*')
    .eq('token', String(token).trim())
    .single();

  if (errToken || !tokenRecord) {
    return errorResponse(res, 404, 'Token akses tidak valid atau tidak ditemukan di database');
  }

  // Cek masa berlaku token
  const now = new Date();
  const expiredAt = new Date(tokenRecord.expired_at);
  if (now > expiredAt) {
    return errorResponse(res, 410, 'Token akses sudah kedaluwarsa. Silakan klaim tiket ulang di Telegram');
  }

  // 2. Ambil data profil teknisi dari tabel users
  const targetUserId = tokenRecord.user_id || 2;
  const { data: user } = await supabase
    .from('users')
    .select('id, nama_lengkap, role, email, telegram_chat_id, username_telegram')
    .eq('id', targetUserId)
    .single();

  const finalUser = user || {
    id: 2,
    nama_lengkap: 'Ari Teknisi',
    role: 'teknisi',
    email: 'teknisi@sto.co.id'
  };

  // 3. Tandai token sudah digunakan
  try {
    await supabase.from('auth_tokens').update({ is_used: true }).eq('id', tokenRecord.id);
  } catch { /* fallback */ }

  return successResponse(res, 200, 'Magic link valid! Sesi teknisi berhasil diaktifkan.', {
    user: finalUser,
    tugas_id: tokenRecord.tugas_id,
    token: tokenRecord.token
  });
};

// 4. Endpoint Logout (Revokasi Sesi Server & Pembersihan Cookie)
exports.logout = async (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.body?.token;
  if (token) {
    try {
      await supabase.from('auth_tokens').update({ is_used: true }).eq('token', token);
    } catch (err) {
      console.warn('[Logout Token Revocation]', err.message);
    }
  }

  // Bersihkan cookie jika ada
  res.clearCookie('token');
  res.clearCookie('session');
  res.clearCookie('refreshToken');

  return successResponse(res, 200, 'Logout berhasil, sesi telah dihapus dari server');
};

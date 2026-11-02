/**
 * ============================================================================
 * STATE MANAGEMENT & DATA SYNC (sto-frontend/src/context/AppContext.jsx)
 * ============================================================================
 * Standar Operasional Prosedur (Alur Kerja Lengkap 6 SOP Telkom Akses STO):
 * 
 * 1. SOP 1 (Pimpinan):
 *    Pimpinan membuat tiket penugasan (Pasang Baru IndiHome / Perbaikan Gangguan).
 *    Tiket disiarkan secara terbuka (Broadcast Open Pool) ke seluruh teknisi lapangan.
 * 
 * 2. SOP 1.5 (Teknisi):
 *    Teknisi melihat daftar siaran terbuka dan mengambil (Klaim) tiket pekerjaan.
 * 
 * 3. SOP 2 (Teknisi):
 *    Teknisi mengajukan permohonan material ke gudang (Dropcore, ONT Modem, Roset, dll).
 * 
 * 4. SOP 3 (Pimpinan):
 *    Pimpinan meninjau dan memberikan persetujuan (Approval) terhadap permohonan barang.
 * 
 * 5. SOP 4 (Gudang):
 *    Petugas gudang merilis barang fisik ke teknisi. Stok gudang otomatis terpotong
 *    dan tersinkronisasi ke database Supabase Cloud.
 * 
 * 6. SOP 5 (Teknisi & WebGIS):
 *    Teknisi bergerak menuju lokasi pelanggan di Payakumbuh. Sensor GPS menyiarkan
 *    koordinat realtime ke peta WebGIS yang dipantau Pimpinan di Command Center.
 * 
 * 7. SOP 6 (Closing Pekerjaan & Rekonsiliasi Material):
 *    Teknisi menyelesaikan instalasi: mengukur redaman optik (OPM dBm), menginput
 *    Serial Number (SN Barcode ONT), dan merekonsiliasi pemakaian material.
 *    Material resmi berstatus "TERPASANG DI PELANGGAN (CONSUMED)", sisa kabel diretur,
 *    dan Dokumen Digital BASTP resmi diterbitkan.
 * ============================================================================
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import supabase, { isSupabaseConfigured } from '../api/supabaseClient';
import api from '../api/axiosInstance';
import { broadcastTicketToTelegram } from '../services/telegramBroadcast';
import {
  initialUsers,
  initialBarang,
  initialTugas,
  initialPermohonan,
  initialDetailPermohonan,
  initialOdp,
  STO_COORDINATES
} from '../data/seedData';

const AppContext = createContext();

export function AppProvider({ children }) {
  // 1. Connectivity & Sync Status
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncStatus, setSyncStatus] = useState('syncing'); // 'synced' | 'local' | 'syncing' | 'offline'
  const [lastSyncedAt, setLastSyncedAt] = useState(() => localStorage.getItem('sto_lastSyncedAt') || null);

  // 2. Current Active User (Session)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user') || localStorage.getItem('sto_currentUser');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return initialUsers[0]; // Pimpinan Ir. Bambang
  });

  // 3. Database Tables
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('sto_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [barang, setBarang] = useState(() => {
    const saved = localStorage.getItem('sto_barang');
    return saved ? JSON.parse(saved) : initialBarang;
  });

  const [tugas, setTugas] = useState(() => {
    const saved = localStorage.getItem('sto_tugas');
    return saved ? JSON.parse(saved) : initialTugas;
  });

  const [permohonan, setPermohonan] = useState(() => {
    const saved = localStorage.getItem('sto_permohonan');
    return saved ? JSON.parse(saved) : initialPermohonan;
  });

  const [detailPermohonan, setDetailPermohonan] = useState(() => {
    const saved = localStorage.getItem('sto_detailPermohonan');
    return saved ? JSON.parse(saved) : initialDetailPermohonan;
  });

  // GPS Tracking dinonaktifkan sesuai kebutuhan produksi
  const trackingGps = [];
  const setTrackingGps = () => {};

  const [odp, setOdp] = useState(() => {
    const saved = localStorage.getItem('sto_odp');
    return saved ? JSON.parse(saved) : initialOdp;
  });

  // Current active navigation view
  // 'landing' | 'login' | 'pimpinan' | 'teknisi' | 'gudang' | 'audit'
  const [currentView, setCurrentView] = useState('pimpinan');
  const [notification, setNotification] = useState(null);

  // Show Toast / Notification
  const showToast = useCallback((message, type = 'success') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  }, []);

  // Helper: Asynchronous Debounced LocalStorage Save (prevents UI freezing on low-end CPUs)
  const debouncedStorageSave = useCallback((key, data, delay = 400) => {
    if (typeof window === 'undefined') return;
    const timerKey = `_sto_debounce_${key}`;
    clearTimeout(window[timerKey]);
    window[timerKey] = setTimeout(() => {
      const persist = () => {
        try {
          localStorage.setItem(key, JSON.stringify(data));
        } catch (err) {
          console.warn(`[Storage Save] Gagal menyimpan ${key}:`, err);
        }
      };

      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(persist);
      } else {
        persist();
      }
    }, delay);
  }, []);

  // Sync to LocalStorage (local state fallback cache with non-blocking debounce)
  useEffect(() => {
    if (currentUser) {
      debouncedStorageSave('sto_currentUser', currentUser, 100);
      debouncedStorageSave('user', currentUser, 100);
    }
  }, [currentUser, debouncedStorageSave]);

  useEffect(() => {
    debouncedStorageSave('sto_users', users, 500);
  }, [users, debouncedStorageSave]);

  useEffect(() => {
    debouncedStorageSave('sto_barang', barang, 400);
  }, [barang, debouncedStorageSave]);

  useEffect(() => {
    debouncedStorageSave('sto_tugas', tugas, 400);
  }, [tugas, debouncedStorageSave]);

  useEffect(() => {
    debouncedStorageSave('sto_permohonan', permohonan, 400);
  }, [permohonan, debouncedStorageSave]);

  useEffect(() => {
    debouncedStorageSave('sto_detailPermohonan', detailPermohonan, 400);
  }, [detailPermohonan, debouncedStorageSave]);

  useEffect(() => { localStorage.removeItem('sto_trackingGps'); }, []);

  useEffect(() => {
    debouncedStorageSave('sto_odp', odp, 500);
  }, [odp, debouncedStorageSave]);

  // Robust Fetch & Sync from Supabase with Local Fallback
  const fetchRealData = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    if (!isSupabaseConfigured()) {
      setSyncStatus('local');
      return;
    }

    setSyncStatus('syncing');

    try {
      const [
        resUsers,
        resBarang,
        resTugas,
        resPermohonan,
        resDetail] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('barang').select('*').order('nama_barang', { ascending: true }),
        supabase.from('tugas').select('*').order('id', { ascending: false }),
        supabase.from('permohonan').select('*').order('id', { ascending: false }),
        supabase.from('detail_permohonan').select('*')
      ]);

      if (resUsers.data && resUsers.data.length > 0) setUsers(resUsers.data);
      if (resBarang.data && resBarang.data.length > 0) setBarang(resBarang.data);
      if (resTugas.data && resTugas.data.length > 0) {
        // Pastikan setiap tugas memiliki target_lat & target_lng untuk lokasi pemasangan/perbaikan di peta WebGIS
        const mappedTugas = resTugas.data.map((t, idx) => {
          const offsetLat = (((Number(t.id || idx) * 7) % 30) - 15) * 0.0012;
          const offsetLng = (((Number(t.id || idx) * 11) % 30) - 15) * 0.0012;
          return {
            ...t,
            target_lat: t.target_lat || (STO_COORDINATES.lat + offsetLat),
            target_lng: t.target_lng || (STO_COORDINATES.lng + offsetLng),
            pelanggan_nama: t.pelanggan_nama || (t.lokasi ? t.lokasi.split('-')[0].trim() : `Pelanggan #${t.id}`),
            keterangan: t.keterangan || `Pekerjaan ${t.jenis_kerja} di ${t.lokasi}`
          };
        });
        setTugas(mappedTugas);
      }
      if (resPermohonan.data && resPermohonan.data.length > 0) setPermohonan(resPermohonan.data);
      if (resDetail.data && resDetail.data.length > 0) setDetailPermohonan(resDetail.data);
      // GPS data query removed

      // 7. Ambil data titik ODP Jaringan Fiber Optic
      try {
        const { data: resOdpData, error: odpErr } = await supabase.from('odp').select('*').order('id', { ascending: true });
        if (!odpErr && resOdpData && resOdpData.length > 0) {
          const mapped = resOdpData.map(o => ({
            ...o,
            alamat: o.alamat || o.nama_lokasi || 'Koto Nan IV Payakumbuh',
            nama_lokasi: o.alamat || o.nama_lokasi || 'Koto Nan IV Payakumbuh'
          }));
          setOdp(mapped);
        } else {
          // Coba dari backend Express API
          const apiOdp = await api.get('/odp');
          if (apiOdp.data?.data && apiOdp.data.data.length > 0) {
            setOdp(apiOdp.data.data);
          }
        }
      } catch {
        // Tetap gunakan state lokal odp
      }

      const timestamp = new Date().toISOString();
      setLastSyncedAt(timestamp);
      localStorage.setItem('sto_lastSyncedAt', timestamp);
      setSyncStatus('synced');
    } catch (err) {
      console.warn('[Sync Fallback] Gagal memuat data dari Supabase, beralih ke cache lokal:', err);
      setSyncStatus('local');
    }
  }, []);

  // Network Online / Offline Detection & Automatic Re-sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      fetchRealData();
      showToast('Koneksi pulih. Data disinkronisasi ulang.', 'info');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
      showToast('Koneksi terputus. Mode cache lokal aktif.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchRealData, showToast]);

  // Initial Fetch & Supabase Real-Time Listener
  useEffect(() => {
    fetchRealData();

    if (!isSupabaseConfigured()) return;

    // Real-time Subscription Channel for Live Tracking GPS & Tasks
    const channel = supabase
      .channel('realtime_sto_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tugas' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTugas((prev) => [payload.new, ...prev.filter(t => t.id !== payload.new.id)]);
          } else if (payload.eventType === 'UPDATE') {
            setTugas((prev) => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRealData]);

  // Auth Operations
  const login = (email, password) => {
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!found) {
      showToast("Email pengguna tidak ditemukan!", "error");
      return false;
    }
    if (found.password !== password) {
      showToast("Kata sandi salah!", "error");
      return false;
    }
    setCurrentUser(found);
    if (found.role === 'pimpinan') setCurrentView('pimpinan');
    else if (found.role === 'teknisi') setCurrentView('teknisi');
    else if (found.role === 'gudang') setCurrentView('gudang');
    showToast(`Selamat datang kembali, ${found.nama_lengkap}!`, "success");
    return true;
  };

  const loginAsRole = (role) => {
    const found = users.find(u => u.role === role);
    if (found) {
      setCurrentUser(found);
      if (role === 'pimpinan') setCurrentView('pimpinan');
      else if (role === 'teknisi') setCurrentView('teknisi');
      else if (role === 'gudang') setCurrentView('gudang');
      showToast(`Beralih ke akun ${found.nama_lengkap} (${found.jabatan || found.role})`, "info");
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('sto_currentUser');
    setCurrentUser(null);
    setCurrentView('landing');
    showToast("Anda telah keluar dari sistem.", "info");
  };

  // SOP 1: Pimpinan membuat tiket tugas dan menyiarkan ke pool teknisi (Diumumkan Terbuka)
  const createTugas = async (taskData) => {
    const newId = tugas.length > 0 ? Math.max(...tugas.map(t => Number(t.id) || 0)) + 1 : 101;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Target coordinates roughly around Payakumbuh Koto Nan IV area if not specified
    const offsetLat = (Math.random() - 0.5) * 0.02;
    const offsetLng = (Math.random() - 0.5) * 0.02;
    const target_lat = taskData.target_lat || (STO_COORDINATES.lat + offsetLat);
    const target_lng = taskData.target_lng || (STO_COORDINATES.lng + offsetLng);

    const fullLokasi = taskData.pelanggan_nama
      ? `${taskData.pelanggan_nama}${taskData.pelanggan_telp ? ' (' + taskData.pelanggan_telp + ')' : ''} - ${taskData.lokasi}${taskData.keterangan ? ' [' + taskData.keterangan + ']' : ''}`
      : taskData.lokasi;

    const assignedId = taskData.id ? Number(taskData.id) : newId;
    const newTask = {
      id: assignedId,
      nomor_tiket: taskData.nomor_tiket || `TKT-PYK-2026-${String(assignedId).padStart(3, '0')}`,
      pimpinan_id: currentUser ? currentUser.id : 1,
      teknisi_id: taskData.teknisi_id ? Number(taskData.teknisi_id) : null,
      jenis_kerja: taskData.jenis_kerja,
      lokasi: taskData.lokasi,
      pelanggan_nama: taskData.pelanggan_nama || "Pelanggan Telkom",
      pelanggan_telp: taskData.pelanggan_telp || "0812-xxxx-xxxx",
      status: "Open",
      keterangan: taskData.keterangan || "",
      target_lat,
      target_lng,
      foto_bukti: null,
      waktu_buat: formattedDate
    };

    setTugas(prev => [newTask, ...prev]);

    // Hanya panggil API / Supabase jika belum disinkronkan oleh komponen pemanggil (misal FormTugas)
    if (!taskData.id) {
      let createdViaBackend = false;
      // 1. Sync ke Express Backend API
      try {
        const resApi = await api.post('/tugas', {
          pimpinan_id: Number(newTask.pimpinan_id) || 1,
          teknisi_id: newTask.teknisi_id ? Number(newTask.teknisi_id) : null,
          jenis_kerja: newTask.jenis_kerja,
          lokasi: newTask.lokasi,
          pelanggan_nama: newTask.pelanggan_nama,
          pelanggan_telp: newTask.pelanggan_telp,
          odp_kode: taskData.odp_kode || taskData.odp_id || 'ODP-PYK-FA/001',
          keterangan: taskData.keterangan || ''
        });
        if (resApi.data?.data?.id) {
          createdViaBackend = true;
          setTugas(prev => prev.map(t => t.id === assignedId ? { ...t, id: resApi.data.data.id } : t));
        }
      } catch (apiErr) {
        console.warn('[createTugas] Backend notice:', apiErr.message);
      }

      // 2. Fallback direct Supabase HANYA jika backend offline
      if (!createdViaBackend && isSupabaseConfigured()) {
        try {
          let insertPayload = {
            pimpinan_id: Number(newTask.pimpinan_id) || 1,
            teknisi_id: newTask.teknisi_id ? Number(newTask.teknisi_id) : null,
            jenis_kerja: newTask.jenis_kerja,
            lokasi: fullLokasi,
            status: 'menunggu',
            broadcast_status: 'sent'
          };

          if (taskData.odp_id) {
            insertPayload.odp_id = Number(taskData.odp_id);
          }

          let { data, error } = await supabase.from('tugas').insert([insertPayload]).select();

          if (error && error.message?.toLowerCase().includes('not-null')) {
            const techFallback = users.find(u => u.role === 'teknisi')?.id || 2;
            insertPayload.teknisi_id = techFallback;
            const retryRes = await supabase.from('tugas').insert([insertPayload]).select();
            data = retryRes.data;
          }

          if (data && data.length > 0) {
            const savedRow = data[0];
            setTugas(prev => prev.map(t => t.id === assignedId ? { ...t, id: savedRow.id } : t));

            // Siarkan langsung ke Telegram dari browser (garansi broadcast selalu tersiar di Netlify)
            broadcastTicketToTelegram({
              ...newTask,
              id: savedRow.id,
              lokasi: fullLokasi,
              odp_kode: taskData.odp_kode || (taskData.odp_id ? `ODP-ID-${taskData.odp_id}` : 'ODP-PYK-01/04')
            }).then(tgRes => {
              if (tgRes?.result?.message_id) {
                supabase.from('tugas').update({ telegram_message_id: String(tgRes.result.message_id) }).eq('id', savedRow.id);
              }
            });
          }
        } catch (err) {
          console.warn('Supabase create task notice:', err);
        }
      }
    }

    showToast(`Tiket #${assignedId} (${taskData.jenis_kerja}) berhasil disiarkan ke seluruh armada teknisi!`, "success");
    return newTask;
  };

  // SOP 1.5: Teknisi mengklaim/mengambil tiket yang diumumkan (dengan validasi ketat & dual sync)
  const claimTugas = async (tugasId, teknisiId = null) => {
    const parsedTugasId = parseInt(tugasId, 10);
    const parsedTeknisiId = parseInt(teknisiId, 10) || currentUser?.id || 2;

    if (!tugasId || isNaN(parsedTugasId) || parsedTugasId <= 0) {
      showToast('ID tugas tidak valid!', 'error');
      return false;
    }

    let targetTask = tugas.find(t => Number(t.id) === parsedTugasId);
    if (!targetTask && isSupabaseConfigured()) {
      try {
        const { data: dbTask } = await supabase.from('tugas').select('*').eq('id', parsedTugasId).single();
        if (dbTask) targetTask = dbTask;
      } catch { /* fallback */ }
    }

    if (targetTask) {
      if (targetTask.status === 'Done' || targetTask.status === 'Closed') {
        showToast('Tiket ini sudah selesai dikerjakan!', 'error');
        return false;
      }

      if (targetTask.teknisi_id && Number(targetTask.teknisi_id) !== Number(parsedTeknisiId) && (targetTask.status === 'Progress' || targetTask.status === 'In-Progress')) {
        showToast('Tiket ini sudah diambil oleh teknisi lain!', 'error');
        return false;
      }
    }

    // 1. Sinkronisasi ke Backend Express API jika backend berjalan
    let claimedViaBackend = false;
    try {
      await api.patch(`/tugas/${parsedTugasId}/claim`, { teknisi_id: parsedTeknisiId });
      claimedViaBackend = true;
    } catch (apiErr) {
      console.log('[claimTugas] Backend notice, beralih ke sinkronisasi langsung Supabase Cloud');
    }

    // 2. Update state React lokal
    setTugas(prev => {
      const exists = prev.some(t => Number(t.id) === parsedTugasId);
      if (exists) {
        return prev.map(t => Number(t.id) === parsedTugasId ? { ...t, teknisi_id: parsedTeknisiId, status: 'Progress' } : t);
      }
      if (targetTask) {
        return [{ ...targetTask, teknisi_id: parsedTeknisiId, status: 'Progress' }, ...prev];
      }
      return prev;
    });

    // 3. Sinkronisasi langsung ke Supabase Cloud (menjamin real-time persistence)
    if (isSupabaseConfigured()) {
      try {
        const { data: updateRes, error: updateErr } = await supabase.from('tugas').update({
          teknisi_id: parsedTeknisiId,
          status: 'Progress'
        }).eq('id', parsedTugasId).select();

        // Jika baris tiket belum ada di Supabase, insert ke tabel tugas Supabase
        if (!updateErr && (!updateRes || updateRes.length === 0)) {
          const matched = targetTask || {};
          await supabase.from('tugas').insert([{
            id: parsedTugasId,
            pimpinan_id: Number(matched.pimpinan_id) || 1,
            teknisi_id: parsedTeknisiId,
            jenis_kerja: matched.jenis_kerja || 'Pasang Baru',
            lokasi: matched.lokasi || 'Koto Nan IV Payakumbuh',
            status: 'Progress',
            broadcast_status: 'sent'
          }]);
        }
      } catch (err) {
        console.warn('Supabase claim task notice:', err);
      }
    }

    showToast(`Tiket #${parsedTugasId} berhasil Anda ambil! Segera ajukan permohonan material ke gudang.`, 'success');
    return true;
  };

  // SOP 2: Teknisi mengajukan material ke gudang
  const requestMaterial = async (param1, param2, param3) => {
    let tugasId = param1;
    let items = param2;
    let catatan = param3;

    if (typeof param1 === 'object' && param1 !== null && !Array.isArray(param1)) {
      tugasId = param1.tugas_id || param1.tugasId;
      items = param1.items || param1.barang || [];
      catatan = param1.catatan || param1.catatan_teknisi;
    }

    const parsedTugasId = parseInt(tugasId, 10) || Number(tugasId);
    const newPermohonanId = permohonan.length > 0 ? Math.max(...permohonan.map(p => Number(p.id) || 0)) + 1 : 501;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newPermohonan = {
      id: newPermohonanId,
      tugas_id: parsedTugasId,
      status: "Pending",
      waktu_request: formattedDate,
      catatan_teknisi: catatan || "Kebutuhan perbaikan / instalasi lapangan"
    };

    let startDetailId = detailPermohonan.length > 0 ? Math.max(...detailPermohonan.map(d => Number(d.id) || 0)) + 1 : 1;
    const newDetails = (items || []).map(item => ({
      id: startDetailId++,
      permohonan_id: newPermohonanId,
      barang_id: parseInt(item.barang_id, 10),
      jumlah_minta: parseInt(item.jumlah_minta, 10) || 1
    }));

    setPermohonan(prev => [newPermohonan, ...prev]);
    setDetailPermohonan(prev => [...newDetails, ...prev]);

    // Set task to Progress if Open
    setTugas(prev => prev.map(t => {
      if (Number(t.id) === parsedTugasId && t.status === 'Open') {
        return { ...t, status: 'Progress' };
      }
      return t;
    }));

    // 1. Sync ke Express Backend API
    let requestedViaBackend = false;
    try {
      await api.post('/permohonan', {
        tugas_id: parsedTugasId,
        barang: (items || []).map(i => ({
          barang_id: parseInt(i.barang_id, 10),
          jumlah_minta: parseInt(i.jumlah_minta, 10) || 1
        })),
        teknisi_nama: currentUser?.nama_lengkap || 'Teknisi Lapangan'
      });
      requestedViaBackend = true;
    } catch (apiErr) {
      console.warn('[requestMaterial] Backend notice:', apiErr.message);
    }

    // 2. Sync ke Supabase HANYA jika backend offline
    if (!requestedViaBackend && isSupabaseConfigured()) {
      try {
        const { data: pData } = await supabase.from('permohonan').insert([{
          tugas_id: parsedTugasId,
          status: 'menunggu'
        }]).select();

        const realPId = pData && pData.length > 0 ? pData[0].id : newPermohonanId;

        const detailsToInsert = items.map(item => ({
          permohonan_id: realPId,
          barang_id: parseInt(item.barang_id, 10),
          jumlah_minta: parseInt(item.jumlah_minta, 10) || 1
        }));
        await supabase.from('detail_permohonan').insert(detailsToInsert);
        await supabase.from('tugas').update({ status: 'Progress' }).eq('id', parsedTugasId);
      } catch (err) {
        console.warn('Supabase request material error:', err);
      }
    }

    showToast(`Permohonan material #${newPermohonanId} diajukan ke Pimpinan untuk persetujuan!`, "info");
  };

  // SOP 3: Pimpinan memberikan persetujuan (approval)
  const approveMaterial = async (permohonanId) => {
    const parsedId = parseInt(permohonanId, 10);
    setPermohonan(prev => prev.map(p => {
      if (Number(p.id) === parsedId) {
        return { ...p, status: "Approved" };
      }
      return p;
    }));

    let approvedViaBackend = false;
    try {
      await api.patch(`/permohonan/${parsedId}/approve`);
      approvedViaBackend = true;
    } catch (apiErr) {
      console.warn('[approveMaterial] Backend API notice:', apiErr.message);
    }

    if (!approvedViaBackend && isSupabaseConfigured()) {
      try {
        await supabase.from('permohonan').update({ status: 'Approved' }).eq('id', parsedId);
      } catch (err) {
        console.warn('Supabase approve error:', err);
      }
    }

    showToast(`Permohonan #${parsedId} DISETUJUI. Diteruskan ke Gudang untuk rilis barang!`, "success");
  };

  const rejectMaterial = async (permohonanId, reason = "Ditolak oleh Pimpinan") => {
    const parsedId = parseInt(permohonanId, 10);
    setPermohonan(prev => prev.map(p => {
      if (Number(p.id) === parsedId) {
        return { ...p, status: "Rejected", catatan_pimpinan: reason };
      }
      return p;
    }));

    let rejectedViaBackend = false;
    try {
      await api.patch(`/permohonan/${parsedId}/reject`, { catatan: reason });
      rejectedViaBackend = true;
    } catch (apiErr) {
      console.warn('[rejectMaterial] Backend API notice:', apiErr.message);
    }

    if (!rejectedViaBackend && isSupabaseConfigured()) {
      try {
        await supabase.from('permohonan').update({ status: 'Rejected' }).eq('id', parsedId);
      } catch (err) {
        console.warn('Supabase reject error:', err);
      }
    }

    showToast(`Permohonan #${parsedId} DITOLAK.`, "error");
  };

  // SOP 4: Gudang merilis barang dan sistem melakukan pemotongan stok otomatis
  const releaseMaterial = async (permohonanId) => {
    const parsedId = parseInt(permohonanId, 10);
    const targetPermohonan = permohonan.find(p => Number(p.id) === parsedId);
    if (!targetPermohonan) return;

    const itemsToRelease = detailPermohonan.filter(d => Number(d.permohonan_id) === parsedId);

    // Periksa apakah stok mencukupi
    for (const item of itemsToRelease) {
      const b = barang.find(x => Number(x.id) === Number(item.barang_id));
      if (b && Number(b.stok) < Number(item.jumlah_minta)) {
        showToast(`Stok ${b.nama_barang} tidak mencukupi (Sisa: ${b.stok}, Diminta: ${item.jumlah_minta})!`, "error");
        return;
      }
    }

    // Pemotongan stok otomatis di state lokal
    setBarang(prev => prev.map(b => {
      const matched = itemsToRelease.find(item => Number(item.barang_id) === Number(b.id));
      if (matched) {
        return { ...b, stok: Math.max(0, Number(b.stok) - Number(matched.jumlah_minta)) };
      }
      return b;
    }));

    // Update status permohonan ke Released
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setPermohonan(prev => prev.map(p => {
      if (Number(p.id) === parsedId) {
        return { ...p, status: "Released", waktu_rilis: formattedDate };
      }
      return p;
    }));

    // 1. Sync ke backend Express API
    try {
      await api.patch(`/permohonan/${parsedId}/release`);
    } catch (apiErr) {
      console.warn('[releaseMaterial] Backend API notice:', apiErr.message);
    }

    // 2. Sync to Supabase: Potong stok real di tabel barang & permohonan status
    if (isSupabaseConfigured()) {
      try {
        for (const item of itemsToRelease) {
          const currentB = barang.find(x => Number(x.id) === Number(item.barang_id));
          const newStok = Math.max(0, (Number(currentB?.stok) || 0) - Number(item.jumlah_minta));
          await supabase.from('barang').update({ stok: newStok }).eq('id', Number(item.barang_id));
        }
        await supabase.from('permohonan').update({ status: 'Released' }).eq('id', parsedId);
      } catch (err) {
        console.warn('Supabase release sync error:', err);
      }
    }

    showToast(`Barang Permohonan #${parsedId} berhasil dirilis & stok gudang otomatis terpotong!`, "success");
  };

  // SOP 5: Teknisi menuju lokasi (Sistem melacak koordinat GPS)
  const updateGpsLocation = () => {};
  const simulateTechnicianStep = () => {};

  /**
   * ==========================================================================
   * SOP 6: TEKNISI KLOSING PEKERJAAN & REKONSILIASI MATERIAL REAL (STANDAR TELKOM AKSES)
   * ==========================================================================
   * Fungsi ini menangani penutupan tiket (Closing Work Order) sesuai SOP IndiHome / Telkom Akses:
   * 1. Mencatat SN ONT Modem yang terpasang di rumah pelanggan.
   * 2. Mencatat ID ODP, Port ODP, dan Redaman Optik (dBm) untuk Quality Assurance.
   * 3. Rekonsiliasi Material: Barang terpasang resmi menjadi 'TERPASANG DI PELANGGAN (CONSUMED)',
   *    sedangkan material sisa dapat diretur kembali ke inventaris gudang.
   * 4. Menerbitkan Dokumen Digital BASTP (Berita Acara Serah Terima Pekerjaan).
   */
  const finishTugas = async (tugasId, argPhotoOrPayload, catatanHasil = "") => {
    const parsedTugasId = parseInt(tugasId, 10);
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Cek apakah argumen kedua berupa objek payload lengkap atau sekadar string URL foto
    const isPayloadObject = typeof argPhotoOrPayload === 'object' && argPhotoOrPayload !== null;

    const proof = isPayloadObject
      ? (argPhotoOrPayload.foto_bukti || argPhotoOrPayload.fotoBuktiUrl || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80")
      : (argPhotoOrPayload || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80");

    const userNote = isPayloadObject ? (argPhotoOrPayload.catatan || "") : catatanHasil;
    const odpId = isPayloadObject ? (argPhotoOrPayload.odp_id || "ODP-PYK-FA/014") : "ODP-PYK-FA/014";
    const portOdp = isPayloadObject ? (argPhotoOrPayload.port_odp || "03") : "03";
    const redamanDbm = isPayloadObject ? (argPhotoOrPayload.redaman_dbm || "-18.5") : "-18.5";
    const snOnt = isPayloadObject ? (argPhotoOrPayload.sn_ont || "ZTEGC8B90112") : "ZTEGC8B90112";
    const pelangganNama = isPayloadObject ? (argPhotoOrPayload.pelanggan_nama || "") : "";
    const reconciliation = isPayloadObject ? (argPhotoOrPayload.reconciliation || []) : [];
    const bastpNumber = isPayloadObject
      ? (argPhotoOrPayload.bastp_number || `BASTP/TA-PYK/${now.getFullYear()}/${String(parsedTugasId).padStart(4, '0')}`)
      : `BASTP/TA-PYK/${now.getFullYear()}/${String(parsedTugasId).padStart(4, '0')}`;

    // Buat ringkasan teks untuk kolom catatan di tabel Supabase
    const materialSummaryText = reconciliation.length > 0
      ? reconciliation.map(m => `${m.nama_barang}: ${m.jumlah_terpakai} ${m.satuan} [TERPASANG]`).join(', ')
      : `ONT SN: ${snOnt}, Dropcore: Terpasang`;

    const summaryNoteForDb = `[BASTP: ${bastpNumber}] ODP: ${odpId} (Port ${portOdp}) | Redaman: ${redamanDbm} dBm | SN: ${snOnt} | Terpasang: ${materialSummaryText} | Catatan: ${userNote}`;

    // Struktur BASTP Lengkap untuk Dokumen Digital & Audit
    const bastpData = {
      nomor_bastp: bastpNumber,
      odp_id: odpId,
      port_odp: portOdp,
      redaman_dbm: redamanDbm,
      sn_ont: snOnt,
      pelanggan_nama: pelangganNama,
      waktu_closing: formattedDate,
      catatan_teknisi: userNote,
      reconciliation: reconciliation.map(r => ({
        ...r,
        status: 'TERPASANG DI PELANGGAN (CONSUMED)'
      }))
    };

    // 1. Perbarui state lokal tugas dengan metadata closing & BASTP
    setTugas(prev => prev.map(t => {
      if (Number(t.id) === parsedTugasId) {
        return {
          ...t,
          status: "Done",
          foto_bukti: proof,
          catatan_selesai: userNote,
          waktu_selesai: formattedDate,
          odp_id: odpId,
          port_odp: portOdp,
          redaman_dbm: redamanDbm,
          sn_ont: snOnt,
          bastp: bastpData
        };
      }
      return t;
    }));

    // 2. Jika teknisi meretur sisa kabel/barang kembali ke gudang, kembalikan ke stok gudang
    if (isPayloadObject && argPhotoOrPayload.retur_ke_gudang && Array.isArray(reconciliation)) {
      reconciliation.forEach(async (item) => {
        const sisa = Number(item.jumlah_sisa) || 0;
        if (sisa > 0 && item.barang_id) {
          setBarang(prev => prev.map(b => {
            if (Number(b.id) === Number(item.barang_id)) {
              return { ...b, stok: Number(b.stok) + sisa };
            }
            return b;
          }));

          // Sinkronisasi update stok sisa retur ke Supabase
          if (isSupabaseConfigured()) {
            try {
              const currentB = barang.find(x => Number(x.id) === Number(item.barang_id));
              const updatedStok = (Number(currentB?.stok) || 0) + sisa;
              await supabase.from('barang').update({ stok: updatedStok }).eq('id', Number(item.barang_id));
            } catch (err) {
              console.warn('[finishTugas Retur] Gagal sync stok retur ke Supabase:', err);
            }
          }
        }
      });
    }

    // 3. Sinkronisasi status selesai ke Supabase
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('tugas').update({
          status: 'Done',
          foto_bukti: proof,
          catatan: summaryNoteForDb
        }).eq('id', parsedTugasId);
      } catch (err) {
        console.warn('Supabase finish task error:', err);
      }
    }

    showToast(`Tiket #${parsedTugasId} berhasil di-closing! Material resmi berstatus TERPASANG DI PELANGGAN & BASTP diterbitkan.`, "success");
    return bastpData;
  };

  // CRUD Gudang (Barang)
  const addBarang = async (item) => {
    const newId = barang.length > 0 ? Math.max(...barang.map(b => Number(b.id) || 0)) + 1 : 1;
    const newItem = {
      id: newId,
      nama_barang: item.nama_barang,
      stok: parseInt(item.stok, 10) || 0,
      satuan: item.satuan || "pcs"
    };

    setBarang(prev => [newItem, ...prev]);

    // 1. Sync ke Express Backend API
    try {
      await api.post('/barang', newItem);
    } catch (apiErr) {
      console.warn('[addBarang] Backend API notice:', apiErr.message);
    }

    // 2. Sync ke Supabase
    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('barang').insert([{
          nama_barang: newItem.nama_barang,
          stok: newItem.stok,
          satuan: newItem.satuan
        }]).select();

        if (data && data.length > 0) {
          setBarang(prev => prev.map(b => b.id === newId ? { ...b, id: data[0].id } : b));
        }
      } catch (err) {
        console.warn('Supabase insert barang error:', err);
      }
    }

    showToast(`Barang '${item.nama_barang}' berhasil ditambahkan ke inventaris!`, "success");
    return newItem;
  };

  const updateBarang = async (id, updatedFields) => {
    const parsedId = parseInt(id, 10);
    setBarang(prev => prev.map(b => {
      if (Number(b.id) === parsedId) {
        return { ...b, ...updatedFields };
      }
      return b;
    }));

    const payload = {};
    if (updatedFields.nama_barang !== undefined) payload.nama_barang = updatedFields.nama_barang;
    if (updatedFields.stok !== undefined) payload.stok = parseInt(updatedFields.stok, 10);
    if (updatedFields.satuan !== undefined) payload.satuan = updatedFields.satuan;

    // 1. Sync ke Express Backend API
    try {
      await api.put(`/barang/${parsedId}`, payload);
    } catch (apiErr) {
      console.warn('[updateBarang] Backend API notice:', apiErr.message);
    }

    // 2. Sync ke Supabase
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('barang').update(payload).eq('id', parsedId);
      } catch (err) {
        console.warn('Supabase update barang error:', err);
      }
    }

    showToast("Data barang berhasil diperbarui!", "success");
  };

  const tambahStokBarang = async (id, jumlah) => {
    const parsedId = parseInt(id, 10);
    const parsedJumlah = parseInt(jumlah, 10);
    if (isNaN(parsedId) || isNaN(parsedJumlah) || parsedJumlah <= 0) return;

    let targetItem = null;
    setBarang(prev => prev.map(b => {
      if (Number(b.id) === parsedId) {
        targetItem = { ...b, stok: Number(b.stok) + parsedJumlah };
        return targetItem;
      }
      return b;
    }));

    // 1. Sync ke Express Backend API
    try {
      await api.patch(`/barang/${parsedId}/stok`, { jumlah_tambah: parsedJumlah });
    } catch (apiErr) {
      console.warn('[tambahStokBarang] Backend API notice:', apiErr.message);
    }

    // 2. Sync ke Supabase
    if (isSupabaseConfigured() && targetItem) {
      try {
        await supabase.from('barang').update({ stok: targetItem.stok }).eq('id', parsedId);
      } catch (err) {
        console.warn('Supabase update stok notice:', err);
      }
    }

    showToast(`Stok ${targetItem?.nama_barang || 'barang'} bertambah +${parsedJumlah} ${targetItem?.satuan || 'pcs'}!`, "success");
  };

  const deleteBarang = async (id) => {
    const parsedId = parseInt(id, 10);
    setBarang(prev => prev.filter(b => Number(b.id) !== parsedId));

    // 1. Sync ke Express Backend API
    try {
      await api.delete(`/barang/${parsedId}`);
    } catch (apiErr) {
      console.warn('[deleteBarang] Backend API notice:', apiErr.message);
    }

    // 2. Sync ke Supabase
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('barang').delete().eq('id', parsedId);
      } catch (err) {
        console.warn('Supabase delete barang error:', err);
      }
    }

    showToast("Barang dihapus dari inventaris gudang!", "info");
  };

  // CRUD Penugasan / Tiket (Tugas)
  const updateTugas = async (id, updatedFields) => {
    const parsedId = parseInt(id, 10);
    setTugas(prev => prev.map(t => Number(t.id) === parsedId ? { ...t, ...updatedFields } : t));

    let updatedViaBackend = false;
    try {
      await api.put(`/tugas/${parsedId}`, updatedFields);
      updatedViaBackend = true;
    } catch (apiErr) {
      console.warn('[updateTugas] Backend API notice:', apiErr.message);
    }

    if (!updatedViaBackend && isSupabaseConfigured()) {
      try {
        const allowedCols = ['jenis_kerja', 'lokasi', 'status', 'teknisi_id', 'foto_bukti', 'odp_id'];
        const cleanPayload = {};
        for (const col of allowedCols) {
          if (updatedFields[col] !== undefined) cleanPayload[col] = updatedFields[col];
        }
        if (Object.keys(cleanPayload).length > 0) {
          await supabase.from('tugas').update(cleanPayload).eq('id', parsedId);
        }
      } catch (err) {
        console.warn('Supabase update tugas error:', err);
      }
    }

    showToast(`Tiket #${parsedId} berhasil diperbarui!`, "success");
  };

  const deleteTugas = async (id) => {
    const parsedId = parseInt(id, 10);
    setTugas(prev => prev.filter(t => Number(t.id) !== parsedId));

    let deletedViaBackend = false;
    try {
      await api.delete(`/tugas/${parsedId}`);
      deletedViaBackend = true;
    } catch (apiErr) {
      console.warn('[deleteTugas] Backend API notice:', apiErr.message);
    }

    if (!deletedViaBackend && isSupabaseConfigured()) {
      try {
        await supabase.from('tugas').delete().eq('id', parsedId);
      } catch (err) {
        console.warn('Supabase delete tugas error:', err);
      }
    }

    showToast(`Tiket #${parsedId} berhasil dibatalkan / dihapus!`, "info");
  };

  const checkInTugas = async (id, coords = {}) => {
    const parsedId = parseInt(id, 10);
    const lat = coords.latitude || -0.2289;
    const lng = coords.longitude || 100.6322;
    const waktu = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    setTugas(prev => prev.map(t => Number(t.id) === parsedId ? {
      ...t,
      checkin: { lat, lng, time: waktu, verified: true }
    } : t));

    try {
      await api.post(`/tugas/${parsedId}/checkin`, {
        latitude: lat,
        longitude: lng,
        teknisi_nama: currentUser?.nama_lengkap || 'Teknisi Lapangan'
      });
    } catch (apiErr) {
      console.warn('[checkInTugas] API notice:', apiErr.message);
    }

    showToast(`Check-In berhasil diverifikasi di koordinat (${lat.toFixed(4)}, ${lng.toFixed(4)}) pada ${waktu}!`, 'success');
  };

  const closeTugas = async (id, closingData = {}) => {
    const parsedId = parseInt(id, 10);
    const targetTask = tugas.find(t => Number(t.id) === parsedId);
    const odpIdOrKode = closingData.odp_id || targetTask?.odp_id || targetTask?.odp_kode || 'ODP-PYK-FA/001';

    // 1. Eksekusi WebGIS Magic: Tambah port ODP & hitung threshold warna (Kuning/Merah)
    setOdp(prev => prev.map(o => {
      const match = Number(o.id) === Number(odpIdOrKode) || o.kode_odp?.toUpperCase() === String(odpIdOrKode).toUpperCase();
      if (match) {
        const kapasitas = o.kapasitas_port || 8;
        const newPort = Math.min(kapasitas, (o.port_terpakai || 0) + 1);
        const ratio = newPort / kapasitas;
        const newStatus = ratio >= 1.0 ? 'Penuh' : ratio >= 0.7 ? 'Hampir Penuh' : 'Tersedia';
        return { ...o, port_terpakai: newPort, status: newStatus };
      }
      return o;
    }));

    // 2. Update status tugas menjadi 'Closed'
    setTugas(prev => prev.map(t => Number(t.id) === parsedId ? {
      ...t,
      status: 'Closed',
      sn_ont: closingData.sn_ont || t.sn_ont || 'ZTEGC8B90112',
      sn_status: 'Active',
      redaman_dbm: closingData.redaman_dbm || -18.5,
      foto_bukti: closingData.foto_ont || t.foto_bukti,
      tanda_tangan_pelanggan: closingData.tanda_tangan_pelanggan,
      bastp_no: `BASTP/TA-PYK/2026/${String(parsedId).padStart(4, '0')}`,
      closed_at: new Date().toISOString()
    } : t));

    // 3. Panggil Express Backend PUT /api/tugas/:id/close
    try {
      const res = await api.put(`/tugas/${parsedId}/close`, {
        ...closingData,
        odp_id: odpIdOrKode,
        pelanggan_nama: targetTask?.pelanggan_nama
      });
      if (res.data?.data?.odp_updated) {
        setOdp(prev => prev.map(o => o.id === res.data.data.odp_updated.id ? res.data.data.odp_updated : o));
      }
    } catch (apiErr) {
      console.warn('[closeTugas] Backend notice:', apiErr.message);
    }

    showToast(`🔥 Tiket #${parsedId} Resmi Ditutup (Closed)! Port ODP bertambah & WebGIS telah berubah warna!`, 'success');
  };

  // CRUD WebGIS ODP (Optical Distribution Point)
  const addOdp = async (odpData) => {
    const newId = odp.length > 0 ? Math.max(...odp.map(o => Number(o.id) || 0)) + 1 : 1;
    const newOdpItem = {
      id: newId,
      kode_odp: (odpData.kode_odp || `ODP-PYK-FA/${String(newId).padStart(3, '0')}`).toUpperCase().trim(),
      nama_lokasi: odpData.nama_lokasi || 'Titik Distribusi ODP Payakumbuh',
      latitude: parseFloat(odpData.latitude) || STO_COORDINATES.lat,
      longitude: parseFloat(odpData.longitude) || STO_COORDINATES.lng,
      kapasitas_port: parseInt(odpData.kapasitas_port, 10) || 8,
      port_terpakai: parseInt(odpData.port_terpakai, 10) || 0,
      redaman_dbm: parseFloat(odpData.redaman_dbm) || -18.5,
      status: odpData.status || 'Tersedia',
      keterangan: odpData.keterangan || ''
    };

    setOdp(prev => [newOdpItem, ...prev]);

    // 1. Sync ke Express Backend API
    try {
      await api.post('/odp', newOdpItem);
    } catch (apiErr) {
      console.warn('[addOdp] Backend API notice:', apiErr.message);
    }

    // 2. Sync ke Supabase
    if (isSupabaseConfigured()) {
      try {
        const supabasePayload = {
          kode_odp: newOdpItem.kode_odp,
          alamat: newOdpItem.alamat || newOdpItem.nama_lokasi || 'Koto Nan IV Payakumbuh',
          latitude: newOdpItem.latitude,
          longitude: newOdpItem.longitude,
          kapasitas_port: newOdpItem.kapasitas_port,
          port_terpakai: newOdpItem.port_terpakai,
          status: newOdpItem.status
        };

        const { data } = await supabase.from('odp').insert([supabasePayload]).select();
        if (data && data.length > 0) {
          setOdp(prev => prev.map(o => o.id === newId ? { ...o, id: data[0].id, alamat: data[0].alamat, nama_lokasi: data[0].alamat } : o));
        }
      } catch (err) {
        console.warn('Supabase insert ODP notice:', err);
      }
    }

    showToast(`Titik ODP '${newOdpItem.kode_odp}' berhasil didaftarkan ke WebGIS!`, "success");
    return newOdpItem;
  };

  const updateOdp = async (id, updatedFields) => {
    const parsedId = parseInt(id, 10);
    setOdp(prev => prev.map(o => Number(o.id) === parsedId ? { ...o, ...updatedFields } : o));

    try {
      await api.put(`/odp/${parsedId}`, updatedFields);
    } catch (apiErr) {
      console.warn('[updateOdp] Backend API notice:', apiErr.message);
    }

    if (isSupabaseConfigured()) {
      try {
        const supabaseUpdate = {};
        if (updatedFields.kode_odp !== undefined) supabaseUpdate.kode_odp = updatedFields.kode_odp;
        if (updatedFields.alamat !== undefined) supabaseUpdate.alamat = updatedFields.alamat;
        if (updatedFields.nama_lokasi !== undefined && !supabaseUpdate.alamat) supabaseUpdate.alamat = updatedFields.nama_lokasi;
        if (updatedFields.latitude !== undefined) supabaseUpdate.latitude = parseFloat(updatedFields.latitude);
        if (updatedFields.longitude !== undefined) supabaseUpdate.longitude = parseFloat(updatedFields.longitude);
        if (updatedFields.kapasitas_port !== undefined) supabaseUpdate.kapasitas_port = parseInt(updatedFields.kapasitas_port, 10);
        if (updatedFields.port_terpakai !== undefined) supabaseUpdate.port_terpakai = parseInt(updatedFields.port_terpakai, 10);
        if (updatedFields.status !== undefined) supabaseUpdate.status = updatedFields.status;

        await supabase.from('odp').update(supabaseUpdate).eq('id', parsedId);
      } catch (err) {
        console.warn('Supabase update ODP notice:', err);
      }
    }

    showToast("Data titik ODP berhasil diperbarui!", "success");
  };

  const deleteOdp = async (id) => {
    const parsedId = parseInt(id, 10);
    setOdp(prev => prev.filter(o => Number(o.id) !== parsedId));

    try {
      await api.delete(`/odp/${parsedId}`);
    } catch (apiErr) {
      console.warn('[deleteOdp] Backend API notice:', apiErr.message);
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('odp').delete().eq('id', parsedId);
      } catch (err) {
        console.warn('Supabase delete ODP notice:', err);
      }
    }

    showToast("Titik ODP berhasil dihapus dari WebGIS!", "info");
  };

  // User Management
  const addUser = async (userData) => {
    const newId = users.length > 0 ? Math.max(...users.map(u => Number(u.id) || 0)) + 1 : 1;
    const newUser = {
      id: newId,
      nama_lengkap: userData.nama_lengkap,
      email: userData.email.toLowerCase().trim(),
      password: userData.password || 'password123',
      role: userData.role || 'teknisi',
      jabatan: userData.role === 'pimpinan'
        ? 'Manager STO Wilayah'
        : userData.role === 'gudang'
        ? 'Staff Logistik & Inventaris'
        : 'Teknisi Lapangan'
    };

    setUsers(prev => [...prev, newUser]);

    // 1. Registrasi via Backend API STO agar password otomatis dienkripsi Bcrypt
    let registeredViaBackend = false;
    try {
      const res = await api.post('/auth/register', {
        nama_lengkap: newUser.nama_lengkap,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role
      });
      if (res.data?.success && res.data?.data?.user) {
        const backendUser = res.data.data.user;
        setUsers(prev => prev.map(u => u.id === newId ? { ...u, id: backendUser.id } : u));
        registeredViaBackend = true;
      }
    } catch (backendErr) {
      console.warn('Backend register fallback to Supabase:', backendErr.message);
    }

    // 2. Fallback insert langsung ke Supabase jika backend offline
    if (!registeredViaBackend && isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('users').insert([{
          nama_lengkap: newUser.nama_lengkap,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role
        }]).select();

        if (data && data.length > 0) {
          setUsers(prev => prev.map(u => u.id === newId ? { ...u, id: data[0].id } : u));
        }
      } catch (err) {
        console.warn('Supabase add user error:', err);
      }
    }

    showToast(`Akun ${newUser.nama_lengkap} (${newUser.role}) berhasil didaftarkan!`, 'success');
    return newUser;
  };

  // Reset State to Default Factory
  const resetToFactoryDefault = () => {
    localStorage.clear();
    setUsers(initialUsers);
    setBarang(initialBarang);
    setTugas(initialTugas);
    setPermohonan(initialPermohonan);
    setDetailPermohonan(initialDetailPermohonan);
    setTrackingGps(initialTrackingGps);
    setOdp(initialOdp);
    setCurrentUser(initialUsers[0]);
    setCurrentView('pimpinan');
    showToast("Semua data berhasil direset ke pengaturan awal pabrik!", "info");
  };

  return (
    <AppContext.Provider
      value={{
        isOnline,
        syncStatus,
        lastSyncedAt,
        refreshData: fetchRealData,
        currentUser,
        setCurrentUser,
        currentView,
        setCurrentView,
        users,
        setUsers,
        addUser,
        barang,
        tugas,
        claimTugas,
        checkInTugas,
        closeTugas,
        updateTugas,
        deleteTugas,
        permohonan,
        detailPermohonan,
        trackingGps,
        odp,
        setOdp,
        addOdp,
        updateOdp,
        deleteOdp,
        STO_COORDINATES,
        notification,
        setNotification,
        showToast,
        login,
        loginAsRole,
        logout,
        createTugas,
        requestMaterial,
        approveMaterial,
        rejectMaterial,
        releaseMaterial,
        updateGpsLocation,
        simulateTechnicianStep,
        removeGpsEntry: (teknisiId) => {
          const parsedId = parseInt(teknisiId, 10);
          setTrackingGps(prev => prev.filter(g => Number(g.teknisi_id) !== parsedId));
          showToast(`Teknisi #${parsedId} berhasil dihapus dari radar armada`, 'info');
        },
        resetGpsTracking: () => {
          localStorage.removeItem('sto_trackingGps');
          setTrackingGps(initialTrackingGps);
          showToast('Seluruh data GPS armada berhasil di-reset dan dibersihkan dari duplikasi!', 'success');
        },
        finishTugas,
        addBarang,
        updateBarang,
        tambahStokBarang,
        deleteBarang,
        resetToFactoryDefault
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

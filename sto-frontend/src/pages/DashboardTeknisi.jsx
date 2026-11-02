import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ModernSidebar from '../components/ModernSidebar';
import RequestBarangModal from '../components/RequestBarangModal';
import UploadBuktiModal from '../components/UploadBuktiModal';
import ModalBASTP from '../components/ModalBASTP';
import CetakSuratPermohonan from '../components/CetakSuratPermohonan';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import {
  Wrench,
  MapPin,
  Package,
  Camera,
  Clock,
  Phone,
  CheckCircle2,
  FilePlus2,
  Printer,
  FileText,
  Lock
} from 'lucide-react';

/**
 * ============================================================================
 * PORTAL TEKNISI LAPANGAN STO TELKOM AKSES (PAYAKUMBUH KOTO NAN IV)
 * ============================================================================
 * Fitur Utama Teknisi:
 * 1. Mengambil / mengklaim tiket penugasan dari siaran terbuka (Open Pool).
 * 2. Mengajukan surat permohonan material barang ke bagian logistik gudang.
 * 3. Mencetak fisik surat permohonan pengambilan barang.
 * 4. Memantau status persetujuan (Approval) Pimpinan STO.
 * 5. Pelacakan GPS lapangan & pengiriman koordinat real-time ke WebGIS Pimpinan.
 * 6. Closing pekerjaan: validasi ODP, redaman dBm, SN ONT, rekonsiliasi material & cetak BASTP.
 * ============================================================================
 */
export default function DashboardTeknisi() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const {
    tugas,
    claimTugas,
    checkInTugas,
    permohonan,
    detailPermohonan,
    barang,
    showToast
  } = useApp();

  const handleDoCheckIn = (targetTask) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          checkInTugas(targetTask.id, {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
        },
        () => {
          checkInTugas(targetTask.id, {
            latitude: targetTask.target_lat || -0.2285,
            longitude: targetTask.target_lng || 100.6335
          });
        }
      );
    } else {
      checkInTugas(targetTask.id, {
        latitude: targetTask.target_lat || -0.2285,
        longitude: targetTask.target_lng || 100.6335
      });
    }
  };

  // Sesi akun teknisi aktif
  const user = JSON.parse(localStorage.getItem('user')) || { id: 2, nama_lengkap: 'Ahmad Fadli', role: 'teknisi' };

  const [activeMenu, setActiveMenu] = useState('tiket');
  const [modalTugasId, setModalTugasId] = useState(null);
  const [uploadTugasId, setUploadTugasId] = useState(null);
  const [bastpModalTask, setBastpModalTask] = useState(null);
  
  // Memoized filter tugas agar tidak di-recompute pada setiap re-render di HP teknisi
  const { openTasks, myActiveTasks, myDoneTasks, activeTasks } = useMemo(() => {
    const open = (tugas || []).filter(t => !t.teknisi_id && (t.status === 'Open' || !t.status));
    const mine = (tugas || []).filter(t => Number(t.teknisi_id) === Number(user?.id));
    const active = mine.filter(t => t.status !== 'Done');
    const done = mine.filter(t => t.status === 'Done');
    const primaryActive = active.length > 0 ? active : (mine.length > 0 ? mine : []);
    return { openTasks: open, myActiveTasks: active, myDoneTasks: done, activeTasks: primaryActive };
  }, [tugas, user?.id]);

  // Memoized filter permohonan teknisi (menggunakan O(1) Map Lookup alih-alih nested find)
  const myRequests = useMemo(() => {
    const taskMap = new Map((tugas || []).map(t => [t.id, t]));
    return (permohonan || []).filter(p => {
      const parent = taskMap.get(p.tugas_id);
      return Number(parent?.teknisi_id) === Number(user?.id);
    });
  }, [permohonan, tugas, user?.id]);

  // Proteksi hak akses sesi teknisi
  const userRole = user?.role;
  useEffect(() => {
    if (!userRole || userRole !== 'teknisi') {
      navigate('/');
    }
  }, [navigate, userRole]);



  return (
    <div className={`min-h-screen flex flex-col lg:flex-row ${
      isDark ? 'bg-[#0a0f1d] text-white' : 'bg-slate-50 text-slate-900'
    } transition-colors duration-300`}>
      
      {/* Left Sidebar Layout */}
      <ModernSidebar activeTab={activeMenu} onTabChange={setActiveMenu} />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col lg:pl-72 transition-all duration-300">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          
          {/* Header Banner */}
          <div className={`p-5 sm:p-6 rounded-3xl border ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          } flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors`}>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  PORTAL TEKNISI LAPANGAN
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: TA-02981</span>
              </div>
              <h1 className={`text-xl sm:text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {activeMenu === 'tiket' && 'Daftar Tiket Tugas & Penugasan Lapangan'}
                {activeMenu === 'surat-permohonan' && 'Form Pembuatan Surat Permohonan Barang'}
                {activeMenu === 'cetak-surat' && 'Cetak Fisik Surat Permohonan Pengambilan Barang'}
                {activeMenu === 'status-approval' && 'Status Persetujuan Pimpinan & Pengambilan Gudang'}
                {activeMenu === 'pengerjaan' && 'Pengerjaan Lapangan, Pengukuran OPM & BASTP'}
              </h1>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                Petugas: <strong>{user.nama_lengkap}</strong> | Unit: Fiber Optic Maintenance & Provisioning.
              </p>
            </div>

            {/* Quick Status Info */}
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-2 rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-400 font-bold text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>{myActiveTasks.length} Tiket Aktif Dikerjakan</span>
              </span>
            </div>
          </div>

          {/* TAB 1: AMBIL TIKET / PEKERJAAN */}
          {activeMenu === 'tiket' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              
              {/* SECTION 1: POOL TIKET TERBUKA (DIUMUMKAN PIMPINAN) */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h2 className="text-base font-extrabold flex items-center gap-2">
                      <span className="p-1.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                        📢
                      </span>
                      <span>Siaran Tiket Terbuka (Pool Pekerjaan Siap Diambil)</span>
                    </h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Tiket kerja yang baru saja diumumkan Pimpinan STO. Klik <strong>Ambil Pekerjaan Ini</strong> untuk menugaskan ke diri Anda.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 self-start sm:self-auto">
                    {openTasks.length} Tiket Tersedia
                  </span>
                </div>

                {openTasks.length === 0 ? (
                  <div className={`p-8 text-center rounded-3xl border ${
                    isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/60 text-slate-400 flex items-center justify-center mx-auto mb-3 text-xl">
                      📭
                    </div>
                    <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Tidak Ada Tiket Terbuka Saat Ini
                    </div>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Semua pekerjaan telah diambil oleh teknisi atau belum ada tiket baru yang diterbitkan oleh Pimpinan STO.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {openTasks.map(t => (
                      <div
                        key={t.id}
                        className={`p-5 rounded-3xl border transition-all ${
                          isDark ? 'bg-slate-900/90 border-blue-900/50 hover:border-blue-500' : 'bg-white border-blue-200 shadow-md hover:border-blue-500'
                        } space-y-4`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-blue-500">#{t.id}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                Pool Terbuka
                              </span>
                            </div>
                            <h3 className={`font-extrabold text-base ${isDark ? 'text-white' : 'text-slate-900'} mt-1`}>
                              {t.pelanggan_nama}
                            </h3>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            t.jenis_kerja === 'Pasang Baru' ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' :
                            t.jenis_kerja === 'Gangguan' ? 'bg-rose-600/20 text-rose-400 border-rose-500/30' :
                            'bg-purple-600/20 text-purple-400 border-purple-500/30'
                          }`}>
                            {t.jenis_kerja}
                          </span>
                        </div>

                        <div className={`p-3.5 rounded-2xl text-xs space-y-2 ${isDark ? 'bg-slate-950/70 border border-slate-800 text-slate-300' : 'bg-slate-50 border border-slate-200 text-slate-700'}`}>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate">{t.lokasi}</span>
                          </div>
                          {t.pelanggan_telp && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>{t.pelanggan_telp}</span>
                            </div>
                          )}
                          {t.keterangan && (
                            <div className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/40">
                              "{t.keterangan}"
                            </div>
                          )}
                        </div>

                        {/* Claim Button */}
                        <button
                          onClick={async () => {
                            await claimTugas(t.id, user.id);
                            showToast(`Tiket #${t.id} berhasil Anda ambil! Segera ajukan permohonan material ke gudang.`, 'success');
                          }}
                          className="w-full py-3 px-4 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-blue-900/40 transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                        >
                          <span>✋ Ambil Pekerjaan Ini (Klaim Tiket)</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 2: TIKET SAYA YANG SEDANG BERJALAN */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                  <div>
                    <h2 className="text-base font-extrabold flex items-center gap-2">
                      <span className="p-1.5 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
                        <Wrench className="w-4 h-4" />
                      </span>
                      <span>Tiket Aktif yang Sedang Saya Tangani</span>
                    </h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Lanjutkan SOP: Ajukan material ke gudang, cetak formulir fisik, aktifkan pelacakan GPS, dan upload bukti selesai.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 self-start sm:self-auto">
                    {myActiveTasks.length} Tiket Sedang Dikerjakan
                  </span>
                </div>

                {myActiveTasks.length === 0 ? (
                  <div className={`p-8 text-center rounded-3xl border ${
                    isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/60 text-slate-400 flex items-center justify-center mx-auto mb-3 text-xl">
                      🛠️
                    </div>
                    <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Belum Ada Pekerjaan Aktif
                    </div>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Ambil tiket dari pool siaran terbuka di atas untuk memulai pekerjaan Anda.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myActiveTasks.map(t => (
                      <div
                        key={t.id}
                        className={`p-5 rounded-3xl border transition-all ${
                          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                        } space-y-4`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-xs font-bold text-blue-500">#{t.id}</span>
                            <h3 className={`font-extrabold text-base ${isDark ? 'text-white' : 'text-slate-900'} mt-0.5`}>
                              {t.pelanggan_nama}
                            </h3>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            t.jenis_kerja === 'Pasang Baru' ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' :
                            t.jenis_kerja === 'Gangguan' ? 'bg-rose-600/20 text-rose-400 border-rose-500/30' :
                            'bg-purple-600/20 text-purple-400 border-purple-500/30'
                          }`}>
                            {t.jenis_kerja}
                          </span>
                        </div>

                        <div className={`p-3 rounded-2xl text-xs space-y-1.5 ${isDark ? 'bg-slate-950/60 border border-slate-850 text-slate-300' : 'bg-slate-50 border border-slate-200 text-slate-700'}`}>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate">{t.lokasi}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{t.pelanggan_telp || '0812-xxxx-xxxx'}</span>
                          </div>
                        </div>

                        {/* SOP Step Actions */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => setModalTugasId(t.id)}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow transition active:scale-95 cursor-pointer"
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>1. Ajukan Material</span>
                          </button>

                          <button
                            onClick={() => setActiveMenu('cetak-surat')}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs shadow transition active:scale-95 cursor-pointer"
                            title="Opsional: Tidak wajib dicetak untuk melanjutkan pekerjaan"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-400" />
                            <span>2. Cetak Fisik (Opsional)</span>
                          </button>

                          {/* 3. Check-In di Lokasi Pelanggan (Mandatory) */}
                          {t.checkin?.verified ? (
                            <div className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>✓ Checked-In ({t.checkin?.time || 'Di Lokasi'})</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleDoCheckIn(t)}
                              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition active:scale-95 cursor-pointer"
                            >
                              <MapPin className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                              <span>3. Check-In di Lokasi</span>
                            </button>
                          )}

                          {/* 4. Upload Bukti & Closing (Wajib Check-In dulu) */}
                          {t.checkin?.verified ? (
                            <button
                              onClick={() => setUploadTugasId(t.id)}
                              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition active:scale-95 cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>4. Closing & BASTP</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => showToast('Wajib tekan "Check-In di Lokasi" terlebih dahulu sebelum melakukan closing!', 'warning')}
                              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs border border-slate-700 cursor-not-allowed opacity-80"
                              title="Wajib Check-In di Lokasi terlebih dahulu"
                            >
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              <span>4. Closing (Wajib Check-In)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 3: RIWAYAT PEKERJAAN SELESAI */}
              {myDoneTasks.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-extrabold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Riwayat Pekerjaan Selesai (Done)</span>
                    </h2>
                    <span className="text-xs text-emerald-400 font-bold">{myDoneTasks.length} Pekerjaan Tuntas</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myDoneTasks.map(t => (
                      <div
                        key={t.id}
                        className={`p-4 rounded-3xl border ${
                          isDark ? 'bg-slate-900/60 border-emerald-500/30' : 'bg-white border-emerald-200 shadow-sm'
                        } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-400">#{t.id}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                              ✓ Selesai & Terpasang
                            </span>
                          </div>
                          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {t.pelanggan_nama}
                          </div>
                          <div className="text-[11px] text-slate-400">{t.lokasi}</div>
                          {t.waktu_selesai && (
                            <div className="text-[10px] text-emerald-400 font-mono">Closing: {t.waktu_selesai}</div>
                          )}

                          <button
                            type="button"
                            onClick={() => setBastpModalTask(t)}
                            className="mt-2 py-1.5 px-3 rounded-xl bg-burgundy-600/20 hover:bg-burgundy-600/30 text-burgundy-400 border border-burgundy-500/30 font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Lihat BASTP & Material Terpasang</span>
                          </button>
                        </div>

                        {t.foto_bukti && (
                          <img
                            src={t.foto_bukti}
                            alt="Bukti Foto"
                            className="w-16 h-16 rounded-xl object-cover border border-emerald-500/40 shrink-0 cursor-pointer hover:opacity-90"
                            onClick={() => setBastpModalTask(t)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: BUAT SURAT PERMOHONAN BARANG */}
          {activeMenu === 'surat-permohonan' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className={`p-6 rounded-3xl border ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>
                  Pilih Tiket untuk Mengajukan Kebutuhan Material:
                </h2>
                {myActiveTasks.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-3`}>
                      Belum ada tiket yang sedang Anda kerjakan. Silakan ambil tiket pekerjaan terlebih dahulu dari Pool Tiket Terbuka.
                    </p>
                    <button
                      onClick={() => setActiveMenu('tiket')}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
                    >
                      Buka Pool Tiket Pekerjaan
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {myActiveTasks.map(t => (
                      <div
                        key={t.id}
                        className={`p-4 rounded-2xl border cursor-pointer transition ${
                          modalTugasId === t.id
                            ? 'border-burgundy-500 bg-burgundy-500/10 shadow-lg'
                            : isDark ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => setModalTugasId(t.id)}
                      >
                        <div className="font-mono text-xs text-burgundy-500 font-bold">Tiket #{t.id}</div>
                        <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'} mt-1 truncate`}>
                          {t.pelanggan_nama}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{t.jenis_kerja} - {t.lokasi}</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalTugasId(t.id);
                          }}
                          className="mt-3 w-full py-1.5 rounded-lg bg-burgundy-600 hover:bg-burgundy-700 text-white font-bold text-[11px] flex items-center justify-center gap-1"
                        >
                          <FilePlus2 className="w-3.5 h-3.5" />
                          <span>Buka Form Barang</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CETAK FISIK SURAT PERMOHONAN */}
          {activeMenu === 'cetak-surat' && (
            <div className="animate-in fade-in duration-200">
              <CetakSuratPermohonan />
            </div>
          )}

          {/* TAB 4: STATUS PERSETUJUAN PIMPINAN & AMBIL BARANG GUDANG */}
          {activeMenu === 'status-approval' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="text-xs text-slate-400">
                Pantau proses approval oleh Pimpinan STO. Jika status sudah <strong>"Approved"</strong>, Anda dapat langsung mengambil material fisik di gudang.
              </div>

              {myRequests.length === 0 ? (
                <div className={`p-12 text-center rounded-3xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <div className="text-sm font-bold text-white">Belum Ada Pengajuan Material</div>
                  <p className="text-xs text-slate-400 mt-1">Gunakan tombol "Ajukan Barang" pada tiket pekerjaan Anda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myRequests.map(req => {
                    const task = tugas.find(t => t.id === req.tugas_id);
                    const details = detailPermohonan.filter(d => d.permohonan_id === req.id);
                    const isApproved = req.status === 'Approved';
                    const isReleased = req.status === 'Released';

                    return (
                      <div
                        key={req.id}
                        className={`p-5 rounded-3xl border transition-all ${
                          isReleased
                            ? isDark ? 'bg-slate-900/80 border-emerald-500/40' : 'bg-white border-emerald-500/40 shadow-sm'
                            : isApproved
                            ? isDark ? 'bg-slate-900/80 border-amber-500/50' : 'bg-white border-amber-500/50 shadow-sm'
                            : isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                        } space-y-4`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-mono text-xs font-bold text-slate-400">Permohonan #{req.id}</span>
                            <h2 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'} mt-0.5`}>
                              Tiket #{req.tugas_id} - {task?.pelanggan_nama}
                            </h2>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isReleased ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            isApproved ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {isReleased ? 'Barang Sudah Dirilis' : isApproved ? 'Disetujui (Siap Ambil)' : 'Menunggu Pimpinan'}
                          </span>
                        </div>

                        {/* Items Requested */}
                        <div className={`p-3 rounded-2xl text-xs ${isDark ? 'bg-slate-950 border border-slate-850' : 'bg-slate-50 border border-slate-200'} space-y-1`}>
                          <div className="font-semibold text-slate-400 text-[10px] uppercase">Rincian Material:</div>
                          {details.map(d => {
                            const itm = barang.find(b => b.id === d.barang_id);
                            return (
                              <div key={d.id} className="flex justify-between text-xs">
                                <span>• {itm?.nama_barang || 'Barang'}</span>
                                <strong className="text-white">{d.jumlah_minta} {itm?.satuan}</strong>
                              </div>
                            );
                          })}
                        </div>

                        {/* Status notification box */}
                        {isApproved && (
                          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            <span>Pimpinan telah menyetujui. Silakan tunjukkan formulir fisik / ID ke petugas gudang!</span>
                          </div>
                        )}

                        {isReleased && (
                          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            <span>Material telah diserahkan oleh gudang. Stok otomatis terpotong!</span>
                          </div>
                        )}

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => setActiveMenu('cetak-surat')}
                            className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak Formulir</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PENGERJAAN LAPANGAN & UPLOAD BUKTI SELESAI */}
          {activeMenu === 'pengerjaan' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* SOP 6 Closing & QA Standard Banner */}
              <div className={`p-6 rounded-3xl border ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              } space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      <Camera className="w-5 h-5" />
                    </span>
                    <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Prosedur Closing & Serah Terima Hasil Pekerjaan (SOP 6)
                    </h2>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Standar Telkom Akses
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Pastikan setiap penutupan tiket telah melalui pengukuran redaman kabel optik (OPM dBm), pencatatan Serial Number ONT modem, dan upload foto bukti lapangan untuk penerbitan dokumen BASTP resmi.
                </p>
              </div>

              {/* Work Orders to Finish */}
              <div className="space-y-4">
                <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Unggah Foto Bukti & Selesaikan Pekerjaan (SOP 6)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeTasks.map(t => {
                    const isDone = t.status === 'Done';
                    return (
                      <div
                        key={t.id}
                        className={`p-5 rounded-3xl border transition-all ${
                          isDone
                            ? isDark ? 'bg-slate-900/60 border-emerald-500/40 opacity-80' : 'bg-white border-emerald-500/40 shadow-sm'
                            : isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                        } space-y-4`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-xs font-bold text-slate-400">Tiket #{t.id}</span>
                            <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'} mt-0.5`}>
                              {t.pelanggan_nama}
                            </h3>
                            <p className="text-xs text-slate-400">{t.lokasi}</p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isDone
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {isDone ? 'Selesai (Done)' : 'Sedang Dikerjakan'}
                          </span>
                        </div>

                        {t.foto_bukti && (
                          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-850">
                            <img
                              src={t.foto_bukti}
                              alt="Bukti Selesai"
                              className="w-16 h-16 object-cover rounded-xl border border-slate-700"
                            />
                            <div className="text-xs">
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Foto Tervalidasi
                              </span>
                              <p className="text-slate-400 text-[11px] mt-0.5">Selesai: {t.waktu_selesai}</p>
                            </div>
                          </div>
                        )}

                        <div>
                          {isDone ? (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold text-xs text-center border border-emerald-500/30 flex items-center justify-center">
                                ✓ Pekerjaan Selesai & Terverifikasi
                              </div>
                              <button
                                onClick={() => setBastpModalTask(t)}
                                className="py-2 px-3.5 rounded-xl bg-burgundy-600 hover:bg-burgundy-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md active:scale-95 whitespace-nowrap"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Lihat BASTP</span>
                              </button>
                            </div>
                          ) : !t.checkin?.verified ? (
                            <div className="space-y-2">
                              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
                                <Lock className="w-4 h-4 shrink-0 text-amber-400" />
                                <span>Wajib tekan Check-In di Lokasi terlebih dahulu sebagai bukti kehadiran Anda.</span>
                              </div>
                              <button
                                onClick={() => handleDoCheckIn(t)}
                                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                              >
                                <MapPin className="w-4 h-4 text-amber-300 animate-pulse" />
                                <span>📍 Check-In di Lokasi Pelanggan Sekarang</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setUploadTugasId(t.id)}
                              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                            >
                              <Camera className="w-4 h-4" />
                              <span>Unggah Foto Bukti & Selesaikan (Closing BASTP)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* Modal: Request Barang (SOP 2) */}
      {modalTugasId && (
        <RequestBarangModal
          tugasId={modalTugasId}
          onClose={() => setModalTugasId(null)}
          onSuccess={() => {
            setModalTugasId(null);
            setActiveMenu('status-approval');
          }}
        />
      )}

      {/* Modal: Upload Bukti Selesai (SOP 6) */}
      {uploadTugasId && (
        <UploadBuktiModal
          tugasId={uploadTugasId}
          onClose={() => setUploadTugasId(null)}
          onSuccess={() => {
            setUploadTugasId(null);
            showToast('Pekerjaan selesai! Berita acara berhasil diperbarui.', 'success');
          }}
        />
      )}

      {/* Modal: Dokumen BASTP & Rekonsiliasi Material Digital */}
      {bastpModalTask && (
        <ModalBASTP
          task={bastpModalTask}
          onClose={() => setBastpModalTask(null)}
        />
      )}

    </div>
  );
}
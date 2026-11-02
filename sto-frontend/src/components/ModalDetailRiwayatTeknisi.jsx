import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import {
  X,
  Trash2,
  MapPin,
  FileText,
  Mail,
  Database,
  RefreshCw
} from 'lucide-react';
const getTaskTypeConfig = (jenisKerja) => {
  const jk = (jenisKerja || '').toLowerCase();
  if (jk.includes('pasang') || jk.includes('psb')) {
    return {
      label: 'Pasang Baru (PSB)',
      badgeBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      badgeText: 'Pasang Baru'
    };
  }
  if (jk.includes('kabel') || jk.includes('putus') || jk.includes('dropcore')) {
    return {
      label: 'Kabel Putus',
      badgeBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      badgeText: 'Kabel Putus'
    };
  }
  if (jk.includes('gangguan') || jk.includes('los')) {
    return {
      label: 'Gangguan (LOS)',
      badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      badgeText: 'Gangguan'
    };
  }
  return {
    label: 'Penugasan Lapangan',
    badgeBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    badgeText: 'Perbaikan'
  };
};

export default function ModalDetailRiwayatTeknisi({
  teknisi,
  onClose,
  onOpenBastp,
  onNavigateToTracking
}) {
  const { isDark } = useTheme();
  const { tugas, deleteTugas, showToast } = useApp();
  const [deletingId, setDeletingId] = useState(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  if (!teknisi) return null;

  // Filter semua tiket yang pernah diambil/dikerjakan oleh teknisi ini
  const techTasks = tugas.filter(t => Number(t.teknisi_id) === Number(teknisi.id));
  const activeTask = techTasks.find(t => t.status !== 'Done');
  const completedTasks = techTasks.filter(t => t.status === 'Done');

  // Hapus single tiket dari Supabase dan state
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm(`Yakin ingin menghapus tiket #${taskId} dari database Supabase? Data riwayat ini akan dihapus permanen.`)) {
      return;
    }

    setDeletingId(taskId);
    try {
      await deleteTugas(taskId);
      showToast(`Tiket #${taskId} berhasil dihapus dari database Supabase!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal menghapus tiket dari database', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Hapus semua riwayat tugas teknisi ini dari Supabase (Reset untuk persiapan data real)
  const handleDeleteAllHistory = async () => {
    if (techTasks.length === 0) return;

    if (!window.confirm(`PERINGATAN: Anda akan menghapus SELURUH ${techTasks.length} riwayat tiket tugas atas nama ${teknisi.nama_lengkap} dari database Supabase.\n\nGunakan fitur ini untuk membersihkan data testing sebelum memasukkan data riil operasional.\n\nLanjutkan?`)) {
      return;
    }

    setIsDeletingAll(true);
    try {
      for (const t of techTasks) {
        await deleteTugas(t.id);
      }
      showToast(`Seluruh riwayat kerja ${teknisi.nama_lengkap} berhasil dibersihkan dari Supabase!`, 'info');
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Gagal membersihkan seluruh riwayat', 'error');
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className={`w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      } animate-in zoom-in-95 duration-200`}>
        
        {/* Modal Header */}
        <div className={`p-5 sm:p-6 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              {teknisi.nama_lengkap?.charAt(0) || 'T'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">
                  {teknisi.nama_lengkap}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Teknisi Lapangan
                </span>
              </div>
              <p className={`text-xs flex items-center gap-3 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {teknisi.email}</span>
                <span>•</span>
                <span>ID Akun: #{teknisi.id}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-3.5 rounded-2xl border ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tugas Diambil</span>
              <div className="text-xl font-black mt-1">{techTasks.length} Tiket</div>
              <span className="text-[10px] text-slate-500">Tersinkron di Supabase</span>
            </div>

            <div className={`p-3.5 rounded-2xl border ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Sedang Dikerjakan</span>
              <div className="text-xl font-black text-blue-500 mt-1">
                {activeTask ? 1 : 0} Tiket
              </div>
              <span className="text-[10px] text-slate-500">
                {activeTask ? 'Status: Progress' : 'Sedang Siaga'}
              </span>
            </div>

            <div className={`p-3.5 rounded-2xl border ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Selesai (Done)</span>
              <div className="text-xl font-black text-emerald-500 mt-1">
                {completedTasks.length} Tiket
              </div>
              <span className="text-[10px] text-slate-500">Dokumen BASTP Terbit</span>
            </div>
          </div>

          {/* Tugas Aktif Saat Ini (Jika Ada) */}
          {activeTask ? (
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-blue-950/20 border-blue-500/30' : 'bg-blue-50 border-blue-200'
            } space-y-2.5`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <span className="font-extrabold text-blue-400 text-xs">
                    Pekerjaan Aktif Sedang Berlangsung (#{activeTask.id})
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {activeTask.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 text-[11px]">Jenis Pekerjaan:</span>
                  <div className="font-bold text-slate-200 mt-0.5">{activeTask.jenis_kerja}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Nama Pelanggan:</span>
                  <div className="font-bold text-slate-200 mt-0.5">{activeTask.pelanggan_nama || '-'}</div>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 text-[11px]">Lokasi Pelaksanaan:</span>
                  <div className="font-semibold text-slate-300 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{activeTask.lokasi}</span>
                  </div>
                </div>
              </div>

              {onNavigateToTracking && (
                <div className="pt-2 flex items-center justify-end border-t border-blue-500/20">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToTracking(activeTask.id);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Lihat Titik Lokasi di WebGIS</span>
                  </button>
                </div>
              )}
            </div>
            ) : (
            <div className={`p-3.5 rounded-2xl border text-center ${
              isDark ? 'bg-slate-950/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              Saat ini teknisi tidak memiliki tiket aktif yang sedang berjalan (Status: Siaga di Posko STO).
            </div>
          )}

          {/* Tabel Riwayat Kerja Lengkap Teknisi */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-extrabold text-sm flex items-center gap-2">
                  <span>Daftar Riwayat Seluruh Pekerjaan yang Pernah Diambil</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                    {techTasks.length} Riwayat
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Data ini tersimpan langsung di tabel <code>tugas</code> Supabase. Anda dapat menghapus data testing sebelum menggunakan data riil.
                </p>
              </div>

              {techTasks.length > 0 && (
                <button
                  type="button"
                  disabled={isDeletingAll}
                  onClick={handleDeleteAllHistory}
                  className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingAll ? 'Membersihkan...' : 'Reset Seluruh Riwayat Teknisi'}</span>
                </button>
              )}
            </div>

            <div className={`rounded-2xl border overflow-hidden ${
              isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`${
                    isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
                  } uppercase text-[10px] tracking-wider border-b font-mono`}>
                    <tr>
                      <th className="px-3.5 py-3">ID</th>
                      <th className="px-3.5 py-3">Pekerjaan</th>
                      <th className="px-3.5 py-3">Pelanggan & Lokasi</th>
                      <th className="px-3.5 py-3 text-center">Status</th>
                      <th className="px-3.5 py-3 text-center">BASTP</th>
                      <th className="px-3.5 py-3 text-center">Aksi Supabase</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                    {techTasks.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-6 text-slate-500 italic">
                          Belum ada riwayat tugas yang diambil oleh teknisi ini.
                        </td>
                      </tr>
                    ) : (
                      techTasks.map(task => {
                        const taskCfg = getTaskTypeConfig(task.jenis_kerja);
                        const isDone = task.status === 'Done';
                        const isDeletingThis = deletingId === task.id;

                        return (
                          <tr key={task.id} className={`${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'} transition`}>
                            <td className="px-3.5 py-3 font-mono font-bold text-slate-400">
                              #{task.id}
                            </td>

                            <td className="px-3.5 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${taskCfg.badgeBg} ${taskCfg.badgeText}`}>
                                {task.jenis_kerja}
                              </span>
                            </td>

                            <td className="px-3.5 py-3">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {task.pelanggan_nama || '-'}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                                {task.lokasi}
                              </div>
                            </td>

                            <td className="px-3.5 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isDone
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                              }`}>
                                {task.status}
                              </span>
                            </td>

                            <td className="px-3.5 py-3 text-center">
                              {isDone ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onOpenBastp(task);
                                  }}
                                  className="px-2 py-0.5 rounded-lg bg-burgundy-600/20 hover:bg-burgundy-600/30 text-burgundy-400 border border-burgundy-500/30 text-[10px] font-bold flex items-center gap-1 mx-auto transition cursor-pointer"
                                  title="Lihat Berita Acara BASTP"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>BASTP</span>
                                </button>
                              ) : (
                                <span className="text-slate-500 text-[10px]">-</span>
                              )}
                            </td>

                            <td className="px-3.5 py-3 text-center">
                              <button
                                type="button"
                                disabled={isDeletingThis}
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer disabled:opacity-40"
                                title="Hapus riwayat tiket ini dari Supabase"
                              >
                                {isDeletingThis ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-between ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sinkronisasi tabel <code>tugas</code> Cloud Supabase</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}

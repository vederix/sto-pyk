import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import {
  ClipboardList,
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  FileText,
  X
} from 'lucide-react';
import ModalDetailRiwayatTeknisi from './ModalDetailRiwayatTeknisi';

export default function KelolaTugas({ onOpenCreateModal, onOpenBastp }) {
  const { isDark } = useTheme();
  const {
    tugas = [],
    users = [],
    currentUser,
    updateTugas,
    deleteTugas
  } = useApp();

  const userRole = currentUser?.role || (JSON.parse(localStorage.getItem('user') || '{}')?.role);
  const canCreateTask = (userRole === 'pimpinan' || userRole === 'admin' || userRole === 'dispatcher') && !!onOpenCreateModal;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jenisFilter, setJenisFilter] = useState('all');
  const [selectedTechnician, setSelectedTechnician] = useState(null);

  // Edit Modal State
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({
    jenis_kerja: '',
    pelanggan_nama: '',
    pelanggan_telp: '',
    lokasi: '',
    teknisi_id: '',
    status: '',
    keterangan: ''
  });

  const technicians = users.filter(u => u.role === 'teknisi');

  const handleStartEdit = (task) => {
    setEditingTask(task);
    setEditForm({
      jenis_kerja: task.jenis_kerja || 'Pasang Baru',
      pelanggan_nama: task.pelanggan_nama || '',
      pelanggan_telp: task.pelanggan_telp || '',
      lokasi: task.lokasi || '',
      teknisi_id: task.teknisi_id ? String(task.teknisi_id) : '',
      status: task.status || 'Open',
      keterangan: task.keterangan || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingTask) return;

    await updateTugas(editingTask.id, {
      jenis_kerja: editForm.jenis_kerja,
      pelanggan_nama: editForm.pelanggan_nama,
      pelanggan_telp: editForm.pelanggan_telp,
      lokasi: editForm.lokasi,
      teknisi_id: editForm.teknisi_id ? parseInt(editForm.teknisi_id, 10) : null,
      status: editForm.status,
      keterangan: editForm.keterangan
    });

    setEditingTask(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Yakin ingin membatalkan & menghapus tiket #${id}?`)) {
      await deleteTugas(id);
    }
  };

  // Filter tugas
  const filteredTugas = tugas.filter(t => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      String(t.id).includes(q) ||
      (t.pelanggan_nama || '').toLowerCase().includes(q) ||
      (t.lokasi || '').toLowerCase().includes(q) ||
      (t.jenis_kerja || '').toLowerCase().includes(q);

    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchJenis = jenisFilter === 'all' || t.jenis_kerja === jenisFilter;

    return matchSearch && matchStatus && matchJenis;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Actions */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-blue-600/20 text-blue-500 border border-blue-500/30">
              <ClipboardList className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-extrabold">Manajemen Tiket Tugas</h1>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Daftar penugasan teknisi dan distribusi tiket kerja operasional.
          </p>
        </div>

        {canCreateTask && (
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Buat Tiket Baru</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-2xl border ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      } flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari ID tiket, nama pelanggan, lokasi jalan, atau jenis pekerjaan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border ${
                isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              } focus:outline-none focus:border-blue-500`}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
              isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
            } focus:outline-none cursor-pointer`}
          >
            <option value="all">Semua Status</option>
            <option value="Open">Open (Menunggu)</option>
            <option value="Progress">Progress (Dikerjakan)</option>
            <option value="Done">Done (Selesai)</option>
          </select>

          {/* Jenis Kerja Filter */}
          <select
            value={jenisFilter}
            onChange={(e) => setJenisFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
              isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
            } focus:outline-none cursor-pointer`}
          >
            <option value="all">Semua Jenis Kerja</option>
            <option value="Pasang Baru">Pasang Baru</option>
            <option value="Gangguan">Gangguan (LOS)</option>
            <option value="ODP">Maintenance ODP</option>
          </select>
        </div>
      </div>

      {/* Tabel Data Tiket */}
      <div className={`rounded-3xl border overflow-hidden ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="overflow-x-auto">
          <table className={`w-full text-left text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <thead className={`${
              isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
            } uppercase text-[10px] tracking-wider border-b`}>
              <tr>
                <th className="px-4 py-3">ID Tiket</th>
                <th className="px-4 py-3">Jenis Pekerjaan</th>
                <th className="px-4 py-3">Pelanggan & Lokasi</th>
                <th className="px-4 py-3">Teknisi Bertugas</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
              {filteredTugas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-400 italic">
                    Tidak ada tiket pekerjaan yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredTugas.map((task) => {
                  const tech = users.find(u => Number(u.id) === Number(task.teknisi_id));
                  const isDone = task.status === 'Done';
                  const isProgress = task.status === 'Progress';

                  return (
                    <tr key={task.id} className={`${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'} transition`}>
                      <td className="px-4 py-3 font-mono font-bold text-blue-500">
                        #{task.id}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          task.jenis_kerja?.toLowerCase().includes('pasang baru')
                            ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                            : task.jenis_kerja?.toLowerCase().includes('gangguan')
                            ? 'bg-rose-600/20 text-rose-400 border-rose-500/30'
                            : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {task.jenis_kerja}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {task.pelanggan_nama || 'Pelanggan STO'}
                          {task.pelanggan_telp && (
                            <span className="text-[10px] text-slate-400 font-normal ml-1">({task.pelanggan_telp})</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{task.lokasi}</div>
                      </td>

                      <td className="px-4 py-3">
                        {tech ? (
                          <button
                            type="button"
                            onClick={() => setSelectedTechnician(tech)}
                            className="flex items-center gap-1.5 text-blue-500 dark:text-blue-400 hover:underline cursor-pointer font-semibold transition text-left"
                            title="Lihat detail & riwayat kerja teknisi ini di database Supabase"
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                            <span>{tech.nama_lengkap}</span>
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                            📢 Terbuka di Pool
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isDone
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : isProgress
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}>
                          {task.status || 'Open'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isDone && onOpenBastp && (
                            <button
                              onClick={() => onOpenBastp(task)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                              title="Lihat BASTP Dokumen Digital"
                            >
                              <FileText className="w-3 h-3" />
                              <span>BASTP</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleStartEdit(task)}
                            className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Edit Data Tiket"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleDelete(task.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Batalkan / Hapus Tiket"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Tiket Penugasan */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in">
          <div className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-600/20 text-blue-500">
                  <Edit2 className="w-5 h-5" />
                </span>
                <h3 className="text-base font-bold">Edit Tiket Penugasan #{editingTask.id}</h3>
              </div>
              <button
                onClick={() => setEditingTask(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-400">Jenis Pekerjaan</label>
                  <select
                    value={editForm.jenis_kerja}
                    onChange={(e) => setEditForm({ ...editForm, jenis_kerja: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    } focus:outline-none focus:border-blue-500`}
                  >
                    <option value="Pasang Baru">Pasang Baru</option>
                    <option value="Gangguan">Gangguan (LOS)</option>
                    <option value="ODP">Maintenance ODP</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-400">Status Tiket</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    } focus:outline-none focus:border-blue-500`}
                  >
                    <option value="Open">Open (Menunggu)</option>
                    <option value="Progress">Progress (Dikerjakan)</option>
                    <option value="Done">Done (Selesai)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-400">Nama Pelanggan</label>
                  <input
                    type="text"
                    required
                    value={editForm.pelanggan_nama}
                    onChange={(e) => setEditForm({ ...editForm, pelanggan_nama: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    } focus:outline-none focus:border-blue-500`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-400">No. Telepon / HP</label>
                  <input
                    type="text"
                    value={editForm.pelanggan_telp}
                    onChange={(e) => setEditForm({ ...editForm, pelanggan_telp: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    } focus:outline-none focus:border-blue-500`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-400">Alamat Lokasi Pelanggan</label>
                <input
                  type="text"
                  required
                  value={editForm.lokasi}
                  onChange={(e) => setEditForm({ ...editForm, lokasi: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  } focus:outline-none focus:border-blue-500`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-400">Teknisi Penanggung Jawab</label>
                <select
                  value={editForm.teknisi_id}
                  onChange={(e) => setEditForm({ ...editForm, teknisi_id: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  } focus:outline-none focus:border-blue-500`}
                >
                  <option value="">-- Siarkan Terbuka di Pool Teknisi --</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.nama_lengkap} ({tech.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-400">Keterangan / Instruksi Kerja</label>
                <textarea
                  rows="2"
                  value={editForm.keterangan}
                  onChange={(e) => setEditForm({ ...editForm, keterangan: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  } focus:outline-none focus:border-blue-500`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail & Riwayat Kerja Teknisi (Tersinkron dengan Supabase) */}
      {selectedTechnician && (
        <ModalDetailRiwayatTeknisi
          teknisi={selectedTechnician}
          onClose={() => setSelectedTechnician(null)}
          onOpenBastp={onOpenBastp}
          onNavigateToTracking={() => {}}
        />
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import ModernSidebar from '../components/ModernSidebar';
import {
  Printer,
  FileText,
  Search,
  CheckCircle2,
  Package,
  Wrench
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

export default function AuditReportPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { currentUser } = useApp();
  const {
    tugas,
    permohonan,
    detailPermohonan,
    barang,
    users
  } = useApp();

  const [statusFilter, setStatusFilter] = useState('all');
  const [jenisFilter, setJenisFilter] = useState('all');
  const [technicianFilter, setTechnicianFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Enriched tasks with materials and technician details
  const enrichedTasks = tugas.map(task => {
    const tech = users.find(u => u.id === task.teknisi_id);
    const pimpinan = users.find(u => u.id === task.pimpinan_id);

    // Find all released materials for this task
    const taskPermohonan = permohonan.filter(p => p.tugas_id === task.id && p.status === 'Released');
    const materialsUsed = [];

    taskPermohonan.forEach(p => {
      const details = detailPermohonan.filter(d => d.permohonan_id === p.id);
      details.forEach(d => {
        const item = barang.find(b => b.id === d.barang_id);
        if (item) {
          materialsUsed.push({
            nama_barang: item.nama_barang,
            jumlah: d.jumlah_minta,
            satuan: item.satuan
          });
        }
      });
    });

    return {
      ...task,
      tech,
      pimpinan,
      materialsUsed
    };
  });

  // Filter logic
  const filteredTasks = enrichedTasks.filter(task => {
    const matchStatus = statusFilter === 'all' || task.status.toLowerCase() === statusFilter.toLowerCase();
    const matchJenis = jenisFilter === 'all' || task.jenis_kerja === jenisFilter;
    const matchTech = technicianFilter === 'all' || String(task.teknisi_id) === String(technicianFilter);
    const matchSearch =
      task.pelanggan_nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.lokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(task.id).includes(searchQuery);

    return matchStatus && matchJenis && matchTech && matchSearch;
  });

  const handlePrint = () => {
    window.print();
  };

  const completedCount = enrichedTasks.filter(t => t.status === 'Done').length;
  const inProgressCount = enrichedTasks.filter(t => t.status === 'Progress').length;
  const totalMaterialsUsed = enrichedTasks.reduce((acc, t) => acc + t.materialsUsed.length, 0);

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row ${isDark ? 'bg-[#0a0f1d] text-slate-100' : 'bg-slate-50 text-slate-800'} transition-colors duration-300`}>
      {/* Left Sidebar */}
      <div className="no-print">
        <ModernSidebar
          activeTab="laporan-kerja"
          onTabChange={(tab) => {
            const role = currentUser?.role || 'pimpinan';
            if (role === 'teknisi') {
              navigate(`/dashboard-teknisi?tab=${tab}`);
            } else if (role === 'gudang') {
              navigate(`/dashboard-gudang?tab=${tab}`);
            } else {
              navigate(`/dashboard-pimpinan?tab=${tab}`);
            }
          }}
        />
      </div>

      <main className="flex-1 min-w-0 lg:pl-72 transition-all duration-300">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Toolbar (Hidden when printing) */}
        <div className={`no-print flex flex-col md:flex-row md:items-center justify-between gap-4 ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} border p-5 rounded-2xl transition-colors`}>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-burgundy-600/20 text-burgundy-500 border border-burgundy-500/30">
                <FileText className="w-5 h-5" />
              </span>
              <h1 className={`text-xl sm:text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Laporan Audit Kerja & Evaluasi Lapangan
              </h1>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
              Rekapitulasi resmi berita acara penanganan tiket, material logistik terpakai, dan dokumentasi foto STO Telkom Akses.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-burgundy-600 hover:bg-burgundy-700 active:scale-95 text-white font-bold text-xs shadow-lg shadow-burgundy-600/30 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Berita Acara (Print)</span>
            </button>
          </div>
        </div>

        {/* KPI Stats (Hidden when printing) */}
        <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-xl p-4 flex items-center justify-between`}>
            <div>
              <div className="text-[11px] text-emerald-500 font-semibold uppercase">Tiket Selesai (Done)</div>
              <div className="text-2xl font-extrabold text-emerald-500 mt-1">{completedCount}</div>
              <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>Tervalidasi dokumentasi foto</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-xl p-4 flex items-center justify-between`}>
            <div>
              <div className="text-[11px] text-blue-500 font-semibold uppercase">Sedang Dikerjakan</div>
              <div className="text-2xl font-extrabold text-blue-500 mt-1">{inProgressCount}</div>
              <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>Teknisi aktif di lapangan</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-500 border border-blue-500/30 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
          </div>

          <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-xl p-4 flex items-center justify-between`}>
            <div>
              <div className="text-[11px] text-amber-500 font-semibold uppercase">Log Alokasi Material</div>
              <div className="text-2xl font-extrabold text-amber-500 mt-1">{totalMaterialsUsed} Item</div>
              <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>Dirilis gudang resmi</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-500 border border-amber-500/30 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter Bar (Hidden when printing) */}
        <div className={`no-print ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3`}>
          <div className="relative flex-1 min-w-[240px]">
            <Search className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'} absolute left-3 top-1/2 -translate-y-1/2`} />
            <input
              type="text"
              placeholder="Cari ID tiket, nama pelanggan, atau lokasi..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 ${isDark ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-burgundy-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-burgundy-500'} border rounded-xl text-xs focus:outline-none`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className={`${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2`}
            >
              <option value="all">Semua Status</option>
              <option value="open">Open</option>
              <option value="progress">Progress</option>
              <option value="done">Done (Selesai)</option>
            </select>

            <select
              value={jenisFilter}
              onChange={e => setJenisFilter(e.target.value)}
              className={`${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2`}
            >
              <option value="all">Semua Jenis Kerja</option>
              <option value="Pasang Baru">Pasang Baru</option>
              <option value="Gangguan">Gangguan</option>
              <option value="ODP">ODP Maintenance</option>
            </select>

            <select
              value={technicianFilter}
              onChange={e => setTechnicianFilter(e.target.value)}
              className={`${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-3 py-2`}
            >
              <option value="all">Semua Teknisi</option>
              {users.filter(u => u.role === 'teknisi').map(t => (
                <option key={t.id} value={t.id}>{t.nama_lengkap}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Official Audit Document Container (Print-ready) */}
        <div className={`${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-md'} border rounded-2xl p-6 sm:p-8 shadow-2xl print-card`}>
          
          {/* Official Telkom Akses Header / Kop Surat (Shown when printing and on screen) */}
          <div className="border-b-2 border-burgundy-600 pb-4 mb-6 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-burgundy-600 flex items-center justify-center text-white font-black text-2xl shadow-lg border border-burgundy-400">
                TA
              </div>
              <div>
                <h2 className={`text-lg sm:text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} print-text-dark tracking-wide`}>
                  PT TELKOM AKSES - REGIONAL OPERATION
                </h2>
                <div className="text-xs font-semibold text-burgundy-600">SENTRAL TELEPON OTOMATIS (STO) PAYAKUMBUH - KOTO NAN IV</div>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} print-text-dark`}>Jl. Soekarno Hatta No. 12, Koto Nan IV, Payakumbuh Barat, Kota Payakumbuh | Telp: (0752) 92881</p>
              </div>
            </div>

            <div className={`text-right text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} print-text-dark`}>
              <div className={`font-mono text-[11px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'} print-text-dark`}>
                DOC: BA/STO-PYK/{new Date().getFullYear()}/{String(new Date().getMonth() + 1).padStart(2, '0')}
              </div>
              <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
                Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="text-center mb-6">
            <h3 className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'} print-text-dark uppercase tracking-wide`}>
              BERITA ACARA & EVALUASI OPERASIONAL PEKERJAAN LAPANGAN
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} print-text-dark`}>
              Rekapitulasi Penugasan, Alokasi Logistik Material, dan Dokumentasi Hasil Pekerjaan
            </p>
          </div>

          {/* Audit Data Table */}
          <div className="overflow-x-auto">
            <table className={`w-full text-left text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'} print-table`}>
              <thead className={`${isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'} uppercase text-[10px] tracking-wider border-b`}>
                <tr>
                  <th className="px-3 py-3 text-center">No Tiket</th>
                  <th className="px-3 py-3">Waktu Penugasan</th>
                  <th className="px-3 py-3">Jenis Pekerjaan</th>
                  <th className="px-3 py-3">Pelanggan & Lokasi</th>
                  <th className="px-3 py-3">Teknisi</th>
                  <th className="px-3 py-3">Material Terpakai</th>
                  <th className="px-3 py-3 text-center">Foto Bukti</th>
                  <th className="px-3 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                {filteredTasks.map(task => (
                  <tr key={task.id} className={`${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                    <td className={`px-3 py-3 text-center font-bold ${isDark ? 'text-white' : 'text-slate-900'} font-mono`}>
                      #{task.id}
                    </td>
                    <td className={`px-3 py-3 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <div>{task.waktu_buat}</div>
                      {task.waktu_selesai && (
                        <div className="text-[10px] text-emerald-500">Selesai: {task.waktu_selesai}</div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        task.jenis_kerja === 'Pasang Baru' ? 'bg-blue-600/20 text-blue-400 border-blue-500/40' :
                        task.jenis_kerja === 'Gangguan' ? 'bg-burgundy-600/20 text-burgundy-400 border-burgundy-500/40' :
                        'bg-purple-600/20 text-purple-400 border-purple-500/40'
                      }`}>
                        {task.jenis_kerja}
                      </span>
                    </td>
                    <td className="px-3 py-3 max-w-[200px]">
                      <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} print-text-dark`}>{task.pelanggan_nama}</div>
                      <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate`}>{task.lokasi}</div>
                    </td>
                    <td className={`px-3 py-3 font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'} print-text-dark`}>
                      {task.tech?.nama_lengkap}
                    </td>
                    <td className="px-3 py-3">
                      {task.materialsUsed.length === 0 ? (
                        <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'} italic`}>Tidak ada material dirilis</span>
                      ) : (
                        <div className="space-y-1">
                          {task.materialsUsed.map((m, idx) => (
                            <div key={idx} className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'} print-text-dark`}>
                              • {m.nama_barang} (<strong>{m.jumlah} {m.satuan}</strong>)
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {task.foto_bukti ? (
                        <div className="inline-block">
                          <img
                            src={task.foto_bukti}
                            alt="Bukti"
                            className={`w-12 h-12 object-cover rounded-lg border ${isDark ? 'border-slate-700' : 'border-slate-200'} shadow mx-auto`}
                          />
                          <span className="text-[9px] text-emerald-500 block mt-0.5">Tervalidasi</span>
                        </div>
                      ) : (
                        <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'} italic`}>- Belum ada -</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        task.status === 'Done' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' :
                        task.status === 'Progress' ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30' :
                        'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Official Signatures Block (Pimpinan & Teknisi) */}
          <div className={`mt-12 pt-6 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} grid grid-cols-2 gap-8 text-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} print-text-dark`}>
            <div>
              <p className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} print-text-dark`}>Disiapkan Oleh (Teknisi Lapangan),</p>
              <div className="h-20 flex items-center justify-center">
                <span className={`${isDark ? 'text-slate-600' : 'text-slate-400'} italic text-[11px] print-text-dark`}>( Tanda Tangan Digital )</span>
              </div>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} print-text-dark underline`}>Ahmad Fadli</p>
              <p className="text-[10px]">NIK: TA-2024-09881</p>
            </div>

            <div>
              <p className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} print-text-dark`}>Mengetahui & Menyetujui (Pimpinan STO),</p>
              <div className="h-20 flex items-center justify-center">
                <span className={`${isDark ? 'text-slate-600' : 'text-slate-400'} italic text-[11px] print-text-dark`}>( Tanda Tangan & Cap Wilayah )</span>
              </div>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} print-text-dark underline`}>Ir. Bambang Sudirman, M.T.</p>
              <p className="text-[10px]">Manager STO Payakumbuh</p>
            </div>
          </div>

        </div>
      </div>
      </main>
    </div>
  );
}

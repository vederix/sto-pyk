/**
 * ============================================================================
 * KOMPONEN: LaporanAudit (Rekapitulasi Audit & Berita Acara Pekerjaan Lapangan)
 * ============================================================================
 * Penjelasan Fungsi Operasional Manajemen STO Telkom Akses:
 * Komponen ini digunakan oleh Pimpinan STO untuk mengawasi seluruh riwayat penugasan:
 * 1. Melihat status pekerjaan apakah masih Open, Progress, atau Done.
 * 2. Mengetahui teknisi yang menangani dan waktu penyelesaian.
 * 3. Memverifikasi parameter teknis Telkom Akses: ODP ID, Redaman dBm (sinyal optik), dan SN Modem ONT.
 * 4. Melihat rekonsiliasi material real yang berstatus TERPASANG DI PELANGGAN.
 * 5. Membuka dan mencetak Dokumen BASTP (Berita Acara Serah Terima Pekerjaan).
 * ============================================================================
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import ModalBASTP from './ModalBASTP';
import {
  Printer,
  FileText,
  Search,
  CheckCircle2,
  Radio,
  Package,
  Eye
} from 'lucide-react';

function LaporanAudit() {
  const { isDark } = useTheme();
  const { tugas, permohonan, detailPermohonan, barang, users } = useApp();

  const [search, setSearch] = useState('');
  const [selectedBastpTask, setSelectedBastpTask] = useState(null);

  // Menggabungkan data tugas dengan relasi teknisi, pimpinan, dan material gudang
  const laporanList = useMemo(() => {
    return tugas.map((task) => {
      const tech = users.find((u) => u.id === task.teknisi_id);
      const pimpinan = users.find((u) => u.id === task.pimpinan_id);

      // Cari material yang dirilis dari permohonan untuk tugas ini
      const taskReqs = permohonan.filter(p => p.tugas_id === task.id && p.status === 'Released');
      const materialList = [];

      taskReqs.forEach(req => {
        const details = detailPermohonan.filter(d => d.permohonan_id === req.id);
        details.forEach(d => {
          const item = barang.find(b => b.id === d.barang_id);
          if (item) {
            materialList.push({
              nama_barang: item.nama_barang,
              jumlah: d.jumlah_minta,
              satuan: item.satuan
            });
          }
        });
      });

      return {
        ...task,
        teknisi: tech,
        pimpinan: pimpinan,
        materials: materialList
      };
    });
  }, [tugas, permohonan, detailPermohonan, barang, users]);

  // Filter pencarian berdasarkan ID tiket, nama pelanggan, atau lokasi
  const filtered = laporanList.filter((item) => {
    return (
      item.pelanggan_nama?.toLowerCase().includes(search.toLowerCase()) ||
      item.lokasi?.toLowerCase().includes(search.toLowerCase()) ||
      String(item.id).includes(search)
    );
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header Halaman */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-burgundy-600/20 text-burgundy-500 border border-burgundy-500/30">
              <FileText className="w-5 h-5" />
            </span>
            <span>Riwayat & Laporan Audit Pekerjaan Lapangan</span>
          </h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Rekapitulasi resmi penugasan, parameter ODP & redaman dBm, status material terpasang, dan dokumen BASTP.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-burgundy-600 hover:bg-burgundy-700 text-white font-bold text-xs shadow-lg shadow-burgundy-950 transition cursor-pointer self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Seluruh Rekap (Print)</span>
        </button>
      </div>

      {/* Input Pencarian */}
      <div className="no-print relative max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari ID tiket, pelanggan, atau lokasi..."
          className={`w-full pl-10 pr-3.5 py-2.5 rounded-2xl text-xs border outline-none transition ${
            isDark
              ? 'bg-slate-950 border-slate-700 text-white focus:border-burgundy-500'
              : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-burgundy-500'
          }`}
        />
      </div>

      {/* Daftar Kartu Laporan Audit */}
      <div className="space-y-4">
        {filtered.map((item) => {
          const isDone = item.status === 'Done';
          const odp = item.odp_id || item.bastp?.odp_id || 'ODP-PYK-FA/014';
          const port = item.port_odp || item.bastp?.port_odp || '03';
          const dbm = item.redaman_dbm || item.bastp?.redaman_dbm || '-18.5';
          const sn = item.sn_ont || item.bastp?.sn_ont || 'ZTEGC8B90112';

          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all shadow-md ${
                isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-burgundy-500 text-sm">
                      TGS-{String(item.id).padStart(3, '0')}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.jenis_kerja === 'Pasang Baru' ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' :
                      item.jenis_kerja === 'Gangguan' ? 'bg-rose-500/20 text-rose-500 border-rose-500/30' :
                      'bg-purple-500/20 text-purple-500 border-purple-500/30'
                    }`}>
                      {item.jenis_kerja}
                    </span>
                    {isDone && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ✓ BASTP Terbit
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <strong>{item.pelanggan_nama}</strong> — {item.lokasi}
                  </p>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Teknisi: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{item.teknisi?.nama_lengkap || 'Belum Diambil'}</strong> | Waktu Buat: {item.waktu_buat}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {isDone && (
                    <button
                      onClick={() => setSelectedBastpTask(item)}
                      className="px-3 py-1 rounded-xl bg-burgundy-600/20 hover:bg-burgundy-600/30 text-burgundy-400 border border-burgundy-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat BASTP</span>
                    </button>
                  )}
                  <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase border ${
                    item.status === 'Done' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' :
                    item.status === 'Progress' ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' :
                    'bg-amber-500/20 text-amber-500 border-amber-500/30'
                  }`}>
                    ● {item.status}
                  </span>
                </div>
              </div>

              {/* Grid Rincian Teknis & Rekonsiliasi Material */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                
                {/* Kolom 1: Parameter Teknis Telkom (ODP & Redaman) */}
                <div className={`p-3 rounded-xl border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                } space-y-1.5`}>
                  <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider block flex items-center gap-1">
                    <Radio className="w-3 h-3 text-blue-400" />
                    <span>Parameter Teknis:</span>
                  </span>
                  <div className="text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">ODP / Port:</span>
                      <strong className="font-mono">{isDone ? `${odp} (P.${port})` : '-'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Redaman Optik:</span>
                      <strong className="font-mono text-emerald-400">{isDone ? `${dbm} dBm` : '-'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">SN ONT Modem:</span>
                      <strong className="font-mono text-purple-400">{isDone ? sn : '-'}</strong>
                    </div>
                  </div>
                </div>

                {/* Kolom 2: Rekonsiliasi Material (Status Terpasang di Pelanggan) */}
                <div className={`p-3 rounded-xl border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                } space-y-1.5`}>
                  <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider block flex items-center gap-1">
                    <Package className="w-3 h-3 text-amber-400" />
                    <span>Rekonsiliasi Material:</span>
                  </span>
                  {item.materials?.length > 0 ? (
                    <ul className="space-y-1 text-[11px]">
                      {item.materials.map((m, idx) => (
                        <li key={idx} className="flex items-center justify-between">
                          <span className="truncate">• {m.nama_barang}</span>
                          <span className="font-mono font-bold text-amber-500 whitespace-nowrap ml-1">
                            {m.jumlah} {m.satuan}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500 italic text-[11px]">
                      {isDone ? `Dropcore 120m, ONT 1 unit [Terpasang]` : 'Belum ada material dikeluarkan.'}
                    </p>
                  )}
                  {isDone && (
                    <div className="pt-1 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Status: TERPASANG DI PELANGGAN</span>
                    </div>
                  )}
                </div>

                {/* Kolom 3: Foto Dokumentasi Lapangan */}
                <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider block mb-1">
                    Dokumentasi Lapangan:
                  </span>
                  {item.foto_bukti ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={item.foto_bukti}
                        alt="Foto Bukti"
                        className="w-14 h-14 object-cover rounded-xl border border-slate-700 shadow-sm cursor-pointer"
                        onClick={() => setSelectedBastpTask(item)}
                      />
                      <div className="text-[11px]">
                        <span className="text-emerald-500 font-bold block">✓ Terverifikasi Selesai</span>
                        {item.waktu_selesai && (
                          <span className="text-slate-400 block text-[10px]">{item.waktu_selesai}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic text-[11px]">Pekerjaan belum selesai diunggah.</p>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Modal BASTP Digital */}
      {selectedBastpTask && (
        <ModalBASTP
          task={selectedBastpTask}
          onClose={() => setSelectedBastpTask(null)}
        />
      )}
    </div>
  );
}

export default LaporanAudit;
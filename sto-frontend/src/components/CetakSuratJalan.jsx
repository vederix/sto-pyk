import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Printer, FileCheck, Clock } from 'lucide-react';

export default function CetakSuratJalan() {
  const { isDark } = useTheme();
  const { permohonan, detailPermohonan, barang, tugas, users } = useApp();

  // Released requests
  const releasedRequests = permohonan.filter(p => p.status === 'Released');
  const [selectedReqId, setSelectedReqId] = useState(releasedRequests[0]?.id || null);

  const activeRequest = permohonan.find(p => p.id === selectedReqId) || releasedRequests[0];
  const activeTask = tugas.find(t => t.id === activeRequest?.tugas_id);
  const activeTech = users.find(u => u.id === activeTask?.teknisi_id);

  const requestDetails = detailPermohonan
    .filter(d => d.permohonan_id === activeRequest?.id)
    .map(d => {
      const item = barang.find(b => b.id === d.barang_id);
      return { ...d, item };
    });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className={`no-print p-4 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-600/20 text-amber-500 border border-amber-500/30">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Cetak Surat Jalan Material</h2>
            <p className="text-xs text-slate-400">Dokumen serah terima pengeluaran barang dari gudang ke teknisi.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={activeRequest?.id || ''}
            onChange={(e) => setSelectedReqId(Number(e.target.value))}
            className={`text-xs px-3 py-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} focus:outline-none`}
          >
            {releasedRequests.map(req => (
              <option key={req.id} value={req.id}>
                Surat Jalan #{req.id} - Tiket #{req.tugas_id} ({req.waktu_rilis || req.waktu_request})
              </option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            disabled={!activeRequest}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-burgundy-600 hover:bg-burgundy-700 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-burgundy-600/30 transition cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Surat Jalan (Print)</span>
          </button>
        </div>
      </div>

      {/* Official Printable Sheet */}
      {activeRequest ? (
        <div className={`p-8 rounded-2xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'} shadow-2xl print-card`}>
          
          {/* Header */}
          <div className="border-b-2 border-burgundy-600 pb-4 mb-6 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-burgundy-600 flex items-center justify-center text-white font-black text-2xl shadow-lg border border-burgundy-400">
                TA
              </div>
              <div>
                <h1 className={`text-lg sm:text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'} print-text-dark tracking-wide`}>
                  PT TELKOM AKSES - LOGISTIK & WAREHOUSE
                </h1>
                <div className="text-xs font-bold text-burgundy-600 dark:text-burgundy-500">GUDANG MATERIAL STO PAYAKUMBUH - KOTO NAN IV</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 print-text-dark">Jl. Soekarno Hatta No. 12, Koto Nan IV, Payakumbuh Barat, Kota Payakumbuh | Gudang Logistik Lt. 1</p>
              </div>
            </div>

            <div className="text-right text-xs text-slate-500 dark:text-slate-400 print-text-dark font-mono">
              <div className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'} print-text-dark`}>
                SJ: SJ-GDG/{new Date().getFullYear()}/{String(activeRequest.id).padStart(5, '0')}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 print-text-dark mt-1">
                Waktu Rilis: {activeRequest.waktu_rilis || activeRequest.waktu_request}
              </div>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} print-text-dark uppercase tracking-wide`}>
              SURAT BUKTI PENGELUARAN & SERAH TERIMA BARANG (SURAT JALAN)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 print-text-dark">
              Verifikasi Pengeluaran Material Resmi Gudang Logistik
            </p>
          </div>

          {/* Details */}
          <div className={`grid grid-cols-2 gap-4 p-4 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/40 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-800'} print-table mb-6 text-xs print-text-dark`}>
            <div className="space-y-1.5">
              <div><strong className="text-slate-400">Nomor Tiket Pekerjaan:</strong> #{activeTask?.id || activeRequest.tugas_id}</div>
              <div><strong className="text-slate-400">Jenis Pekerjaan:</strong> {activeTask?.jenis_kerja}</div>
              <div><strong className="text-slate-400">Pelanggan / Wilayah:</strong> {activeTask?.pelanggan_nama} ({activeTask?.lokasi})</div>
            </div>
            <div className="space-y-1.5 text-right">
              <div><strong className="text-slate-400">Penerima Barang (Teknisi):</strong> {activeTech?.nama_lengkap}</div>
              <div><strong className="text-slate-400">NIK Teknisi:</strong> TA-{activeTech?.id}9821</div>
              <div><strong className="text-slate-400">Petugas Gudang:</strong> Siti Rahmawati (Warehouse Admin)</div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto mb-8">
            <table className={`w-full text-left text-xs ${isDark ? 'text-slate-300' : 'text-slate-800'} print-table`}>
              <thead className={`${isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'} uppercase text-[10px] tracking-wider border-b`}>
                <tr>
                  <th className="px-3 py-2.5 text-center w-12">No</th>
                  <th className="px-3 py-2.5">Kode Barang</th>
                  <th className="px-3 py-2.5">Nama Material & Kategori</th>
                  <th className="px-3 py-2.5 text-center">Satuan</th>
                  <th className="px-3 py-2.5 text-right">Jumlah Diserahkan</th>
                  <th className="px-3 py-2.5 text-center">Kondisi Fisik</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                {requestDetails.map((detail, idx) => (
                  <tr key={idx} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                    <td className="px-3 py-2.5 text-center font-mono">{idx + 1}</td>
                    <td className={`px-3 py-2.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{detail.item?.kode || `MAT-0${detail.barang_id}`}</td>
                    <td className={`px-3 py-2.5 font-semibold ${isDark ? 'text-white' : 'text-slate-900'} print-text-dark`}>
                      {detail.item?.nama_barang}
                      <span className={`block text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-normal`}>{detail.item?.kategori}</span>
                    </td>
                    <td className={`px-3 py-2.5 text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{detail.item?.satuan}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400 print-text-dark text-sm">{detail.jumlah_minta}</td>
                    <td className="px-3 py-2.5 text-center text-emerald-600 dark:text-emerald-500 font-semibold text-[10px]">BAIK / BARU</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className={`pt-6 border-t ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'} grid grid-cols-2 gap-8 text-center text-xs print-text-dark`}>
            <div>
              <p className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'} print-text-dark`}>Diserahkan Oleh (Petugas Gudang),</p>
              <div className="h-20 flex items-center justify-center">
                <span className="text-slate-500 italic text-[11px] print-text-dark">( Tanda Tangan & Cap Gudang )</span>
              </div>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} print-text-dark underline`}>Siti Rahmawati</p>
              <p className="text-[10px]">Staff Gudang & Logistik STO</p>
            </div>

            <div>
              <p className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'} print-text-dark`}>Diterima Lengkap Oleh (Teknisi Lapangan),</p>
              <div className="h-20 flex items-center justify-center">
                <span className="text-slate-500 italic text-[11px] print-text-dark">( Tanda Tangan Penerima )</span>
              </div>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} print-text-dark underline`}>{activeTech?.nama_lengkap || 'Ahmad Fadli'}</p>
              <p className="text-[10px]">NIK: TA-{activeTech?.id || 2}9821</p>
            </div>
          </div>

        </div>
      ) : (
        <div className={`p-12 text-center rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <Clock className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
          <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Belum Ada Pengeluaran Barang (Surat Jalan)</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Surat jalan akan otomatis terbuat saat petugas gudang menekan tombol "Rilis Barang & Potong Stok" pada antrean Output Barang.</p>
        </div>
      )}
    </div>
  );
}

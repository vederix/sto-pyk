import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Printer, FileText, Clock } from 'lucide-react';

export default function CetakSuratPermohonan() {
  const { isDark } = useTheme();
  const { permohonan, detailPermohonan, barang, tugas, users, currentUser } = useApp();

  // Find requests belonging to current technician or all if pimpinan/admin
  const techRequests = permohonan.filter(p => {
    const parentTask = tugas.find(t => t.id === p.tugas_id);
    if (currentUser?.role === 'teknisi') {
      return parentTask?.teknisi_id === currentUser?.id;
    }
    return true;
  });

  const [selectedReqId, setSelectedReqId] = useState(techRequests[0]?.id || null);

  const activeRequest = permohonan.find(p => p.id === selectedReqId) || techRequests[0];
  const activeTask = tugas.find(t => t.id === activeRequest?.tugas_id);
  const activeTech = users.find(u => u.id === activeTask?.teknisi_id) || currentUser;
  const activePimpinan = users.find(u => u.id === activeTask?.pimpinan_id) || users.find(u => u.role === 'pimpinan');

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
      {/* Top Selector Toolbar (Hidden on Print) */}
      <div className={`no-print p-4 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-burgundy-600/20 text-burgundy-500 border border-burgundy-500/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Cetak Surat Permohonan Material</h2>
            <p className="text-xs text-slate-400">Formulir permohonan material teknisi untuk pengesahan fisik Pimpinan.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={activeRequest?.id || ''}
            onChange={(e) => setSelectedReqId(Number(e.target.value))}
            className={`text-xs px-3 py-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} focus:outline-none`}
          >
            {techRequests.map(req => (
              <option key={req.id} value={req.id}>
                Permohonan #{req.id} - Tiket #{req.tugas_id} ({req.status})
              </option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-burgundy-600 hover:bg-burgundy-700 text-white font-bold text-xs shadow-lg shadow-burgundy-600/30 transition cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Formulir (Print)</span>
          </button>
        </div>
      </div>

      {/* Official Telkom Akses Printable Letter */}
      {activeRequest ? (
        <div className={`p-8 rounded-2xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'} shadow-2xl print-card`}>
          
          {/* Official Letterhead (Kop Surat) */}
          <div className="border-b-2 border-burgundy-600 pb-4 mb-6 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-burgundy-600 flex items-center justify-center text-white font-black text-2xl shadow-lg border border-burgundy-400">
                TA
              </div>
              <div>
                <h1 className={`text-lg sm:text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'} print-text-dark tracking-wide`}>
                  PT TELKOM AKSES - REGIONAL OPERATION
                </h1>
                <div className="text-xs font-bold text-burgundy-600 dark:text-burgundy-500">SENTRAL TELEPON OTOMATIS (STO) PAYAKUMBUH - KOTO NAN IV</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 print-text-dark">Jl. Soekarno Hatta No. 12, Koto Nan IV, Payakumbuh Barat, Kota Payakumbuh | Telp: (0752) 92881</p>
              </div>
            </div>

            <div className="text-right text-xs text-slate-500 dark:text-slate-400 print-text-dark font-mono">
              <div className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'} print-text-dark`}>
                NO: SPB/STO-PYK/{new Date().getFullYear()}/{String(activeRequest.id).padStart(4, '0')}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 print-text-dark mt-1">
                Tanggal: {activeRequest.waktu_request || new Date().toISOString().split('T')[0]}
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} print-text-dark uppercase tracking-wide`}>
              SURAT PERMOHONAN PENGAMBILAN MATERIAL GUDANG
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 print-text-dark">
              Dasar Penugasan Lapangan Tiket Operasional STO
            </p>
          </div>

          {/* Metadata Section */}
          <div className={`grid grid-cols-2 gap-4 p-4 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/40 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-800'} print-table mb-6 text-xs print-text-dark`}>
            <div className="space-y-1.5">
              <div><strong className="text-slate-400">ID Tiket Tugas:</strong> #{activeTask?.id || activeRequest.tugas_id}</div>
              <div><strong className="text-slate-400">Jenis Pekerjaan:</strong> {activeTask?.jenis_kerja || 'Gangguan / Pasang Baru'}</div>
              <div><strong className="text-slate-400">Nama Pelanggan:</strong> {activeTask?.pelanggan_nama || 'Pelanggan Telkom'}</div>
              <div><strong className="text-slate-400">Lokasi / Alamat:</strong> {activeTask?.lokasi || '-'}</div>
            </div>
            <div className="space-y-1.5 text-right">
              <div><strong className="text-slate-400">Teknisi Pemohon:</strong> {activeTech?.nama_lengkap}</div>
              <div><strong className="text-slate-400">NIK / ID Teknisi:</strong> TA-{activeTech?.id}9821</div>
              <div><strong className="text-slate-400">Catatan Kebutuhan:</strong> "{activeRequest.catatan_teknisi || '-'}"</div>
              <div className="flex items-center justify-end gap-1">
                <strong className="text-slate-400">Status Permohonan:</strong>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeRequest.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' :
                  activeRequest.status === 'Released' ? 'bg-blue-500/20 text-blue-400' :
                  activeRequest.status === 'Rejected' ? 'bg-rose-500/20 text-rose-400' :
                  'bg-amber-500/20 text-amber-400'
                }`}>
                  {activeRequest.status}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto mb-8">
            <table className={`w-full text-left text-xs ${isDark ? 'text-slate-300' : 'text-slate-800'} print-table`}>
              <thead className={`${isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'} uppercase text-[10px] tracking-wider border-b`}>
                <tr>
                  <th className="px-3 py-2.5 text-center w-12">No</th>
                  <th className="px-3 py-2.5">Kode Material</th>
                  <th className="px-3 py-2.5">Nama Barang / Spesifikasi</th>
                  <th className="px-3 py-2.5 text-center">Satuan</th>
                  <th className="px-3 py-2.5 text-right">Jumlah Permohonan</th>
                  <th className="px-3 py-2.5 text-center">Paraf Gudang</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                {requestDetails.map((detail, idx) => (
                  <tr key={idx} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                    <td className="px-3 py-2.5 text-center font-mono">{idx + 1}</td>
                    <td className={`px-3 py-2.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{detail.item?.kode || `MAT-0${detail.barang_id}`}</td>
                    <td className={`px-3 py-2.5 font-semibold ${isDark ? 'text-white' : 'text-slate-900'} print-text-dark`}>{detail.item?.nama_barang}</td>
                    <td className={`px-3 py-2.5 text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{detail.item?.satuan}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-amber-500 dark:text-amber-400 print-text-dark text-sm">{detail.jumlah_minta}</td>
                    <td className="px-3 py-2.5 text-center text-slate-400 print-text-dark">[ &nbsp; &nbsp; &nbsp; &nbsp; ]</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Official Signatures Block */}
          <div className={`pt-6 border-t ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'} grid grid-cols-3 gap-6 text-center text-xs print-text-dark`}>
            <div>
              <p className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'} print-text-dark`}>Pemohon (Teknisi Lapangan),</p>
              <div className="h-20 flex items-center justify-center">
                <span className="text-slate-500 italic text-[11px] print-text-dark">( Tanda Tangan )</span>
              </div>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} print-text-dark underline`}>{activeTech?.nama_lengkap}</p>
              <p className="text-[10px]">NIK: TA-{activeTech?.id}9821</p>
            </div>

            <div>
              <p className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'} print-text-dark`}>Menyetujui (Pimpinan STO),</p>
              <div className="h-20 flex items-center justify-center">
                {activeRequest.status === 'Approved' || activeRequest.status === 'Released' ? (
                  <div className="px-3 py-1 rounded-xl border border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    TELAH DISETUJUI DIGITAL
                  </div>
                ) : (
                  <span className="text-slate-500 italic text-[11px] print-text-dark">( Tanda Tangan & Cap )</span>
                )}
              </div>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} print-text-dark underline`}>{activePimpinan?.nama_lengkap || 'Ir. Bambang Sudirman, M.T.'}</p>
              <p className="text-[10px]">Manager STO Payakumbuh</p>
            </div>

            <div>
              <p className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'} print-text-dark`}>Menyerahkan (Petugas Gudang),</p>
              <div className="h-20 flex items-center justify-center">
                <span className="text-slate-500 italic text-[11px] print-text-dark">( Tanda Tangan & Cap Logistik )</span>
              </div>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} print-text-dark underline`}>Siti Rahmawati</p>
              <p className="text-[10px]">Staff Gudang & Logistik</p>
            </div>
          </div>

        </div>
      ) : (
        <div className={`p-12 text-center rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <Clock className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
          <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Belum Ada Surat Permohonan Barang</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Silakan ajukan surat permohonan material terlebih dahulu melalui menu "Surat Permohonan Barang".</p>
        </div>
      )}
    </div>
  );
}

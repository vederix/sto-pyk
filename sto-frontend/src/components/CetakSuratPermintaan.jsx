import React from 'react';
import { Printer, X, FileText } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function CetakSuratPermintaan({ task, items = [], onClose }) {
  const { isDark } = useTheme();

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const defaultItems = [
    { nama: 'Kabel FO Dropcore 1-Core', jumlah: '150', satuan: 'meter', fungsi: 'Penarikan ODP ke Pelanggan' },
    { nama: 'Modem ONT ZTE F670L Dual Band', jumlah: '1', satuan: 'unit', fungsi: 'CPE Perangkat Pelanggan' },
    { nama: 'Roset Optik 1-Port + Adapter SC/UPC', jumlah: '1', satuan: 'pcs', fungsi: 'Terminasi Dinding Indoor' },
    { nama: 'Patchcord SC/UPC - SC/UPC 2M', jumlah: '1', satuan: 'pcs', fungsi: 'Jumper Roset ke Modem' }
  ];

  const displayItems = items.length > 0 ? items : defaultItems;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className={`${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'} border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-4 transition-colors`}>
        
        {/* Modal Toolbar (Tidak tercetak saat print) */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <FileText className="w-4 h-4" />
            </span>
            <span className="font-bold text-xs sm:text-sm">
              Surat Permintaan Pengeluaran Material Gudang (Fisik)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lembar Cetak Standar Telkom Akses (Print Area) */}
        <div className="p-6 sm:p-8 bg-white text-slate-900 text-xs font-sans space-y-4 print:p-0 print:m-0">
          
          {/* Header Kop Surat */}
          <div className="border-b-2 border-red-700 pb-3 flex justify-between items-start">
            <div>
              <div className="font-black text-red-700 text-base sm:text-lg tracking-tight uppercase">
                PT TELKOM AKSES &bull; STO PAYAKUMBUH
              </div>
              <div className="text-[10px] text-slate-600 font-semibold">
                Divisi Pemeliharaan Jaringan & Logistik Material STO Koto Nan IV
              </div>
              <div className="text-[9px] text-slate-500">
                Jl. Soekarno Hatta No. 14, Payakumbuh Barat, Kota Payakumbuh, Sumatera Barat
              </div>
            </div>
            <div className="text-right text-[10px] font-mono">
              <span className="inline-block px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded font-bold text-[9px] uppercase">
                FORM SPM-GUDANG
              </span>
              <div className="text-slate-600 mt-1">No: SPM/TA-PYK/{task?.id || '101'}/{new Date().getFullYear()}</div>
              <div className="text-slate-500">Tanggal: {currentDate}</div>
            </div>
          </div>

          <div className="text-center py-1">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
              SURAT PERMINTAAN MATERIAL KERJA LAPANGAN
            </h2>
            <p className="text-[10px] text-slate-500">
              Acuan Tiket Penugasan Lapangan #{task?.id || '101'} &mdash; {task?.jenis_kerja || 'Pasang Baru IndiHome'}
            </p>
          </div>

          {/* Rincian Tiket & Lokasi */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px]">
            <div>
              <div><strong className="text-slate-600">Teknisi Pemohon:</strong> {task?.teknisi?.nama_lengkap || 'Ahmad Fadli'}</div>
              <div><strong className="text-slate-600">Pelanggan:</strong> {task?.pelanggan_nama || 'Bpk. Rian Hidayat'}</div>
              <div><strong className="text-slate-600">Kontak:</strong> {task?.pelanggan_telp || '081267890123'}</div>
            </div>
            <div>
              <div><strong className="text-slate-600">Acuan ODP:</strong> {task?.odp_kode || 'ODP-PYK-FA/001'}</div>
              <div><strong className="text-slate-600">Alamat Kerja:</strong> {task?.lokasi || 'Koto Nan IV, Payakumbuh'}</div>
              <div><strong className="text-slate-600">Status ODP:</strong> <span className="text-emerald-700 font-bold">Tersedia (HIJAU)</span></div>
            </div>
          </div>

          {/* Tabel Material */}
          <div>
            <div className="font-bold text-[11px] mb-1.5 uppercase text-slate-700">
              Daftar Permintaan Material Fisik ke Gudang:
            </div>
            <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase">
                  <th className="border border-slate-300 p-2 text-center w-8">No</th>
                  <th className="border border-slate-300 p-2">Nama Material / Spesifikasi</th>
                  <th className="border border-slate-300 p-2 text-center w-20">Volume</th>
                  <th className="border border-slate-300 p-2 text-center w-16">Satuan</th>
                  <th className="border border-slate-300 p-2">Peruntukan Fisik</th>
                  <th className="border border-slate-300 p-2 text-center w-16">Verifikasi</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                    <td className="border border-slate-300 p-2 font-medium">{item.nama || item.nama_barang}</td>
                    <td className="border border-slate-300 p-2 text-center font-bold text-amber-700">{item.jumlah || item.jumlah_minta}</td>
                    <td className="border border-slate-300 p-2 text-center">{item.satuan}</td>
                    <td className="border border-slate-300 p-2 text-slate-600">{item.fungsi || 'Instalasi Pelanggan'}</td>
                    <td className="border border-slate-300 p-2 text-center font-bold text-emerald-600">[ &check; ]</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Kolom Tanda Tangan */}
          <div className="pt-6 grid grid-cols-3 gap-4 text-center text-[10px]">
            <div>
              <div className="text-slate-500 uppercase font-semibold">Teknisi Pemohon</div>
              <div className="h-14"></div>
              <div className="font-bold border-t border-slate-400 pt-1 inline-block w-4/5">
                {task?.teknisi?.nama_lengkap || 'Ahmad Fadli'}
              </div>
            </div>
            <div>
              <div className="text-slate-500 uppercase font-semibold">Petugas Gudang (Rilis)</div>
              <div className="h-14"></div>
              <div className="font-bold border-t border-slate-400 pt-1 inline-block w-4/5">
                Siti Rahmawati
              </div>
            </div>
            <div>
              <div className="text-slate-500 uppercase font-semibold">Pimpinan Wilayah STO</div>
              <div className="h-14"></div>
              <div className="font-bold border-t border-slate-400 pt-1 inline-block w-4/5">
                Ir. Bambang Hermanto
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

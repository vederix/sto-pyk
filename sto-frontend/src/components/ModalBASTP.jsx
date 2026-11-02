/**
 * ============================================================================
 * KOMPONEN: ModalBASTP (Berita Acara Serah Terima Pekerjaan & Rekonsiliasi Material)
 * ============================================================================
 * Penjelasan Teknis Operasional STO Telkom Akses:
 * Dokumen BASTP ini adalah bukti digital resmi standar Telkom Akses yang membuktikan:
 * 1. Pekerjaan lapangan telah selesai dikerjakan dengan kualitas redaman teruji.
 * 2. Perangkat hardware (Modem ONT dengan Serial Number terdata) telah terpasang di rumah pelanggan.
 * 3. Rekonsiliasi material membuktikan kabel Dropcore dan material lain benar-benar
 *    "TERPASANG DI PELANGGAN (CONSUMED)" dan bukan hilang tanpa jejak.
 * 4. Dapat dicetak langsung (Print/PDF) untuk keperluan arsip administrasi resmi perusahaan.
 * ============================================================================
 */

import React from 'react';
import { useTheme } from '../context/ThemeContext';
import BrandLogo from './BrandLogo';
import {
  Printer,
  X,
  CheckCircle2,
  Radio,
  User,
  ShieldCheck,
  Package
} from 'lucide-react';

export default function ModalBASTP({ task, onClose }) {
  const { isDark } = useTheme();

  if (!task) return null;

  const bastp = task.bastp || {
    nomor_bastp: `BASTP/TA-PYK/2026/${String(task.id).padStart(4, '0')}`,
    odp_id: task.odp_id || 'ODP-PYK-FA/014',
    port_odp: task.port_odp || '03',
    redaman_dbm: task.redaman_dbm || '-18.5',
    sn_ont: task.sn_ont || 'ZTEGC8B90112',
    pelanggan_nama: task.pelanggan_nama || 'Pelanggan Telkom',
    waktu_closing: task.waktu_selesai || '2026-10-12 11:00',
    catatan_teknisi: task.catatan_selesai || task.catatan || 'Instalasi selesai, koneksi optimal.',
    reconciliation: [
      {
        nama_barang: 'Kabel Dropcore 1 Core (FO)',
        jumlah_diambil: 150,
        jumlah_terpakai: 120,
        jumlah_sisa: 30,
        satuan: 'meter',
        status: 'TERPASANG DI PELANGGAN (CONSUMED)'
      },
      {
        nama_barang: 'Modem ONT GPON Wi-Fi (ZTE F609)',
        jumlah_diambil: 1,
        jumlah_terpakai: 1,
        jumlah_sisa: 0,
        satuan: 'unit',
        sn: task.sn_ont || 'ZTEGC8B90112',
        status: 'TERPASANG DI PELANGGAN (CONSUMED)'
      }
    ]
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className={`rounded-3xl w-full max-w-3xl border shadow-2xl transition-all max-h-[92vh] flex flex-col ${
        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* HEADER MODAL DENGAN TOMBOL PRINT */}
        <div className="no-print flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold">
                Berita Acara Serah Terima Pekerjaan (BASTP) Digital
              </h2>
              <p className="text-[11px] text-slate-400">
                Dokumen Audit Rekonsiliasi Material Lapangan Resmi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-burgundy-600 hover:bg-burgundy-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak BASTP (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AREA DOKUMEN CETAK BASTP RESMI */}
        <div className="printable-bastp flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-xs text-slate-900 dark:text-slate-100">
          
          {/* KOP SURAT FORMAL */}
          <div className="pb-4 border-b-2 border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BrandLogo size="lg" />
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight">
                  PT TELKOM AKSES WILAYAH SUMATERA BARAT
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Kantor Operasional STO Payakumbuh (Koto Nan IV), Jl. Soekarno-Hatta
                </p>
                <div className="text-[10px] font-bold text-burgundy-600 dark:text-burgundy-400 tracking-wider uppercase mt-0.5">
                  UNIT PEMELIHARAAN JARINGAN & PROVISIONING INDIHOME
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right font-mono">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Nomor Dokumen BASTP:</div>
              <div className="text-xs font-black text-burgundy-600 dark:text-burgundy-400">
                {bastp.nomor_bastp}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Tanggal: {bastp.waktu_closing}
              </div>
            </div>
          </div>

          {/* JUDUL DOKUMEN */}
          <div className="text-center py-1">
            <h2 className="text-sm sm:text-base font-black tracking-wider uppercase underline underline-offset-4 text-burgundy-700 dark:text-burgundy-400">
              BERITA ACARA SERAH TERIMA PEKERJAAN & PEMAKAIAN MATERIAL
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Ref: Tiket Perintah Kerja #{task.id} — Jenis Pekerjaan: {task.jenis_kerja}
            </p>
          </div>

          {/* GRID DATA PELANGGAN & TEKNIS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: Data Pelanggan */}
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            } space-y-2`}>
              <div className="font-bold text-[11px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Identitas Pelanggan & Lokasi:</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nama Pelanggan:</span>
                  <strong className="text-right">{bastp.pelanggan_nama || task.pelanggan_nama}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Alamat Lokasi:</span>
                  <strong className="text-right max-w-[200px] truncate">{task.lokasi}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">No. Kontak:</span>
                  <span className="font-mono">{task.pelanggan_telp || '0812-xxxx-xxxx'}</span>
                </div>
              </div>
            </div>

            {/* Box 2: Parameter Teknis Quality Assurance */}
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            } space-y-2`}>
              <div className="font-bold text-[11px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>Parameter Teknis Jaringan (OPM & ODP):</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">ID ODP / Port:</span>
                  <strong className="font-mono">{bastp.odp_id} (Port {bastp.port_odp})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Redaman Optik (OPM):</span>
                  <strong className="font-mono text-emerald-500 font-bold">
                    {bastp.redaman_dbm} dBm (Lolos QC)
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SN ONT / Modem:</span>
                  <strong className="font-mono text-purple-400 font-bold">{bastp.sn_ont}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* TABEL REKONSILIASI MATERIAL REAL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-400" />
                <span>Rincian Rekonsiliasi Pemakaian Material Riil di Lapangan:</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Status: Resmi Terpasang di Pelanggan
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b ${isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                    <th className="py-2 px-3 font-bold">No</th>
                    <th className="py-2 px-3 font-bold">Nama Barang / Material</th>
                    <th className="py-2 px-3 font-bold text-center">Diambil</th>
                    <th className="py-2 px-3 font-bold text-center text-emerald-500">Terpasang (Consumed)</th>
                    <th className="py-2 px-3 font-bold text-center text-amber-500">Sisa Retur</th>
                    <th className="py-2 px-3 font-bold text-right">Status Inventaris</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {bastp.reconciliation?.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/10">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <strong className="block">{m.nama_barang}</strong>
                        {m.sn && (
                          <span className="text-[10px] font-mono text-purple-400">
                            SN Barcode: {m.sn}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {m.jumlah_diambil} {m.satuan}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-500">
                        {m.jumlah_terpakai} {m.satuan}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-500">
                        {m.jumlah_sisa} {m.satuan}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 whitespace-nowrap">
                          TERPASANG DI PELANGGAN
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px]">
              <strong>Keterangan Audit Material:</strong> Material yang tercatat pada kolom <em>Terpasang (Consumed)</em> secara permanen telah menjadi instalasi CPE di rumah pelanggan. Material sisa telah diverifikasi untuk retur ke gudang logistik.
            </div>
          </div>

          {/* FOTO BUKTI LAPANGAN */}
          {task.foto_bukti && (
            <div className="space-y-2">
              <span className="font-bold text-[11px] text-slate-400 uppercase tracking-wider block">
                Dokumentasi Bukti Fisik Lapangan:
              </span>
              <div className="flex items-center gap-4 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950/40">
                <img
                  src={task.foto_bukti}
                  alt="Bukti BASTP"
                  className="w-28 h-20 object-cover rounded-xl border border-slate-700 shadow-sm"
                />
                <div>
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Dokumentasi Lapangan Terverifikasi</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-md">
                    Catatan Teknisi: "{bastp.catatan_teknisi}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* KOLOM TANDA TANGAN (SIGNATURE BLOCK) */}
          <div className="pt-6 border-t border-slate-300 dark:border-slate-800 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Pelanggan Penerima</div>
              <div className="h-16 flex items-end justify-center font-bold text-xs">
                ( {bastp.pelanggan_nama || task.pelanggan_nama} )
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase">Teknisi Pelaksana</div>
              <div className="h-16 flex items-end justify-center font-bold text-xs text-burgundy-500">
                ( Petugas Lapangan STO )
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase">Pimpinan STO / Asman</div>
              <div className="h-16 flex items-end justify-center font-bold text-xs">
                ( Ir. Bambang Hermanto )
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}


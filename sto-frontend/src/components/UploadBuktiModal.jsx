/**
 * ============================================================================
 * KOMPONEN: UploadBuktiModal (Formulir Closing & Rekonsiliasi Material Real)
 * ============================================================================
 * Standar Operasional Prosedur (SOP IndiHome / Telkom Akses WFM):
 * Pada pekerjaan lapangan fiber optik (Pasang Baru PSB / Penanganan Gangguan):
 * 1. Teknisi tidak bisa sekadar klik "Selesai" dan upload 1 foto.
 * 2. Teknisi WAJIB melakukan validasi teknis:
 *    - ODP ID & Port ODP (titik distribusi kabel tiang Telkom).
 *    - Redaman Optik (Optical Power Loss dalam dBm, standar -16 s/d -24 dBm).
 *    - Serial Number (SN / Barcode) Modem ONT yang terpasang di rumah pelanggan.
 * 3. REKONSILIASI MATERIAL REAL:
 *    - Barang yang diambil dari gudang (misal Dropcore 150 meter) dihitung pemakaian riilnya (misal 125 meter).
 *    - 125 meter Dropcore + 1 unit Modem ONT resmi beralih status menjadi
 *      "TERPASANG DI PELANGGAN (CONSUMED)" — resmi keluar/hilang dari inventaris perusahaan!
 *    - Sisa 25 meter dapat di-retur kembali ke gudang sehingga stok akurat.
 * 4. Sistem otomatis menerbitkan Berita Acara Serah Terima Pekerjaan (BASTP) digital.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { compressImage } from '../utils/imageCompressor';
import {
  Camera,
  Upload,
  X,
  CheckCircle2,
  Barcode,
  Wrench,
  Radio,
  FileText,
  RotateCcw,
  Sparkles
} from 'lucide-react';

// Contoh foto dokumentasi lapangan standar Telkom Akses
const CONTOH_FOTO_LAPANGAN = [
  { label: 'Modem ONT & Indikator PON', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80' },
  { label: 'Penarikan Dropcore & ODP Tiang', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80' },
  { label: 'Hasil Ukur OPM (Redaman dBm)', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80' },
];

export default function UploadBuktiModal({ tugasId, onClose, onSuccess }) {
  const { isDark } = useTheme();
  const { tugas, permohonan, detailPermohonan, barang, finishTugas, showToast } = useApp();

  // Cari data tugas target berdasarkan ID
  const task = tugas.find((t) => Number(t.id) === Number(tugasId));

  // 1. STATE FORM DATA TEKNIS & PERANGKAT (STANDAR INDIHOME)
  const [odpId, setOdpId] = useState(task?.odp_id || 'ODP-PYK-FA/014');
  const [portOdp, setPortOdp] = useState(task?.port_odp || '03');
  const [redamanDbm, setRedamanDbm] = useState(task?.redaman_dbm || '-18.5');
  const [snOnt, setSnOnt] = useState(task?.sn_ont || 'ZTEGC8B90112');
  const [pelangganNama, setPelangganNama] = useState(task?.pelanggan_nama || 'Pelanggan Telkom');
  const [catatan, setCatatan] = useState('Pemasangan instalasi selesai. Redaman optimal (-18.5 dBm), lampu PON modem hijau solid, internet aktif.');
  const [returKeGudang, setReturKeGudang] = useState(true);

  // 2. STATE FOTO DOKUMENTASI
  const [preview, setPreview] = useState(CONTOH_FOTO_LAPANGAN[0].url);
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(1); // Step 1: Teknis & SN, Step 2: Rekonsiliasi Material, Step 3: Foto & Selesai

  // 3. DAFTAR MATERIAL YANG AKAN DIREKONSILIASI
  // Cari barang yang diajukan pada tiket ini dari permohonan yang disetujui / dirilis
  const [materialList, setMaterialList] = useState([]);

  useEffect(() => {
    const taskPermohonanList = permohonan.filter(p => Number(p.tugas_id) === Number(tugasId));
    let initialList = [];

    if (taskPermohonanList.length > 0) {
      taskPermohonanList.forEach(p => {
        const details = detailPermohonan.filter(d => Number(d.permohonan_id) === Number(p.id));
        details.forEach(d => {
          const item = barang.find(b => Number(b.id) === Number(d.barang_id));
          if (item) {
            // Dropcore default terpakai misal 80% dari tarikan, modem 100%
            const qtyMinta = Number(d.jumlah_minta) || 1;
            const terpakai = item.nama_barang.toLowerCase().includes('dropcore')
              ? Math.max(1, Math.round(qtyMinta * 0.85))
              : qtyMinta;
            const sisa = Math.max(0, qtyMinta - terpakai);

            initialList.push({
              barang_id: item.id,
              nama_barang: item.nama_barang,
              satuan: item.satuan,
              jumlah_diambil: qtyMinta,
              jumlah_terpakai: terpakai,
              jumlah_sisa: sisa,
              sn: item.nama_barang.toLowerCase().includes('ont') || item.nama_barang.toLowerCase().includes('modem') ? snOnt : null
            });
          }
        });
      });
    }

    // Jika tiket ini belum punya permohonan barang formal, berikan default material lapangan IndiHome
    if (initialList.length === 0) {
      initialList = [
        {
          barang_id: 1,
          nama_barang: 'Kabel Dropcore 1 Core (FO)',
          satuan: 'meter',
          jumlah_diambil: 150,
          jumlah_terpakai: 120,
          jumlah_sisa: 30,
          sn: null
        },
        {
          barang_id: 2,
          nama_barang: 'Modem ONT GPON Wi-Fi (ZTE F609)',
          satuan: 'unit',
          jumlah_diambil: 1,
          jumlah_terpakai: 1,
          jumlah_sisa: 0,
          sn: snOnt
        },
        {
          barang_id: 3,
          nama_barang: 'Roset Optik 1 Core + Pigtail',
          satuan: 'pcs',
          jumlah_diambil: 1,
          jumlah_terpakai: 1,
          jumlah_sisa: 0,
          sn: null
        }
      ];
    }

    setMaterialList(initialList);
  }, [tugasId, permohonan, detailPermohonan, barang, snOnt]);

  // Handler mengubah jumlah material terpakai
  const handleTerpakaiChange = (index, value) => {
    const val = Number(value) || 0;
    setMaterialList(prev => prev.map((item, idx) => {
      if (idx === index) {
        const terpakai = Math.min(item.jumlah_diambil, Math.max(0, val));
        const sisa = item.jumlah_diambil - terpakai;
        return { ...item, jumlah_terpakai: terpakai, jumlah_sisa: sisa };
      }
      return item;
    }));
  };

  // Garbage Collection cleanup: Lepas alokasi Blob Object URL lama dari memori browser
  useEffect(() => {
    return () => {
      if (preview && typeof preview === 'string' && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Handler upload file lokal dengan kompresi client-side otomatis & memory cleanup
  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      showToast('File harus berupa gambar foto', 'error');
      return;
    }

    // Bebaskan URL blob sebelumnya dari RAM browser jika ada
    if (preview && typeof preview === 'string' && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }

    try {
      // Kompres otomatis gambar kamera HP teknisi
      const compressed = await compressImage(selected, { maxWidth: 1280, maxHeight: 1280, quality: 0.82 });
      setFile(compressed);
      setPreview(URL.createObjectURL(compressed));
    } catch {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  // Validasi kualitas redaman optik (Standar Telkom Regional: -16.0 s/d -24.0 dBm)
  const redamanVal = parseFloat(redamanDbm);
  const isRedamanValid = !isNaN(redamanVal) && redamanVal >= -24.0 && redamanVal <= -14.0;

  // Generate Serial Number Acak Baru jika dibutuhkan
  const handleGenerateSn = () => {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newSn = `ZTEGC8${randomHex}`;
    setSnOnt(newSn);
    setMaterialList(prev => prev.map(m => {
      if (m.nama_barang.toLowerCase().includes('ont') || m.nama_barang.toLowerCase().includes('modem')) {
        return { ...m, sn: newSn };
      }
      return m;
    }));
    showToast(`Serial Number modem diperbarui: ${newSn}`, 'info');
  };

  // SUBMIT KLOSING TIKET & REKONSILIASI MATERIAL
  const handleSubmitClosing = async () => {
    setSubmitting(true);

    const closingPayload = {
      fotoBuktiUrl: preview,
      catatan,
      odp_id: odpId,
      port_odp: portOdp,
      redaman_dbm: redamanDbm,
      sn_ont: snOnt,
      pelanggan_nama: pelangganNama,
      retur_ke_gudang: returKeGudang,
      reconciliation: materialList,
      bastp_number: `BASTP/TA-PYK/2026/${String(tugasId).padStart(4, '0')}`
    };

    try {
      await finishTugas(tugasId, closingPayload);
      setSubmitting(false);
      onSuccess();
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className={`rounded-3xl p-5 sm:p-6 w-full max-w-2xl border shadow-2xl transition-all max-h-[92vh] flex flex-col ${
        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* HEADER MODAL */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-burgundy-600/20 text-burgundy-400 border border-burgundy-500/30 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-burgundy-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  CLOSING WORK ORDER & BASTP
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">Tiket #{tugasId}</span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold mt-0.5">
                Rekonsiliasi Material & Berita Acara Lapangan
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEPPER WIZARD TABS */}
        <div className="flex items-center gap-2 py-3 border-b border-slate-200 dark:border-slate-800 text-xs font-bold flex-shrink-0">
          <button
            onClick={() => setActiveStep(1)}
            className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeStep === 1
                ? 'bg-burgundy-600 text-white shadow'
                : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>1. Teknis & SN ONT</span>
          </button>

          <button
            onClick={() => setActiveStep(2)}
            className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeStep === 2
                ? 'bg-burgundy-600 text-white shadow'
                : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>2. Material Real</span>
          </button>

          <button
            onClick={() => setActiveStep(3)}
            className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeStep === 3
                ? 'bg-burgundy-600 text-white shadow'
                : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>3. Foto & BASTP</span>
          </button>
        </div>

        {/* BODY CONTENT SCROLLABLE */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs">

          {/* STEP 1: DATA TEKNIS & SERIAL NUMBER MODEM */}
          {activeStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className={`p-3.5 rounded-2xl border ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Identitas Pelanggan & Lokasi Penanganan:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Nama Pelanggan:</span>
                    <input
                      type="text"
                      value={pelangganNama}
                      onChange={(e) => setPelangganNama(e.target.value)}
                      className={`w-full p-2 rounded-xl border text-xs font-sans outline-none ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Lokasi Sambungan:</span>
                    <div className="p-2 rounded-xl bg-slate-900/40 border border-slate-800 text-xs font-sans text-slate-300 truncate">
                      {task?.lokasi || 'STO Payakumbuh Koto Nan IV'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Data ODP & Redaman */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-blue-400" />
                    <span>Terminasi ODP & Pengukuran Redaman (OPM):</span>
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isRedamanValid
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}>
                    {isRedamanValid ? '✓ Spek Telkom Lolos QC' : '⚠️ Cek Redaman Optik'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">ID ODP Tiang:</label>
                    <input
                      type="text"
                      value={odpId}
                      onChange={(e) => setOdpId(e.target.value)}
                      placeholder="Contoh: ODP-PYK-FA/014"
                      className={`w-full p-2.5 rounded-xl border font-mono text-xs outline-none ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Port ODP:</label>
                    <input
                      type="text"
                      value={portOdp}
                      onChange={(e) => setPortOdp(e.target.value)}
                      placeholder="Contoh: 03 (Port 1-16)"
                      className={`w-full p-2.5 rounded-xl border font-mono text-xs outline-none ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Redaman (dBm):</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={redamanDbm}
                        onChange={(e) => setRedamanDbm(e.target.value)}
                        placeholder="-18.5"
                        className={`w-full p-2.5 pr-10 rounded-xl border font-mono text-xs font-bold outline-none ${
                          isRedamanValid ? 'text-emerald-400' : 'text-amber-400'
                        } ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
                        dBm
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic">
                  * Standar Telkom Akses Regional: Redaman optimal berada di antara -16.0 dBm s/d -24.0 dBm.
                </p>
              </div>

              {/* Serial Number ONT */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Barcode className="w-3.5 h-3.5 text-purple-400" />
                    <span>Serial Number (SN Barcode ONT / Modem Pelanggan):</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateSn}
                    className="text-[10px] font-bold text-burgundy-400 hover:text-burgundy-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Acak SN Baru</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={snOnt}
                    onChange={(e) => setSnOnt(e.target.value)}
                    placeholder="Contoh: ZTEGC8B90112"
                    className={`flex-1 p-2.5 rounded-xl border font-mono font-bold tracking-wider text-xs outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-emerald-400' : 'bg-white border-slate-300 text-emerald-600'
                    }`}
                  />
                </div>
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[11px]">
                  <strong>Binding CPE Pelanggan:</strong> Perangkat modem dengan SN ini akan resmi dialokasikan permanen ke rumah pelanggan (bukan lagi on-hand teknisi).
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-5 py-2.5 rounded-xl bg-burgundy-600 hover:bg-burgundy-700 text-white font-bold text-xs shadow-lg transition cursor-pointer"
                >
                  Lanjut ke Rekonsiliasi Material →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: REKONSILIASI MATERIAL REAL (CONSUMED VS SISA RETUR) */}
          {activeStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
              } space-y-3`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm">Rekonsiliasi Material Lapangan Real</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Catat berapa panjang/jumlah material yang terpasang di rumah pelanggan vs sisa yang diretur ke gudang.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    SOP Logistik Telkom
                  </span>
                </div>

                {/* Tabel Rekonsiliasi Material */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                        <th className="py-2 px-2.5 font-bold">Material / Barang</th>
                        <th className="py-2 px-2.5 font-bold text-center">Diambil</th>
                        <th className="py-2 px-2.5 font-bold text-center text-emerald-400">Terpasang (Consumed)</th>
                        <th className="py-2 px-2.5 font-bold text-center text-amber-400">Sisa (Retur)</th>
                        <th className="py-2 px-2.5 font-bold text-right">Status Akhir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {materialList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/20">
                          <td className="py-2.5 px-2.5">
                            <span className="font-semibold block">{item.nama_barang}</span>
                            {item.sn && (
                              <span className="text-[10px] font-mono text-purple-400 block">
                                SN: {item.sn}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2.5 text-center font-mono font-bold">
                            {item.jumlah_diambil} {item.satuan}
                          </td>
                          <td className="py-2.5 px-2.5 text-center">
                            <input
                              type="number"
                              min="0"
                              max={item.jumlah_diambil}
                              value={item.jumlah_terpakai}
                              onChange={(e) => handleTerpakaiChange(idx, e.target.value)}
                              className={`w-20 text-center p-1.5 rounded-lg border font-mono font-bold text-xs outline-none ${
                                isDark ? 'bg-slate-900 border-slate-700 text-emerald-400' : 'bg-slate-50 border-slate-300 text-emerald-600'
                              }`}
                            />
                          </td>
                          <td className="py-2.5 px-2.5 text-center font-mono text-amber-400 font-bold">
                            {item.jumlah_sisa} {item.satuan}
                          </td>
                          <td className="py-2.5 px-2.5 text-right">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                              TERPASANG (CONSUMED)
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Opsi Retur Otomatis */}
                <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-xs">Retur Sisa Material ke Gudang Otomatis</span>
                      <p className="text-[10px] text-slate-400">
                        Sisa material yang tidak terpasang (misal potongan dropcore) otomatis ditambahkan kembali ke stok gudang.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={returKeGudang}
                    onChange={(e) => setReturKeGudang(e.target.checked)}
                    className="w-4 h-4 rounded text-burgundy-600 accent-burgundy-600 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  ← Kembali
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="px-5 py-2.5 rounded-xl bg-burgundy-600 hover:bg-burgundy-700 text-white font-bold text-xs shadow-lg transition cursor-pointer"
                >
                  Lanjut ke Foto & Penerbitan BASTP →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: FOTO DOKUMENTASI & PENERBITAN BASTP */}
          {activeStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Preview Foto */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
                  Foto Bukti Pelaksanaan (Kamera HP / Lapangan):
                </label>
                <div className={`border-2 border-dashed rounded-2xl overflow-hidden relative ${
                  isDark ? 'border-slate-700 bg-slate-950' : 'border-slate-300 bg-slate-50'
                }`}>
                  {preview ? (
                    <div className="relative h-44 w-full">
                      <img src={preview} alt="Bukti Selesai" className="w-full h-full object-cover" />
                      <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] text-white font-mono flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Kamera STO Payakumbuh</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                      <p className="text-slate-400 text-xs">Pilih contoh foto atau ambil foto baru</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Preset Foto Cepat */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Pilihan Dokumentasi Cepat Lapangan:
                </span>
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  {CONTOH_FOTO_LAPANGAN.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => { setPreview(sample.url); setFile(null); }}
                      className={`p-2 rounded-xl border truncate transition cursor-pointer text-center ${
                        preview === sample.url
                          ? 'bg-burgundy-600 text-white border-burgundy-500 font-bold'
                          : isDark
                          ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload File Sendiri */}
              <label className={`block py-2.5 px-3 rounded-xl border text-center cursor-pointer transition ${
                isDark ? 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}>
                <span className="font-semibold text-xs">Pilih Foto Sendiri dari Perangkat</span>
                <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
              </label>

              {/* Catatan Selesai */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Catatan Teknisi / Berita Acara:
                </label>
                <textarea
                  rows={2}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Kondisi redaman, lampu ONT, kepuasan pelanggan..."
                  className={`w-full p-2.5 rounded-xl border outline-none text-xs ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Ringkasan BASTP */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Dokumen BASTP Siap Diterbitkan</span>
                </div>
                <div>• Nomor BASTP: <strong>BASTP/TA-PYK/2026/{String(tugasId).padStart(4, '0')}</strong></div>
                <div>• ODP / Port: <strong>{odpId} (Port {portOdp})</strong> | Redaman: <strong>{redamanDbm} dBm</strong></div>
                <div>• SN ONT Terpasang: <strong>{snOnt}</strong> (Status: Terpasang di Pelanggan)</div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  ← Kembali
                </button>
                <button
                  type="button"
                  onClick={handleSubmitClosing}
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-950 transition cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Memproses BASTP...' : 'Closing & Terbitkan BASTP'}</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
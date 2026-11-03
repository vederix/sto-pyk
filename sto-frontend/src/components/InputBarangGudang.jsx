import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axiosInstance';
import {
  PlusCircle,
  PackageCheck,
  History,
  Barcode,
  Boxes,
  Tag
} from 'lucide-react';

export default function InputBarangGudang() {
  const { isDark } = useTheme();
  const { addBarang, showToast } = useApp();

  const [form, setForm] = useState({
    nama_barang: '',
    stok: 1,
    satuan: 'pcs'
  });

  // State Nomor Seri hanya untuk perangkat ONT/Modem (Manual Scan Barcode Fisik)
  const [inputSn, setInputSn] = useState('');
  const [serialNumbers, setSerialNumbers] = useState([]);

  // Recent in-flow history in session
  const [historyLog, setHistoryLog] = useState([
    {
      id: 1,
      nama_barang: 'Kabel FO Dropcore 1-Core 150M',
      jumlah: 105,
      satuan: 'roll',
      waktu: '2026-09-17 08:30',
      serial_count: 0
    },
    {
      id: 2,
      nama_barang: 'Modem ONT ZTE F670L Dual Band',
      jumlah: 11,
      satuan: 'unit',
      waktu: '2026-09-17 09:15',
      serial_count: 11
    }
  ]);

  // Deteksi ketat: HANYA barang kategori ONT atau Modem yang mewajibkan input Nomor Seri (SN)
  const isOntItem = form.nama_barang.toLowerCase().includes('ont') ||
                    form.nama_barang.toLowerCase().includes('modem');

  // Preset material logistik STO untuk kemudahan staf gudang
  const materialPresets = [
    { name: 'Modem ONT ZTE F670L Dual Band', unit: 'unit' },
    { name: 'Modem ONT Huawei HG8245H5', unit: 'unit' },
    { name: 'Kabel FO Dropcore 1-Core 150M', unit: 'roll' },
    { name: 'Kabel Sling Baja Penggantung FO', unit: 'roll' },
    { name: 'Roset Fiber Optic 1-Core', unit: 'pcs' },
    { name: 'Patch Cord SC-UPC 2M', unit: 'pcs' },
    { name: 'Splitter PLC 1:8 SC/UPC', unit: 'pcs' },
    { name: 'Protection Sleeve 60mm', unit: 'pcs' }
  ];

  const handleSelectPreset = (preset) => {
    setForm({
      nama_barang: preset.name,
      stok: preset.name.toLowerCase().includes('ont') || preset.name.toLowerCase().includes('modem') ? Math.max(1, serialNumbers.length) : 10,
      satuan: preset.unit
    });
    if (!preset.name.toLowerCase().includes('ont') && !preset.name.toLowerCase().includes('modem')) {
      setSerialNumbers([]);
    }
  };

  // Tambah SN manual / hasil scan barcode fisik
  const handleAddManualSn = () => {
    if (!inputSn.trim()) return;

    // Mendukung pemisahan koma, spasi, atau baris baru jika scan banyak sekaligus
    const items = inputSn
      .split(/[\n,\s]+/)
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);

    const uniqueNew = items.filter(s => !serialNumbers.includes(s));
    if (uniqueNew.length > 0) {
      const updated = [...serialNumbers, ...uniqueNew];
      setSerialNumbers(updated);
      setForm(prev => ({ ...prev, stok: updated.length }));
      setInputSn('');
      showToast(`${uniqueNew.length} Nomor Seri Barcode ONT berhasil dicatat!`, 'success');
    } else {
      showToast('Nomor seri sudah terdaftar dalam daftar input!', 'error');
    }
  };

  const handleRemoveSn = (indexToRemove) => {
    const updated = serialNumbers.filter((_, idx) => idx !== indexToRemove);
    setSerialNumbers(updated);
    setForm(prev => ({ ...prev, stok: Math.max(1, updated.length) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama_barang.trim()) {
      showToast('Harap isi nama material!', 'error');
      return;
    }

    if (isOntItem && serialNumbers.length === 0) {
      showToast('Khusus perangkat ONT/Modem, scan atau ketik minimal 1 Serial Number fisik!', 'error');
      return;
    }

    const stokCount = isOntItem && serialNumbers.length > 0
      ? serialNumbers.length
      : Math.max(1, Number(form.stok) || 1);

    const newItem = {
      nama_barang: form.nama_barang.trim(),
      stok: stokCount,
      satuan: form.satuan
    };

    // 1. Simpan ke master barang di database
    await addBarang(newItem);

    // 2. Jika item ONT, simpan serial numbers ke database tracking & storage
    if (isOntItem && serialNumbers.length > 0) {
      try {
        await api.post('/barang/seri', {
          model: form.nama_barang,
          serial_numbers: serialNumbers
        });
      } catch (err) {
        console.warn('[InputBarang] Backend seri notice:', err.message);
      }

      // Simpan ke local storage tracking
      const existingSnStorage = JSON.parse(localStorage.getItem('sto_ont_serials') || '[]');
      const now = new Date().toLocaleString('id-ID');
      const newEntries = serialNumbers.map((sn, idx) => ({
        id: Date.now() + idx,
        sn,
        model: form.nama_barang,
        status: 'Di Gudang',
        lokasi: 'Rak Logistik Sentral STO Payakumbuh',
        tugas_id: null,
        waktu: now
      }));
      localStorage.setItem('sto_ont_serials', JSON.stringify([...newEntries, ...existingSnStorage]));
    }

    // Add to session history log
    setHistoryLog([
      {
        id: Date.now(),
        nama_barang: form.nama_barang,
        jumlah: stokCount,
        satuan: form.satuan,
        waktu: new Date().toLocaleString('id-ID'),
        serial_count: isOntItem ? serialNumbers.length : 0
      },
      ...historyLog
    ]);

    showToast(
      `Material "${form.nama_barang}" (+${stokCount} ${form.satuan}) ${
        isOntItem ? `dengan ${serialNumbers.length} SN Barcode ONT` : ''
      } berhasil masuk ke gudang!`,
      'success'
    );

    // Reset form
    setForm({
      nama_barang: '',
      stok: 1,
      satuan: 'pcs'
    });
    setSerialNumbers([]);
    setInputSn('');
  };

  return (
    <div className="space-y-6">
      {/* Form Card */}
      <div className={`p-6 sm:p-8 rounded-3xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} transition-colors`}>
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800 mb-6">
          <span className="p-2.5 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
            <PlusCircle className="w-5 h-5" />
          </span>
          <div>
            <h2 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
              <span>Pengadaan Barang Masuk</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
                Logistik STO
              </span>
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Registrasi pengadaan material baru dan barcode Serial Number (SN) ONT.
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-5 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
            <Tag className="w-3.5 h-3.5" />
            <span>Pilihan Cepat Material:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {materialPresets.map(preset => {
              const isSelected = form.nama_barang === preset.name;
              const isPresetOnt = preset.name.toLowerCase().includes('ont') || preset.name.toLowerCase().includes('modem');
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                      : isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <span>{preset.name}</span>
                  {isPresetOnt && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-500/20 text-purple-400 border border-purple-500/30 font-mono">
                      +SN
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className={`block font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Nama Barang / Model Material *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Modem ONT ZTE F670L / Kabel FO Dropcore / Roset FO"
                value={form.nama_barang}
                onChange={e => setForm({ ...form, nama_barang: e.target.value })}
                className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'} focus:outline-none focus:border-emerald-500 font-semibold`}
              />
            </div>

            <div>
              <label className={`block font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Satuan Ukuran *
              </label>
              <select
                value={form.satuan}
                onChange={e => setForm({ ...form, satuan: e.target.value })}
                className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} focus:outline-none focus:border-emerald-500 cursor-pointer font-bold`}
              >
                <option value="pcs">pcs (buah)</option>
                <option value="unit">unit (perangkat ONT/modem)</option>
                <option value="roll">roll (gulungan kabel / sling)</option>
                <option value="meter">meter</option>
                <option value="set">set</option>
                <option value="box">box</option>
              </select>
            </div>
          </div>

          {/* HANYA MUNCUL JIKA BARANG KATEGORI ONT/MODEM */}
          {isOntItem ? (
            <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-purple-950/20 border-purple-500/30' : 'bg-purple-50/70 border-purple-200'} space-y-3.5 animate-in fade-in duration-200`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-purple-500/20">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <Barcode className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="font-extrabold text-xs text-purple-400">
                      Input Nomor Seri (SN Barcode) Perangkat ONT Fisik
                    </h4>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Scan barcode pada dus/stiker belakang modem ONT atau ketik manual.
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 w-fit">
                  Total SN: {serialNumbers.length} Unit
                </span>
              </div>

              {/* Input Scan Barcode SN Manual */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Scan barcode atau ketik SN (misal: ZTEGC8B90112 / HWTC12345678)"
                  value={inputSn}
                  onChange={(e) => setInputSn(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddManualSn();
                    }
                  }}
                  className={`flex-1 p-2.5 rounded-xl border font-mono uppercase font-bold text-xs ${isDark ? 'bg-slate-950 border-purple-700/60 text-white placeholder-slate-500' : 'bg-white border-purple-300 text-slate-900 placeholder-slate-400'} focus:outline-none focus:border-purple-500`}
                />
                <button
                  type="button"
                  onClick={handleAddManualSn}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Barcode className="w-3.5 h-3.5" />
                  <span>+ Tambah SN</span>
                </button>
              </div>

              {/* Daftar Tag SN Terdaftar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Daftar SN Siap Disimpan ({serialNumbers.length} unit):</span>
                  {serialNumbers.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSerialNumbers([]);
                        setForm(prev => ({ ...prev, stok: 1 }));
                      }}
                      className="text-rose-400 hover:underline cursor-pointer font-bold"
                    >
                      Hapus Semua
                    </button>
                  )}
                </div>

                <div className={`p-3 rounded-xl border max-h-36 overflow-y-auto flex flex-wrap gap-1.5 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200'}`}>
                  {serialNumbers.length === 0 ? (
                    <span className="text-slate-500 italic text-[11px] p-1">
                      Belum ada nomor seri yang dimasukkan. Silakan scan barcode fisik modem ONT di atas.
                    </span>
                  ) : (
                    serialNumbers.map((sn, idx) => (
                      <span
                        key={sn + idx}
                        className="px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono text-[11px] font-bold flex items-center gap-1.5"
                      >
                        <Barcode className="w-3 h-3 text-purple-400" />
                        <span>{sn}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSn(idx)}
                          className="text-slate-400 hover:text-rose-400 ml-1 cursor-pointer font-black text-xs"
                          title="Hapus SN ini"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Info untuk material non-ONT
            <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'} text-xs flex items-center gap-2.5`}>
              <Boxes className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                Material umum (Kabel, Sling, Roset, Patch Cord, dll) tidak menggunakan Nomor Seri. Cukup masukkan jumlah fisik di bawah.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className={`block font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Jumlah Stok Masuk Fisik *
              </label>
              <input
                type="number"
                min="1"
                required
                disabled={isOntItem && serialNumbers.length > 0}
                value={isOntItem && serialNumbers.length > 0 ? serialNumbers.length : form.stok}
                onChange={e => setForm({ ...form, stok: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} focus:outline-none focus:border-emerald-500 font-bold ${
                  isOntItem && serialNumbers.length > 0 ? 'opacity-80 bg-purple-950/20' : ''
                }`}
              />
              <p className="text-[10px] text-slate-500 mt-1">
                {isOntItem
                  ? 'Jumlah stok otomatis mengikuti banyaknya barcode SN fisik yang discan/dimasukkan.'
                  : 'Total unit fisik barang yang masuk ke rak gudang.'}
              </p>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-950 transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Simpan Barang Masuk ke Gudang</span>
              </button>
            </div>
          </div>

        </form>
      </div>

      {/* Recent History Table */}
      <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-emerald-400" />
          <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Riwayat Barang Masuk Terakhir
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className={`w-full text-left text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <thead className={`${isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'} uppercase text-[10px] tracking-wider border-b`}>
              <tr>
                <th className="px-4 py-3">Waktu Masuk</th>
                <th className="px-4 py-3">Nama Barang</th>
                <th className="px-4 py-3 text-right">Jumlah Masuk</th>
                <th className="px-4 py-3 text-center">Nomor Seri (SN)</th>
                <th className="px-4 py-3 text-center">Status Database</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
              {historyLog.map(item => (
                <tr key={item.id} className={`${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'} transition`}>
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{item.waktu}</td>
                  <td className={`px-4 py-3 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.nama_barang}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-500 text-sm">
                    +{item.jumlah} {item.satuan}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.serial_count > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        {item.serial_count} SN Terdaftar
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Tersimpan di Supabase
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

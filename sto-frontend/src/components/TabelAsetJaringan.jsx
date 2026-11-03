import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import {
  Radio,
  Search,
  PlusCircle,
  Download,
  Edit2,
  Trash2,
  MapPin
} from 'lucide-react';

export default function TabelAsetJaringan({ onNavigateToWebGis }) {
  const { isDark } = useTheme();
  const { odp, addOdp, updateOdp, deleteOdp, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'ODP' | 'Tiang FO' | 'ODC'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'Tersedia' | 'Hampir Penuh' | 'Penuh' | 'Maintenance'
  const [filterKapasitas, setFilterKapasitas] = useState('all'); // 'all' | '8' | '16' | '24'

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [form, setForm] = useState({
    kode_odp: '',
    tipe_aset: 'ODP',
    nama_lokasi: '',
    latitude: -0.2285,
    longitude: 100.6335,
    kapasitas_port: 8,
    port_terpakai: 0,
    redaman_dbm: -18.5,
    status: 'Tersedia',
    keterangan: ''
  });

  // Filtered Assets
  const filteredAssets = odp.filter(item => {
    const matchSearch =
      (item.kode_odp || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.nama_lokasi || '').toLowerCase().includes(searchQuery.toLowerCase());

    const itemType = item.tipe_aset || (item.kode_odp?.startsWith('TIANG') ? 'Tiang FO' : item.kode_odp?.startsWith('ODC') ? 'ODC' : 'ODP');
    const matchType = filterType === 'all' || itemType === filterType;
    const matchStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchKapasitas = filterKapasitas === 'all' || String(item.kapasitas_port) === filterKapasitas;

    return matchSearch && matchType && matchStatus && matchKapasitas;
  });

  const handleOpenAdd = () => {
    const nextNumber = odp.length + 1;
    setForm({
      kode_odp: `ODP-PYK-FA/${String(nextNumber).padStart(3, '0')}`,
      tipe_aset: 'ODP',
      nama_lokasi: 'Jl. Soekarno Hatta, Koto Nan IV',
      latitude: -0.2289,
      longitude: 100.6322,
      kapasitas_port: 8,
      port_terpakai: 0,
      redaman_dbm: -18.50,
      status: 'Tersedia',
      keterangan: 'Distribusi fiber optic baru'
    });
    setEditingItem(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({
      kode_odp: item.kode_odp || '',
      tipe_aset: item.tipe_aset || (item.kode_odp?.startsWith('TIANG') ? 'Tiang FO' : 'ODP'),
      nama_lokasi: item.nama_lokasi || '',
      latitude: item.latitude || -0.2289,
      longitude: item.longitude || 100.6322,
      kapasitas_port: item.kapasitas_port || 8,
      port_terpakai: item.port_terpakai || 0,
      redaman_dbm: item.redaman_dbm || -18.5,
      status: item.status || 'Tersedia',
      keterangan: item.keterangan || ''
    });
    setShowAddModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.kode_odp.trim() || !form.nama_lokasi.trim()) {
      showToast('Kode aset dan nama lokasi wajib diisi!', 'warning');
      return;
    }

    if (editingItem) {
      updateOdp(editingItem.id, form);
      showToast(`Data aset ${form.kode_odp} berhasil diperbarui!`, 'success');
    } else {
      addOdp(form);
      showToast(`Aset baru ${form.kode_odp} berhasil ditambahkan ke WebGIS!`, 'success');
    }

    setShowAddModal(false);
    setEditingItem(null);
  };

  const handleDelete = (item) => {
    if (window.confirm(`Konfirmasi: Apakah Anda yakin ingin menghapus aset ${item.kode_odp} (${item.nama_lokasi})?`)) {
      deleteOdp(item.id);
    }
  };

  // Export to Excel / CSV
  const handleExportCsv = () => {
    const headers = [
      'ID',
      'Kode Aset',
      'Tipe Aset',
      'Nama Lokasi / Jalan',
      'Latitude',
      'Longitude',
      'Kapasitas Port',
      'Port Terpakai',
      'Rasio Okupansi (%)',
      'Redaman Optik (dBm)',
      'Status WebGIS',
      'Keterangan'
    ];

    const rows = filteredAssets.map(item => {
      const type = item.tipe_aset || (item.kode_odp?.startsWith('TIANG') ? 'Tiang FO' : item.kode_odp?.startsWith('ODC') ? 'ODC' : 'ODP');
      const ratio = item.kapasitas_port ? ((item.port_terpakai / item.kapasitas_port) * 100).toFixed(1) : '0';
      return [
        item.id,
        `"${item.kode_odp || ''}"`,
        `"${type}"`,
        `"${item.nama_lokasi || ''}"`,
        item.latitude,
        item.longitude,
        item.kapasitas_port,
        item.port_terpakai,
        `"${ratio}%"`,
        item.redaman_dbm,
        `"${item.status}"`,
        `"${item.keterangan || ''}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Aset_Jaringan_ODP_Tiang_STO_Payakumbuh_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Laporan aset ODP/Tiang berhasil diexport ke CSV / Excel!', 'success');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className={`p-5 sm:p-6 rounded-3xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              INFRASTRUKTUR JARINGAN
            </span>
          </div>
          <h2 className={`text-xl sm:text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Inventaris Aset Jaringan
          </h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
            Data titik ODP, tiang FO, dan ODC wilayah Payakumbuh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel (CSV)</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-950 transition cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Tambah ODP / Tiang</span>
          </button>
        </div>
      </div>

      {/* Toolbar Filter & Pencarian */}
      <div className={`p-4 rounded-3xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} space-y-3`}>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Input Pencarian */}
          <div className="relative flex-1">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Cari kode ODP, tiang, nama lokasi, atau jalan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 ${
                isDark ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Group Filter */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            
            {/* Filter Tipe Aset */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Tipe:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`p-2 rounded-xl border text-xs font-semibold ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="all">Semua Aset</option>
                <option value="ODP">ODP (Distribusi)</option>
                <option value="Tiang FO">Tiang FO</option>
                <option value="ODC">ODC (Kabinet Feeder)</option>
              </select>
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`p-2 rounded-xl border text-xs font-semibold ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="all">Semua Status</option>
                <option value="Tersedia">🟢 Tersedia</option>
                <option value="Hampir Penuh">🟡 Hampir Penuh</option>
                <option value="Penuh">🔴 Penuh</option>
                <option value="Maintenance">🔧 Maintenance</option>
              </select>
            </div>

            {/* Filter Kapasitas */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Port:</span>
              <select
                value={filterKapasitas}
                onChange={(e) => setFilterKapasitas(e.target.value)}
                className={`p-2 rounded-xl border text-xs font-semibold ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="all">Semua Port</option>
                <option value="8">8 Port</option>
                <option value="16">16 Port</option>
                <option value="24">24 Port</option>
              </select>
            </div>

          </div>

        </div>
      </div>

      {/* Tabel Master Aset Jaringan */}
      <div className={`rounded-3xl border overflow-hidden shadow-xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Daftar Titik Infrastruktur Jaringan Terdata
            </h3>
            <p className="text-[11px] text-slate-400">
              Menampilkan {filteredAssets.length} dari total {odp.length} titik aset jaringan Payakumbuh.
            </p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Realtime Supabase Sync
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className={`w-full text-left text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <thead className={`${isDark ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'} uppercase text-[10px] tracking-wider border-b`}>
              <tr>
                <th className="px-4 py-3">Kode Aset</th>
                <th className="px-4 py-3">Tipe</th>
                <th className="px-4 py-3">Lokasi / Patokan</th>
                <th className="px-4 py-3 text-center">Koordinat GPS</th>
                <th className="px-4 py-3 text-center">Port Terpakai</th>
                <th className="px-4 py-3 text-center">Redaman (OPM)</th>
                <th className="px-4 py-3 text-center">Status WebGIS</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Tidak ditemukan aset jaringan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredAssets.map(item => {
                  const type = item.tipe_aset || (item.kode_odp?.startsWith('TIANG') ? 'Tiang FO' : item.kode_odp?.startsWith('ODC') ? 'ODC' : 'ODP');
                  const ratio = item.kapasitas_port ? (item.port_terpakai / item.kapasitas_port) : 0;
                  const ratioPercent = (ratio * 100).toFixed(0);

                  const statusClass = item.status === 'Penuh'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : item.status === 'Hampir Penuh'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : item.status === 'Maintenance'
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';

                  return (
                    <tr key={item.id} className={`${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'} transition`}>
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-amber-400 text-xs">
                          {item.kode_odp}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">ID #{item.id}</span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                          {type}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} max-w-xs truncate`}>
                          {item.nama_lokasi}
                        </div>
                        {item.keterangan && (
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{item.keterangan}</div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center font-mono text-[11px] text-slate-400">
                        {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-mono font-bold text-xs">
                            {item.port_terpakai} / {item.kapasitas_port} Port
                          </span>
                          <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                ratio >= 1.0 ? 'bg-rose-500' : ratio >= 0.7 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, ratioPercent)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center font-mono font-bold text-xs">
                        <span className={item.redaman_dbm <= -24 ? 'text-rose-400' : 'text-emerald-400'}>
                          {item.redaman_dbm} dBm
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusClass}`}>
                          {item.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onNavigateToWebGis && (
                            <button
                              type="button"
                              onClick={() => onNavigateToWebGis(item)}
                              className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 transition cursor-pointer"
                              title="Lihat di WebGIS"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition cursor-pointer"
                            title="Edit Data Aset"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 border border-slate-700 transition cursor-pointer"
                            title="Hapus Aset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal Tambah / Edit Aset */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className={`${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'} border w-full max-w-lg rounded-3xl shadow-2xl p-6 my-4 space-y-4 text-xs transition-colors`}>
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                  <Radio className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold">
                    {editingItem ? `Edit Aset: ${editingItem.kode_odp}` : 'Registrasi Titik Aset Jaringan Baru'}
                  </h3>
                  <p className="text-[10px] text-slate-400">Sinkron otomatis ke tabel ODP Supabase & Peta WebGIS</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-300">Tipe Aset *</label>
                  <select
                    value={form.tipe_aset}
                    onChange={(e) => setForm({ ...form, tipe_aset: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} focus:outline-none focus:border-emerald-500`}
                  >
                    <option value="ODP">ODP (Optical Distribution Point)</option>
                    <option value="Tiang FO">Tiang FO Tumpu / Tarik</option>
                    <option value="ODC">ODC (Optical Distribution Cabinet)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-300">Kode / Nama Aset *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: ODP-SBT-05"
                    value={form.kode_odp}
                    onChange={(e) => setForm({ ...form, kode_odp: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} font-mono uppercase font-bold focus:outline-none focus:border-emerald-500`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-300">Nama Lokasi / Patokan Jalan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jl. Simpang Benteng No. 14, Payakumbuh"
                  value={form.nama_lokasi}
                  onChange={(e) => setForm({ ...form, nama_lokasi: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} focus:outline-none focus:border-emerald-500`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-300">Latitude (Garis Lintang)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) })}
                    className={`w-full p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} font-mono`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-300">Longitude (Garis Bujur)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) })}
                    className={`w-full p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} font-mono`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-300">Kapasitas Port</label>
                  <select
                    value={form.kapasitas_port}
                    onChange={(e) => setForm({ ...form, kapasitas_port: parseInt(e.target.value, 10) })}
                    className={`w-full p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  >
                    <option value="8">8 Port</option>
                    <option value="16">16 Port</option>
                    <option value="24">24 Port</option>
                    <option value="0">0 (Tiang)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-300">Port Terpakai</label>
                  <input
                    type="number"
                    min="0"
                    max={form.kapasitas_port}
                    value={form.port_terpakai}
                    onChange={(e) => setForm({ ...form, port_terpakai: parseInt(e.target.value, 10) || 0 })}
                    className={`w-full p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} font-mono font-bold`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-300">Redaman dBm</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.redaman_dbm}
                    onChange={(e) => setForm({ ...form, redaman_dbm: parseFloat(e.target.value) || -18.5 })}
                    className={`w-full p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} font-mono`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-300">Status Titik</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                >
                  <option value="Tersedia">🟢 Tersedia (Port Masih Ada)</option>
                  <option value="Hampir Penuh">🟡 Hampir Penuh (&ge; 70%)</option>
                  <option value="Penuh">🔴 Penuh (100% Terisi)</option>
                  <option value="Maintenance">🔧 Maintenance / Perbaikan Redaman</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-300">Keterangan / Catatan Teknis</label>
                <input
                  type="text"
                  placeholder="Contoh: Tiang distribusi utama jalur komplek"
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`px-4 py-2.5 rounded-xl ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'} font-semibold text-xs cursor-pointer`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-lg shadow-emerald-950 active:scale-95 cursor-pointer"
                >
                  {editingItem ? 'Simpan Perubahan Aset' : 'Daftarkan Titik Aset'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState } from 'react';
import WebGISMap from './WebGISMap';
import {
  MapPin,
  Plus,
  Search,
  Radio,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';

export default function WebGISTracking({ initialSelectedTaskId = null }) {
  const { isDark } = useTheme();
  const {
    odp = [],
    addOdp,
    updateOdp,
    deleteOdp,
    showToast
  } = useApp();

  const [selectedOdpId, setSelectedOdpId] = useState(null);
  const [selectedTugasId, setSelectedTugasId] = useState(initialSelectedTaskId);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal Tambah / Edit ODP
  const [showOdpModal, setShowOdpModal] = useState(false);
  const [editingOdp, setEditingOdp] = useState(null);
  const [odpForm, setOdpForm] = useState({
    kode_odp: '',
    nama_lokasi: '',
    latitude: -0.2285,
    longitude: 100.6335,
    kapasitas_port: 8,
    port_terpakai: 0,
    redaman_dbm: -18.5,
    status: 'Tersedia',
    keterangan: ''
  });

  const handleOpenAdd = () => {
    setEditingOdp(null);
    setOdpForm({
      kode_odp: `ODP-PYK-FA/${String(odp.length + 1).padStart(3, '0')}`,
      nama_lokasi: '',
      latitude: -0.2285,
      longitude: 100.6335,
      kapasitas_port: 8,
      port_terpakai: 0,
      redaman_dbm: -18.5,
      status: 'Tersedia',
      keterangan: ''
    });
    setShowOdpModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingOdp(item);
    setOdpForm({
      kode_odp: item.kode_odp,
      nama_lokasi: item.nama_lokasi,
      latitude: item.latitude,
      longitude: item.longitude,
      kapasitas_port: item.kapasitas_port,
      port_terpakai: item.port_terpakai,
      redaman_dbm: item.redaman_dbm,
      status: item.status,
      keterangan: item.keterangan || ''
    });
    setShowOdpModal(true);
  };

  const handleSaveOdp = async (e) => {
    e.preventDefault();
    if (!odpForm.kode_odp || !odpForm.nama_lokasi) {
      showToast('Kode ODP dan nama lokasi wajib diisi!', 'error');
      return;
    }

    if (editingOdp) {
      await updateOdp(editingOdp.id, odpForm);
    } else {
      await addOdp(odpForm);
    }

    setShowOdpModal(false);
  };

  const handleDeleteOdp = (id) => {
    if (window.confirm('Yakin ingin menghapus titik ODP ini dari WebGIS?')) {
      deleteOdp(id);
    }
  };

  // Filter ODP
  const filteredOdp = odp.filter((item) => {
    const matchSearch =
      item.kode_odp?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nama_lokasi?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Statistik ODP
  const totalOdp = odp.length;
  const tersediaOdp = odp.filter(o => o.status === 'Tersedia').length;
  const penuhOdp = odp.filter(o => o.status === 'Penuh').length;
  const maintenanceOdp = odp.filter(o => o.status === 'Maintenance').length;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-blue-600/20 text-blue-500 border border-blue-500/30">
              <MapPin className="w-5 h-5" />
            </span>
            <span>WebGIS Pemetaan Infrastruktur ODP STO Telkom Payakumbuh</span>
          </h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Pemetaan titik Optical Distribution Point (ODP), kapasitas port, redaman optik (dBm), dan sebaran tiket penugasan lapangan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Titik ODP</span>
          </button>
        </div>
      </div>

      {/* KPI Ringkasan ODP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="text-[10px] font-bold text-slate-400 uppercase">Total ODP Terdata</div>
          <div className="text-xl font-black mt-0.5 text-blue-500">{totalOdp} Titik</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Wilayah STO Payakumbuh</div>
        </div>

        <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="text-[10px] font-bold text-emerald-500 uppercase">ODP Port Tersedia</div>
          <div className="text-xl font-black mt-0.5 text-emerald-500">{tersediaOdp} Titik</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Siap pasang baru IndiHome</div>
        </div>

        <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="text-[10px] font-bold text-rose-500 uppercase">ODP Port Penuh</div>
          <div className="text-xl font-black mt-0.5 text-rose-500">{penuhOdp} Titik</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Kapasitas splitter 100%</div>
        </div>

        <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="text-[10px] font-bold text-amber-500 uppercase">Perlu Maintenance</div>
          <div className="text-xl font-black mt-0.5 text-amber-500">{maintenanceOdp} Titik</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Redaman &gt; -24 dBm</div>
        </div>
      </div>

      {/* Grid: Map Utama */}
      <div className="h-[520px] w-full rounded-2xl overflow-hidden shadow-xl">
        <WebGISMap
          selectedOdpId={selectedOdpId}
          onSelectOdp={setSelectedOdpId}
          selectedTugasId={selectedTugasId}
          onSelectTugas={setSelectedTugasId}
          onOpenAddOdp={handleOpenAdd}
        />
      </div>

      {/* Panel Daftar & Kelola Data ODP */}
      <div className={`p-4 sm:p-5 rounded-3xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-500" />
            <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Daftar Titik ODP & Inventarisasi Aset Jaringan Fiber Optic
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari ODP / Jalan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-8 pr-3 py-1.5 rounded-xl text-xs border ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                } focus:outline-none focus:border-blue-500`}
              />
            </div>

            {/* Filter Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              } focus:outline-none cursor-pointer`}
            >
              <option value="all">Semua Status</option>
              <option value="Tersedia">Tersedia</option>
              <option value="Penuh">Penuh</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        {/* ODP Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredOdp.map((point) => {
            const isSelected = selectedOdpId === point.id;
            const totalPort = Number(point.kapasitas_port) || 8;
            const usedPort = Number(point.port_terpakai) || 0;
            const availablePort = Math.max(0, totalPort - usedPort);
            const percentUsed = Math.round((usedPort / totalPort) * 100);

            let statusBadge = 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
            let barColor = 'bg-emerald-500';

            if (point.status === 'Maintenance' || Number(point.redaman_dbm) <= -24) {
              statusBadge = 'bg-rose-500/20 text-rose-500 border-rose-500/30';
              barColor = 'bg-rose-500';
            } else if (availablePort === 0 || point.status === 'Penuh') {
              statusBadge = 'bg-red-500/20 text-red-500 border-red-500/30';
              barColor = 'bg-red-500';
            } else if (availablePort <= 1) {
              statusBadge = 'bg-amber-500/20 text-amber-500 border-amber-500/30';
              barColor = 'bg-amber-500';
            }

            return (
              <div
                key={point.id}
                onClick={() => setSelectedOdpId(point.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-500/10'
                    : isDark
                    ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-500 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
                      FO
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {point.kode_odp}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {Number(point.latitude).toFixed(4)}, {Number(point.longitude).toFixed(4)}
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusBadge}`}>
                    {point.status}
                  </span>
                </div>

                <div className="mt-2.5 space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px]">Alamat Tiang:</span>
                    <div className={`font-semibold text-[11px] truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {point.nama_lokasi}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-slate-400">Port Terpakai:</span>
                      <strong className={isDark ? 'text-white' : 'text-slate-900'}>
                        {usedPort} / {totalPort} Port ({availablePort} Kosong)
                      </strong>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${percentUsed}%` }}></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-1">
                    <span className="text-slate-400">Redaman Optik:</span>
                    <span className={`font-mono font-bold ${Number(point.redaman_dbm) <= -24 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {point.redaman_dbm ? `${point.redaman_dbm} dBm` : '-18.5 dBm'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-800/40">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(point);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteOdp(point.id);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Tambah / Edit ODP */}
      {showOdpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in">
          <div className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-600/20 text-blue-500">
                  <MapPin className="w-5 h-5" />
                </span>
                <h3 className="text-base font-bold">
                  {editingOdp ? 'Edit Titik ODP' : 'Pendaftaran Titik ODP Baru'}
                </h3>
              </div>
              <button
                onClick={() => setShowOdpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOdp} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-400">Kode ODP *</label>
                  <input
                    type="text"
                    required
                    value={odpForm.kode_odp}
                    onChange={(e) => setOdpForm({ ...odpForm, kode_odp: e.target.value })}
                    placeholder="Contoh: ODP-PYK-FA/001"
                    className={`w-full p-2.5 rounded-xl border ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    } focus:outline-none focus:border-blue-500`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-400">Status ODP</label>
                  <select
                    value={odpForm.status}
                    onChange={(e) => setOdpForm({ ...odpForm, status: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    } focus:outline-none focus:border-blue-500`}
                  >
                    <option value="Tersedia">Tersedia</option>
                    <option value="Penuh">Penuh</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-400">Nama Lokasi / Tiang Distribusi *</label>
                <input
                  type="text"
                  required
                  value={odpForm.nama_lokasi}
                  onChange={(e) => setOdpForm({ ...odpForm, nama_lokasi: e.target.value })}
                  placeholder="Contoh: Jl. Soekarno Hatta No. 14, Koto Nan IV"
                  className={`w-full p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  } focus:outline-none focus:border-blue-500`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-400">Latitude (Koordinat)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={odpForm.latitude}
                    onChange={(e) => setOdpForm({ ...odpForm, latitude: parseFloat(e.target.value) })}
                    className={`w-full p-2.5 rounded-xl border ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    } focus:outline-none focus:border-blue-500`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-400">Longitude (Koordinat)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={odpForm.longitude}
                    onChange={(e) => setOdpForm({ ...odpForm, longitude: parseFloat(e.target.value) })}
                    className={`w-full p-2.5 rounded-xl border ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    } focus:outline-none focus:border-blue-500`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-400">Kapasitas Port</label>
                  <input
                    type="number"
                    min="1"
                    value={odpForm.kapasitas_port}
                    onChange={(e) => setOdpForm({ ...odpForm, kapasitas_port: parseInt(e.target.value, 10) })}
                    className={`w-full p-2.5 rounded-xl border ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    } focus:outline-none focus:border-blue-500`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-400">Port Terpakai</label>
                  <input
                    type="number"
                    min="0"
                    value={odpForm.port_terpakai}
                    onChange={(e) => setOdpForm({ ...odpForm, port_terpakai: parseInt(e.target.value, 10) })}
                    className={`w-full p-2.5 rounded-xl border ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    } focus:outline-none focus:border-blue-500`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-400">Redaman (dBm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={odpForm.redaman_dbm}
                    onChange={(e) => setOdpForm({ ...odpForm, redaman_dbm: parseFloat(e.target.value) })}
                    className={`w-full p-2.5 rounded-xl border ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    } focus:outline-none focus:border-blue-500`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-400">Catatan Jalur Feeder / Keterangan</label>
                <input
                  type="text"
                  value={odpForm.keterangan}
                  onChange={(e) => setOdpForm({ ...odpForm, keterangan: e.target.value })}
                  placeholder="Contoh: Jalur Feeder 02 dari Sentral STO"
                  className={`w-full p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  } focus:outline-none focus:border-blue-500`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOdpModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {editingOdp ? 'Simpan Perubahan' : 'Tambahkan ODP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
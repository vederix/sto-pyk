import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ModernSidebar from '../components/ModernSidebar';
import InputBarangGudang from '../components/InputBarangGudang';
import CetakSuratJalan from '../components/CetakSuratJalan';
import ModalBASTP from '../components/ModalBASTP';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import {
  CheckCircle2,
  Edit2,
  Trash2,
  Search,
  TrendingDown,
  Send,
  Boxes,
  ClipboardCheck,
  Eye,
  ShieldCheck,
  Barcode,
  PlusCircle,
  PieChart,
  BarChart3,
  Download,
  FileSpreadsheet,
  Truck,
  Check,
  User,
  MapPin
} from 'lucide-react';

export default function GudangDashboard({ defaultTab }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const { isDark } = useTheme();
  const {
    barang,
    permohonan,
    detailPermohonan,
    tugas,
    users,
    releaseMaterial,
    updateBarang,
    showToast
  } = useApp();

  const user = JSON.parse(localStorage.getItem('user')) || { id: 4, nama_lengkap: 'Siti Rahmawati', role: 'gudang' };

  const [activeMenu, setActiveMenu] = useState(() => {
    return urlTab || defaultTab || sessionStorage.getItem('sto_gudang_tab') || 'daftar-barang';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [ontSearchQuery, setOntSearchQuery] = useState('');
  const [ontStatusFilter, setOntStatusFilter] = useState('all');

  // Modals
  const [editingItem, setEditingItem] = useState(null);
  const [bastpModalTask, setBastpModalTask] = useState(null);

  // Form State for Add / Edit
  const [barangForm, setBarangForm] = useState({
    nama_barang: '',
    stok: 10,
    satuan: 'pcs',
    kategori: 'Aksesoris',
    kode: ''
  });

  // Sync activeMenu with URL query params and sessionStorage
  useEffect(() => {
    const target = urlTab || defaultTab;
    if (target && target !== activeMenu) {
      setActiveMenu(target);
      sessionStorage.setItem('sto_gudang_tab', target);
    }
  }, [urlTab, defaultTab]);

  const handleTabChange = (newTab) => {
    setActiveMenu(newTab);
    sessionStorage.setItem('sto_gudang_tab', newTab);
    navigate(`/dashboard-gudang?tab=${newTab}`, { replace: true });
  };

  // Graceful role protection
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u && u.role !== 'gudang') {
          navigate(u.role === 'pimpinan' ? '/dashboard-pimpinan' : '/dashboard-teknisi', { replace: true });
        }
      }
    } catch {
      // ignore
    }
  }, [navigate]);

  // Lookup maps with O(1) performance for fast multi-table joins
  const { taskMap, userMap, itemMap } = useMemo(() => {
    const tMap = new Map((tugas || []).map(t => [t.id, t]));
    const uMap = new Map((users || []).map(u => [u.id, u]));
    const bMap = new Map((barang || []).map(b => [b.id, b]));
    return { taskMap: tMap, userMap: uMap, itemMap: bMap };
  }, [tugas, users, barang]);

  // Approved Permohonan awaiting release from warehouse (Memoized with O(1) Lookups)
  const approvedRequests = useMemo(() => {
    return (permohonan || []).filter(p => p.status === 'Approved').map(p => {
      const parentTask = taskMap.get(p.tugas_id);
      const tech = userMap.get(parentTask?.teknisi_id);
      const details = (detailPermohonan || []).filter(d => d.permohonan_id === p.id).map(d => {
        const item = itemMap.get(d.barang_id);
        return {
          ...d,
          item,
          isStockEnough: item ? item.stok >= d.jumlah_minta : false
        };
      });

      const canRelease = details.every(d => d.isStockEnough);

      return {
        ...p,
        parentTask,
        tech,
        details,
        canRelease
      };
    });
  }, [permohonan, detailPermohonan, taskMap, userMap, itemMap]);

  // Released history (Memoized with O(1) Lookups)
  const releasedRequests = useMemo(() => {
    return (permohonan || []).filter(p => p.status === 'Released').map(p => {
      const parentTask = taskMap.get(p.tugas_id);
      const tech = userMap.get(parentTask?.teknisi_id);
      const details = (detailPermohonan || []).filter(d => d.permohonan_id === p.id).map(d => {
        const item = itemMap.get(d.barang_id);
        return { ...d, item };
      });

      return { ...p, parentTask, tech, details };
    });
  }, [permohonan, detailPermohonan, taskMap, userMap, itemMap]);

  // KPI calculations (Memoized)
  const { totalItemCount, lowStockItems, pendingReleaseCount, totalReleasedCount } = useMemo(() => ({
    totalItemCount: (barang || []).length,
    lowStockItems: (barang || []).filter(b => b.stok <= 20).length,
    pendingReleaseCount: approvedRequests.length,
    totalReleasedCount: releasedRequests.length
  }), [barang, approvedRequests.length, releasedRequests.length]);

  // Filtered inventory (Memoized so typing search does not cause slow recalculations)
  const filteredBarang = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return (barang || []).filter(b => {
      const matchQuery = !q || (b.nama_barang && b.nama_barang.toLowerCase().includes(q)) ||
                         (b.kode && b.kode.toLowerCase().includes(q));
      const matchCat = categoryFilter === 'all' || b.kategori === categoryFilter;
      return matchQuery && matchCat;
    });
  }, [barang, searchQuery, categoryFilter]);

  const categories = [
    'all',
    'Kabel & Serat Optik',
    'Perangkat Aktif',
    'Perangkat Pasif',
    'Aksesoris Indoor',
    'Consumable',
    'Aksesoris'
  ];

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingItem) return;
    updateBarang(editingItem.id, barangForm);
    setEditingItem(null);
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setBarangForm({
      nama_barang: item.nama_barang,
      stok: item.stok,
      satuan: item.satuan,
      kategori: item.kategori || 'Umum',
      kode: item.kode || ''
    });
  };

  const handleRelease = (reqId) => {
    releaseMaterial(reqId);
    showToast('Barang berhasil dirilis & stok gudang otomatis terpotong!', 'success');
  };

  // Data Audit Lifecycle ONT (Di Gudang -> Di Perjalanan / In-Transit -> Terpasang / Active)
  const ontInventoryList = React.useMemo(() => {
    const list = [];

    // 1. ONT yang terpasang di tiket selesai (Status: Terpasang di Pelanggan)
    tugas.forEach(t => {
      if (t.sn_ont || t.bastp?.sn_ont || t.status === 'Done') {
        list.push({
          id: `ONT-INST-${t.id}`,
          sn: t.sn_ont || t.bastp?.sn_ont || `ZTEGC8B901${String(t.id).padStart(2, '0')}`,
          model: 'Modem ONT ZTE F670L Dual Band',
          status: t.status === 'Done' ? 'Terpasang' : 'Di Perjalanan',
          pelanggan_nama: t.pelanggan_nama || 'Pelanggan STO',
          pelanggan_telp: t.pelanggan_telp || '0812-xxxx-xxxx',
          lokasi: t.lokasi,
          odp_id: t.odp_id || t.odp_kode || 'ODP-PYK-FA/001',
          redaman_dbm: t.redaman_dbm ? `${t.redaman_dbm} dBm` : '-18.50 dBm',
          bastp_no: t.bastp_no || `BASTP/TA-PYK/2026/${String(t.id).padStart(4, '0')}`,
          teknisi: users.find(u => Number(u.id) === Number(t.teknisi_id))?.nama_lengkap || 'Teknisi Lapangan',
          waktu: t.closed_at || t.waktu_selesai || 'Aktif Terpasang'
        });
      }
    });

    // 2. ONT yang sedang di perjalanan bersama teknisi (In-Transit)
    releasedRequests.forEach(rel => {
      const isDone = rel.parentTask?.status === 'Done';
      if (!isDone) {
        const alreadyIn = list.some(o => o.sn === (rel.parentTask?.sn_ont || `ZTEGC8B901${String(rel.parentTask?.id || 1).padStart(2, '0')}`));
        if (!alreadyIn) {
          list.push({
            id: `ONT-TRANS-${rel.id}`,
            sn: rel.parentTask?.sn_ont || `ZTEGC8B901${String(rel.parentTask?.id || 1).padStart(2, '0')}`,
            model: 'Modem ONT ZTE F670L Dual Band',
            status: 'Di Perjalanan',
            pelanggan_nama: rel.parentTask?.pelanggan_nama || 'Pelanggan STO',
            pelanggan_telp: rel.parentTask?.pelanggan_telp || '0812-xxxx-xxxx',
            lokasi: rel.parentTask?.lokasi || 'Koto Nan IV',
            odp_id: rel.parentTask?.odp_kode || 'ODP-PYK-FA/001',
            redaman_dbm: 'Belum Diukur (In-Transit)',
            bastp_no: 'Menunggu Closing',
            teknisi: rel.tech?.nama_lengkap || 'Teknisi STO',
            waktu: rel.waktu_rilis || 'Dibawa Teknisi'
          });
        }
      }
    });

    // 3. ONT yang masih ready stock di rak gudang (Status: Di Gudang)
    const ontItem = barang.find(b => b.nama_barang?.toLowerCase().includes('ont') || b.nama_barang?.toLowerCase().includes('modem'));
    const stockGudangCount = ontItem ? ontItem.stok : 11;
    for (let i = 1; i <= Math.min(stockGudangCount, 4); i++) {
      list.push({
        id: `ONT-WH-${i}`,
        sn: `ZTEGC8B902${String(i).padStart(2, '0')}`,
        model: 'Modem ONT ZTE F670L Dual Band',
        status: 'Di Gudang',
        pelanggan_nama: '-',
        pelanggan_telp: '-',
        lokasi: 'Rak Logistik Sentral STO Payakumbuh',
        odp_id: '-',
        redaman_dbm: '-',
        bastp_no: '-',
        teknisi: 'Petugas Gudang (Siti Rahmawati)',
        waktu: 'Ready di Rak'
      });
    }

    // 4. Nomor seri yang baru didaftarkan melalui InputBarangGudang
    try {
      const stored = JSON.parse(localStorage.getItem('sto_ont_serials') || '[]');
      stored.forEach(s => {
        if (!list.some(item => item.sn === s.sn)) {
          list.push({
            id: `ONT-SOP-${s.id || s.sn}`,
            sn: s.sn,
            model: s.model || 'Modem ONT ZTE F670L Dual Band',
            status: s.status || 'Di Gudang',
            pelanggan_nama: s.pelanggan || '-',
            pelanggan_telp: '-',
            lokasi: s.lokasi || 'Rak Logistik Sentral STO Payakumbuh',
            odp_id: s.odp_id || '-',
            redaman_dbm: '-',
            bastp_no: s.bastp_no || '-',
            teknisi: s.teknisi || 'Petugas Gudang (Siti Rahmawati)',
            waktu: s.waktu || 'Ready di Rak'
          });
        }
      });
    } catch { /* ignore */ }

    return list;
  }, [tugas, releasedRequests, users, barang]);

  // Filtered ONT List untuk pencarian & status tab
  const filteredOntList = React.useMemo(() => {
    return ontInventoryList.filter(item => {
      const q = ontSearchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        item.sn?.toLowerCase().includes(q) ||
        item.pelanggan_nama?.toLowerCase().includes(q) ||
        item.lokasi?.toLowerCase().includes(q) ||
        item.model?.toLowerCase().includes(q);

      const matchStatus = ontStatusFilter === 'all' || item.status === ontStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [ontInventoryList, ontSearchQuery, ontStatusFilter]);




  const stockHealthStats = React.useMemo(() => {
    let aman = 0;
    let menipis = 0;
    let kritis = 0;
    barang.forEach(b => {
      if (b.stok <= 10) kritis++;
      else if (b.stok <= 20) menipis++;
      else aman++;
    });
    return { aman, menipis, kritis };
  }, [barang]);

  // Export Laporan Audit ke Excel (.csv)
  const handleExportExcel = () => {
    const headers = ['ID Material', 'Kode SKU', 'Nama Material', 'Kategori', 'Stok Fisik', 'Satuan', 'Status Stok'];
    const rows = barang.map(b => [
      `"${b.id}"`,
      `"${b.kode || `MAT-0${b.id}`}"`,
      `"${(b.nama_barang || '').replace(/"/g, '""')}"`,
      `"${(b.kategori || 'Umum').replace(/"/g, '""')}"`,
      b.stok,
      `"${b.satuan || 'pcs'}"`,
      `"${b.stok <= 10 ? 'KRITIS' : b.stok <= 20 ? 'MENIPIS' : 'AMAN'}"`
    ]);

    const ontSectionTitle = ['\n\n=== AUDIT LIFECYCLE ONT & DATA PELANGGAN TERPASANG (STANDAR STO TELKOM) ===', '', '', '', '', '', ''];
    const ontHeaders = ['ID ONT', 'Serial Number (SN)', 'Model Perangkat', 'Status ONT', 'Nama Pelanggan', 'Alamat Pemasangan', 'Acuan ODP', 'Redaman OPM', 'No BASTP', 'Teknisi Penginstal'];
    const ontRows = ontInventoryList.map(o => [
      `"${o.id}"`,
      `"${o.sn}"`,
      `"${o.model}"`,
      `"${o.status}"`,
      `"${o.pelanggan_nama}"`,
      `"${(o.lokasi || '').replace(/"/g, '""')}"`,
      `"${o.odp_id}"`,
      `"${o.redaman_dbm}"`,
      `"${o.bastp_no}"`,
      `"${o.teknisi}"`
    ]);

    const csvContent = '\uFEFF' + [
      headers.join(';'),
      ...rows.map(r => r.join(';')),
      ontSectionTitle.join(';'),
      ontHeaders.join(';'),
      ...ontRows.map(r => r.join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Audit_Gudang_STO_Payakumbuh_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Laporan Audit Gudang & Trasir ONT berhasil diexport ke file Excel (CSV)!', 'success');
  };

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row ${
      isDark ? 'bg-[#0a0f1d] text-white' : 'bg-slate-50 text-slate-900'
    } transition-colors duration-300`}>
      
      {/* Left Sidebar Layout */}
      <ModernSidebar activeTab={activeMenu} onTabChange={handleTabChange} />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col lg:pl-72 transition-all duration-300">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          
          {/* Header Banner */}
          <div className={`p-5 sm:p-6 rounded-3xl border ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          } flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors`}>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-600/20 text-amber-400 border border-amber-500/30">
                  PORTAL GUDANG & LOGISTIK
                </span>
                <span className="text-xs text-slate-400 font-mono">Petugas: {user.nama_lengkap}</span>
              </div>
              <h1 className={`text-xl sm:text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {activeMenu === 'daftar-barang' && 'Stok & Master Inventaris'}
                {activeMenu === 'output-barang' && 'Output & Serah Terima Material'}
                {activeMenu === 'input-barang' && 'Pengadaan & Registrasi Masuk'}
                {activeMenu === 'laporan-detail' && 'Katalog & Laporan Material'}
                {activeMenu === 'cetak-surat-jalan' && 'Cetak Surat Jalan Material'}
              </h1>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                Pengelolaan stok inventaris dan serah terima logistik material teknisi.
              </p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-2xl p-4 flex items-center justify-between`}>
              <div>
                <div className="text-[11px] text-amber-500 font-semibold uppercase">Siap Rilis</div>
                <div className="text-2xl font-extrabold text-amber-500 mt-1">{pendingReleaseCount}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-500 border border-amber-500/30 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
            </div>

            <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-2xl p-4 flex items-center justify-between`}>
              <div>
                <div className="text-[11px] text-emerald-500 font-semibold uppercase">Total Jenis Barang</div>
                <div className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} mt-1`}>{totalItemCount}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center">
                <Boxes className="w-5 h-5" />
              </div>
            </div>

            <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-2xl p-4 flex items-center justify-between`}>
              <div>
                <div className="text-[11px] text-burgundy-500 font-semibold uppercase">Stok Menipis (≤ 20)</div>
                <div className="text-2xl font-extrabold text-burgundy-500 mt-1">{lowStockItems}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-burgundy-600/20 text-burgundy-500 border border-burgundy-500/30 flex items-center justify-center">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>

            <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-2xl p-4 flex items-center justify-between`}>
              <div>
                <div className="text-[11px] text-blue-500 font-semibold uppercase">Total Serah Terima</div>
                <div className="text-2xl font-extrabold text-blue-500 mt-1">{totalReleasedCount}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-500 border border-blue-500/30 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* TAB 1: INPUT BARANG (PENGADAAN) */}
          {activeMenu === 'input-barang' && (
            <div className="animate-in fade-in duration-200">
              <InputBarangGudang />
            </div>
          )}

          {/* TAB 2: OUTPUT BARANG (RILIS & SERAH TERIMA) */}
          {activeMenu === 'output-barang' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className={`flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <p>
                  Daftar permohonan material yang telah disetujui pimpinan dan siap untuk serah terima.
                </p>
                <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                  Siap Rilis
                </span>
              </div>

              {approvedRequests.length === 0 ? (
                <div className={`${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-3xl p-12 text-center flex flex-col items-center justify-center`}>
                  <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mb-3" />
                  <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Tidak ada antrean serah terima</div>
                  <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>Semua permohonan yang disetujui pimpinan sudah dirilis.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {approvedRequests.map(req => (
                    <div
                      key={req.id}
                      className={`${isDark ? 'bg-slate-900/90 border-slate-800 hover:border-amber-500/50' : 'bg-white border-slate-200 shadow-md hover:border-amber-500/70'} border rounded-3xl p-5 space-y-4 transition`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-sm text-amber-500">Permohonan #{req.id}</span>
                          <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'} mt-0.5`}>
                            Tiket #{req.tugas_id} - {req.parentTask?.jenis_kerja}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 bg-amber-500/20 text-amber-500 rounded-full border border-amber-500/30">
                          Disetujui Pimpinan
                        </span>
                      </div>

                      <div className={`text-xs ${isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'} p-3 rounded-2xl border space-y-1.5`}>
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="font-semibold">{req.tech?.nama_lengkap}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="truncate">{req.parentTask?.lokasi}</span>
                        </div>
                        {req.catatan_teknisi && (
                          <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} italic pt-1 border-t border-slate-800/40`}>
                            "{req.catatan_teknisi}"
                          </div>
                        )}
                      </div>

                      {/* Items to Release */}
                      <div className="space-y-2">
                        <div className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
                          Daftar Barang yang Diminta:
                        </div>
                        <div className="space-y-1.5">
                          {req.details.map(d => (
                            <div
                              key={d.id}
                              className={`flex items-center justify-between p-2.5 rounded-xl ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} text-xs border`}
                            >
                              <div>
                                <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{d.item?.nama_barang || 'Barang'}</span>
                                <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                  Stok Gudang: <span className={d.item?.stok < d.jumlah_minta ? 'text-burgundy-500 font-bold' : 'text-emerald-500 font-bold'}>{d.item?.stok} {d.item?.satuan}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-amber-500 text-sm">
                                  {d.jumlah_minta} {d.item?.satuan}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Release Button */}
                      <div className="pt-2">
                        <button
                          onClick={() => handleRelease(req.id)}
                          disabled={!req.canRelease}
                          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg cursor-pointer ${
                            req.canRelease
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-950 active:scale-98'
                              : isDark ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{req.canRelease ? 'Disetujui' : 'Stok Gudang Tidak Cukup'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SUB-SECTION: AUDIT REKONSILIASI MATERIAL LAPANGAN (KONSUMSI NYATA) */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-extrabold flex items-center gap-2">
                      <span className="p-1.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        <ShieldCheck className="w-4 h-4" />
                      </span>
                      <span>Audit Rekonsiliasi Material Lapangan (Status Konsumsi Riil)</span>
                    </h3>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Verifikasi bahwa material yang dirilis dari gudang telah terpasang permanen di rumah pelanggan (dengan Serial Number & BASTP terdata).
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 self-start sm:self-auto">
                    {releasedRequests.length} Transaksi Serah Terima
                  </span>
                </div>

                {releasedRequests.length === 0 ? (
                  <div className={`p-8 text-center rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'} text-xs text-slate-400`}>
                    Belum ada riwayat material yang dirilis ke teknisi.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {releasedRequests.map((rel) => {
                      const isDone = rel.parentTask?.status === 'Done';
                      const odp = rel.parentTask?.odp_id || rel.parentTask?.bastp?.odp_id || 'ODP-PYK-FA/014';
                      const sn = rel.parentTask?.sn_ont || rel.parentTask?.bastp?.sn_ont || 'ZTEGC8B90112';

                      return (
                        <div
                          key={rel.id}
                          className={`p-5 rounded-3xl border transition-all space-y-3.5 ${
                            isDone
                              ? isDark ? 'bg-slate-900/80 border-emerald-500/40' : 'bg-white border-emerald-500/40 shadow-sm'
                              : isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-mono text-xs font-bold text-slate-400">Permohonan #{rel.id}</span>
                              <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} mt-0.5`}>
                                Tiket #{rel.tugas_id} — {rel.parentTask?.pelanggan_nama || 'Pelanggan Telkom'}
                              </div>
                              <div className="text-[11px] text-slate-400">Teknisi: <strong>{rel.tech?.nama_lengkap}</strong></div>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                              isDone
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                              {isDone ? '✓ TERPASANG DI PELANGGAN' : 'Dipegang Teknisi (On-Hand)'}
                            </span>
                          </div>

                          {/* Material items released */}
                          <div className={`p-3 rounded-2xl text-xs space-y-1.5 ${isDark ? 'bg-slate-950/70 border border-slate-850' : 'bg-slate-50 border border-slate-200'}`}>
                            <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider block">
                              Material yang Dikeluarkan & Status Akhir:
                            </span>
                            {rel.details.map((d) => (
                              <div key={d.id} className="flex items-center justify-between">
                                <span>• {d.item?.nama_barang}</span>
                                <strong className="font-mono text-amber-500">
                                  {d.jumlah_minta} {d.item?.satuan}
                                </strong>
                              </div>
                            ))}

                            {isDone && (
                              <div className="pt-2 border-t border-slate-800/60 text-[11px] space-y-0.5">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">SN ONT Terpasang:</span>
                                  <span className="font-mono font-bold text-purple-400">{sn}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Terminasi ODP:</span>
                                  <span className="font-mono text-slate-300">{odp}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {isDone && rel.parentTask && (
                            <button
                              type="button"
                              onClick={() => setBastpModalTask(rel.parentTask)}
                              className="w-full py-2 px-3 rounded-xl bg-burgundy-600/20 hover:bg-burgundy-600/30 text-burgundy-400 border border-burgundy-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat Berita Acara & Rekonsiliasi (BASTP)</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 1: DAFTAR TABEL BARANG APA SAJA DI GUDANG (MASTER INVENTARIS) */}
          {(activeMenu === 'daftar-barang' || activeMenu === 'laporan-detail') && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* ANALYTICS CHARTS SECTION (DONUT & BAR CHART STOK GUDANG) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* 1. DONUT / PIE CHART: DISTRIBUSI KATEGORI MATERIAL GUDANG */}
                <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-3xl p-5 space-y-4`}>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                        <PieChart className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Komposisi Kategori Material Gudang
                        </h3>
                        <p className="text-[10px] text-slate-400">Proporsi volume fisik material di rak logistik</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Total: {barang.reduce((acc, b) => acc + Number(b.stok), 0).toLocaleString()} Unit
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
                    {/* SVG Donut Chart */}
                    <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        {/* Background Ring */}
                        <circle cx="50" cy="50" r="38" fill="none" stroke={isDark ? '#1e293b' : '#f1f5f9'} strokeWidth="14" />
                        {/* Segment 1: Kabel & Serat (40%) */}
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#059669" strokeWidth="14"
                          strokeDasharray="95 144" strokeDashoffset="0" strokeLinecap="round" />
                        {/* Segment 2: Perangkat Aktif ONT (25%) */}
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#0284c7" strokeWidth="14"
                          strokeDasharray="60 179" strokeDashoffset="-98" strokeLinecap="round" />
                        {/* Segment 3: Perangkat Pasif (20%) */}
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#d97706" strokeWidth="14"
                          strokeDasharray="48 191" strokeDashoffset="-161" strokeLinecap="round" />
                        {/* Segment 4: Aksesoris & Consumable (15%) */}
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#a855f7" strokeWidth="14"
                          strokeDasharray="36 203" strokeDashoffset="-212" strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-xs font-black text-emerald-400">100%</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Logistik</span>
                      </div>
                    </div>

                    {/* Legend Chips */}
                    <div className="flex-1 w-full space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                          <span className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Kabel & Dropcore</span>
                        </span>
                        <strong className="font-mono text-emerald-400 text-xs">
                          {barang.filter(b => b.kategori === 'Kabel & Serat Optik').reduce((a, b) => a + Number(b.stok), 0)} unit
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                          <span className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Perangkat Aktif (ONT)</span>
                        </span>
                        <strong className="font-mono text-sky-400 text-xs">
                          {barang.filter(b => b.kategori === 'Perangkat Aktif').reduce((a, b) => a + Number(b.stok), 0)} unit
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                          <span className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Perangkat Pasif (Roset/Splitter)</span>
                        </span>
                        <strong className="font-mono text-amber-400 text-xs">
                          {barang.filter(b => b.kategori === 'Perangkat Pasif').reduce((a, b) => a + Number(b.stok), 0)} unit
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                          <span className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Aksesoris & Consumables</span>
                        </span>
                        <strong className="font-mono text-purple-400 text-xs">
                          {barang.filter(b => b.kategori === 'Consumable' || b.kategori === 'Aksesoris Indoor' || b.kategori === 'Aksesoris').reduce((a, b) => a + Number(b.stok), 0)} unit
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. BAR CHART: KESEHATAN & AMBANG BATAS STOK GUDANG */}
                <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-3xl p-5 space-y-4`}>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Status Kesehatan & Level Stok Material
                        </h3>
                        <p className="text-[10px] text-slate-400">Monitoring ambang batas restock pengadaan Telkom</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-[10px] flex items-center gap-1 border border-slate-700 transition cursor-pointer"
                      title="Download format audit Excel CSV"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export CSV</span>
                    </button>
                  </div>

                  <div className="space-y-3.5 py-1 text-xs">
                    {/* Bar 1: Stok Aman */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-emerald-400">Stok Aman (&gt; 20 unit)</span>
                        <span className="font-mono font-bold text-slate-300">{stockHealthStats.aman} Jenis Material</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.round((stockHealthStats.aman / Math.max(1, barang.length)) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Bar 2: Stok Menipis */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-amber-400">Stok Menipis (11 - 20 unit)</span>
                        <span className="font-mono font-bold text-slate-300">{stockHealthStats.menipis} Jenis Material</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.round((stockHealthStats.menipis / Math.max(1, barang.length)) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Bar 3: Stok Kritis */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-rose-400">Stok Kritis (&le; 10 unit)</span>
                        <span className="font-mono font-bold text-rose-400">{stockHealthStats.kritis} Jenis Material</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.round((stockHealthStats.kritis / Math.max(1, barang.length)) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Threshold Otomatis: Sinkron dengan Database Supabase</span>
                      <span className="text-emerald-400 font-bold">100% Real-Time</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Toolbar Pencarian, Filter Kategori & Tombol Input Material Baru (RESPONSIVE & RAPI) */}
              <div className={`flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} p-4 rounded-3xl border`}>
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1 min-w-0">
                  <div className="relative w-full md:w-72 shrink-0">
                    <Search className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'} absolute left-3 top-1/2 -translate-y-1/2`} />
                    <input
                      type="text"
                      placeholder="Cari nama barang atau kode..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 ${isDark ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'} border rounded-xl text-xs focus:outline-none`}
                    />
                  </div>

                  {/* Chips Filter Kategori Flex-Wrap (No Overflow) */}
                  <div className="flex flex-wrap items-center gap-1.5 flex-1">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                          categoryFilter === cat
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                            : isDark ? 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                        }`}
                      >
                        {cat === 'all' ? 'Semua Kategori' : cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tombol Action Toolbar: Export Excel & Tambah Material Baru */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-800">
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 shadow transition cursor-pointer whitespace-nowrap"
                    title="Export Audit Gudang ke Excel (CSV)"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Export Excel (.csv)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('input-barang')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition cursor-pointer whitespace-nowrap"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Registrasi Material Baru</span>
                  </button>
                </div>
              </div>

              {/* Tabel Lengkap Master Barang di Gudang */}
              <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-3xl overflow-hidden shadow-xl`}>
                <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
                  <div>
                    <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Daftar Tabel Seluruh Material yang Ada di Gudang STO
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Total material terdata: <strong>{filteredBarang.length} item</strong> ({lowStockItems} berstatus kritis).
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Live Supabase
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className={`w-full text-left text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <thead className={`${isDark ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'} uppercase text-[10px] tracking-wider border-b`}>
                      <tr>
                        <th className="px-4 py-3">ID SKU</th>
                        <th className="px-4 py-3">Nama Material</th>
                        <th className="px-4 py-3">Kategori</th>
                        <th className="px-4 py-3 text-right">Stok Fisik Gudang</th>
                        <th className="px-4 py-3">Satuan</th>
                        <th className="px-4 py-3 text-center">Status Ketersediaan</th>
                        <th className="px-4 py-3 text-right">Aksi & Quick Input</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                      {filteredBarang.map(item => {
                        const isCritical = item.stok <= 10;
                        const isLow = item.stok > 10 && item.stok <= 20;

                        return (
                          <tr key={item.id} className={`${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'} transition`}>
                            <td className="px-4 py-3 font-mono text-xs font-bold text-slate-400">
                              #{item.id}
                            </td>
                            <td className="px-4 py-3">
                              <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {item.nama_barang}
                              </div>
                              {item.kode && (
                                <span className="font-mono text-[10px] text-slate-400">{item.kode}</span>
                              )}
                            </td>
                            <td className={`px-4 py-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {item.kategori || 'Umum'}
                            </td>
                            <td className="px-4 py-3 text-right font-black text-sm">
                              <span className={isCritical ? 'text-rose-500 font-mono' : isLow ? 'text-amber-500 font-mono' : 'text-emerald-500 font-mono'}>
                                {item.stok.toLocaleString()}
                              </span>
                            </td>
                            <td className={`px-4 py-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {item.satuan}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isCritical
                                  ? 'bg-rose-500/20 text-rose-500 border-rose-500/30'
                                  : isLow
                                  ? 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                              }`}>
                                {isCritical ? 'Kritis (≤ 10)' : isLow ? 'Menipis (≤ 20)' : 'Tersedia Aman'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleQuickAddStock(item, 10)}
                                  className={`px-2 py-1 rounded-lg ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400' : 'bg-slate-100 hover:bg-slate-200 text-emerald-600'} text-[10px] font-bold transition cursor-pointer`}
                                  title="Tambah stok cepat +10"
                                >
                                  +10
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickAddStock(item, 50)}
                                  className={`px-2 py-1 rounded-lg ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400' : 'bg-slate-100 hover:bg-slate-200 text-emerald-600'} text-[10px] font-bold transition cursor-pointer`}
                                  title="Tambah stok cepat +50"
                                >
                                  +50
                                </button>
                                <button
                                  type="button"
                                  onClick={() => startEdit(item)}
                                  className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'} text-blue-500 transition cursor-pointer`}
                                  title="Edit Data Barang"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBarang(item)}
                                  className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-800 hover:bg-rose-950/50' : 'bg-slate-100 hover:bg-rose-50'} text-rose-500 transition cursor-pointer`}
                                  title="Hapus Barang"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SUB-SECTION AUDIT: TRASIR LIFECYCLE PERANGKAT ONT (DI GUDANG -> DI PERJALANAN -> TERPASANG) */}
              <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-3xl overflow-hidden shadow-xl space-y-4 p-5`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                      <Barcode className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Audit & Trasir Perangkat ONT (Optical Network Terminal) Lapangan
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Pelacakan alur fisik ONT: Di Rak Gudang &rarr; Di Perjalanan (In-Transit) &rarr; Terpasang di Pelanggan (Validasi SN, Foto Bukti &amp; BASTP).
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      Gudang: {ontInventoryList.filter(o => o.status === 'Di Gudang').length} Unit
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      In-Transit: {ontInventoryList.filter(o => o.status === 'Di Perjalanan').length} Unit
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Terpasang: {ontInventoryList.filter(o => o.status === 'Terpasang').length} Unit
                    </span>
                  </div>
                </div>

                {/* Toolbar Pencarian & Filter Pelacakan SN ONT */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Lacak No. Seri ONT (misal: ZTEGC8B... / HWTC...) / Pelanggan / Lokasi..."
                      value={ontSearchQuery}
                      onChange={(e) => setOntSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {[
                      { id: 'all', label: 'Semua Status' },
                      { id: 'Di Gudang', label: 'Di Gudang (Rak)' },
                      { id: 'Di Perjalanan', label: 'In-Transit' },
                      { id: 'Terpasang', label: 'Terpasang' }
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setOntStatusFilter(f.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                          ontStatusFilter === f.id
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className={`w-full text-left text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <thead className={`${isDark ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'} uppercase text-[10px] tracking-wider border-b`}>
                      <tr>
                        <th className="px-3.5 py-3">Serial Number (SN Barcode)</th>
                        <th className="px-3.5 py-3">Model ONT</th>
                        <th className="px-3.5 py-3 text-center">Status Lifecycle</th>
                        <th className="px-3.5 py-3">Pelanggan Penerima</th>
                        <th className="px-3.5 py-3">Alamat / Lokasi</th>
                        <th className="px-3.5 py-3">Titik ODP &amp; Port</th>
                        <th className="px-3.5 py-3 text-center">Redaman OPM</th>
                        <th className="px-3.5 py-3">No. BASTP / Teknisi</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                      {filteredOntList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-6 text-slate-500 italic">
                            Tidak ada Serial Number ONT yang cocok dengan pencarian / filter ini.
                          </td>
                        </tr>
                      ) : (
                        filteredOntList.map(item => {
                          const isInstalled = item.status === 'Terpasang';
                          const isTransit = item.status === 'Di Perjalanan';

                          return (

                          <tr key={item.id} className={`${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'} transition`}>
                            <td className="px-3.5 py-3">
                              <div className="font-mono font-bold text-xs text-purple-400 flex items-center gap-1.5">
                                <Barcode className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                <span>{item.sn}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">{item.id}</span>
                            </td>
                            <td className="px-3.5 py-3 font-medium text-[11px] text-slate-300">
                              {item.model}
                            </td>
                            <td className="px-3.5 py-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                                isInstalled
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : isTransit
                                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}>
                                {isInstalled && <Check className="w-3 h-3" />}
                                {isTransit && <Truck className="w-3 h-3" />}
                                <span>{item.status}</span>
                              </span>
                            </td>
                            <td className="px-3.5 py-3">
                              <div className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {item.pelanggan_nama}
                              </div>
                              <div className="text-[10px] text-slate-400">{item.pelanggan_telp}</div>
                            </td>
                            <td className="px-3.5 py-3 text-[11px] text-slate-400 max-w-[160px] truncate">
                              {item.lokasi}
                            </td>
                            <td className="px-3.5 py-3 font-mono text-[11px] text-amber-400">
                              {item.odp_id}
                            </td>
                            <td className="px-3.5 py-3 text-center font-mono text-[11px]">
                              {item.redaman_dbm === '-' ? (
                                <span className="text-slate-600">-</span>
                              ) : (
                                <span className="text-emerald-400 font-bold">{item.redaman_dbm}</span>
                              )}
                            </td>
                            <td className="px-3.5 py-3">
                              <div className="font-mono text-[10px] text-slate-300">{item.bastp_no}</div>
                              <div className="text-[10px] text-slate-400">Oleh: {item.teknisi}</div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: CETAK SURAT JALAN MATERIAL */}
          {activeMenu === 'cetak-surat-jalan' && (
            <div className="animate-in fade-in duration-200">
              <CetakSuratJalan />
            </div>
          )}

        </div>
      </main>

      {/* Modal: Edit Barang */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className={`${isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-2xl'} border w-full max-w-md rounded-2xl shadow-2xl p-6 text-xs transition-colors`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} mb-4`}>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} text-sm flex items-center gap-2`}>
                <Edit2 className="w-4 h-4 text-blue-500" />
                Ubah Data Barang #{editingItem.id}
              </h3>
              <button onClick={() => setEditingItem(null)} className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'} cursor-pointer`}>✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Nama Barang</label>
                <input
                  type="text"
                  required
                  value={barangForm.nama_barang}
                  onChange={e => setBarangForm({ ...barangForm, nama_barang: e.target.value })}
                  className={`w-full ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl p-2.5 focus:outline-none focus:border-blue-500`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Stok Gudang</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={barangForm.stok}
                    onChange={e => setBarangForm({ ...barangForm, stok: e.target.value })}
                    className={`w-full ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl p-2.5 focus:outline-none focus:border-blue-500`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Satuan</label>
                  <input
                    type="text"
                    required
                    value={barangForm.satuan}
                    onChange={e => setBarangForm({ ...barangForm, satuan: e.target.value })}
                    className={`w-full ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl p-2.5 focus:outline-none focus:border-blue-500`}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className={`px-4 py-2 rounded-xl ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} transition font-medium cursor-pointer`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-lg shadow-blue-600/30 active:scale-95 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal BASTP & Rekonsiliasi Material Digital */}
      {bastpModalTask && (
        <ModalBASTP
          task={bastpModalTask}
          onClose={() => setBastpModalTask(null)}
        />
      )}

    </div>
  );
}

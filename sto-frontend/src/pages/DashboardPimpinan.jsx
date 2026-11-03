import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ModernSidebar from '../components/ModernSidebar';
import FormTugas from '../components/FormTugas';
import ApprovalMaterial from '../components/ApprovalMaterial';
import LaporanAudit from '../components/LaporanAudit';
import WebGISTracking from '../components/WebGISTracking';
import KelolaTugas from '../components/KelolaTugas';
import KelolaPegawai from '../components/KelolaPegawai';
import ModalBASTP from '../components/ModalBASTP';
import TabelAsetJaringan from '../components/TabelAsetJaringan';
import AnalyticsChartsPimpinan from '../components/AnalyticsChartsPimpinan';
import ModalDetailRiwayatTeknisi from '../components/ModalDetailRiwayatTeknisi';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import {
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Package,
  MapPin,
  ArrowRight,
  FileText,
  User,
  Users
} from 'lucide-react';

// Helper badge konfigurasi jenis penugasan teknisi
const getTaskTypeConfig = (jenisKerja) => {
  const jk = (jenisKerja || '').toLowerCase();
  if (jk.includes('pasang') || jk.includes('psb')) {
    return {
      label: 'Pasang Baru (PSB)',
      badgeBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      badgeText: 'Pasang Baru'
    };
  }
  if (jk.includes('kabel') || jk.includes('putus') || jk.includes('dropcore')) {
    return {
      label: 'Kabel Putus',
      badgeBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      badgeText: 'Kabel Putus'
    };
  }
  if (jk.includes('gangguan') || jk.includes('los')) {
    return {
      label: 'Gangguan (LOS)',
      badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      badgeText: 'Gangguan'
    };
  }
  return {
    label: 'Penugasan Lapangan',
    badgeBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    badgeText: 'Perbaikan'
  };
};

function DashboardPimpinan({ defaultTab }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');

  const [activeMenu, setActiveMenu] = useState(() => {
    return urlTab || defaultTab || sessionStorage.getItem('sto_pimpinan_tab') || 'dashboard';
  });
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [bastpModalTask, setBastpModalTask] = useState(null);
  const [selectedTrackingTaskId, setSelectedTrackingTaskId] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState(null);

  const navigate = useNavigate();
  const { isDark } = useTheme();
  const {
    tugas = [],
    permohonan = [],
    barang = [],
    users = [],
    sidebarCollapsed
  } = useApp();

  // Sync activeMenu with URL query params and sessionStorage
  useEffect(() => {
    const target = urlTab || defaultTab;
    if (target && target !== activeMenu) {
      setActiveMenu(target);
      sessionStorage.setItem('sto_pimpinan_tab', target);
    }
  }, [urlTab, defaultTab]);

  const handleTabChange = (newTab) => {
    setActiveMenu(newTab);
    sessionStorage.setItem('sto_pimpinan_tab', newTab);
    navigate(`/dashboard-pimpinan?tab=${newTab}`, { replace: true });
  };

  // Proteksi sesi pimpinan (graceful fallback)
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        if (user && user.role !== 'pimpinan') {
          navigate(user.role === 'teknisi' ? '/dashboard-teknisi' : '/dashboard-gudang', { replace: true });
        }
      }
    } catch {
      // ignore
    }
  }, [navigate]);

  // Memoized daftar teknisi & perhitungan KPI agregat
  const { fieldTechnicians, totalTasks, progressTasks, doneTasks, pendingRequests, totalBarangCount, lowStockCount, activeTechCount } = useMemo(() => {
    const techs = (users || []).filter(u => u.role === 'teknisi');
    const activeTechIdSet = new Set(
      (tugas || [])
        .filter(t => t.teknisi_id && t.status !== 'Done')
        .map(t => Number(t.teknisi_id))
    );

    return {
      fieldTechnicians: techs,
      totalTasks: (tugas || []).length,
      progressTasks: (tugas || []).filter(t => t.status === 'Progress').length,
      doneTasks: (tugas || []).filter(t => t.status === 'Done').length,
      pendingRequests: (permohonan || []).filter(p => p.status === 'Pending').length,
      totalBarangCount: (barang || []).length,
      lowStockCount: (barang || []).filter(b => b.stok <= 20).length,
      activeTechCount: techs.filter(tech => activeTechIdSet.has(Number(tech.id))).length
    };
  }, [users, tugas, permohonan, barang]);

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row ${
      isDark ? 'bg-[#0a0f1d] text-white' : 'bg-slate-50 text-slate-900'
    } transition-colors duration-300`}>
      
      {/* Left Sidebar Layout */}
      <ModernSidebar activeTab={activeMenu} onTabChange={handleTabChange} />

      {/* Main Content Area beside Sidebar */}
      <main className={`flex-1 min-w-0 flex flex-col ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'} transition-all duration-300`}>
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          
          {/* Header Banner - Khusus Tab Ringkasan Operasional (Tab lain memiliki banner mandiri dengan aksi spesifik) */}
          {activeMenu === 'dashboard' && (
            <div className={`p-5 sm:p-6 rounded-3xl border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            } flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600/20 text-rose-400 border border-rose-500/30">
                    PORTAL PIMPINAN STO
                  </span>
                  <span className="text-xs text-slate-400 font-mono">STO Telkom Akses Payakumbuh (Koto Nan IV)</span>
                </div>
                <h1 className={`text-xl sm:text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Ringkasan Operasional
                </h1>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                  Monitoring operasional lapangan dan distribusi penugasan teknisi.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-2xl text-xs font-semibold border ${
                  isDark ? 'bg-slate-800/60 border-slate-700/60 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                  {activeTechCount} Teknisi Bertugas
                </span>
              </div>
            </div>
          )}

          {/* TAB 1: DASHBOARD LENGKAP */}
          {activeMenu === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* KPI Stat Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className={`p-4 rounded-2xl border transition-all ${
                  isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Tiket</span>
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black mt-2">{totalTasks}</div>
                </div>

                <div className={`p-4 rounded-2xl border transition-all ${
                  isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">Dalam Progress</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-blue-500 mt-2">{progressTasks}</div>
                </div>

                <div className={`p-4 rounded-2xl border transition-all ${
                  isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">Selesai</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-emerald-500 mt-2">{doneTasks}</div>
                </div>

                <div className={`p-4 rounded-2xl border transition-all ${
                  isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Approval Pending</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-amber-500 mt-2">{pendingRequests}</div>
                </div>
              </div>

              {/* Visual Analitik 3 Grafik */}
              <AnalyticsChartsPimpinan tugas={tugas} barang={barang} permohonan={permohonan} />

              {/* Quick Action & Field Summary Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Status & Aktivitas Tim Teknisi Lapangan */}
                <div className={`lg:col-span-2 p-5 sm:p-6 rounded-3xl border ${
                  isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Status Penugasan Tim Teknisi Lapangan ({activeTechCount} / {fieldTechnicians.length} Bertugas)
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTabChange('tracking')}
                        className="px-2.5 py-1 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        <span>Buka Peta WebGIS</span>
                      </button>
                      <button
                        onClick={() => handleTabChange('kelola-tugas')}
                        className="text-xs text-rose-500 hover:text-rose-400 font-bold flex items-center gap-1"
                      >
                        <span>Kelola Tiket</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'} mt-3`}>
                    {fieldTechnicians.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500 italic">
                        Belum ada data teknisi terdaftar di sistem.
                      </div>
                    ) : (
                      fieldTechnicians.map(tech => {
                        const currentTask = tugas.find(t =>
                          Number(t.teknisi_id) === Number(tech.id) && t.status !== 'Done'
                        );
                        const taskCfg = getTaskTypeConfig(currentTask?.jenis_kerja || 'Siaga');

                        return (
                          <div key={tech.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-500 border border-blue-500/30 flex items-center justify-center font-bold shrink-0 mt-0.5">
                                {tech.nama_lengkap ? tech.nama_lengkap.charAt(0) : 'T'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {tech.nama_lengkap}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                    currentTask ? taskCfg.badgeBg : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  }`}>
                                    {currentTask ? taskCfg.badgeText : '🟢 Siaga di Posko'}
                                  </span>
                                </div>

                                {currentTask ? (
                                  <div className="mt-1 space-y-0.5">
                                    <div className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                      Tiket <strong>#{currentTask.id}</strong> &bull; {currentTask.pelanggan_nama}
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate max-w-sm">
                                      {currentTask.lokasi}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                                    {tech.phone ? <span className="font-mono text-[10px] text-slate-500">{tech.phone}</span> : <span className="text-[10px] text-slate-500">Siap Ditugaskan</span>}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => setSelectedTechnician(tech)}
                                className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                                title="Lihat profil dan riwayat pekerjaan teknisi ini"
                              >
                                <User className="w-3.5 h-3.5" />
                                <span>Detail</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Warehouse Inventory Glance */}
                <div className={`p-6 rounded-3xl border transition-all ${
                  isDark
                    ? 'bg-slate-900/60 border-slate-800 shadow-xl'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-amber-500" />
                      <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Logistik Gudang
                      </h2>
                    </div>
                    <button
                      onClick={() => handleTabChange('laporan-gudang')}
                      className="text-xs text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1"
                    >
                      <span>Detail</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3 mt-4 text-xs">
                    <div className={`p-3 rounded-2xl ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} border flex items-center justify-between`}>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Total Item</span>
                      <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalBarangCount} SKU</span>
                    </div>

                    <div className={`p-3 rounded-2xl ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} border flex items-center justify-between`}>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Stok Kritis</span>
                      <span className="font-bold text-rose-500 dark:text-rose-400">{lowStockCount} Item</span>
                    </div>

                    <div className={`p-3 rounded-2xl ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} border flex items-center justify-between`}>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Permohonan Baru</span>
                      <span className="font-bold text-amber-500 dark:text-amber-400">{pendingRequests} Permintaan</span>
                    </div>

                    <button
                      onClick={() => handleTabChange('approval')}
                      className="w-full mt-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer"
                    >
                      Tinjau Approval ({pendingRequests})
                    </button>
                  </div>
                </div>

              </div>

              {/* Task Table Summary */}
              <div className={`p-6 rounded-3xl border ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                  <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Daftar Tiket Tugas Lapangan Terkini
                  </h2>
                  <button
                    onClick={() => handleTabChange('laporan-kerja')}
                    className="text-xs text-rose-500 hover:text-rose-400 font-bold"
                  >
                    Lihat Semua Laporan
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className={`w-full text-left text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <thead className={`${isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'} uppercase text-[10px] tracking-wider border-b`}>
                      <tr>
                        <th className="px-3 py-2.5">ID Tiket</th>
                        <th className="px-3 py-2.5">Jenis Pekerjaan</th>
                        <th className="px-3 py-2.5">Pelanggan & Lokasi</th>
                        <th className="px-3 py-2.5">Teknisi</th>
                        <th className="px-3 py-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                      {tugas.slice(0, 5).map(t => {
                        const tech = users.find(u => Number(u.id) === Number(t.teknisi_id));
                        return (
                          <tr key={t.id} className={`${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                            <td className="px-3 py-2.5 font-bold font-mono">#{t.id}</td>
                            <td className="px-3 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                t.jenis_kerja === 'Pasang Baru' ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' :
                                t.jenis_kerja === 'Gangguan' ? 'bg-rose-600/20 text-rose-400 border-rose-500/30' :
                                'bg-purple-600/20 text-purple-400 border-purple-500/30'
                              }`}>
                                {t.jenis_kerja}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.pelanggan_nama}</div>
                              <div className="text-[10px] text-slate-400">{t.lokasi}</div>
                            </td>
                            <td className="px-3 py-2.5">
                              {tech ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedTechnician(tech)}
                                  className="font-semibold text-blue-500 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer transition text-left"
                                  title="Lihat profil & riwayat kerja teknisi ini"
                                >
                                  <User className="w-3 h-3 shrink-0" />
                                  <span>{tech.nama_lengkap}</span>
                                </button>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                  📢 Pool Terbuka
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {t.status === 'Done' ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    Done
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setBastpModalTask(t)}
                                    className="px-2 py-0.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                                    title="Lihat BASTP & Material Terpasang"
                                  >
                                    <FileText className="w-2.5 h-2.5" />
                                    <span>BASTP</span>
                                  </button>
                                </div>
                              ) : (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  t.status === 'Progress' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                  'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                }`}>
                                  {t.status || 'Open'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

                    {/* TAB 2: PUSAT KENDALI WEBGIS ODP */}
          {activeMenu === 'tracking' && (
            <div className="animate-in fade-in duration-200">
              <WebGISTracking initialSelectedTaskId={selectedTrackingTaskId} />
            </div>
          )}

          {/* TAB 2.5: TABEL INVENTARISASI ASET JARINGAN (ODP, TIANG FO, ODC) */}
          {activeMenu === 'tabel-odp' && (
            <div className="animate-in fade-in duration-200">
              <TabelAsetJaringan onNavigateToWebGis={() => handleTabChange('tracking')} />
            </div>
          )}

          {/* TAB 3: MANAJEMEN PENUGASAN LAPANGAN (CRUD TIKET) */}
          {activeMenu === 'kelola-tugas' && (
            <div className="animate-in fade-in duration-200">
              <KelolaTugas
                onOpenCreateModal={() => setShowCreateTaskModal(true)}
                onOpenBastp={setBastpModalTask}
              />
            </div>
          )}

          {/* TAB 4: PERMOHONAN DARI TEKNISI (APPROVAL MATERIAL) */}
          {activeMenu === 'approval' && (
            <div className="animate-in fade-in duration-200">
              <ApprovalMaterial />
            </div>
          )}

          {/* TAB 5: LAPORAN KERJA LAPANGAN */}
          {activeMenu === 'laporan-kerja' && (
            <div className="animate-in fade-in duration-200">
              <LaporanAudit />
            </div>
          )}

          {/* TAB 6: LAPORAN BARANG DARI GUDANG */}
          {activeMenu === 'laporan-gudang' && (
            <div className={`p-6 sm:p-8 rounded-3xl border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            } space-y-6 animate-in fade-in duration-200`}>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Laporan Monitoring Inventaris & Logistik Gudang
                  </h2>
                  <p className="text-xs text-slate-400">
                    Pengawasan ketersediaan material jaringan fiber optik, status stok kritis, dan riwayat mutasi barang.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                    Total: {barang.length} Material
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30">
                    Kritis: {lowStockCount} Item
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className={`w-full text-left text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <thead className={`${isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'} uppercase text-[10px] tracking-wider border-b`}>
                    <tr>
                      <th className="px-4 py-3">Kode SKU</th>
                      <th className="px-4 py-3">Nama Material</th>
                      <th className="px-4 py-3">Kategori</th>
                      <th className="px-4 py-3 text-right">Stok Fisik</th>
                      <th className="px-4 py-3">Satuan</th>
                      <th className="px-4 py-3 text-center">Status Gudang</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                    {barang.map(item => {
                      const isCritical = item.stok <= 20;
                      return (
                        <tr key={item.id} className={`${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                          <td className="px-4 py-3 font-mono text-slate-400">{item.kode || `MAT-0${item.id}`}</td>
                          <td className={`px-4 py-3 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.nama_barang}</td>
                          <td className="px-4 py-3 text-slate-400">{item.kategori}</td>
                          <td className="px-4 py-3 text-right font-bold text-sm">
                            <span className={isCritical ? 'text-rose-500' : 'text-emerald-500'}>
                              {item.stok.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">{item.satuan}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isCritical
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {isCritical ? 'Perlu Restock' : 'Aman'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: KELOLA AKUN & PEGAWAI */}
          {activeMenu === 'kelola-pegawai' && (
            <div className="animate-in fade-in duration-200">
              <KelolaPegawai />
            </div>
          )}

        </div>
      </main>

      {/* Modal: Buat Tiket Tugas Baru */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 ${
            isDark ? 'bg-slate-900 border border-slate-700 text-white' : 'bg-white border border-slate-200 text-slate-900'
          } shadow-2xl relative`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-rose-500" />
                Buat Tiket Kerja Baru
              </h3>
              <button
                onClick={() => setShowCreateTaskModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <FormTugas onCreated={() => setShowCreateTaskModal(false)} />
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

      {/* Modal Detail & Riwayat Kerja Teknisi */}
      {selectedTechnician && (
        <ModalDetailRiwayatTeknisi
          teknisi={selectedTechnician}
          onClose={() => setSelectedTechnician(null)}
          onOpenBastp={setBastpModalTask}
          onNavigateToTracking={(taskId) => {
            setSelectedTrackingTaskId(taskId);
            handleTabChange('tracking');
          }}
        />
      )}

    </div>
  );
}

export default DashboardPimpinan;

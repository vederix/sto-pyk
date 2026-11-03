import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import BrandLogo from './BrandLogo';
import {
  LayoutDashboard,
  MapPin,
  CheckCircle2,
  FileText,
  Package,
  ClipboardList,
  FilePlus2,
  Printer,
  Clock,
  Camera,
  PlusCircle,
  Send,
  Boxes,
  FileCheck,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
  Menu,
  X,
  Network
} from 'lucide-react';

export default function ModernSidebar({ activeTab, onTabChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { isDark, toggleTheme } = useTheme();
  const { currentUser, logout, permohonan, tugas, barang = [] } = useApp();
  const navigate = useNavigate();

  const currentRole = currentUser?.role || 'pimpinan';

  // Badge calculations
  const pendingApprovalCount = permohonan.filter(p => p.status === 'Pending').length;
  const approvedForReleaseCount = permohonan.filter(p => p.status === 'Approved').length;
  const assignedTechTickets = tugas.filter(t => t.teknisi_id === currentUser?.id && t.status !== 'Done').length;

  // Menu items configured strictly per user requirements
  const getRoleMenus = () => {
    switch (currentRole) {
      case 'teknisi':
        return [
          {
            key: 'tiket',
            label: 'Ambil Tiket / Pekerjaan',
            icon: ClipboardList,
            badge: assignedTechTickets > 0 ? assignedTechTickets : null,
            badgeColor: 'bg-blue-500 text-white'
          },
          {
            key: 'surat-permohonan',
            label: 'Surat Permohonan Barang',
            icon: FilePlus2
          },
          {
            key: 'cetak-surat',
            label: 'Cetak Fisik Surat Permohonan',
            icon: Printer
          },
          {
            key: 'status-approval',
            label: 'Status Persetujuan Pimpinan',
            icon: Clock,
            badge: approvedForReleaseCount > 0 ? 'Siap Ambil' : null,
            badgeColor: 'bg-emerald-500 text-white'
          },
          {
            key: 'pengerjaan',
            label: 'Pengerjaan & Bukti Selesai',
            icon: Camera
          }
        ];

      case 'gudang':
        return [
          {
            key: 'daftar-barang',
            label: 'Daftar Stok Barang Gudang',
            icon: Boxes,
            badge: barang.length > 0 ? `${barang.length} Item` : null,
            badgeColor: 'bg-emerald-500 text-white'
          },
          {
            key: 'output-barang',
            label: 'Output Barang (Rilis / Serah Terima)',
            icon: Send,
            badge: approvedForReleaseCount > 0 ? approvedForReleaseCount : null,
            badgeColor: 'bg-amber-500 text-white'
          },
          {
            key: 'input-barang',
            label: 'Input Barang (Pengadaan Masuk)',
            icon: PlusCircle
          },
          {
            key: 'cetak-surat-jalan',
            label: 'Cetak Surat Jalan Material',
            icon: FileCheck
          }
        ];

      case 'pimpinan':
      default:
        return [
          {
            key: 'dashboard',
            label: 'Dashboard Lengkap',
            icon: LayoutDashboard
          },
          {
            key: 'tracking',
            label: 'WebGIS Pemetaan ODP',
            icon: MapPin
          },
          {
            key: 'tabel-odp',
            label: 'Tabel ODP, Tiang & ODC',
            icon: Network
          },
          {
            key: 'kelola-tugas',
            label: 'Manajemen Tiket Tugas',
            icon: ClipboardList
          },
          {
            key: 'approval',
            label: 'Permohonan dari Teknisi',
            icon: CheckCircle2,
            badge: pendingApprovalCount > 0 ? pendingApprovalCount : null,
            badgeColor: 'bg-amber-500 text-white'
          },
          {
            key: 'laporan-kerja',
            label: 'Laporan Kerja Lapangan',
            icon: FileText
          },
          {
            key: 'laporan-gudang',
            label: 'Laporan Barang dari Gudang',
            icon: Package
          },
          {
            key: 'kelola-pegawai',
            label: 'Kelola Akun & Pegawai',
            icon: Users
          }
        ];
    }
  };

  const menus = getRoleMenus();

  const handleMenuClick = (key) => {
    if (onTabChange) {
      onTabChange(key);
    }
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header with Hamburger Button */}
      <div className={`lg:hidden flex items-center justify-between px-4 py-3 border-b ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} sticky top-0 z-30 shadow-sm`}>
        <BrandLogo size="sm" />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`p-2 rounded-xl ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-800'} transition active:scale-95`}
          title="Toggle Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop (No heavy blur that ruins view, simple clean dimmer with click-outside) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden animate-in fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar Container (Desktop Persistent + Mobile Drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col transition-all duration-300 ${
          isDark
            ? 'bg-gradient-to-b from-[#0a0f1d] via-slate-950 to-[#070b14] border-r border-slate-800/80 text-white'
            : 'bg-white border-r border-slate-200 text-slate-900 shadow-sm'
        } ${collapsed ? 'w-20' : 'w-72'} ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'} h-16`}>
          <BrandLogo size="md" collapsed={collapsed} />

          {/* Collapse Button on Desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`hidden lg:flex p-1.5 rounded-xl ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-black'
            } transition`}
            title={collapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Close button on Mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Card */}
        <div className={`p-4 border-b ${isDark ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-200 bg-slate-50/70'}`}>
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-burgundy-700 to-rose-500 flex items-center justify-center font-bold text-white shadow-lg flex-shrink-0">
              {currentUser?.nama_lengkap?.charAt(0) || 'U'}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold truncate leading-tight">
                  {currentUser?.nama_lengkap || 'Pengguna'}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    currentRole === 'pimpinan' ? 'bg-burgundy-600/20 text-burgundy-400 border border-burgundy-500/30' :
                    currentRole === 'teknisi' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' :
                    'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {currentRole}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
          {!collapsed && (
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
              Menu Navigasi
            </div>
          )}

          {menus.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => handleMenuClick(item.key)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-burgundy-600 text-white font-bold shadow-lg shadow-burgundy-600/30 scale-[1.02]'
                    : isDark
                    ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                } ${collapsed ? 'justify-center' : 'justify-between'}`}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!collapsed && item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${item.badgeColor || 'bg-burgundy-500 text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer Controls */}
        <div className={`p-3 border-t ${isDark ? 'border-slate-800/80 bg-slate-950/60' : 'border-slate-200 bg-slate-50/90'}`}>
          <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'justify-between'}`}>
            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              title={isDark ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Logout Button */}
            <button
              onClick={async () => {
                await logout();
                navigate('/login', { replace: true });
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition cursor-pointer ${
                isDark
                  ? 'bg-rose-950/40 border-rose-900/60 text-rose-400 hover:bg-rose-900/50 hover:text-white'
                  : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
              }`}
              title="Keluar dari Sistem"
            >
              <LogOut className="w-4 h-4" />
              {!collapsed && <span className="text-xs font-bold">Keluar</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}


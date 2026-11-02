import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { supabase, isSupabaseConfigured } from '../api/supabaseClient';
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  Clock,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Package,
  Layers,
  Send,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function TiketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { tugas, users, claimTugas, showToast } = useApp();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);

  // User sesi aktif (default Teknisi jika belum login)
  const user = JSON.parse(localStorage.getItem('user')) || { id: 2, nama_lengkap: 'Ahmad Fadli', role: 'teknisi' };

  useEffect(() => {
    async function loadTicket() {
      setLoading(true);
      const parsedId = parseInt(id, 10);

      // 1. Cek dari AppContext state
      const foundInState = (tugas || []).find(t => Number(t.id) === parsedId);
      if (foundInState) {
        setTicket(foundInState);
        setLoading(false);
        return;
      }

      // 2. Fetch langsung dari Supabase
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('tugas')
            .select('*')
            .eq('id', parsedId)
            .single();

          if (data && !error) {
            setTicket({
              ...data,
              pelanggan_nama: data.pelanggan_nama || (data.lokasi ? data.lokasi.split('(')[0].trim() : `Pelanggan #${data.id}`),
              keterangan: data.keterangan || `Instruksi pengerjaan ${data.jenis_kerja}`
            });
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('[TiketDetailPage] Supabase fetch notice:', err);
        }
      }

      setLoading(false);
    }

    loadTicket();
  }, [id, tugas]);

  // Handler klaim tiket langsung dari halaman detail
  const handleClaim = async () => {
    if (!ticket) return;
    setClaiming(true);

    try {
      const ok = await claimTugas(ticket.id, user.id);
      if (ok) {
        setJustClaimed(true);
        setTicket(prev => ({
          ...prev,
          teknisi_id: user.id,
          status: 'Progress'
        }));
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal mengklaim tiket: ' + err.message, 'error');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0f1d] text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-blue-600 border-t-transparent shadow-lg shadow-blue-600/20" />
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Memuat Data Tiket #{id}...
          </span>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDark ? 'bg-[#0a0f1d] text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className={`max-w-md w-full p-8 rounded-3xl border text-center ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            !
          </div>
          <h2 className="text-lg font-extrabold mb-1">Tiket Tidak Ditemukan</h2>
          <p className="text-xs text-slate-400 mb-6">
            Tiket dengan ID #{id} tidak ada di database sistem atau telah dihapus.
          </p>
          <button
            onClick={() => navigate('/dashboard-teknisi')}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer"
          >
            Kembali ke Dashboard Teknisi
          </button>
        </div>
      </div>
    );
  }

  const isClaimedByMe = Number(ticket.teknisi_id) === Number(user.id);
  const isDone = ticket.status === 'Done' || ticket.status === 'Closed';
  const isProgress = ticket.status === 'Progress' || ticket.status === 'In-Progress';
  const isOpenPool = (!ticket.teknisi_id || ticket.status === 'menunggu' || ticket.status === 'Open' || ticket.status === 'open') && !isDone && !isProgress;

  const assignedTech = users?.find(u => Number(u.id) === Number(ticket.teknisi_id));
  const assignedTechName = isClaimedByMe ? user.nama_lengkap : (assignedTech?.nama_lengkap || 'Teknisi Lapangan');

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0f1d] text-white' : 'bg-slate-50 text-slate-900'} py-8 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Top Header & Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className={`p-2.5 rounded-2xl border flex items-center gap-2 text-xs font-bold transition cursor-pointer ${
              isDark ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-500">
              #{ticket.id}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
              isDone ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
              isProgress ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
              'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}>
              {isDone ? '✅ Selesai (Closed)' : isProgress ? '⚡ In-Progress' : '📢 Open Pool (Siaga)'}
            </span>
          </div>
        </div>

        {/* Just Claimed Banner Alert */}
        {justClaimed && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
            <div className="text-xs space-y-1">
              <strong className="font-extrabold block text-sm">Tiket Berhasil Anda Ambil!</strong>
              <p>Tiket ini telah resmi ditugaskan ke Anda. Langkah selanjutnya: Silakan ajukan kebutuhan material ke Petugas Gudang STO.</p>
            </div>
          </div>
        )}

        {/* Main Work Order Card */}
        <div className={`p-6 sm:p-8 rounded-3xl border ${
          isDark ? 'bg-slate-900/90 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'
        } space-y-6`}>
          
          {/* Header Title */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-xs text-rose-500 font-extrabold tracking-wider uppercase mb-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                TELKOM AKSES — NOC STO PAYAKUMBUH
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Work Order / Tiket Penugasan Lapangan
              </h1>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Perintah kerja teknisi lapangan dan dasar permohonan logistik material gudang STO.
              </p>
            </div>

            <span className={`px-3 py-1.5 rounded-xl text-xs font-black border uppercase shrink-0 ${
              ticket.jenis_kerja?.toLowerCase().includes('pasang') ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' :
              ticket.jenis_kerja?.toLowerCase().includes('gangguan') ? 'bg-rose-600/20 text-rose-400 border-rose-500/30' :
              'bg-purple-600/20 text-purple-400 border-purple-500/30'
            }`}>
              {ticket.jenis_kerja || 'Perbaikan Lapangan'}
            </span>
          </div>

          {/* Grid Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Box 1: Info Pelanggan & Lokasi */}
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-3`}>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span>Data Pelanggan</span>
              </div>

              <div>
                <div className="text-sm font-extrabold">{ticket.pelanggan_nama || 'Pelanggan IndiHome'}</div>
                {ticket.pelanggan_telp && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold mt-1">
                    <Phone className="w-3 h-3" />
                    <span>{ticket.pelanggan_telp}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800/40 text-xs flex items-start gap-2 text-slate-400">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{ticket.lokasi || 'Koto Nan IV Payakumbuh'}</span>
              </div>
            </div>

            {/* Box 2: Info Teknis Jaringan & ODP */}
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-3`}>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-purple-500" />
                <span>Teknis Jaringan & ODP</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Titik Distribusi:</span>
                  <span className="font-mono font-bold text-blue-400">{ticket.odp_kode || `ODP-PYK-01/04`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Target SLA:</span>
                  <span className="font-bold text-amber-400">&lt; 3 Jam (Prioritas Utama)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Teknisi Ditugaskan:</span>
                  <span className="font-bold text-slate-200">
                    {ticket.teknisi_id ? assignedTechName : 'Belum Diambil (Open Pool)'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Catatan Gangguan / Instruksi */}
          {ticket.keterangan && (
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-amber-50/50 border-amber-200/60'} text-xs space-y-1`}>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Instruksi NOC Dispatch:</span>
              <p className={`italic ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>"{ticket.keterangan}"</p>
            </div>
          )}

          {/* ACTION BUTTON AREA */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            {isOpenPool ? (
              <button
                type="button"
                onClick={handleClaim}
                disabled={claiming}
                className="w-full py-4 px-6 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-900/40 transition active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{claiming ? '⏳ Mengambil Tiket...' : '✋ Ambil Tiket Ini (Klaim Pekerjaan Sekarang)'}</span>
              </button>
            ) : isProgress ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 flex items-center justify-between">
                  <span>👷 Tiket sedang dikerjakan oleh <strong>{assignedTechName}</strong></span>
                  <span className="font-bold">IN-PROGRESS</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate('/dashboard-teknisi')}
                    className="py-3 px-4 rounded-xl bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Package className="w-4 h-4" />
                    <span>📦 Ajukan Material Gudang</span>
                  </button>

                  <button
                    onClick={() => navigate('/dashboard-teknisi')}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Buka Dashboard Teknisi</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-center text-xs font-bold">
                Tiket ini telah selesai dikerjakan 100% dan Berita Acara BASTP Digital telah diterbitkan.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import api from '../api/axiosInstance';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import {
  CheckCircle2,
  XCircle,
  ShieldCheck
} from 'lucide-react';

function ApprovalMaterial() {
  const { isDark } = useTheme();
  const {
    permohonan,
    tugas,
    barang,
    detailPermohonan,
    users,
    approveMaterial,
    rejectMaterial,
    showToast
  } = useApp();

  const [pesan, setPesan] = useState('');
  const [error, setError] = useState('');

  // 1. Build enriched pending list reactively with useMemo
  const permohonanList = useMemo(() => {
    return permohonan.filter(p => p.status === 'Pending').map(p => {
      const parentTask = tugas.find(t => t.id === p.tugas_id);
      const tech = users.find(u => u.id === parentTask?.teknisi_id);
      const details = detailPermohonan.filter(d => d.permohonan_id === p.id).map(d => {
        const item = barang.find(b => b.id === d.barang_id);
        return {
          ...d,
          nama_barang: item?.nama_barang || `Barang #${d.barang_id}`,
          satuan: item?.satuan || 'pcs'
        };
      });

      return {
        ...p,
        parentTask,
        tech,
        details
      };
    });
  }, [permohonan, tugas, detailPermohonan, barang, users]);

  const handleApprove = async (id) => {
    setPesan('');
    setError('');

    try {
      await api.patch(`/permohonan/${id}/approve`);
      setPesan(`Permohonan #${id} berhasil disetujui server.`);
    } catch {
      // Offline fallback
    }

    // Always update local AppContext state (SOP 3)
    approveMaterial(id);
    showToast(`Permohonan #${id} DISETUJUI. Diteruskan ke Gudang untuk rilis barang!`, 'success');
  };

  const handleReject = async (id) => {
    setPesan('');
    setError('');
    rejectMaterial(id);
    showToast(`Permohonan #${id} DITOLAK.`, 'error');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <span>Approval Permohonan Material</span>
          </h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Verifikasi permohonan material teknisi sebelum serah terima gudang.
          </p>
        </div>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          {permohonanList.length} Menunggu Otorisasi
        </span>
      </div>

      {pesan && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{pesan}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-700/60 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          {error}
        </div>
      )}

      {permohonanList.length === 0 ? (
        <div className={`p-10 rounded-2xl border text-center flex flex-col items-center justify-center ${
          isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mb-2" />
          <span className="text-xs font-bold text-slate-400">
            Tidak ada permohonan material yang pending saat ini. Semua telah disetujui.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {permohonanList.map((p) => (
            <div
              key={p.id}
              className={`rounded-2xl p-5 border transition-all shadow-md flex flex-col justify-between ${
                isDark
                  ? 'bg-slate-950/70 border-slate-800 hover:border-amber-500/40'
                  : 'bg-white border-slate-200 hover:border-amber-500/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs font-black text-amber-500">Permohonan #{p.id}</span>
                    <h3 className="font-bold text-sm mt-0.5">
                      Tiket #{p.tugas_id} — {p.parentTask?.jenis_kerja || 'Pekerjaan STO'}
                    </h3>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Diajukan oleh: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{p.tech?.nama_lengkap || 'Teknisi Lapangan'}</strong>
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase bg-amber-500/20 text-amber-500 border border-amber-500/30">
                    {p.status}
                  </span>
                </div>

                <div className={`p-3 rounded-xl border text-xs mb-3 space-y-1 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Lokasi Pekerjaan:</div>
                  <div className="font-medium truncate">{p.parentTask?.lokasi || 'Koto Nan IV, Payakumbuh'}</div>
                  {p.catatan_teknisi && (
                    <div className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-200 dark:border-slate-800">
                      "{p.catatan_teknisi}"
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Rincian Barang Diminta:
                  </div>
                  <div className="space-y-1.5">
                    {p.details?.map((d) => (
                      <div
                        key={d.id}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
                          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
                        }`}
                      >
                        <span className="font-medium">• {d.nama_barang}</span>
                        <span className="font-extrabold text-amber-500">
                          {d.jumlah_minta} {d.satuan}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => handleApprove(p.id)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-950 cursor-pointer active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Setujui (Approve)</span>
                </button>
                <button
                  onClick={() => handleReject(p.id)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border-slate-700'
                      : 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-200'
                  }`}
                  title="Tolak Permohonan"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ApprovalMaterial;
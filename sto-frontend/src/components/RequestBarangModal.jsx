import { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Package, Plus, Trash2, X } from 'lucide-react';

function RequestBarangModal({ tugasId, onClose, onSuccess }) {
  const { isDark } = useTheme();
  const { barang: localBarang, requestMaterial } = useApp();

  const [barangList, setBarangList] = useState(localBarang || []);
  const [selectedBarang, setSelectedBarang] = useState('');
  const [jumlah, setJumlah] = useState('1');
  const [keranjang, setKeranjang] = useState([]);
  const [catatan, setCatatan] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fallback to localBarang
    if (localBarang && localBarang.length > 0) {
      setBarangList(localBarang);
      setSelectedBarang(String(localBarang[0]?.id));
    }

    // Try API
    api.get('/barang')
      .then((res) => {
        if (res.data?.barang && res.data.barang.length > 0) {
          setBarangList(res.data.barang);
        }
      })
      .catch(() => {});
  }, [localBarang]);

  const handleTambah = () => {
    if (!selectedBarang || !jumlah || Number(jumlah) <= 0) {
      setError('Pilih barang dan isi kuantitas yang valid');
      return;
    }

    const item = barangList.find((b) => b.id === Number(selectedBarang));
    if (!item) return;

    setKeranjang((prev) => [
      ...prev,
      {
        barang_id: item.id,
        nama_barang: item.nama_barang,
        satuan: item.satuan,
        jumlah_minta: Number(jumlah)
      },
    ]);
    setError('');
  };

  const handleHapusItem = (idx) => {
    setKeranjang(keranjang.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (keranjang.length === 0) {
      setError('Tambahkan minimal 1 jenis barang ke daftar permohonan');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post('/permohonan', {
        tugas_id: tugasId,
        barang: keranjang.map((k) => ({ barang_id: k.barang_id, jumlah_minta: k.jumlah_minta })),
      });
    } catch {
      // Offline fallback
    }

    // Always update AppContext state (SOP 2)
    requestMaterial(tugasId, keranjang, catatan || 'Kebutuhan material lapangan');
    setSubmitting(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className={`rounded-3xl p-6 w-full max-w-md border shadow-2xl transition-all ${
        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold">Ajukan Material ke Gudang</h2>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tiket Tugas #{tugasId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs mb-3 font-semibold">
            {error}
          </div>
        )}

        <div className="space-y-3 text-xs mb-4">
          <div className="flex gap-2">
            <select
              value={selectedBarang}
              onChange={(e) => setSelectedBarang(e.target.value)}
              className={`flex-1 p-2.5 rounded-xl border outline-none cursor-pointer ${
                isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              {barangList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nama_barang} (Sisa: {b.stok} {b.satuan})
                </option>
              ))}
            </select>

            <input
              type="number"
              min="1"
              value={jumlah}
              onChange={(e) => setJumlah(e.target.value)}
              className={`w-16 p-2.5 rounded-xl border text-center font-bold outline-none ${
                isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />

            <button
              type="button"
              onClick={handleTambah}
              className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition flex items-center justify-center cursor-pointer shadow"
              title="Tambah Barang"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Cart Table */}
          {keranjang.length > 0 ? (
            <div className={`p-3 rounded-2xl border space-y-2 ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-[10px] font-extrabold uppercase text-slate-400">Daftar Barang Diminta:</div>
              {keranjang.map((k, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs pb-1 border-b border-slate-200 dark:border-slate-800 last:border-none">
                  <span className="font-medium">
                    • {k.nama_barang} (<strong>{k.jumlah_minta} {k.satuan}</strong>)
                  </span>
                  <button
                    onClick={() => handleHapusItem(idx)}
                    className="text-rose-500 hover:text-rose-400 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic text-center py-2">
              Belum ada barang di daftar. Pilih barang di atas dan tekan tombol (+).
            </p>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Catatan Tambahan Teknisi:</label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Kebutuhan penarikan kabel 100 meter ke tiang ODP..."
              className={`w-full p-2.5 rounded-xl border outline-none text-xs ${
                isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-600 text-white text-xs font-extrabold shadow-lg shadow-rose-900/30 transition cursor-pointer active:scale-98 disabled:opacity-50"
          >
            {submitting ? 'Mengirim...' : 'Kirim ke Pimpinan'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RequestBarangModal;
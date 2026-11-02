import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import {
  Users,
  UserPlus,
  Shield,
  Wrench,
  Package,
  Mail,
  X
} from 'lucide-react';

export default function KelolaPegawai() {
  const { isDark } = useTheme();
  const { users, addUser, showToast } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState('teknisi');
  const [submitting, setSubmitting] = useState(false);
  const [filterRole, setFilterRole] = useState('all');

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    if (!nama.trim() || !email.trim() || !password.trim()) {
      showToast('Nama, email, dan kata sandi wajib diisi!', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await addUser({
        nama_lengkap: nama.trim(),
        email: email.toLowerCase().trim(),
        password,
        role
      });

      setShowAddModal(false);
      setNama('');
      setEmail('');
      setPassword('password123');
      showToast(`Akun pegawai ${nama} berhasil ditambahkan ke database!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal menambahkan pegawai', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => {
    if (filterRole === 'all') return true;
    return u.role === filterRole;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-burgundy-600/20 text-burgundy-500 border border-burgundy-500/30">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black">Kelola Akun & Hak Akses Pegawai</h1>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Pimpinan dapat mendaftarkan akun baru, mengatur role (Teknisi / Gudang / Pimpinan), dan memantau status staf di STO Payakumbuh.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-burgundy-600 hover:bg-burgundy-700 text-white font-bold text-xs shadow-lg shadow-burgundy-600/30 transition cursor-pointer active:scale-95 whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Akun Pegawai</span>
        </button>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'all', label: `Semua Pegawai (${users.length})` },
          { key: 'teknisi', label: `Teknisi Lapangan (${users.filter(u => u.role === 'teknisi').length})` },
          { key: 'gudang', label: `Petugas Gudang (${users.filter(u => u.role === 'gudang').length})` },
          { key: 'pimpinan', label: `Pimpinan (${users.filter(u => u.role === 'pimpinan').length})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterRole(tab.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              filterRole === tab.key
                ? 'bg-burgundy-600 text-white shadow-md'
                : isDark ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white' : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Employee List Table */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="overflow-x-auto">
          <table className={`w-full text-left text-xs ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
            <thead className={`${isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'} uppercase text-[10px] tracking-wider border-b`}>
              <tr>
                <th className="px-4 py-3">Nama Pegawai</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Peran / Role</th>
                <th className="px-4 py-3">ID Akun</th>
                <th className="px-4 py-3 text-center">Status Database</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
              {filteredUsers.map(u => (
                <tr key={u.id} className={`${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-white shadow ${
                        u.role === 'pimpinan' ? 'bg-rose-700' : u.role === 'teknisi' ? 'bg-blue-600' : 'bg-emerald-600'
                      }`}>
                        {u.nama_lengkap?.charAt(0) || 'U'}
                      </div>
                      <div className="font-extrabold text-slate-900 dark:text-white">{u.nama_lengkap}</div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {u.email}</span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      u.role === 'pimpinan' ? 'bg-burgundy-600/20 text-burgundy-500 border-burgundy-500/30' :
                      u.role === 'teknisi' ? 'bg-blue-600/20 text-blue-500 border-blue-500/30' :
                      'bg-emerald-600/20 text-emerald-500 border-emerald-500/30'
                    }`}>
                      {u.role}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-400">
                    #{u.id}
                  </td>

                  <td className="px-4 py-3.5">
                    {u.jabatan || (u.role === 'pimpinan' ? 'Manager STO' : u.role === 'teknisi' ? 'Teknisi Lapangan' : 'Staff Gudang')}
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      Aktif (Real)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Pegawai Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          } animate-in zoom-in-95 duration-200`}>
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-burgundy-500" />
                <h3 className="font-extrabold text-base">Tambah Akun Pegawai STO</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={e => setNama(e.target.value)}
                  placeholder="Contoh: Rahmat Hidayat"
                  className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Email Resmi Pegawai</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nama@telkomakses.co.id"
                  className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Peran / Role Pengguna</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'teknisi', label: 'Teknisi', icon: Wrench },
                    { id: 'gudang', label: 'Gudang', icon: Package },
                    { id: 'pimpinan', label: 'Pimpinan', icon: Shield }
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition ${
                        role === r.id
                          ? 'bg-burgundy-600 text-white border-burgundy-500 shadow'
                          : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600'
                      }`}
                    >
                      <r.icon className="w-3.5 h-3.5" />
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Kata Sandi</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-burgundy-600 hover:bg-burgundy-700 text-white font-bold text-xs shadow-lg shadow-burgundy-600/30 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


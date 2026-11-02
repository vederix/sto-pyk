import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase, { isSupabaseConfigured } from '../api/supabaseClient';
import api from '../api/axiosInstance';
import ParticleBackground from '../components/ParticleBackground';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import BrandLogo from '../components/BrandLogo';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
  UserPlus,
  LogIn,
  Wrench,
  Eye,
  EyeOff
} from 'lucide-react';

export default function Login({ onTriggerSplash }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  // Login Form States - Clean production state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register Form States (strictly matching Supabase users table: nama_lengkap, email, password, role)
  const [regNama, setRegNama] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const regRole = 'teknisi'; // Strictly Teknisi! Pimpinan and Gudang cannot be self-registered

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [particleColor, setParticleColor] = useState('burgundy');

  const { toggleTheme, isDark } = useTheme();
  const { users, setCurrentUser, addUser, showToast } = useApp();
  const navigate = useNavigate();

  // Handle Automatic Role-Based Login
  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      let loggedInUser = null;

      // 1. Prioritaskan Autentikasi via Backend API STO (/api/auth/login)
      // Mendukung pencocokan hash password Bcrypt dari Supabase secara aman & akurat
      try {
        const response = await api.post('/auth/login', {
          email: email.toLowerCase().trim(),
          password: password.trim()
        });

        if (response.data?.success && (response.data?.data?.user || response.data?.user)) {
          loggedInUser = response.data?.data?.user || response.data?.user;
        }
      } catch (backendErr) {
        // Jika backend secara spesifik menolak password salah atau email tidak ada
        if (backendErr.response) {
          const status = backendErr.response.status;
          const msg = backendErr.response.data?.message;
          if (status === 401 || status === 404) {
            setError(msg || 'Email atau kata sandi tidak valid!');
            setLoading(false);
            return;
          }
        }
        console.warn('Backend API tidak merespons, mencoba fallback langsung:', backendErr.message);
      }

      // 2. Direct real-time check against Supabase 'users' table (Fallback jika server backend offline)
      if (!loggedInUser && isSupabaseConfigured()) {
        try {
          const { data: dbUser, error: dbErr } = await supabase
            .from('users')
            .select('*')
            .ilike('email', email.toLowerCase().trim())
            .single();

          if (dbUser && !dbErr) {
            if (String(dbUser.password).trim() === String(password).trim()) {
              loggedInUser = dbUser;
            } else if (dbUser.password.startsWith('$2')) {
              setError('Password akun Anda dienkripsi (Bcrypt). Harap pastikan server backend aktif di port 5000.');
              setLoading(false);
              return;
            } else {
              setError('Kata sandi yang Anda masukkan salah!');
              setLoading(false);
              return;
            }
          }
        } catch (supabaseErr) {
          console.warn('Supabase auth attempt:', supabaseErr);
        }
      }

      // 3. Fallback to state/localStorage users list
      if (!loggedInUser) {
        const localFound = users.find(
          (u) => u.email?.toLowerCase().trim() === email.toLowerCase().trim()
        );

        if (localFound) {
          if (String(localFound.password).trim() === String(password).trim()) {
            loggedInUser = localFound;
          } else {
            setError('Kata sandi tidak sesuai!');
            setLoading(false);
            return;
          }
        }
      }

      // 4. Evaluate Authentication Result
      if (!loggedInUser) {
        setError('Akun dengan email tersebut belum terdaftar di sistem STO.');
        setLoading(false);
        return;
      }

      // 4. Save Session & Auto Route by Database Role
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      setCurrentUser(loggedInUser);

      showToast(`Selamat datang, ${loggedInUser.nama_lengkap}! Masuk sebagai ${loggedInUser.role.toUpperCase()}`, 'success');



      if (loggedInUser.role === 'pimpinan') {
        navigate('/dashboard-pimpinan');
      } else if (loggedInUser.role === 'teknisi') {
        navigate('/dashboard-teknisi');
      } else if (loggedInUser.role === 'gudang') {
        navigate('/dashboard-gudang');
      } else {
        navigate('/dashboard-pimpinan');
      }
    } catch (err) {
      setError('Terjadi kendala saat memproses login. Silakan coba lagi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Technician Registration (strictly role: 'teknisi' per business policy)
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!regNama.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError('Harap lengkapi nama, email, dan kata sandi.');
      return;
    }

    setLoading(true);

    try {
      // Check existing email
      const existing = users.find(u => u.email?.toLowerCase().trim() === regEmail.toLowerCase().trim());
      if (existing) {
        setError('Email ini sudah terdaftar. Silakan gunakan email lain atau langsung masuk.');
        setLoading(false);
        return;
      }

      const created = await addUser({
        nama_lengkap: regNama.trim(),
        email: regEmail.toLowerCase().trim(),
        password: regPassword,
        role: 'teknisi' // Strictly Teknisi Lapangan! Pimpinan & Gudang are managed internally
      });

      showToast(`Pendaftaran berhasil! Akun Teknisi ${created.nama_lengkap} siap digunakan.`, 'success');

      // Pre-fill login email and switch to login tab
      setEmail(regEmail);
      setPassword(regPassword);
      setAuthMode('login');
    } catch (err) {
      setError('Gagal mendaftarkan akun. Silakan periksa koneksi data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#0a0f1d] text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Interactive Canvas Particle Background with Compact Dropdown Color Switcher */}
      <ParticleBackground
        activeColor={particleColor}
        onColorChange={(newCol) => setParticleColor(newCol)}
        showSelector={true}
      />

      {/* Top Left Theme & Splash Controls */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className={`p-2.5 rounded-2xl border transition shadow-lg cursor-pointer ${
            isDark
              ? 'bg-slate-900/80 border-slate-700 text-amber-400 hover:bg-slate-800'
              : 'bg-white/90 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
          title="Ganti Tema Dark / Light Mode"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {onTriggerSplash && (
          <button
            onClick={onTriggerSplash}
            className={`px-3 py-2 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition shadow-lg cursor-pointer ${
              isDark
                ? 'bg-slate-900/80 border-slate-700 text-rose-300 hover:bg-slate-800'
                : 'bg-white/90 border-slate-200 text-rose-700 hover:bg-slate-100'
            }`}
            title="Putar Ulang Animasi Splash Screen"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Lihat Splash</span>
          </button>
        )}
      </div>

      {/* Center Auth Card */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-300 my-8">
        <div
          className={`rounded-3xl p-7 sm:p-9 shadow-2xl border transition-all duration-300 ${
            isDark
              ? 'bg-slate-900/85 border-slate-700/80 backdrop-blur-2xl shadow-rose-950/20'
              : 'bg-white/95 border-slate-200 backdrop-blur-2xl shadow-slate-300/50'
          }`}
        >
          {/* Header Brand */}
          <div className="flex flex-col items-center text-center mb-6">
            <BrandLogo size="lg" className="mb-2 justify-center" />
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              STO Telkom Akses Payakumbuh (Koto Nan IV)
            </p>
          </div>

          {/* Tab Switcher: Masuk vs Registrasi Teknisi */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950/80 rounded-2xl mb-6 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setError(''); }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk Sistem</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setError(''); }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar Teknisi</span>
            </button>
          </div>

          {/* Error Message if any */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs text-center font-medium animate-in fade-in duration-200">
              {error}
            </div>
          )}

          {/* MODE 1: LOGIN FORM */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                  Email Pegawai Telkom
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@sto.co.id"
                    className={`w-full pl-10 pr-3.5 py-3 rounded-2xl text-xs font-medium border outline-none transition ${
                      isDark
                        ? 'bg-slate-950/80 border-slate-700 text-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                    }`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                    Kata Sandi
                  </label>
                  <span className="text-[11px] font-semibold text-rose-500 hover:underline cursor-pointer">
                    Lupa Sandi?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-3 rounded-2xl text-xs font-medium border outline-none transition ${
                      isDark
                        ? 'bg-slate-950/80 border-slate-700 text-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none cursor-pointer transition p-1"
                    title={showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-linear-to-r from-rose-700 via-rose-600 to-rose-700 hover:from-rose-600 hover:to-rose-600 text-white font-extrabold text-xs shadow-xl shadow-rose-900/40 transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <span>Memverifikasi Akun...</span>
                ) : (
                  <>
                    <span>Masuk ke Sistem STO</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Belum memiliki akun?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setError(''); }}
                    className="text-rose-500 font-bold hover:underline cursor-pointer"
                  >
                    Daftar Akun Teknisi Lapangan
                  </button>
                </span>
              </div>
            </form>
          )}

          {/* MODE 2: REGISTER FORM - Strictly for Field Technicians */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5 animate-in fade-in duration-200">
              {/* Role Informational Notice Card */}
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      Pendaftaran Khusus: Teknisi Lapangan (Field Tech)
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Pendaftaran mandiri ini diperuntukkan bagi Teknisi Lapangan. Akun Pimpinan dan Petugas Gudang dikelola secara resmi & terpusat oleh Kantor Sentral STO Telkom Akses.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                  Nama Lengkap Teknisi
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regNama}
                    onChange={(e) => setRegNama(e.target.value)}
                    placeholder="Contoh: Ahmad Fadli"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-2xl text-xs font-medium border outline-none transition ${
                      isDark
                        ? 'bg-slate-950/80 border-slate-700 text-white focus:border-rose-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                  Email Resmi Teknisi
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nama.teknisi@sto.co.id"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-2xl text-xs font-medium border outline-none transition ${
                      isDark
                        ? 'bg-slate-950/80 border-slate-700 text-white focus:border-rose-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-2xl text-xs font-medium border outline-none transition ${
                      isDark
                        ? 'bg-slate-950/80 border-slate-700 text-white focus:border-rose-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none cursor-pointer transition p-1"
                    title={showRegPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 mt-2 rounded-2xl bg-linear-to-r from-rose-700 via-rose-600 to-rose-700 hover:from-rose-600 hover:to-rose-600 text-white font-extrabold text-xs shadow-xl shadow-rose-900/40 transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? <span>Mendaftarkan Akun Teknisi...</span> : <span>Daftarkan Akun Teknisi Lapangan</span>}
              </button>

              <div className="pt-2 text-center">
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Sudah memiliki akun?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setError(''); }}
                    className="text-rose-500 font-bold hover:underline cursor-pointer"
                  >
                    Masuk ke Sistem
                  </button>
                </span>
              </div>
            </form>
          )}

        </div>

        {/* Footer Info */}
        <p className="text-center text-[10px] text-slate-500 mt-4">
          PT Telkom Akses • Sentral Telepon Otomatis (STO) Payakumbuh
        </p>
      </div>

    </div>
  );
}
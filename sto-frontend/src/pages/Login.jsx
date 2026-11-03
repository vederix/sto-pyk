import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase, { isSupabaseConfigured } from '../api/supabaseClient';
import api from '../api/axiosInstance';
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
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';

/**
 * Isolated Login Sub-Form:
 * Local state for email & password so keystrokes do NOT re-render
 * the parent layout, BrandLogo, or Tab Switcher.
 */
const LoginForm = memo(function LoginForm({
  onSubmit,
  loading,
  onSwitchRegister,
  isDark,
  initialEmail = ''
}) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loading) {
      onSubmit(email, password);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
          Email Pegawai Telkom
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@sto.co.id"
            className={`w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-2xl text-xs font-medium border outline-none transition-colors ${
              isDark
                ? 'bg-slate-950/80 border-slate-700 text-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
            }`}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
            Kata Sandi
          </label>
          <span className="text-[11px] font-semibold text-rose-500 hover:underline cursor-pointer select-none">
            Lupa Sandi?
          </span>
        </div>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={`w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-2xl text-xs font-medium border outline-none transition-colors ${
              isDark
                ? 'bg-slate-950/80 border-slate-700 text-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
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
        className="w-full py-3 sm:py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold text-xs shadow-md shadow-rose-900/30 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Memverifikasi Akun...</span>
          </span>
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
            onClick={onSwitchRegister}
            className="text-rose-500 font-bold hover:underline cursor-pointer"
          >
            Daftar Akun Teknisi Lapangan
          </button>
        </span>
      </div>
    </form>
  );
});

/**
 * Isolated Register Sub-Form:
 * Local state for name, email & password.
 */
const RegisterForm = memo(function RegisterForm({
  onSubmit,
  loading,
  onSwitchLogin,
  isDark
}) {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loading) {
      onSubmit({ nama, email, password });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div>
        <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
          Nama Lengkap Teknisi
        </label>
        <div className="relative">
          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            required
            autoComplete="name"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Contoh: Ahmad Fadli"
            className={`w-full pl-10 pr-3.5 py-2.5 rounded-2xl text-xs font-medium border outline-none transition-colors ${
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
          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama.teknisi@sto.co.id"
            className={`w-full pl-10 pr-3.5 py-2.5 rounded-2xl text-xs font-medium border outline-none transition-colors ${
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
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            className={`w-full pl-10 pr-10 py-2.5 rounded-2xl text-xs font-medium border outline-none transition-colors ${
              isDark
                ? 'bg-slate-950/80 border-slate-700 text-white focus:border-rose-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
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
        className="w-full py-3 px-4 mt-2 rounded-2xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold text-xs shadow-md shadow-rose-900/30 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Mendaftarkan Akun Teknisi...</span>
          </span>
        ) : (
          <span>Daftarkan Akun Teknisi Lapangan</span>
        )}
      </button>

      <div className="pt-2 text-center">
        <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Sudah memiliki akun?{' '}
          <button
            type="button"
            onClick={onSwitchLogin}
            className="text-rose-500 font-bold hover:underline cursor-pointer"
          >
            Masuk ke Sistem
          </button>
        </span>
      </div>
    </form>
  );
});

export default function Login() {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const { toggleTheme, isDark } = useTheme();
  const { users, setCurrentUser, addUser, showToast } = useApp();
  const navigate = useNavigate();

  // If user is already authenticated, preserve session and avoid login flicker
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        const savedUser = JSON.parse(rawUser);
        if (savedUser && savedUser.role) {
          const redirectPath = sessionStorage.getItem('sto_redirect_after_login');
          if (redirectPath) {
            sessionStorage.removeItem('sto_redirect_after_login');
            navigate(redirectPath, { replace: true });
            return;
          }

          if (savedUser.role === 'pimpinan') {
            const pTab = sessionStorage.getItem('sto_pimpinan_tab');
            navigate(pTab ? `/dashboard-pimpinan?tab=${pTab}` : '/dashboard-pimpinan', { replace: true });
          } else if (savedUser.role === 'teknisi') {
            const tTab = sessionStorage.getItem('sto_teknisi_tab');
            navigate(tTab ? `/dashboard-teknisi?tab=${tTab}` : '/dashboard-teknisi', { replace: true });
          } else if (savedUser.role === 'gudang') {
            const gTab = sessionStorage.getItem('sto_gudang_tab');
            navigate(gTab ? `/dashboard-gudang?tab=${gTab}` : '/dashboard-gudang', { replace: true });
          } else {
            navigate('/dashboard-pimpinan', { replace: true });
          }
        }
      }
    } catch {
      // ignore
    }
  }, [navigate]);

  // Handle Automatic Role-Based Login
  const handleLogin = useCallback(async (inputEmail, inputPassword) => {
    setError('');
    setLoading(true);

    const cleanEmail = inputEmail.toLowerCase().trim();
    const cleanPassword = inputPassword.trim();

    try {
      let loggedInUser = null;

      // 1. Backend API STO (/api/auth/login) with fast fallback
      try {
        const response = await api.post('/auth/login', {
          email: cleanEmail,
          password: cleanPassword
        });

        if (response.data?.success && (response.data?.data?.user || response.data?.user)) {
          loggedInUser = response.data?.data?.user || response.data?.user;
        }
      } catch (backendErr) {
        if (backendErr.response) {
          const status = backendErr.response.status;
          const msg = backendErr.response.data?.message;
          if (status === 401 || status === 404) {
            setError(msg || 'Email atau kata sandi tidak valid!');
            setLoading(false);
            return;
          }
        }
      }

      // 2. Direct real-time check against Supabase 'users' table (Lean query, only fetch single matching user)
      if (!loggedInUser && isSupabaseConfigured()) {
        try {
          const { data: dbUser, error: dbErr } = await supabase
            .from('users')
            .select('id, nama_lengkap, email, password, role, jabatan, avatar')
            .ilike('email', cleanEmail)
            .maybeSingle();

          if (dbUser && !dbErr) {
            if (String(dbUser.password).trim() === cleanPassword) {
              loggedInUser = dbUser;
            } else if (dbUser.password?.startsWith('$2')) {
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
          console.warn('Supabase auth fallback error:', supabaseErr);
        }
      }

      // 3. Fallback to cached/local users list
      if (!loggedInUser) {
        const localFound = users.find(
          (u) => u.email?.toLowerCase().trim() === cleanEmail
        );

        if (localFound) {
          if (String(localFound.password).trim() === cleanPassword) {
            loggedInUser = localFound;
          } else {
            setError('Kata sandi tidak sesuai!');
            setLoading(false);
            return;
          }
        }
      }

      // 4. Validate Authentication Outcome
      if (!loggedInUser) {
        setError('Akun dengan email tersebut belum terdaftar di sistem STO.');
        setLoading(false);
        return;
      }

      // 5. Save Session & Auto Route by Database Role
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      setCurrentUser(loggedInUser);

      showToast(`Selamat datang, ${loggedInUser.nama_lengkap}! Masuk sebagai ${loggedInUser.role.toUpperCase()}`, 'success');

      const redirectPath = sessionStorage.getItem('sto_redirect_after_login');
      if (redirectPath) {
        sessionStorage.removeItem('sto_redirect_after_login');
        navigate(redirectPath, { replace: true });
        return;
      }

      if (loggedInUser.role === 'pimpinan') {
        const pTab = sessionStorage.getItem('sto_pimpinan_tab');
        navigate(pTab ? `/dashboard-pimpinan?tab=${pTab}` : '/dashboard-pimpinan');
      } else if (loggedInUser.role === 'teknisi') {
        const tTab = sessionStorage.getItem('sto_teknisi_tab');
        navigate(tTab ? `/dashboard-teknisi?tab=${tTab}` : '/dashboard-teknisi');
      } else if (loggedInUser.role === 'gudang') {
        const gTab = sessionStorage.getItem('sto_gudang_tab');
        navigate(gTab ? `/dashboard-gudang?tab=${gTab}` : '/dashboard-gudang');
      } else {
        navigate('/dashboard-pimpinan');
      }
    } catch (err) {
      setError('Terjadi kendala saat memproses login. Silakan periksa koneksi data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [users, setCurrentUser, showToast, navigate]);

  // Handle Technician Registration
  const handleRegister = useCallback(async ({ nama, email: regEmail, password: regPassword }) => {
    setError('');

    if (!nama.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError('Harap lengkapi nama, email, dan kata sandi.');
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = regEmail.toLowerCase().trim();
      const existing = users.find((u) => u.email?.toLowerCase().trim() === cleanEmail);
      if (existing) {
        setError('Email ini sudah terdaftar. Silakan gunakan email lain atau langsung masuk.');
        setLoading(false);
        return;
      }

      const created = await addUser({
        nama_lengkap: nama.trim(),
        email: cleanEmail,
        password: regPassword,
        role: 'teknisi'
      });

      showToast(`Pendaftaran berhasil! Akun Teknisi ${created.nama_lengkap} siap digunakan.`, 'success');

      setRegisteredEmail(cleanEmail);
      setAuthMode('login');
    } catch (err) {
      setError('Gagal mendaftarkan akun. Silakan periksa koneksi data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [users, addUser, showToast]);

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-[#0a0f1d] text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* 100% Pure Static CSS Background (Zero JS / Zero Canvas Animation / 0% CPU/GPU) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        {/* Subtle Ambient Red Glow at Top */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 rounded-full blur-3xl pointer-events-none ${
            isDark ? 'bg-rose-600/10' : 'bg-rose-500/5'
          }`}
        />
        {/* Subtle Micro-Dot Grid Pattern */}
        <div
          className={`absolute inset-0 pointer-events-none ${
            isDark
              ? 'opacity-25 bg-[radial-gradient(#be123c_1px,transparent_1px)] [background-size:24px_24px]'
              : 'opacity-15 bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:24px_24px]'
          }`}
        />
      </div>

      {/* Top Left Theme Toggle */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className={`p-2.5 rounded-2xl border transition shadow-sm cursor-pointer ${
            isDark
              ? 'bg-slate-900/90 border-slate-700 text-amber-400 hover:bg-slate-800'
              : 'bg-white/90 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
          title="Ganti Tema Dark / Light Mode"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Center Auth Card: High-performance crisp surface */}
      <div className="w-full max-w-md relative z-10 my-8">
        <div
          className={`rounded-3xl p-6 sm:p-8 shadow-xl border transition-colors duration-200 ${
            isDark
              ? 'bg-slate-900/95 border-slate-800 text-white shadow-rose-950/20'
              : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-200/60'
          }`}
        >
          {/* Header Brand */}
          <div className="flex flex-col items-center text-center mb-5">
            <BrandLogo size="lg" className="mb-2 justify-center" />
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              STO Telkom Akses Payakumbuh (Koto Nan IV)
            </p>
          </div>

          {/* Tab Switcher: Masuk vs Registrasi Teknisi */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950/80 rounded-2xl mb-5 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError('');
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                authMode === 'login'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk Sistem</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setError('');
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                authMode === 'register'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar Teknisi</span>
            </button>
          </div>

          {/* Error Message if any */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs text-center font-medium">
              {error}
            </div>
          )}

          {/* MODE 1: LOGIN FORM */}
          {authMode === 'login' ? (
            <LoginForm
              key={registeredEmail || 'login-form'}
              onSubmit={handleLogin}
              loading={loading}
              onSwitchRegister={() => {
                setAuthMode('register');
                setError('');
              }}
              isDark={isDark}
              initialEmail={registeredEmail}
            />
          ) : (
            <RegisterForm
              onSubmit={handleRegister}
              loading={loading}
              onSwitchLogin={() => {
                setAuthMode('login');
                setError('');
              }}
              isDark={isDark}
            />
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

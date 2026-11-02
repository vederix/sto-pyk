import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider, useApp } from './context/AppContext';
import SplashScreen from './components/SplashScreen';
import Snackbar from './components/Snackbar';
import ErrorBoundary from './components/ErrorBoundary';

// Code-splitting via dynamic imports (Lazy Loading)
const Login = lazy(() => import('./pages/Login'));
const DashboardPimpinan = lazy(() => import('./pages/DashboardPimpinan'));
const DashboardTeknisi = lazy(() => import('./pages/DashboardTeknisi'));
const GudangDashboard = lazy(() => import('./pages/GudangDashboard'));
const AuditReportPage = lazy(() => import('./pages/AuditReportPage'));
const TiketDetailPage = lazy(() => import('./pages/TiketDetailPage'));

// Lightweight Page Loading Fallback (Responsive & Minimal Overhead)
function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-200">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-red-600 border-t-transparent shadow-lg shadow-red-600/20" />
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          Memuat Sistem STO...
        </span>
      </div>
    </div>
  );
}

function AppContent() {
  const { notification, setNotification } = useApp();
  const [showSplash, setShowSplash] = useState(() => {
    // Show splash screen on first visit in the browser session
    const seen = sessionStorage.getItem('sto_splash_seen');
    return !seen;
  });

  const handleSplashFinish = () => {
    sessionStorage.setItem('sto_splash_seen', 'true');
    setShowSplash(false);
  };

  return (
    <ErrorBoundary>
      {showSplash && (
        <SplashScreen onFinish={handleSplashFinish} duration={1900} />
      )}

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard-pimpinan" element={<DashboardPimpinan />} />
          <Route path="/dashboard-teknisi" element={<DashboardTeknisi />} />
          <Route path="/dashboard-gudang" element={<GudangDashboard />} />
          <Route path="/laporan-audit" element={<AuditReportPage />} />
          <Route path="/tiket/:id" element={<TiketDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      <Snackbar
        notification={notification}
        onClose={() => setNotification(null)}
      />
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}

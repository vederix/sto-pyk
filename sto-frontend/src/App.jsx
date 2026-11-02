import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider, useApp } from './context/AppContext';
import SplashScreen from './components/SplashScreen';
import Snackbar from './components/Snackbar';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';

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

// Role-aware sub-route dispatchers for dedicated URLs
function TasksDispatcher() {
  let user = null;
  try {
    const raw = localStorage.getItem('user');
    if (raw) user = JSON.parse(raw);
  } catch {}

  if (user?.role === 'teknisi') {
    return <DashboardTeknisi defaultTab="tiket" />;
  }
  if (user?.role === 'gudang') {
    return <GudangDashboard defaultTab="output-barang" />;
  }
  return <DashboardPimpinan defaultTab="kelola-tugas" />;
}

function MaterialsDispatcher() {
  let user = null;
  try {
    const raw = localStorage.getItem('user');
    if (raw) user = JSON.parse(raw);
  } catch {}

  if (user?.role === 'gudang') {
    return <GudangDashboard defaultTab="daftar-barang" />;
  }
  if (user?.role === 'teknisi') {
    return <DashboardTeknisi defaultTab="surat-permohonan" />;
  }
  return <DashboardPimpinan defaultTab="laporan-gudang" />;
}

function ApprovalDispatcher() {
  let user = null;
  try {
    const raw = localStorage.getItem('user');
    if (raw) user = JSON.parse(raw);
  } catch {}

  if (user?.role === 'teknisi') {
    return <DashboardTeknisi defaultTab="status-approval" />;
  }
  if (user?.role === 'gudang') {
    return <GudangDashboard defaultTab="output-barang" />;
  }
  return <DashboardPimpinan defaultTab="approval" />;
}

function SmartCatchAll() {
  let user = null;
  try {
    const raw = localStorage.getItem('user');
    if (raw) user = JSON.parse(raw);
  } catch {}

  if (user?.role === 'teknisi') return <Navigate to="/dashboard-teknisi" replace />;
  if (user?.role === 'gudang') return <Navigate to="/dashboard-gudang" replace />;
  if (user?.role === 'pimpinan') return <Navigate to="/dashboard-pimpinan" replace />;

  return <Navigate to="/login" replace />;
}

function AppContent() {
  const { notification, setNotification } = useApp();
  const [showSplash, setShowSplash] = useState(() => {
    // Show splash screen only on first visit in the browser session
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
          {/* Public Authentication Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* Core Protected Role Dashboards */}
          <Route
            path="/dashboard-pimpinan"
            element={
              <ProtectedRoute allowedRoles={['pimpinan']}>
                <DashboardPimpinan />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard-teknisi"
            element={
              <ProtectedRoute allowedRoles={['teknisi']}>
                <DashboardTeknisi />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard-gudang"
            element={
              <ProtectedRoute allowedRoles={['gudang']}>
                <GudangDashboard />
              </ProtectedRoute>
            }
          />

          {/* Sub-Pages & URL Aliases (Preserve views across refresh) */}
          <Route
            path="/technicians"
            element={
              <ProtectedRoute allowedRoles={['pimpinan']}>
                <DashboardPimpinan defaultTab="kelola-pegawai" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pegawai"
            element={
              <ProtectedRoute allowedRoles={['pimpinan']}>
                <DashboardPimpinan defaultTab="kelola-pegawai" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/materials"
            element={
              <ProtectedRoute>
                <MaterialsDispatcher />
              </ProtectedRoute>
            }
          />
          <Route
            path="/barang"
            element={
              <ProtectedRoute>
                <MaterialsDispatcher />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tracking"
            element={
              <ProtectedRoute allowedRoles={['pimpinan']}>
                <DashboardPimpinan defaultTab="tracking" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/webgis"
            element={
              <ProtectedRoute allowedRoles={['pimpinan']}>
                <DashboardPimpinan defaultTab="tracking" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <TasksDispatcher />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kelola-tugas"
            element={
              <ProtectedRoute>
                <TasksDispatcher />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tugas"
            element={
              <ProtectedRoute>
                <TasksDispatcher />
              </ProtectedRoute>
            }
          />

          <Route
            path="/approval"
            element={
              <ProtectedRoute>
                <ApprovalDispatcher />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tabel-odp"
            element={
              <ProtectedRoute allowedRoles={['pimpinan']}>
                <DashboardPimpinan defaultTab="tabel-odp" />
              </ProtectedRoute>
            }
          />

          {/* Dedicated Sub-Pages */}
          <Route
            path="/laporan-audit"
            element={
              <ProtectedRoute>
                <AuditReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tiket/:id"
            element={
              <ProtectedRoute>
                <TiketDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Smart Catch-All for unknown routes */}
          <Route path="*" element={<SmartCatchAll />} />
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

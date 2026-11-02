import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

/**
 * ProtectedRoute Component
 * Prevents unauthorized access and protects deep routes from premature redirects during refresh.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const { currentUser } = useApp();

  // 1. Read authentication session safely (context -> localStorage fallback)
  let user = currentUser;
  if (!user) {
    try {
      const saved = localStorage.getItem('user');
      if (saved) {
        user = JSON.parse(saved);
      }
    } catch {
      user = null;
    }
  }

  // 2. Unauthenticated: Store intended destination and redirect to login
  if (!user) {
    sessionStorage.setItem('sto_redirect_after_login', location.pathname + location.search);
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 3. Role Restriction Check
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Gracefully redirect to the user's natural role dashboard instead of throwing to login
    if (user.role === 'teknisi') {
      const tTab = sessionStorage.getItem('sto_teknisi_tab');
      return <Navigate to={tTab ? `/dashboard-teknisi?tab=${tTab}` : '/dashboard-teknisi'} replace />;
    } else if (user.role === 'gudang') {
      const gTab = sessionStorage.getItem('sto_gudang_tab');
      return <Navigate to={gTab ? `/dashboard-gudang?tab=${gTab}` : '/dashboard-gudang'} replace />;
    } else {
      const pTab = sessionStorage.getItem('sto_pimpinan_tab');
      return <Navigate to={pTab ? `/dashboard-pimpinan?tab=${pTab}` : '/dashboard-pimpinan'} replace />;
    }
  }

  return children;
}


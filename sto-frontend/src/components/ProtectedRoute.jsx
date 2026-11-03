import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

/**
 * ProtectedRoute Component
 * Prevents unauthorized access, enforces role boundaries, and ensures
 * zero session leakage through browser back-forward cache (BFCache) or memory cache.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const { currentUser, setCurrentUser } = useApp();

  // 1. Read authentication session safely (Context -> localStorage fallback)
  let user = currentUser;
  if (!user) {
    try {
      const saved = localStorage.getItem('user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.id || parsed.role)) {
          user = parsed;
          // Synchronize memory state if context was empty
          if (!currentUser && typeof setCurrentUser === 'function') {
            setCurrentUser(parsed);
          }
        }
      }
    } catch {
      user = null;
    }
  }

  // 2. Active BFCache (Back-Forward Cache) & Window Focus Invalidation:
  // When a user logs out and presses the browser 'Back' button, immediately detect
  // that localStorage session has been cleared and force-purge the cached view.
  useEffect(() => {
    const checkSessionIntegrity = () => {
      const rawUser = localStorage.getItem('user');
      if (!rawUser) {
        window.location.replace('/login');
      }
    };

    const handlePageShow = (event) => {
      // event.persisted is true when restored from browser BFCache
      if (event.persisted) {
        checkSessionIntegrity();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', checkSessionIntegrity);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', checkSessionIntegrity);
    };
  }, []);

  // 3. Unauthenticated Check: Must have a valid user and valid role
  if (!user || !user.role) {
    // Store intended destination only if not already on login
    if (location.pathname !== '/' && location.pathname !== '/login') {
      sessionStorage.setItem('sto_redirect_after_login', location.pathname + location.search);
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 4. Role Restriction Check
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (user.role === 'teknisi') {
      const tTab = sessionStorage.getItem('sto_teknisi_tab');
      return <Navigate to={tTab ? `/dashboard-teknisi?tab=${tTab}` : '/dashboard-teknisi'} replace />;
    } else if (user.role === 'gudang') {
      const gTab = sessionStorage.getItem('sto_gudang_tab');
      return <Navigate to={gTab ? `/dashboard-gudang?tab=${gTab}` : '/dashboard-gudang'} replace />;
    } else if (user.role === 'pimpinan') {
      const pTab = sessionStorage.getItem('sto_pimpinan_tab');
      return <Navigate to={pTab ? `/dashboard-pimpinan?tab=${pTab}` : '/dashboard-pimpinan'} replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
}

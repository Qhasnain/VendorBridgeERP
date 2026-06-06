import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { EnterpriseLayout } from './components/EnterpriseLayout';

// Lazy load named page exports
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Vendors = lazy(() => import('./pages/Vendors').then(m => ({ default: m.Vendors })));
const Rfqs = lazy(() => import('./pages/Rfqs').then(m => ({ default: m.Rfqs })));
const Comparison = lazy(() => import('./pages/Comparison').then(m => ({ default: m.Comparison })));
const Approvals = lazy(() => import('./pages/Approvals').then(m => ({ default: m.Approvals })));
const PurchaseOrders = lazy(() => import('./pages/PurchaseOrders').then(m => ({ default: m.PurchaseOrders })));
const Invoices = lazy(() => import('./pages/Invoices').then(m => ({ default: m.Invoices })));
const AuditLogs = lazy(() => import('./pages/AuditLogs').then(m => ({ default: m.AuditLogs })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <EnterpriseLayout>{children}</EnterpriseLayout>;
};

const AppRoutes: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <Routes>
        {/* Auth Portal */}
        <Route path="/login" element={<Login />} />

        {/* Internal Protected ERP Modules */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/vendors" element={<ProtectedRoute><Vendors /></ProtectedRoute>} />
        <Route path="/rfqs" element={<ProtectedRoute><Rfqs /></ProtectedRoute>} />
        <Route path="/comparison" element={<ProtectedRoute><Comparison /></ProtectedRoute>} />
        <Route path="/approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
        <Route path="/pos" element={<ProtectedRoute><PurchaseOrders /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
        <Route path="/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />

        {/* Default Fallbacks */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

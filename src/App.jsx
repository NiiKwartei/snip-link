// ─────────────────────────────────────────────────
//  snip.link — App Root
// ─────────────────────────────────────────────────

import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import LinksPage from "./pages/LinksPage";
import LinkDetail from "./pages/LinkDetail";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="links" element={<LinksPage />} />
        <Route path="links/:shortCode" element={<LinkDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="grain-overlay" />
      <div className="glow-orange" />
      <div className="glow-cyan" />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#18181b",
            color: "#e4e4e7",
            border: "1px solid rgba(255,255,255,0.08)",
            fontFamily: "'DM Mono', monospace",
            fontSize: "13px",
          },
        }}
      />
      <AppRoutes />
    </AuthProvider>
  );
}

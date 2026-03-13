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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
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

// ─────────────────────────────────────────────────
//  snip.link — Layout
// ─────────────────────────────────────────────────

import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Zap, LayoutDashboard, Link2, LogOut, User } from "lucide-react";

function SidebarLink({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
        ${isActive
          ? "bg-brand-500/15 text-brand-500"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
        }`
      }
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="relative z-10 min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/[0.06] bg-surface-0/80 backdrop-blur-xl flex flex-col fixed h-screen">
        {/* Logo */}
        <div className="px-6 py-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-mono text-lg font-medium tracking-tight">snip.link</span>
          <div className="flex items-center gap-1.5 ml-2">
            <div className="live-dot" />
            <span className="text-[11px] text-green-500 font-mono">LIVE</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" end />
          <SidebarLink to="/links" icon={Link2} label="Links" />
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
              <User size={14} className="text-brand-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-zinc-300 truncate">
                {user?.name || user?.email}
              </div>
              <div className="text-xs text-zinc-600 truncate">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}

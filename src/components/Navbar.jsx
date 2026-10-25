import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Shield, Smartphone, Building2, Blocks, Cpu, Sparkles, RefreshCw, Layers, Landmark, UserCircle, FileCheck, LogOut } from 'lucide-react';
import { useAuth } from '../lib/authContext';

export default function Navbar({ onResetDemo }) {
  const navigate = useNavigate();
  const { currentRole, currentUser, logout } = useAuth();

  const navItems = [
    { to: '/wallet', label: 'Resident Wallet', icon: Smartphone, badge: 'PWA Holder' },
    { to: '/documents', label: 'Gov Ingestion', icon: FileCheck, badge: 'AI Verified' },
    { to: '/verifier', label: 'City Verifier', icon: Building2, badge: 'OpenID4VP' },
    { to: '/blockchain', label: 'Trust On-Chain', icon: Blocks, badge: 'Hardhat L2' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070a12]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <Link to="/wallet" className="flex items-center space-x-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-black" strokeWidth={2.5} />
              <div className="absolute -inset-1 rounded-xl bg-cyan-400 opacity-20 blur-sm -z-10 animate-pulse"></div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white font-mono">
                  Shroud<span className="text-cyan-400">IT</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-mono font-semibold uppercase tracking-wider">
                  ChronoForge 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden lg:block">
                Prove one fact to one service. Nobody can connect it to anything else you do.
              </p>
            </div>
          </Link>

          {/* Navigation Links with Active State */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span className="hidden sm:inline font-semibold">{item.label}</span>
                      {item.to === '/auditor' && (
                        <span className="relative flex h-2 w-2 ml-1">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Status Indicator & Persona Switcher */}
          <div className="flex items-center space-x-2">
            <Link
              to="/wallet"
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-cyan-500/60 hover:bg-slate-800 transition-all text-xs"
              title="Citizen Identity & Enclave Portal"
            >
              <UserCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-semibold text-slate-200 truncate max-w-[130px] hidden sm:inline">
                {currentUser?.name || "Citizen Sign In"}
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase ${
                currentUser?.isGovernmentVerified
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-cyan-950 text-cyan-300 border-cyan-800'
              }`}>
                {currentUser?.isGovernmentVerified ? 'Verified' : currentRole}
              </span>
            </Link>

            {currentUser && (
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-rose-500/60 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 transition-all"
                title="Log Out of Citizen Account"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="hidden lg:flex items-center space-x-2 pl-2 border-l border-slate-800 text-[11px] font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Epoch #142</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

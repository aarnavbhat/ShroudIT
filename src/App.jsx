import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import WalletPage from './pages/WalletPage';
import VerifierPage from './pages/VerifierPage';
import BlockchainPage from './pages/BlockchainPage';
import AuditorPage from './pages/AuditorPage';
import { Camera, Sparkles, Shield, ArrowRight } from 'lucide-react';

export default function App() {
  const [bannerDismissed, setBannerDismissed] = useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#070a12] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
        {/* Top Navbar */}
        <Navbar />

        {/* Screenshot & Hackathon Guide Banner */}
        {!bannerDismissed && (
          <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-purple-950/60 border-b border-cyan-800/40 px-4 py-2.5 text-xs">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center space-x-2 text-slate-300">
                <Camera className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  <strong className="text-white">Screenshot Ready:</strong> Each screen now has its own dedicated page at:
                  <Link to="/wallet" className="text-cyan-300 font-mono underline ml-1 hover:text-white">/wallet</Link>, 
                  <Link to="/verifier" className="text-emerald-300 font-mono underline ml-1 hover:text-white">/verifier</Link>, 
                  <Link to="/blockchain" className="text-purple-300 font-mono underline ml-1 hover:text-white">/blockchain</Link>, and 
                  <Link to="/auditor" className="text-amber-300 font-mono underline ml-1 hover:text-white">/auditor</Link>.
                </span>
              </div>
              <button
                onClick={() => setBannerDismissed(true)}
                className="text-slate-400 hover:text-white text-[11px] font-mono underline shrink-0"
              >
                Hide Banner
              </button>
            </div>
          </div>
        )}

        {/* Main Routed Page Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/wallet" replace />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/verifier" element={<VerifierPage />} />
            <Route path="/blockchain" element={<BlockchainPage />} />
            <Route path="/auditor" element={<AuditorPage />} />
            <Route path="*" element={<Navigate to="/wallet" replace />} />
          </Routes>
        </main>

        {/* Cyber Footer */}
        <footer className="border-t border-slate-800/80 bg-[#070a12]/80 mt-12 py-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px]">
            <div className="flex items-center space-x-2">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-300 font-semibold">ShroudIT</span>
              <span>— ChronoForge Proposal Screening Prototype (Cybersecurity Track)</span>
            </div>
            <div className="flex items-center space-x-4 text-slate-400">
              <span>Theme: Cities of the Future</span>
              <span>•</span>
              <span>DPDP Act 2023 Aligned</span>
              <span>•</span>
              <span>IETF CFRG BBS+ Signatures</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

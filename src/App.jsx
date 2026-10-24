import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './lib/authContext';
import Navbar from './components/Navbar';
import JudgeTourBanner from './components/JudgeTourBanner';
import WalletPage from './pages/WalletPage';
import VerifierPage from './pages/VerifierPage';
import BlockchainPage from './pages/BlockchainPage';
import AuditorPage from './pages/AuditorPage';
import LoginPage from './pages/LoginPage';
import IssuerStudioPage from './pages/IssuerStudioPage';
import { Shield } from 'lucide-react';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-[#070a12] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
          {/* Top Navbar */}
          <Navbar />

          {/* Hackathon Judge Walkthrough Guide Ribbon */}
          <JudgeTourBanner />

          {/* Main Routed Page Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<Navigate to="/wallet" replace />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/verifier" element={<VerifierPage />} />
              <Route path="/blockchain" element={<BlockchainPage />} />
              <Route path="/auditor" element={<AuditorPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/issuer" element={<IssuerStudioPage />} />
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
      </AuthProvider>
    </BrowserRouter>
  );
}

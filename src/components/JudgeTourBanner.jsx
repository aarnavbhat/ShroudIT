import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  Smartphone, 
  Building2, 
  Blocks, 
  Cpu, 
  X,
  CheckCircle2,
  Play
} from 'lucide-react';

export default function JudgeTourBanner() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const tourSteps = [
    {
      num: 1,
      path: '/wallet',
      title: 'Hold & Disclose',
      subtitle: 'ZK Selective Disclosure & Dynamic QR',
      icon: Smartphone,
      color: 'cyan'
    },
    {
      num: 2,
      path: '/verifier',
      title: 'Scan & Verify',
      subtitle: 'Camera QR Ingestion & Anti-Replay',
      icon: Building2,
      color: 'emerald'
    },
    {
      num: 3,
      path: '/blockchain',
      title: 'Audit Trust',
      subtitle: 'Accreditation & Epoch Merkle Roots',
      icon: Blocks,
      color: 'purple'
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="bg-gradient-to-r from-cyan-950/70 via-slate-900 to-purple-950/70 border-b border-cyan-800/40 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Title */}
        <div className="flex items-center space-x-2 text-slate-200">
          <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-white uppercase tracking-wider text-[11px] font-mono">
            Hackathon Judge Tour:
          </span>
          <span className="text-slate-400 hidden sm:inline text-[11px]">
            Follow the 4-step proof pipeline
          </span>
        </div>

        {/* 4 Steps Nav */}
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-1 max-w-full">
          {tourSteps.map((step, idx) => {
            const isActive = location.pathname === step.path;
            const Icon = step.icon;

            return (
              <React.Fragment key={step.path}>
                <Link
                  to={step.path}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 ${
                    isActive
                      ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono ${
                    isActive ? 'bg-black text-cyan-400 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {step.num}
                  </span>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{step.title}</span>
                </Link>

                {idx < tourSteps.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 shrink-0 self-end md:self-auto"
          title="Dismiss tour banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

import React from 'react';
import { Shield, Train, BadgePercent, Award, CheckCircle2, ChevronRight, EyeOff, Lock, Check } from 'lucide-react';

export default function CredentialCard({ 
  credential, 
  isSelected, 
  onSelect, 
  selectedPredicates, 
  onTogglePredicate,
  onOpenExplainer 
}) {
  const iconMap = {
    Shield,
    Train,
    BadgePercent,
    Award
  };
  const IconComponent = iconMap[credential.icon] || Shield;

  const colorStyles = {
    cyan: {
      gradient: "from-cyan-500/15 via-blue-500/5 to-transparent",
      border: "border-cyan-500/40",
      accent: "text-cyan-400",
      glow: "shadow-cyan-500/10",
      badge: "bg-cyan-950/80 text-cyan-300 border-cyan-800"
    },
    emerald: {
      gradient: "from-emerald-500/15 via-teal-500/5 to-transparent",
      border: "border-emerald-500/40",
      accent: "text-emerald-400",
      glow: "shadow-emerald-500/10",
      badge: "bg-emerald-950/80 text-emerald-300 border-emerald-800"
    },
    amber: {
      gradient: "from-amber-500/15 via-orange-500/5 to-transparent",
      border: "border-amber-500/40",
      accent: "text-amber-400",
      glow: "shadow-amber-500/10",
      badge: "bg-amber-950/80 text-amber-300 border-amber-800"
    },
    violet: {
      gradient: "from-violet-500/15 via-purple-500/5 to-transparent",
      border: "border-violet-500/40",
      accent: "text-violet-400",
      glow: "shadow-violet-500/10",
      badge: "bg-violet-950/80 text-violet-300 border-violet-800"
    }
  };

  const currentTheme = colorStyles[credential.badgeColor] || colorStyles.cyan;

  return (
    <div 
      className={`relative rounded-2xl border transition-all duration-300 overflow-hidden holo-card bg-[#0b101c]/90 ${
        isSelected 
          ? `${currentTheme.border} shadow-xl ${currentTheme.glow} ring-1 ring-cyan-500/30` 
          : 'border-slate-800 hover:border-slate-700 hover:bg-[#0d1424]'
      }`}
    >
      {/* Background ambient gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentTheme.gradient} pointer-events-none`}></div>

      {/* Card Header & Chip */}
      <div className="p-5 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl bg-slate-900 border border-slate-700/60 ${currentTheme.accent}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${currentTheme.badge}`}>
                {credential.category}
              </span>
              <h4 className="text-base font-semibold text-white mt-1">{credential.title}</h4>
              <p className="text-xs text-slate-400">{credential.subtitle}</p>
            </div>
          </div>

          {/* Microchip graphic */}
          <div className="hidden sm:flex flex-col items-end">
            <div className="w-9 h-7 rounded border border-amber-400/40 bg-gradient-to-tr from-amber-500/20 to-yellow-300/10 flex flex-col justify-center px-1">
              <div className="h-0.5 bg-amber-400/50 mb-1"></div>
              <div className="h-0.5 bg-amber-400/50"></div>
            </div>
            <span className="text-[9px] font-mono text-slate-500 mt-1">BBS+ ED25519</span>
          </div>
        </div>

        {/* Card Metadata info strip */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-mono block">Holder Name</span>
            <span className="font-medium text-slate-200">{credential.rawData.fullName || credential.rawData.studentName || credential.rawData.holderName}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-mono block">Status</span>
            <span className="inline-flex items-center text-emerald-400 font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              {credential.status}
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-mono block">Expiry</span>
            <span className="font-mono text-slate-300 text-[11px]">{credential.expiryDate}</span>
          </div>
        </div>

        {/* Interactive Selective Disclosure Predicates Section */}
        <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center space-x-1.5">
              <EyeOff className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-200">Selective Disclosure Predicates</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Zero PII Leaked</span>
          </div>

          <div className="space-y-2">
            {credential.predicates.map((p) => {
              const isChecked = selectedPredicates.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePredicate(p.id);
                  }}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border text-xs ${
                    isChecked
                      ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                      isChecked ? 'bg-cyan-500 border-cyan-400 text-black' : 'border-slate-600 bg-slate-800'
                    }`}>
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <span className="font-medium">{p.label}</span>
                      <span className="block text-[10px] text-slate-500">{p.statement}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    ZK-Proof
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="mt-4 flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenExplainer(credential);
            }}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center space-x-1"
          >
            <span>Explain Privacy Guarantee</span>
            <ChevronRight className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={() => onSelect(credential)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
              isSelected
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isSelected ? 'Active for Presentation' : 'Select Card'}
          </button>
        </div>
      </div>
    </div>
  );
}

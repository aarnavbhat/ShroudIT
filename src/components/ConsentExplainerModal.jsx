import React, { useState } from 'react';
import { Shield, Check, X, Globe, Sparkles, AlertCircle, FileCheck } from 'lucide-react';
import { generateContextualConsentNotice } from '../lib/firewallEngine';

export default function ConsentExplainerModal({ isOpen, onClose, verifierName, requestedPredicateLabels, onAuthorize }) {
  const [lang, setLang] = useState('en');

  if (!isOpen) return null;

  const t = generateContextualConsentNotice({
    lang,
    verifierName: verifierName || 'Bengaluru City Central Library',
    requestedPredicateLabels: requestedPredicateLabels || ['Age ≥ 18', 'Bengaluru Resident']
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl glass-panel-glow bg-[#0b101d] border border-cyan-500/30 p-6 shadow-2xl shadow-cyan-950/50">
        {/* Language Selector */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">{t.title}</h3>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                {t.badge}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                lang === 'en' ? 'bg-cyan-500 text-black font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('kn')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                lang === 'kn' ? 'bg-cyan-500 text-black font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              ಕನ್ನಡ
            </button>
            <button
              onClick={() => setLang('hi')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                lang === 'hi' ? 'bg-cyan-500 text-black font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>

        {/* Verifier & Request Details */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Requesting Authority:</span>
            <span className="text-cyan-300 font-medium">{t.verifierTitle}</span>
          </div>
          <div className="flex items-start justify-between text-xs">
            <span className="text-slate-400">Zero-Knowledge Predicates:</span>
            <div className="flex flex-wrap gap-1 justify-end max-w-[65%]">
              {t.predicatesList.map((p, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono text-[11px]">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* AI Explainer Statement */}
        <div className="mt-4 p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs text-slate-300 leading-relaxed">
          {t.summary}
        </div>

        {/* 3 Pillars */}
        <div className="mt-4 space-y-2.5">
          {t.points.map((pt, i) => (
            <div key={i} className="flex items-start space-x-3 p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/80 text-xs">
              <div className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3" />
              </div>
              <div>
                <p className="font-semibold text-slate-200">{pt.title}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">{pt.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            {t.cancelButton}
          </button>
          <button
            onClick={() => {
              if (onAuthorize) onAuthorize();
              onClose();
            }}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold text-xs shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all"
          >
            <Shield className="w-4 h-4" />
            <span>{t.actionButton}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

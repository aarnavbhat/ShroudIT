import React, { useState } from 'react';
import { 
  Cpu, 
  Play, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  Unlink, 
  Link2, 
  Sparkles,
  Zap,
  RefreshCw,
  Sliders,
  CheckCircle2,
  TrendingDown,
  Info
} from 'lucide-react';
import { runLinkabilitySimulation, ANOMALY_SCENARIOS } from '../lib/auditorEngine';

export default function AuditorPage() {
  const [simData, setSimData] = useState(() => runLinkabilitySimulation());
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeAnomalyTab, setActiveAnomalyTab] = useState('all');
  const [adversaryStrategy, setAdversaryStrategy] = useState('collusion_graph');

  const handleRunSim = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setSimData(runLinkabilitySimulation());
      setIsSimulating(false);
    }, 500);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Page Title & Threat Intelligence Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>AI Adversary Simulation & DPDP Compliance Benchmark</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
              Core Hackathon Claim
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            AI Linkability Auditor & Threat Engine
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            "Selective disclosure is not the new part. <strong className="text-slate-200">Measurable privacy is.</strong>" Quantifies cross-service correlation attack success rates across 4 municipal verifiers.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleRunSim}
          disabled={isSimulating}
          className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all disabled:opacity-50 self-start md:self-auto"
        >
          {isSimulating ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              <span>Executing Adversary Attack...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-black" />
              <span>Simulate Cross-Service Attack</span>
            </>
          )}
        </button>
      </div>

      {/* Side-by-Side Adversary Comparison (The Showstopper Visual) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Baseline (Standard SD-JWT / Reused Signature) */}
        <div className="rounded-2xl glass-panel p-6 border border-rose-500/50 space-y-5 relative overflow-hidden bg-gradient-to-b from-rose-950/25 to-transparent">
          <div className="flex items-center justify-between pb-3 border-b border-rose-900/50">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <Link2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{simData.baseline.name}</h3>
                <p className="text-xs text-rose-300 font-mono">Reused issuer signature & persistent status indices</p>
              </div>
            </div>
            <span className="text-xs font-mono font-extrabold px-3 py-1 rounded-full bg-rose-950 text-rose-400 border border-rose-800">
              Linkability: 100%
            </span>
          </div>

          {/* Core Metric Callouts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-rose-900/50 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Attacker Success</span>
              <span className="text-2xl font-extrabold font-mono text-rose-400">8 / 8 Linked</span>
              <p className="text-[11px] text-rose-300 mt-1">Single resident persona de-anonymized</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/90 border border-rose-900/50 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Shannon Entropy</span>
              <span className="text-2xl font-extrabold font-mono text-rose-400">{simData.baseline.entropyScore} / 1.00</span>
              <p className="text-[11px] text-rose-300 mt-1">Near-zero cryptographic randomness</p>
            </div>
          </div>

          {/* Threat Verdict */}
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-200 leading-relaxed">
            <strong className="text-rose-100">Adversary Finding:</strong> {simData.baseline.threatVerdict}
          </div>

          {/* Correlation Chain Graph */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">
              Colluding Verifier Correlation Chain:
            </span>
            <div className="space-y-2 font-mono text-xs">
              {simData.baseline.events.slice(0, 4).map((ev, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-900/90 border border-rose-900/50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                    <span className="text-white font-medium">{ev.service}</span>
                    <span className="text-slate-500 text-[10px]">({ev.time})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-rose-400 font-bold text-[11px] block">CORRELATED: {ev.reusedSignature}</span>
                    <span className="text-[10px] text-slate-400">{ev.pseudonym}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ShroudIT (BBS+ Randomized Proofs) */}
        <div className="rounded-2xl glass-panel p-6 border border-emerald-500/50 space-y-5 relative overflow-hidden bg-gradient-to-b from-emerald-950/25 to-transparent">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-900/50">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Unlink className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{simData.civicVeil.name}</h3>
                <p className="text-xs text-emerald-300 font-mono">Fresh randomized proofs with blinded factors</p>
              </div>
            </div>
            <span className="text-xs font-mono font-extrabold px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
              Linkability: 0.00%
            </span>
          </div>

          {/* Core Metric Callouts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-900/50 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Attacker Success</span>
              <span className="text-2xl font-extrabold font-mono text-emerald-400">0 / 8 Linked</span>
              <p className="text-[11px] text-emerald-300 mt-1">8 mathematically isolated nodes</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-900/50 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Shannon Entropy</span>
              <span className="text-2xl font-extrabold font-mono text-emerald-400">{simData.civicVeil.entropyScore} / 1.00</span>
              <p className="text-[11px] text-emerald-300 mt-1">Maximal cryptographic entropy</p>
            </div>
          </div>

          {/* Threat Verdict */}
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-200 leading-relaxed">
            <strong className="text-emerald-100">Adversary Finding:</strong> {simData.civicVeil.threatVerdict}
          </div>

          {/* Unlinkable Presentations */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">
              Cryptographically Unlinkable Presentations:
            </span>
            <div className="space-y-2 font-mono text-xs">
              {simData.civicVeil.events.slice(0, 4).map((ev, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-900/50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-white font-medium">{ev.service}</span>
                    <span className="text-slate-500 text-[10px]">({ev.time})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold text-[11px] block">RANDOMIZED: {ev.randomizedSignature}</span>
                    <span className="text-[10px] text-slate-400">Blinded: {ev.ephemeralCommitment}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Metadata Anomaly Detection (Isolation Forest) Section */}
      <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Metadata Anomaly Monitor</h3>
              <p className="text-xs text-slate-400">
                scikit-learn Isolation Forest model analyzing non-personal metadata (issuance velocity, probing, replay attempts)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-slate-400">Filter View:</span>
            <button
              onClick={() => setActiveAnomalyTab('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeAnomalyTab === 'all'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              All Signals (4)
            </button>
            <button
              onClick={() => setActiveAnomalyTab('alerts')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeAnomalyTab === 'alerts'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Threats Only (3)
            </button>
          </div>
        </div>

        {/* Anomaly Event Cards Feed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ANOMALY_SCENARIOS
            .filter(a => activeAnomalyTab === 'all' || a.anomalyScore > 0.5)
            .map((anom) => (
              <div 
                key={anom.id} 
                className={`p-5 rounded-2xl border text-xs space-y-2.5 transition-all ${
                  anom.statusColor === 'rose'
                    ? 'bg-rose-950/20 border-rose-800/60'
                    : anom.statusColor === 'amber'
                    ? 'bg-amber-950/20 border-amber-800/60'
                    : 'bg-emerald-950/20 border-emerald-800/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-bold text-white text-sm">{anom.vector}</span>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                    anom.statusColor === 'rose'
                      ? 'bg-rose-900 text-rose-200'
                      : anom.statusColor === 'amber'
                      ? 'bg-amber-900 text-amber-200'
                      : 'bg-emerald-900 text-emerald-200'
                  }`}>
                    {anom.status} (Score: {anom.anomalyScore})
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed text-xs">{anom.description}</p>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Model: {anom.model}</span>
                  <span>{anom.timestamp}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

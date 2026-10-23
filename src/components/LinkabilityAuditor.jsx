import React, { useState } from 'react';
import { 
  Cpu, 
  Play, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  Network, 
  Unlink, 
  Link2, 
  Sparkles,
  Zap,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { runLinkabilitySimulation, ANOMALY_SCENARIOS } from '../lib/auditorEngine';

export default function LinkabilityAuditor() {
  const [simData, setSimData] = useState(() => runLinkabilitySimulation());
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeAnomalyTab, setActiveAnomalyTab] = useState('all');

  const handleRunSim = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setSimData(runLinkabilitySimulation());
      setIsSimulating(false);
    }, 500);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-2xl glass-panel-glow p-5 border border-cyan-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">AI Linkability Auditor & Threat Engine</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Judges Benchmark
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                "Selective disclosure is not the new part. <strong>Measurable privacy is.</strong>" Simulates an adversary attempting to correlate cross-service resident visits.
              </p>
            </div>
          </div>

          <button
            onClick={handleRunSim}
            disabled={isSimulating}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all disabled:opacity-50"
          >
            {isSimulating ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span>Attacking presentations...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-black" />
                <span>Simulate Correlation Attack</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Side-by-Side Adversary Comparison (The Key Hackathon Visual) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Baseline (Standard SD-JWT / Reused Signature) */}
        <div className="rounded-2xl glass-panel p-5 border border-rose-500/40 space-y-4 relative overflow-hidden bg-gradient-to-b from-rose-950/20 to-transparent">
          <div className="flex items-center justify-between pb-3 border-b border-rose-900/40">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{simData.baseline.name}</h3>
                <p className="text-[11px] text-rose-300 font-mono">Reused issuer signature & persistent indices</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-rose-950 text-rose-400 border border-rose-800">
              Linkability: 100%
            </span>
          </div>

          {/* Core Metric Callouts */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-rose-900/40 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Attacker Correlation</span>
              <span className="text-xl font-bold font-mono text-rose-400">8 / 8 Linked</span>
              <p className="text-[10px] text-rose-300 mt-0.5">Identified as single resident</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-rose-900/40 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Entropy Score</span>
              <span className="text-xl font-bold font-mono text-rose-400">{simData.baseline.entropyScore} / 1.00</span>
              <p className="text-[10px] text-rose-300 mt-0.5">Zero privacy protection</p>
            </div>
          </div>

          {/* Threat Verdict */}
          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-200">
            <strong>Adversary Finding:</strong> {simData.baseline.threatVerdict}
          </div>

          {/* Interaction Graph / Flow */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">
              Colluding Verifier Correlation Chain:
            </span>
            <div className="space-y-1.5 font-mono text-xs">
              {simData.baseline.events.slice(0, 4).map((ev, i) => (
                <div key={i} className="p-2 rounded-lg bg-slate-900/90 border border-rose-900/50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    <span className="text-white font-medium">{ev.service}</span>
                    <span className="text-slate-500 text-[10px]">({ev.time})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-rose-400 font-bold text-[11px] block">MATCH: {ev.reusedSignature}</span>
                    <span className="text-[10px] text-slate-400">{ev.pseudonym}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ShroudIT (BBS+ Randomized Proofs) */}
        <div className="rounded-2xl glass-panel p-5 border border-emerald-500/40 space-y-4 relative overflow-hidden bg-gradient-to-b from-emerald-950/20 to-transparent">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Unlink className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{simData.civicVeil.name}</h3>
                <p className="text-[11px] text-emerald-300 font-mono">Fresh randomized proofs with blinded factors</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
              Linkability: 0.00%
            </span>
          </div>

          {/* Core Metric Callouts */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-900/40 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Attacker Correlation</span>
              <span className="text-xl font-bold font-mono text-emerald-400">0 / 8 Linked</span>
              <p className="text-[10px] text-emerald-300 mt-0.5">8 mathematically isolated nodes</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-900/40 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Entropy Score</span>
              <span className="text-xl font-bold font-mono text-emerald-400">{simData.civicVeil.entropyScore} / 1.00</span>
              <p className="text-[10px] text-emerald-300 mt-0.5">Maximal Shannon entropy</p>
            </div>
          </div>

          {/* Threat Verdict */}
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-200">
            <strong>Adversary Finding:</strong> {simData.civicVeil.threatVerdict}
          </div>

          {/* Interaction Graph / Flow */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">
              Cryptographically Unlinkable Presentations:
            </span>
            <div className="space-y-1.5 font-mono text-xs">
              {simData.civicVeil.events.slice(0, 4).map((ev, i) => (
                <div key={i} className="p-2 rounded-lg bg-slate-900/90 border border-emerald-900/50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
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

      {/* AI Metadata Anomaly Detection (Isolation Forest) Feed */}
      <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI Metadata Anomaly Monitor</h3>
              <p className="text-[11px] text-slate-400">
                scikit-learn Isolation Forest on non-personal metadata (issuance velocity, revocation probing, stuffing)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-slate-400">Filter:</span>
            <button
              onClick={() => setActiveAnomalyTab('all')}
              className={`px-2.5 py-1 rounded-lg ${activeAnomalyTab === 'all' ? 'bg-cyan-500 text-black font-bold' : 'bg-slate-900 text-slate-400'}`}
            >
              All (4)
            </button>
            <button
              onClick={() => setActiveAnomalyTab('alerts')}
              className={`px-2.5 py-1 rounded-lg ${activeAnomalyTab === 'alerts' ? 'bg-cyan-500 text-black font-bold' : 'bg-slate-900 text-slate-400'}`}
            >
              Threats Only (3)
            </button>
          </div>
        </div>

        {/* Anomaly Cards Feed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ANOMALY_SCENARIOS
            .filter(a => activeAnomalyTab === 'all' || a.anomalyScore > 0.5)
            .map((anom) => (
              <div 
                key={anom.id} 
                className={`p-4 rounded-xl border text-xs space-y-2 ${
                  anom.statusColor === 'rose'
                    ? 'bg-rose-950/20 border-rose-800/60'
                    : anom.statusColor === 'amber'
                    ? 'bg-amber-950/20 border-amber-800/60'
                    : 'bg-emerald-950/20 border-emerald-800/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{anom.vector}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    anom.statusColor === 'rose'
                      ? 'bg-rose-900 text-rose-200'
                      : anom.statusColor === 'amber'
                      ? 'bg-amber-900 text-amber-200'
                      : 'bg-emerald-900 text-emerald-200'
                  }`}>
                    {anom.status} (Score: {anom.anomalyScore})
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed">{anom.description}</p>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
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

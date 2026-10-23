import React, { useState } from 'react';
import { 
  Blocks, 
  ShieldCheck, 
  Layers, 
  FileSpreadsheet, 
  Binary, 
  GitCommit, 
  CheckCircle2, 
  ExternalLink,
  Search,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ON_CHAIN_REGISTRY } from '../lib/mockData';
import { buildMerkleTree } from '../lib/cryptoSim';

export default function BlockchainView() {
  const [activeSubTab, setActiveSubTab] = useState('issuers');
  const [selectedLeafIndex, setSelectedLeafIndex] = useState(0);

  // Sample leaves for the interactive Merkle tree
  const sampleLeaves = [
    "Aarav_S_Rao:ResidentID_v2:Salt_99f2",
    "BMTC_Transit:StudentConcession_2026:Salt_41bc",
    "Welfare_Directorate:PHH_Eligibility:Salt_77da",
    "KDEM_Academy:Cybersec_Cert_Distinction:Salt_12ee"
  ];
  const tree = buildMerkleTree(sampleLeaves);
  const inclusionProof = tree.getInclusionProof(selectedLeafIndex);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Network Header & Key Stat Bar */}
      <div className="rounded-2xl glass-panel p-5 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
              <Blocks className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">{ON_CHAIN_REGISTRY.network}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                  Tamper-Evident
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Public anchor for non-personal trust data: Issuer public keys, epoch revocation roots, and issuance logs.
              </p>
            </div>
          </div>

          {/* Ledger stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div className="p-2 sm:px-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="block text-[10px] text-slate-500 uppercase font-mono">Block</span>
              <span className="text-sm sm:text-base font-bold text-cyan-400 font-mono">#{ON_CHAIN_REGISTRY.latestBlock}</span>
            </div>
            <div className="p-2 sm:px-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="block text-[10px] text-slate-500 uppercase font-mono">On-Chain PII</span>
              <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono">0 Bytes</span>
            </div>
            <div className="p-2 sm:px-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="block text-[10px] text-slate-500 uppercase font-mono">Epoch Root</span>
              <span className="text-sm sm:text-base font-bold text-purple-400 font-mono">#{ON_CHAIN_REGISTRY.currentEpoch}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('issuers')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'issuers'
              ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Accredited Issuers & Schemas</span>
        </button>

        <button
          onClick={() => setActiveSubTab('revocation')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'revocation'
              ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Binary className="w-4 h-4" />
          <span>Revocation Status Roots</span>
        </button>

        <button
          onClick={() => setActiveSubTab('transparency')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'transparency'
              ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <GitCommit className="w-4 h-4" />
          <span>Issuance Transparency Log</span>
        </button>

        <button
          onClick={() => setActiveSubTab('merkle')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'merkle'
              ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Interactive Merkle Tree</span>
        </button>
      </div>

      {/* Sub-tab 1: Accredited Issuers Registry */}
      {activeSubTab === 'issuers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Public Issuer Directory & Schema Endorsements</h3>
            <span className="text-xs text-slate-400 font-mono">Contract: 0x7c92b...IssuerRegistry.sol</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ON_CHAIN_REGISTRY.issuers.map((iss, i) => (
              <div key={i} className="rounded-2xl glass-panel p-4 border border-slate-800 hover:border-slate-700 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{iss.name}</h4>
                    <span className="text-xs font-mono text-cyan-400 block mt-0.5">{iss.did}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono">
                    {iss.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Public Key:</span>
                    <span className="font-mono text-slate-200">{iss.publicKey}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Credentials Issued:</span>
                    <span className="font-mono text-cyan-300 font-bold">{iss.credentialsIssued}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Last Anchored Tx:</span>
                    <span className="font-mono text-slate-400">{iss.lastAnchoredTx}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-1">
                  {iss.schemas.map((s, idx) => (
                    <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                      schema://{s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-tab 2: Revocation Status Roots */}
      {activeSubTab === 'revocation' && (
        <div className="space-y-4">
          <div className="rounded-2xl glass-panel-glow p-5 border border-cyan-500/30 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Binary className="w-4 h-4 text-cyan-400" />
              <span>Private Epoch-Anchored Revocation Architecture</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Traditional status checks leak privacy by revealing <em>which credential</em> is being checked and <em>by whom</em>.
              ShroudIT solves this by anchoring an aggregated <strong>Merkle Status Root</strong> on-chain every epoch (6 hours).
              Verifiers download the entire root vector once, verifying non-revocation locally without making any query that identifies the resident.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500 text-[10px] font-mono uppercase block">Active Epoch</span>
              <span className="text-2xl font-bold font-mono text-white">Epoch #142</span>
              <p className="text-xs text-slate-400 mt-1">Refreshes in {ON_CHAIN_REGISTRY.epochTimeRemaining}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 md:col-span-2">
              <span className="text-slate-500 text-[10px] font-mono uppercase block">Anchored Merkle Status Root</span>
              <span className="text-xs font-mono text-cyan-300 break-all select-all block mt-1">
                {ON_CHAIN_REGISTRY.merkleRootHash}
              </span>
              <p className="text-xs text-emerald-400 mt-2 font-mono flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero Holder Tracking: Full-list bitvector download enabled</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 3: Issuance Transparency Log */}
      {activeSubTab === 'transparency' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Issuance Transparency Batches</h3>
              <p className="text-xs text-slate-400">Cryptographically committed batches to prevent silent mass issuance</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Contract: 0x991a...IssuanceLog.sol</span>
          </div>

          <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Batch ID</th>
                  <th className="p-3">Accredited Issuer</th>
                  <th className="p-3">Credentials Minted</th>
                  <th className="p-3">Batch Merkle Root</th>
                  <th className="p-3">On-Chain Tx</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-slate-300">
                {ON_CHAIN_REGISTRY.transparencyLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-white">{log.batchId}</td>
                    <td className="p-3 text-cyan-400">{log.issuer}</td>
                    <td className="p-3">{log.count}</td>
                    <td className="p-3 text-slate-400">{log.merkleRoot}</td>
                    <td className="p-3 text-slate-500">{log.txHash}</td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-tab 4: Interactive Document Merkle Tree Visualizer */}
      {activeSubTab === 'merkle' && (
        <div className="space-y-5">
          <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Interactive Document Merkle Path Validator</span>
            </h3>
            <p className="text-xs text-slate-400">
              Click any credential leaf to trace its cryptographic inclusion path to the on-chain Merkle Root. 
              This enables paper/QR document verification with salted commitments.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Leaves selector */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-semibold text-slate-300 block">Select Credential Leaf to Verify:</span>
              {sampleLeaves.map((leaf, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedLeafIndex(idx)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedLeafIndex === idx
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white">Leaf #{idx}</span>
                    <span className="text-[10px] font-mono text-cyan-400">
                      {selectedLeafIndex === idx ? 'Tracing Inclusion...' : 'Click to trace'}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] truncate">{leaf}</p>
                </div>
              ))}
            </div>

            {/* Merkle Tree Path Diagram */}
            <div className="lg:col-span-7 rounded-2xl glass-panel p-5 border border-slate-800 space-y-4">
              <span className="text-xs font-semibold text-slate-300 block">Cryptographic Authentication Path:</span>
              
              <div className="space-y-3 text-xs font-mono">
                {/* Root node */}
                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/50 text-purple-200">
                  <div className="flex items-center justify-between text-[11px] text-purple-300 mb-1">
                    <span>On-Chain Merkle Root</span>
                    <span className="text-emerald-400 font-bold">[VERIFIED]</span>
                  </div>
                  <p className="truncate text-white font-bold">{tree.root}</p>
                </div>

                <div className="flex justify-center text-slate-600">
                  <ArrowRight className="w-4 h-4 rotate-90" />
                </div>

                {/* Sibling Proof Nodes */}
                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/60 text-cyan-200 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 block">
                    Proof Siblings (Inclusion Path)
                  </span>
                  {inclusionProof.map((sib, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-black/40">
                      <span className="text-slate-400">Level {i} ({sib.position} sibling):</span>
                      <span className="text-cyan-300 truncate max-w-[55%]">{sib.hash}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center text-slate-600">
                  <ArrowRight className="w-4 h-4 rotate-90" />
                </div>

                {/* Selected Leaf */}
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">
                    Target Leaf Hash (Selected)
                  </span>
                  <p className="truncate text-white">{tree.levels[0][selectedLeafIndex]}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

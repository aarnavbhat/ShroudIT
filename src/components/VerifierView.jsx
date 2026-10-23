import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Scan, 
  RefreshCw, 
  Cpu, 
  Clock, 
  Lock, 
  EyeOff, 
  AlertTriangle,
  FileText,
  Key
} from 'lucide-react';
import { VERIFIERS, CREDENTIALS } from '../lib/mockData';
import { generateNonce, deriveBbsProof, verifyProof } from '../lib/cryptoSim';

export default function VerifierView({ currentProof, onSelectVerifier }) {
  const [selectedVerifierId, setSelectedVerifierId] = useState('verifier-library');
  const [activeNonce, setActiveNonce] = useState(null);
  const [nonceTimeRemaining, setNonceTimeRemaining] = useState(180);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const currentVerifier = VERIFIERS.find(v => v.id === selectedVerifierId) || VERIFIERS[0];

  // Refresh nonce on verifier change
  useEffect(() => {
    handleNewNonce();
  }, [selectedVerifierId]);

  // Nonce countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setNonceTimeRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleNewNonce = () => {
    const nonce = generateNonce(currentVerifier.did);
    setActiveNonce(nonce);
    setNonceTimeRemaining(180);
    setVerificationResult(null);
  };

  const handleRunVerification = () => {
    setIsVerifying(true);
    setVerificationResult(null);

    setTimeout(() => {
      // Find matching synthetic credential if no currentProof passed
      const cred = CREDENTIALS[0];
      const proofToTest = currentProof || deriveBbsProof({
        credential: cred,
        selectedPredicateIds: currentVerifier.requiredPredicates,
        nonce: activeNonce ? activeNonce.value : '0x992fa...11c',
        verifierDid: currentVerifier.did
      });

      const res = verifyProof(
        proofToTest,
        activeNonce ? activeNonce.value : proofToTest.nonceBinding,
        currentVerifier.did,
        142
      );

      setVerificationResult({
        ...res,
        proofTested: proofToTest
      });
      setIsVerifying(false);
    }, 600);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Verifier Service Header */}
      <div className="rounded-2xl glass-panel p-5 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">City Service Verifier Kiosk</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  OpenID4VP Relying Party
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Checks Zero-Knowledge predicate assertions without receiving or storing any personal data.
              </p>
            </div>
          </div>

          {/* Service Selector Tabs */}
          <div className="flex flex-wrap gap-2">
            {VERIFIERS.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setSelectedVerifierId(v.id);
                  if (onSelectVerifier) onSelectVerifier(v.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedVerifierId === v.id
                    ? 'bg-cyan-500 text-black font-semibold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {v.name.split('-')[0].trim()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Verifier Details & Interactive Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Verifier Kiosk Specifications */}
        <div className="lg:col-span-6 space-y-5">
          <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                  {currentVerifier.department}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{currentVerifier.name}</h3>
              </div>
              <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                currentVerifier.isRegistered 
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : 'bg-rose-950 text-rose-400 border-rose-800'
              }`}>
                {currentVerifier.isRegistered ? 'Accredited Verifier' : 'Unregistered / High Risk'}
              </span>
            </div>

            {/* Purpose & Retention Notice */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Registered Legal Purpose</span>
                <p className="text-slate-200 mt-0.5 font-medium leading-relaxed">
                  "{currentVerifier.registeredPurpose}"
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-mono">Retention Policy:</span>
                <span className="text-cyan-300 font-mono">{currentVerifier.retentionPolicy}</span>
              </div>
            </div>

            {/* Requested Predicates vs Forbidden Demands */}
            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Authorized Predicates to Receive:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentVerifier.requestedAttributes.map((attr, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-mono text-xs flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{attr}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-rose-400 block mb-1.5">
                  Strictly Prohibited by ShroudIT Protocol:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentVerifier.forbiddenDemands.map((f, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-rose-950/40 text-rose-300 border border-rose-900/60 font-mono text-xs flex items-center space-x-1.5">
                      <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                      <span>{f}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Ephemeral Nonce Display */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold flex items-center space-x-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Session Nonce Challenge (Anti-Replay)</span>
                </span>
                <button
                  onClick={handleNewNonce}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Generate New</span>
                </button>
              </div>
              <div className="p-2 rounded bg-black/60 font-mono text-xs text-amber-300 break-all select-all">
                {activeNonce ? activeNonce.value : '0x...'}
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Expires in: {nonceTimeRemaining}s</span>
                <span>Binding: {currentVerifier.did.substring(0, 16)}...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Verification Engine & Zero-PII Result */}
        <div className="lg:col-span-6 space-y-5">
          <div className="rounded-2xl glass-panel-glow p-5 border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Scan className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Live Verification Gateway</h3>
                  <p className="text-[11px] text-slate-400">BBS+ Proof Verification & Status Checking</p>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                Epoch #142 Root
              </span>
            </div>

            {/* Action trigger button */}
            <button
              onClick={handleRunVerification}
              disabled={isVerifying || !currentVerifier.isRegistered}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying Zero-Knowledge Proof Math...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Resident Presentation</span>
                </>
              )}
            </button>

            {/* Verification Results Panel */}
            {verificationResult && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/40 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-bold text-white">Access Granted: Verified</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {verificationResult.timestamp}
                  </span>
                </div>

                {/* 4 Cryptographic Proof Checks */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-black/40 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Nonce Binding:</span>
                    <span className="text-emerald-400">MATCH (Valid)</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">BBS+ Proof Math:</span>
                    <span className="text-emerald-400">VALID (e(σ,g))</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Revocation Root:</span>
                    <span className="text-emerald-400">UNREVOKED</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Issuer Accredited:</span>
                    <span className="text-emerald-400">ON-CHAIN (CeG)</span>
                  </div>
                </div>

                {/* What the Verifier Learned (Zero PII Highlight) */}
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-2">
                  <span className="text-xs font-semibold text-emerald-300 block">
                    Facts Proven to Service (Selective Disclosure):
                  </span>
                  <div className="space-y-1">
                    {verificationResult.revealedPredicates.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-xs text-slate-200">
                        <span>• {p.statement}</span>
                        <span className="font-mono text-emerald-400 font-bold">[VERIFIED]</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-emerald-800/40 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">Personal Data Leaked to Verifier:</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 font-bold">
                      0 BYTES (ZERO PII)
                    </span>
                  </div>
                </div>

                {/* Cross-Service Linkability Guarantee */}
                <div className="p-2.5 rounded-lg bg-black/50 border border-slate-800 text-[11px] text-slate-400 flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    <strong>Unlinkability Guarantee:</strong> This randomized signature cannot be connected to any previous or future visits to this or any other service.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

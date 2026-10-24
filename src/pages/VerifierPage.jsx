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
  Key,
  Radio,
  Wifi,
  Sparkles,
  Terminal,
  ShieldAlert,
  Camera,
  Upload
} from 'lucide-react';
import { VERIFIERS, CREDENTIALS } from '../lib/mockData';
import { useAuth } from '../lib/authContext';
import { generateNonce, deriveBbsProof, verifyProof } from '../lib/cryptoSim';
import CameraQrScannerModal from '../components/CameraQrScannerModal';

export default function VerifierPage() {
  const auth = useAuth();
  const currentRole = auth?.currentRole;
  const currentUser = auth?.currentUser;
  const allVerifiers = auth?.allVerifiers || VERIFIERS;

  const initialVerifierId = (currentRole === 'verifier' && currentUser?.id) 
    ? currentUser.id 
    : 'verifier-library';

  const [selectedVerifierId, setSelectedVerifierId] = useState(initialVerifierId);
  const [activeNonce, setActiveNonce] = useState(null);
  const [nonceTimeRemaining, setNonceTimeRemaining] = useState(180);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [scanAnimationActive, setScanAnimationActive] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [consumedNonces, setConsumedNonces] = useState(() => new Set());

  const currentVerifier = allVerifiers.find(v => v.id === selectedVerifierId) || allVerifiers[0] || VERIFIERS[0];

  useEffect(() => {
    handleNewNonce();
  }, [selectedVerifierId]);

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

  const handleProcessScannedPayload = (payload) => {
    let proof = payload;
    if (typeof payload === 'string') {
      try {
        proof = JSON.parse(payload);
      } catch (e) {
        // payload is plain string
      }
    }
    if (proof && proof.presentationProof) {
      proof = proof.presentationProof;
    }

    setIsVerifying(true);
    setScanAnimationActive(true);
    setVerificationResult(null);

    setTimeout(async () => {
      setScanAnimationActive(false);
      const effectiveNonce = (proof && (proof.nonceBinding || proof.nonce || proof.n)) || (activeNonce ? activeNonce.value : '0x992fa...11c');

      // Check 1: Nonce expiration check (180s TTL)
      if (nonceTimeRemaining <= 0 || (activeNonce && Date.now() > activeNonce.expiresAt)) {
        setVerificationResult({
          valid: false,
          summary: "Session Challenge Expired (180s TTL)",
          issues: [
            "Security Violation: Active session challenge nonce has expired (180s TTL).",
            "In accordance with W3C zero-knowledge freshness standards, presentation proofs cannot be verified against expired challenge nonces.",
            "Please click 'Refresh Challenge' to obtain a fresh anti-replay nonce."
          ],
          timestamp: new Date().toLocaleTimeString()
        });
        setIsVerifying(false);
        return;
      }

      // Check 2: Single-use anti-replay enforcement
      if (consumedNonces.has(effectiveNonce)) {
        setVerificationResult({
          valid: false,
          summary: "Replay Attack Blocked",
          issues: [
            `Security Violation: Challenge nonce (${effectiveNonce.substring(0, 16)}...) has already been consumed for a previous presentation.`,
            "Strict Replay Defense: Blinded BBS+ presentations must strictly consume fresh single-use nonces to eliminate replay attacks and preserve unlinkability."
          ],
          timestamp: new Date().toLocaleTimeString()
        });
        setIsVerifying(false);
        return;
      }
      
      // Auto-detect target verifier if presentation was bound to a specific registered city verifier or reveals specific predicates
      const boundVerifier = (proof && (proof.verifierBinding || proof.v));
      let matchingVerifier = boundVerifier ? allVerifiers.find(v => v.did === boundVerifier) : null;
      if (!matchingVerifier && proof && proof.revealedStatements) {
        const revealedIds = proof.revealedStatements.map(s => s.predicateId || s.id || s.label);
        matchingVerifier = allVerifiers.find(v => 
          v.requiredPredicates && v.requiredPredicates.some(rp => revealedIds.some(rid => String(rid).includes(rp) || rp.includes(String(rid))))
        );
      }
      if (matchingVerifier && matchingVerifier.id !== currentVerifier.id) {
        setSelectedVerifierId(matchingVerifier.id);
      }

      const targetCred = CREDENTIALS.find(c => (matchingVerifier || currentVerifier).allowedCredentialIds?.includes(c.id)) || CREDENTIALS[0];
      const proofToTest = (proof && proof.revealedStatements) ? proof : deriveBbsProof({
        credential: targetCred,
        selectedPredicateIds: (matchingVerifier || currentVerifier).requiredPredicates,
        nonce: effectiveNonce,
        verifierDid: (matchingVerifier || currentVerifier).did
      });

      const res = await verifyProof(
        proofToTest,
        effectiveNonce,
        boundVerifier || currentVerifier.did,
        142
      );

      if (res.valid) {
        setConsumedNonces(prev => new Set(prev).add(effectiveNonce));
      }

      setVerificationResult({
        ...res,
        proofTested: proofToTest
      });
      setIsVerifying(false);
    }, 600);
  };

  const handleRunVerification = () => {
    let storedPresentation = null;
    try {
      const stored = localStorage.getItem('shroudit_active_presentation');
      if (stored) {
        storedPresentation = JSON.parse(stored);
      }
    } catch (e) {}

    const presentationNonce = storedPresentation ? (storedPresentation.nonceBinding || storedPresentation.nonce) : null;
    const effectiveNonce = presentationNonce || (activeNonce ? activeNonce.value : '0x992fa...11c');

    // Check 1: Nonce expiration check (180s TTL)
    if (nonceTimeRemaining <= 0 || (activeNonce && Date.now() > activeNonce.expiresAt)) {
      setVerificationResult({
        valid: false,
        summary: "Session Challenge Expired (180s TTL)",
        issues: [
          "Security Violation: Active session challenge nonce has expired (180s TTL).",
          "In accordance with zero-knowledge freshness standards, presentation proofs cannot be verified against expired challenge nonces.",
          "Please click 'Refresh Challenge' to obtain a fresh anti-replay nonce."
        ],
        timestamp: new Date().toLocaleTimeString()
      });
      return;
    }

    // Check 2: Single-use anti-replay enforcement
    if (consumedNonces.has(effectiveNonce)) {
      setVerificationResult({
        valid: false,
        summary: "Replay Attack Blocked",
        issues: [
          `Security Violation: Challenge nonce (${effectiveNonce.substring(0, 16)}...) has already been consumed for a previous presentation.`,
          "Strict Replay Defense: Blinded BBS+ presentations must strictly consume fresh single-use nonces to eliminate replay attacks and preserve unlinkability."
        ],
        timestamp: new Date().toLocaleTimeString()
      });
      return;
    }

    setIsVerifying(true);
    setScanAnimationActive(true);
    setVerificationResult(null);

    setTimeout(async () => {
      setScanAnimationActive(false);

      // Auto-detect target verifier from stored presentation binding or disclosed predicates
      const boundVerifier = (storedPresentation && (storedPresentation.verifierBinding || storedPresentation.v));
      let matchingVerifier = boundVerifier ? allVerifiers.find(v => v.did === boundVerifier) : null;
      if (!matchingVerifier && storedPresentation && storedPresentation.revealedStatements) {
        const revealedIds = storedPresentation.revealedStatements.map(s => s.predicateId || s.id || s.label);
        matchingVerifier = allVerifiers.find(v => 
          v.requiredPredicates && v.requiredPredicates.some(rp => revealedIds.some(rid => String(rid).includes(rp) || rp.includes(String(rid))))
        );
      }
      if (matchingVerifier && matchingVerifier.id !== currentVerifier.id) {
        setSelectedVerifierId(matchingVerifier.id);
      }

      const activeVer = matchingVerifier || currentVerifier;
      const targetCred = CREDENTIALS.find(c => activeVer.allowedCredentialIds?.includes(c.id)) || CREDENTIALS[0];
      const proofToTest = (storedPresentation && storedPresentation.revealedStatements)
        ? storedPresentation
        : deriveBbsProof({
            credential: targetCred,
            selectedPredicateIds: activeVer.requiredPredicates,
            nonce: effectiveNonce,
            verifierDid: activeVer.did
          });

      const res = await verifyProof(
        proofToTest,
        effectiveNonce,
        boundVerifier || activeVer.did,
        142
      );

      if (res.valid) {
        setConsumedNonces(prev => new Set(prev).add(effectiveNonce));
      }

      setVerificationResult({
        ...res,
        proofTested: proofToTest
      });
      setIsVerifying(false);
    }, 750);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Page Title & Smart City Kiosk Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>OpenID4VP Verifier Terminal • City of Bengaluru</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
              Zero-PII Gateway
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            City Service Verifier Kiosk
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Autonomous verification terminal for municipal services, transit turnstiles, and welfare schemes. Checks zero-knowledge facts with zero identity leakage.
          </p>
        </div>

        {/* Verifier Switcher Buttons */}
        <div className="flex flex-wrap gap-2">
          {allVerifiers.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVerifierId(v.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedVerifierId === v.id
                  ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {v.name.split('-')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Kiosk Terminal Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Kiosk Registration & Policy Specification */}
        <div className="lg:col-span-6 space-y-5">
          <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-5">
            {/* Terminal Identity Card */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                    {currentVerifier.department}
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">{currentVerifier.name}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{currentVerifier.did}</p>
                </div>
              </div>

              <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                currentVerifier.isRegistered 
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : 'bg-rose-950 text-rose-400 border-rose-800'
              }`}>
                {currentVerifier.isRegistered ? 'Accredited Relying Party' : 'Unregistered Warning'}
              </span>
            </div>

            {/* DPDP Purpose Limitation Card */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[10px] uppercase">Registered Legal Purpose</span>
                <span className="text-cyan-400 font-mono text-[10px]">{currentVerifier.purposeId}</span>
              </div>
              <p className="text-xs text-slate-200 font-medium leading-relaxed">
                "{currentVerifier.registeredPurpose}"
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Data Retention:</span>
                <span className="text-cyan-300">{currentVerifier.retentionPolicy}</span>
              </div>
            </div>

            {/* Predicate Requirements vs Prohibited Demands */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40 space-y-2">
                <span className="text-xs font-semibold text-cyan-300 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Authorized Predicates:</span>
                </span>
                <div className="space-y-1">
                  {currentVerifier.requestedAttributes.map((attr, i) => (
                    <div key={i} className="text-[11px] font-mono text-cyan-200">
                      • {attr}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-2">
                <span className="text-xs font-semibold text-rose-300 flex items-center space-x-1.5">
                  <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>Prohibited Data:</span>
                </span>
                <div className="space-y-1">
                  {currentVerifier.forbiddenDemands.map((f, i) => (
                    <div key={i} className="text-[11px] font-mono text-rose-200">
                      ✕ {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ephemeral Nonce Challenge Panel */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center space-x-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ephemeral Session Nonce (Replay Defense)</span>
                </span>
                <button
                  onClick={handleNewNonce}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh Challenge</span>
                </button>
              </div>
              <div className="p-2.5 rounded bg-black/60 font-mono text-xs text-amber-300 break-all select-all border border-slate-800">
                {activeNonce ? activeNonce.value : '0x...'}
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>Nonce Lifetime: {nonceTimeRemaining}s remaining</span>
                </span>
                <span>Verifier: {currentVerifier.did.substring(0, 16)}...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Scanner Viewport & Verification Gateway */}
        <div className="lg:col-span-6 space-y-5">
          <div className="rounded-2xl glass-panel-glow p-6 border border-cyan-500/30 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Scan className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Live Turnstile / Kiosk Scanner</h3>
                  <p className="text-[11px] text-slate-400">BBS+ Zero-Knowledge Presentation Ingestion</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                Epoch #142 Merkle Sync
              </span>
            </div>

            {/* Interactive Scanner Viewport Graphic */}
            <div className="relative rounded-2xl bg-black/80 border-2 border-dashed border-slate-700 p-8 flex flex-col items-center justify-center min-h-[190px] overflow-hidden">
              {/* Laser scan line animation */}
              {scanAnimationActive && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-lg shadow-cyan-400 animate-bounce"></div>
              )}

              <div className="relative z-10 text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Scan className="w-8 h-8" />
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  {isVerifying ? 'Ingesting presentation and validating cryptographic pairings...' : 'Ready for Resident Wallet Tap or QR Scan'}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Protocols: OpenID4VP • BBS+ Selective Disclosure • Nonce Bound
                </p>
              </div>
            </div>

            {/* Action Triggers: Camera Scanner & Simulated NFC Tap */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setScannerOpen(true)}
                disabled={isVerifying || !currentVerifier.isRegistered}
                className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>Scan QR (Camera/File)</span>
              </button>

              <button
                onClick={handleRunVerification}
                disabled={isVerifying || !currentVerifier.isRegistered}
                className="py-3.5 px-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:border-cyan-500 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Simulate Fast Tap</span>
                  </>
                )}
              </button>
            </div>

            {/* Verification Result Inspection */}
            {verificationResult && (
              verificationResult.valid ? (
                <div className="p-5 rounded-2xl bg-slate-900/95 border border-emerald-500/50 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      <div>
                        <h4 className="text-base font-bold text-white">ACCESS GRANTED: VERIFIED</h4>
                        <span className="text-[10px] text-slate-400 font-mono">Turnstile unlocked at {verificationResult.timestamp}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      STATUS: VALID
                    </span>
                  </div>

                  {/* 4 Cryptographic Proof Checks */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded-lg bg-black/50 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Nonce Challenge:</span>
                      <span className="text-emerald-400 font-bold">MATCH (Valid)</span>
                    </div>
                    <div className="p-2 rounded-lg bg-black/50 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">BBS Pairing e(σ,g):</span>
                      <span className="text-emerald-400 font-bold">VALID (OK)</span>
                    </div>
                    <div className="p-2 rounded-lg bg-black/50 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Epoch Status Root:</span>
                      <span className="text-emerald-400 font-bold">UNREVOKED (#{verificationResult.verifiedEpoch || 142})</span>
                    </div>
                    <div className="p-2 rounded-lg bg-black/50 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Issuer Accreditation:</span>
                      <span className="text-emerald-400 font-bold truncate max-w-[145px]" title={verificationResult.onChainIssuerData?.name || verificationResult.proofTested?.issuer || "Accredited Authority"}>
                        {verificationResult.onChainIssuerData?.name 
                          ? `ON-CHAIN (${verificationResult.onChainIssuerData.name.split(',')[0].replace('Karnataka ', '').trim()})` 
                          : (verificationResult.proofTested?.issuer ? `ON-CHAIN (${verificationResult.proofTested.issuer})` : 'ON-CHAIN (Verified)')}
                      </span>
                    </div>
                  </div>

                  {/* What the Verifier Learned (Zero PII Highlight) */}
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-2.5">
                    <span className="text-xs font-bold text-emerald-300 block">
                      Facts Proven to Service (Selective Disclosure):
                    </span>
                    <div className="space-y-1">
                      {(verificationResult.revealedPredicates || []).map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-xs text-slate-200">
                          <span>• {p.statement || p.label || p}</span>
                          <span className="font-mono text-emerald-400 font-bold">[VERIFIED TRUE]</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-emerald-800/40 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300">Personal Data Leaked to Verifier:</span>
                      <span className="px-2.5 py-1 rounded bg-emerald-900 text-emerald-100 font-bold">
                        0 BYTES (ZERO PII)
                      </span>
                    </div>
                  </div>

                  {/* Audit summary */}
                  <div className="p-3 rounded-lg bg-black/60 border border-slate-800 text-[11px] text-slate-400 flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>
                      <strong>Anti-Tracking Assurance:</strong> This presentation cannot be linked to any previous visits or cross-correlated with other city services.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-500/50 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-6 h-6 text-rose-400" />
                      <div>
                        <h4 className="text-base font-bold text-white">ACCESS DENIED: VERIFICATION REJECTED</h4>
                        <span className="text-[10px] text-rose-300 font-mono">{verificationResult.summary || "Cryptographic Security Check Failed"}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-rose-950 text-rose-400 border border-rose-800">
                      STATUS: REJECTED
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/60 border border-rose-900/50 space-y-1.5 text-xs">
                    <span className="text-xs font-semibold text-rose-300 block">Security Violations Detected:</span>
                    {(verificationResult.issues || ["Presentation rejected by zero-knowledge pairing engine"]).map((issue, idx) => (
                      <div key={idx} className="flex items-start space-x-1.5 text-rose-200">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{issue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Live Camera & Image File Scanner Modal */}
      <CameraQrScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleProcessScannedPayload}
        currentNonce={activeNonce?.value}
        verifierDid={currentVerifier.did}
      />
    </div>
  );
}

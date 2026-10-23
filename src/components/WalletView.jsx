import React, { useState } from 'react';
import { 
  Shield, 
  Smartphone, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck, 
  Zap, 
  Lock, 
  Unlock, 
  Layers, 
  Cpu, 
  Sparkles, 
  History,
  Copy,
  ExternalLink,
  Ban
} from 'lucide-react';
import CredentialCard from './CredentialCard';
import ConsentExplainerModal from './ConsentExplainerModal';
import { CREDENTIALS, VERIFIERS, INITIAL_CONSENT_RECEIPTS } from '../lib/mockData';
import { deriveBbsProof, generateNonce } from '../lib/cryptoSim';

export default function WalletView({ onPresentProofToVerifier }) {
  const [credentials] = useState(CREDENTIALS);
  const [selectedCredId, setSelectedCredId] = useState(CREDENTIALS[0].id);
  const [selectedPredicates, setSelectedPredicates] = useState(["over_18", "blr_resident"]);
  const [selectedVerifierId, setSelectedVerifierId] = useState("verifier-library");
  
  // Interactive state
  const [activeProof, setActiveProof] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [explainerOpen, setExplainerOpen] = useState(false);
  const [explainerCred, setExplainerCred] = useState(CREDENTIALS[0]);
  const [overAskingTriggered, setOverAskingTriggered] = useState(false);
  const [receipts, setReceipts] = useState(INITIAL_CONSENT_RECEIPTS);
  const [copied, setCopied] = useState(false);

  const currentCred = credentials.find(c => c.id === selectedCredId) || credentials[0];
  const currentVerifier = VERIFIERS.find(v => v.id === selectedVerifierId) || VERIFIERS[0];

  const handleTogglePredicate = (predId) => {
    setSelectedPredicates(prev => 
      prev.includes(predId) 
        ? prev.filter(p => p !== predId) 
        : [...prev, predId]
    );
  };

  const handleSelectCard = (cred) => {
    setSelectedCredId(cred.id);
    setSelectedPredicates(cred.predicates.map(p => p.id));
  };

  const handleOpenExplainer = (cred) => {
    setExplainerCred(cred);
    setExplainerOpen(true);
  };

  const handleGenerateProof = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const nonceObj = generateNonce(currentVerifier.did);
      const proof = deriveBbsProof({
        credential: currentCred,
        selectedPredicateIds: selectedPredicates,
        nonce: nonceObj.value,
        verifierDid: currentVerifier.did
      });
      setActiveProof(proof);
      setIsGenerating(false);

      // Create new DPDP consent receipt
      const newReceipt = {
        id: `rcpt-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
        verifierName: currentVerifier.name,
        purpose: currentVerifier.registeredPurpose,
        attributesDisclosed: proof.revealedStatements.map(s => `${s.label} (True)`),
        zeroPiiLeaked: true,
        nonceHash: nonceObj.value.substring(0, 16) + '...',
        bbsProofCommitment: proof.randomizedCommitment.substring(0, 16) + '...',
        dpdpActNotice: "Compliant with DPDP Act §6 (Purpose Limitation)"
      };
      setReceipts(prev => [newReceipt, ...prev]);

      if (onPresentProofToVerifier) {
        onPresentProofToVerifier(proof, currentVerifier.id);
      }
    }, 450);
  };

  const handleSimulateOverAsking = () => {
    setOverAskingTriggered(true);
  };

  const handleCopyProof = () => {
    if (activeProof) {
      navigator.clipboard.writeText(JSON.stringify(activeProof, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Wallet Identity & Device Binding Banner */}
      <div className="rounded-2xl glass-panel p-5 border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">ShroudIT Resident Wallet</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Device Key Bound
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Holder: <span className="text-slate-200 font-mono">Aarav S. Rao (Bengaluru Urban)</span> | Device Key: <span className="text-cyan-400 font-mono">ed25519:e4:91...0d:66</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div className="p-2 sm:px-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="block text-[10px] text-slate-500 uppercase font-mono">Credentials</span>
              <span className="text-sm sm:text-base font-bold text-cyan-400 font-mono">{credentials.length} Active</span>
            </div>
            <div className="p-2 sm:px-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="block text-[10px] text-slate-500 uppercase font-mono">PII Exposure</span>
              <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono">0 Bytes</span>
            </div>
            <div className="p-2 sm:px-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="block text-[10px] text-slate-500 uppercase font-mono">Epoch Root</span>
              <span className="text-sm sm:text-base font-bold text-purple-400 font-mono">#142 Synced</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Credentials (Left) & BBS+ Presentation Kiosk (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Credential Cards Stack */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center space-x-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Issued Civic Credentials</span>
              </h3>
              <p className="text-xs text-slate-400">Select a credential and toggle which predicates you want to disclose</p>
            </div>

            {/* Rogue verifier test button */}
            <button
              onClick={handleSimulateOverAsking}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/80 hover:bg-rose-900/80 transition-all shadow-sm"
              title="Test Over-asking Attack Protection"
            >
              <Ban className="w-3.5 h-3.5 text-rose-400" />
              <span>Simulate Over-Asking Attack</span>
            </button>
          </div>

          {/* Over-Asking Warning Banner (If Triggered) */}
          {overAskingTriggered && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-600/60 text-rose-200 animate-fadeIn">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white">ShroudIT Purpose Firewall: Request Blocked</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900/80 text-rose-300 border border-rose-700 font-mono">
                        DPDP Act §6 Violation
                      </span>
                    </div>
                    <p className="text-xs text-rose-200/90 mt-1">
                      Target: <span className="font-mono text-white">Suspicious Public WiFi Portal (did:cv:rogue-unregistered-wifi-kiosk)</span>
                    </p>
                    <p className="text-xs text-rose-300/80 mt-1">
                      Violation: The verifier demanded your <strong className="text-rose-100">Full Aadhaar, Date of Birth, and Mobile Phone</strong> for basic WiFi access. This violates statutory data minimization. ShroudIT blocked this request. Zero data sent.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOverAskingTriggered(false)}
                  className="text-xs text-rose-400 hover:text-white px-2 py-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Credentials Cards List */}
          <div className="space-y-4">
            {credentials.map((cred) => (
              <CredentialCard
                key={cred.id}
                credential={cred}
                isSelected={cred.id === selectedCredId}
                onSelect={handleSelectCard}
                selectedPredicates={cred.id === selectedCredId ? selectedPredicates : []}
                onTogglePredicate={handleTogglePredicate}
                onOpenExplainer={handleOpenExplainer}
              />
            ))}
          </div>
        </div>

        {/* Right Column: BBS+ Proof Derivation & QR Code Presentation */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl glass-panel-glow p-5 border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Zero-Knowledge Presentation</h3>
                  <p className="text-[11px] text-slate-400">BBS+ Randomized Signature Proof</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                Unlinkable
              </span>
            </div>

            {/* Target Verifier Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Target Verifier (City Service)
              </label>
              <select
                value={selectedVerifierId}
                onChange={(e) => setSelectedVerifierId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {VERIFIERS.filter(v => v.isRegistered).map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.purposeId})</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1 italic">
                Registered purpose: "{currentVerifier.registeredPurpose}"
              </p>
            </div>

            {/* Predicates to be revealed */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">
                Disclosed Predicates ({selectedPredicates.length})
              </span>
              {selectedPredicates.length === 0 ? (
                <p className="text-xs text-amber-400 italic">No predicates selected. Check at least one above.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {selectedPredicates.map(pid => {
                    const pred = currentCred.predicates.find(p => p.id === pid);
                    return (
                      <span key={pid} className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono text-xs flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                        <span>{pred ? pred.label : pid}: TRUE</span>
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-emerald-400 font-mono">
                <span>Withheld Attributes:</span>
                <span>{Object.keys(currentCred.rawData).length} items kept private</span>
              </div>
            </div>

            {/* Generate Proof Button */}
            <button
              onClick={handleGenerateProof}
              disabled={isGenerating || selectedPredicates.length === 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>Deriving Randomized BBS+ Proof...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-black" />
                  <span>Derive Fresh BBS+ Proof</span>
                </>
              )}
            </button>

            {/* Derived Proof Display & QR Code */}
            {activeProof && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/40 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-cyan-300 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Cryptographic Presentation Ready</span>
                  </span>
                  <button
                    onClick={handleCopyProof}
                    className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center space-x-1 font-mono"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copied ? 'Copied!' : 'Copy Proof'}</span>
                  </button>
                </div>

                {/* Simulated QR Code & Payload preview */}
                <div className="p-3 bg-white rounded-xl flex items-center justify-center space-x-4">
                  {/* Stylized QR representation */}
                  <div className="w-24 h-24 bg-black p-1.5 rounded-lg flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-2 border-white p-0.5 flex items-center justify-center">
                        <div className="w-3 h-3 bg-white"></div>
                      </div>
                      <div className="w-6 h-6 border-2 border-white p-0.5 flex items-center justify-center">
                        <div className="w-3 h-3 bg-white"></div>
                      </div>
                    </div>
                    <div className="flex justify-center items-center py-1">
                      <div className="w-2 h-2 bg-white mx-0.5"></div>
                      <div className="w-2 h-2 bg-white mx-0.5"></div>
                      <div className="w-2 h-2 bg-white mx-0.5"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-2 border-white p-0.5 flex items-center justify-center">
                        <div className="w-3 h-3 bg-white"></div>
                      </div>
                      <div className="w-4 h-4 bg-white/70"></div>
                    </div>
                  </div>

                  <div className="text-slate-900 text-left space-y-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-cyan-800 block">OpenID4VP Payload</span>
                    <p className="text-xs font-semibold leading-tight">Ready for Smart Turnstile / Kiosk Tap</p>
                    <p className="text-[10px] text-slate-600 font-mono">Bound to Nonce: {activeProof.nonceBinding.substring(0, 10)}...</p>
                    <span className="inline-block text-[9px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                      Zero Identity Leak
                    </span>
                  </div>
                </div>

                {/* Proof Cryptographic Math Inspection */}
                <div className="p-2.5 rounded-lg bg-black/60 font-mono text-[10px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">BBS Blinded Sig (A'):</span>
                    <span className="text-cyan-400">{activeProof.bbsComponents.A_prime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Commitment (C):</span>
                    <span className="text-purple-400">{activeProof.randomizedCommitment.substring(0, 16)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Device Proof:</span>
                    <span className="text-emerald-400">{activeProof.deviceBindingSignature}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Local Consent Receipts History */}
          <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                <History className="w-3.5 h-3.5 text-cyan-400" />
                <span>Signed Consent Receipts (DPDP Log)</span>
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">Device-Stored</span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {receipts.map(rcpt => (
                <div key={rcpt.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{rcpt.verifierName}</span>
                    <span className="text-[10px] font-mono text-slate-500">{rcpt.timestamp}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {rcpt.attributesDisclosed.map((attr, idx) => (
                      <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                        {attr}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono truncate pt-0.5">
                    Proof Commitment: {rcpt.bbsProofCommitment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Multilingual Consent Explainer Modal */}
      <ConsentExplainerModal
        isOpen={explainerOpen}
        onClose={() => setExplainerOpen(false)}
        verifierName={currentVerifier.name}
        requestedPredicateLabels={selectedPredicates.map(pid => {
          const p = currentCred.predicates.find(x => x.id === pid);
          return p ? p.label : pid;
        })}
        onAuthorize={() => handleGenerateProof()}
      />
    </div>
  );
}

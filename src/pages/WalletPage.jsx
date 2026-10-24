import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Shield, 
  Smartphone, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck, 
  Zap, 
  Lock, 
  Layers, 
  Cpu, 
  Sparkles, 
  History,
  Copy,
  ExternalLink,
  Ban,
  Maximize2,
  Minimize2,
  Check,
  ChevronRight,
  EyeOff,
  Download,
  Database
} from 'lucide-react';
import CredentialCard from '../components/CredentialCard';
import ConsentExplainerModal from '../components/ConsentExplainerModal';
import { CREDENTIALS, VERIFIERS, INITIAL_CONSENT_RECEIPTS } from '../lib/mockData';
import { useAuth } from '../lib/authContext';
import { deriveBbsProof, generateNonce } from '../lib/cryptoSim';
import { 
  initWalletStorage, 
  getStoredCredentials, 
  getStoredReceipts, 
  saveConsentReceipt, 
  exportReceiptAsJson 
} from '../lib/walletStorage';

export default function WalletPage() {
  const auth = useAuth();
  const currentUser = auth?.currentUser;
  const allVerifiers = auth?.allVerifiers || VERIFIERS;
  const allIssuers = auth?.allIssuers || [];
  const userCredentials = auth?.userCredentials || CREDENTIALS;

  const [credentials, setCredentials] = useState(userCredentials);
  const [selectedCredId, setSelectedCredId] = useState(userCredentials[0]?.id || CREDENTIALS[0].id);
  const [selectedPredicates, setSelectedPredicates] = useState(["over_18", "blr_resident"]);
  const [selectedVerifierId, setSelectedVerifierId] = useState("verifier-library");
  
  // View mode: 'desktop' or 'phone'
  const [viewMode, setViewMode] = useState('desktop');

  // Interactive state
  const [activeProof, setActiveProof] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [explainerOpen, setExplainerOpen] = useState(false);
  const [explainerCred, setExplainerCred] = useState(userCredentials[0] || CREDENTIALS[0]);
  const [overAskingTriggered, setOverAskingTriggered] = useState(false);
  const [receipts, setReceipts] = useState(INITIAL_CONSENT_RECEIPTS);
  const [copied, setCopied] = useState(false);
  const [storageInitialized, setStorageInitialized] = useState(false);
  const [enlargeQrOpen, setEnlargeQrOpen] = useState(false);

  useEffect(() => {
    async function loadWalletStorage() {
      await initWalletStorage();
      const storedCreds = await getStoredCredentials();
      const storedReceipts = await getStoredReceipts();
      if (storedCreds && storedCreds.length > 0) {
        setCredentials(storedCreds);
        setSelectedCredId(storedCreds[0].id);
        if (storedCreds[0].predicates && storedCreds[0].predicates.length > 0) {
          setSelectedPredicates(storedCreds[0].predicates.map(p => p.id));
        }
      }
      if (storedReceipts && storedReceipts.length > 0) {
        setReceipts(storedReceipts);
      }
      setStorageInitialized(true);
    }
    loadWalletStorage();
  }, [userCredentials]);

  const currentCred = credentials.find(c => c.id === selectedCredId) || credentials[0] || CREDENTIALS[0];
  const currentVerifier = allVerifiers.find(v => v.id === selectedVerifierId) || allVerifiers[0] || VERIFIERS[0];

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
      const targetIssuer = allIssuers.find(i => i.did === currentCred.issuerDid) || allIssuers[0];
      const proof = deriveBbsProof({
        credential: currentCred,
        selectedPredicateIds: selectedPredicates,
        nonce: nonceObj.value,
        verifierDid: currentVerifier.did,
        deviceHardwareKey: currentUser?.hardwareKey,
        issuerKeyPair: targetIssuer?.keyPair
      });
      setActiveProof(proof);
      setIsGenerating(false);

      try {
        localStorage.setItem('shroudit_active_presentation', JSON.stringify(proof));
      } catch (e) {}

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
      saveConsentReceipt(newReceipt);
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
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Page Title & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
              ShroudIT Client • Device-Bound Architecture
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              DPDP Act §6
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Resident Privacy Wallet
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Holds digitally signed civic credentials. Derives randomized, unlinkable BBS+ proofs with zero data leakage to verifiers.
          </p>
        </div>

        {/* View Mode Toggle (Desktop Dashboard vs Smartphone Frame) */}
        <div className="flex items-center space-x-2 self-start md:self-auto bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('desktop')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'desktop'
                ? 'bg-cyan-500 text-black font-semibold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Expanded View</span>
          </button>
          <button
            onClick={() => setViewMode('phone')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'phone'
                ? 'bg-cyan-500 text-black font-semibold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile Device Mockup</span>
          </button>
        </div>
      </div>

      {/* Over-Asking Warning Banner */}
      {overAskingTriggered && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-600/60 text-rose-200 animate-fadeIn">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-white">ShroudIT Purpose Firewall: Request Intercepted & Blocked</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900/80 text-rose-300 border border-rose-700 font-mono">
                    DPDP Act §6 Violation
                  </span>
                </div>
                <p className="text-xs text-rose-200/90 mt-1">
                  Target: <span className="font-mono text-white">Suspicious Public WiFi Portal (did:cv:rogue-unregistered-wifi-kiosk)</span>
                </p>
                <p className="text-xs text-rose-300/80 mt-1 leading-relaxed">
                  Violation: The verifier demanded your <strong className="text-rose-100">Full Aadhaar, Date of Birth, and Mobile Phone</strong> for basic WiFi access. This violates statutory data minimization. ShroudIT blocked this request. Zero data sent.
                </p>
              </div>
            </div>
            <button
              onClick={() => setOverAskingTriggered(false)}
              className="text-xs text-rose-400 hover:text-white px-2 py-1 font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* IF MOBILE DEVICE MOCKUP SELECTED */}
      {viewMode === 'phone' ? (
        <div className="flex justify-center py-6">
          <div className="w-[390px] rounded-[48px] bg-[#0c111e] border-4 border-slate-700 shadow-2xl shadow-cyan-950/40 overflow-hidden relative p-4 space-y-4">
            {/* Dynamic Island / Speaker notch */}
            <div className="flex justify-center mb-1">
              <div className="w-28 h-5 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-between px-3">
                <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              </div>
            </div>

            {/* Mobile Header */}
            <div className="flex items-center justify-between px-2 pt-1">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span className="font-bold text-white text-sm">ShroudIT Wallet</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                Ed25519 Bound
              </span>
            </div>

            {/* Active Card in Phone */}
            <div className="rounded-2xl p-4 bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-500/40 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-mono uppercase text-cyan-400">{currentCred.category}</span>
                  <h3 className="text-sm font-bold text-white">{currentCred.title}</h3>
                </div>
                <div className="w-7 h-5 rounded border border-amber-400/40 bg-amber-500/20"></div>
              </div>
              <div className="text-xs text-slate-300 font-mono">
                Holder: {currentUser?.name || "Aarav S. Rao"}
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-[10px] text-slate-400">
                <span>Predicates: {currentCred.predicates.length} Available</span>
                <span className="text-emerald-400 font-bold">Unrevoked (Epoch 142)</span>
              </div>
            </div>

            {/* Mobile Predicate Selection */}
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-300 block">Selective Disclosure (ZK-Proof)</span>
              {currentCred.predicates.map(p => {
                const isChecked = selectedPredicates.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => handleTogglePredicate(p.id)}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer border ${
                      isChecked ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>{p.label}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {isChecked ? 'DISCLOSE' : 'HIDE'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Mobile Action Button */}
            <button
              onClick={handleGenerateProof}
              disabled={isGenerating}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 hover:brightness-110"
            >
              {isGenerating ? 'Computing BBS+ Proof...' : 'Present to Verifier'}
            </button>

            {/* Mobile Proof Card */}
            {activeProof && (
              <div className="p-3 rounded-2xl bg-slate-900 border border-cyan-500/40 text-center space-y-2">
                <span className="text-xs font-bold text-cyan-300 block">Randomized Presentation Ready</span>
                <div className="p-2.5 bg-white mx-auto rounded-xl inline-block shadow-lg">
                  <QRCodeSVG
                    value={JSON.stringify({
                      protocol: "openid4vp",
                      proofId: activeProof.proofId,
                      verifier: activeProof.verifierBinding,
                      nonce: activeProof.nonceBinding,
                      commitment: activeProof.randomizedCommitment,
                      revealedStatements: activeProof.revealedStatements,
                      deviceProof: activeProof.deviceProofRaw || activeProof.deviceBindingSignature,
                      devicePublicKey: activeProof.devicePublicKey,
                      timestamp: activeProof.timestamp,
                      rawProof: activeProof.rawProof
                    })}
                    size={150}
                    level="L"
                    includeMargin={true}
                  />
                </div>
                <p className="text-[10px] text-emerald-400 font-mono">0 Bytes PII Leaked • Fresh Proof</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* EXPANDED DESKTOP VIEW */
        <div className="space-y-8">
          {/* Holder Identity Ribbon */}
          <div className="rounded-2xl glass-panel p-5 border border-slate-800">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold text-white">Resident: {currentUser?.name || "Aarav S. Rao"}</h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {currentUser?.domicile || "Bengaluru Urban Domicile"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    DID: <span className="font-mono text-cyan-300">{currentUser?.did || "did:key:z6Mku7X...89p"}</span> | Device Hardware Key: <span className="font-mono text-slate-300">{currentUser?.hardwareKey?.publicKeyHex ? 'ed25519:' + currentUser.hardwareKey.publicKeyHex.substring(0, 10) + '...' : "ed25519:e4:91...0d:66"}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-800">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AES-256-GCM IndexedDB Enclave</span>
                </span>
                <button
                  onClick={handleSimulateOverAsking}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-950/60 text-rose-300 border border-rose-800 hover:bg-rose-900/80 transition-all shadow-sm"
                >
                  <Ban className="w-4 h-4 text-rose-400" />
                  <span>Simulate Over-Asking Attack</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Layout: Credentials (Left 7 cols) & Proof Derivation Kiosk (Right 5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Credentials Stack */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Issued Smart City Credentials</span>
                  </h3>
                  <p className="text-xs text-slate-400">Select a card to derive a privacy-preserving selective disclosure proof</p>
                </div>
                <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  {credentials.length} Cards in Secure Enclave
                </span>
              </div>

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

            {/* Right Column: Interactive BBS+ Derivation Console */}
            <div className="lg:col-span-5 space-y-5">
              <div className="rounded-2xl glass-panel-glow p-5 border border-cyan-500/30 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">BBS+ Proof Derivation</h3>
                      <p className="text-[11px] text-slate-400">Blinded Zero-Knowledge Presentation</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                    Unlinkable
                  </span>
                </div>

                {/* Target Verifier Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Target City Service:
                  </label>
                  <select
                    value={selectedVerifierId}
                    onChange={(e) => setSelectedVerifierId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {allVerifiers.filter(v => v.isRegistered).map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.purposeId})</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1 italic">
                    Purpose: "{currentVerifier.registeredPurpose}"
                  </p>
                </div>

                {/* Disclosed Predicates */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">
                      Disclosed Predicates:
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      {selectedPredicates.length} Selected
                    </span>
                  </div>

                  {selectedPredicates.length === 0 ? (
                    <p className="text-xs text-amber-400 italic">No predicates selected. Check at least one on the card.</p>
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

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Withheld Attributes:</span>
                    <span className="text-emerald-400 font-bold">
                      {Object.keys(currentCred.rawData).length} kept confidential
                    </span>
                  </div>
                </div>

                {/* Derive Proof Button */}
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

                {/* Generated Proof Payload & QR Code */}
                {activeProof && (
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/40 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-cyan-300 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Fresh Presentation Ready</span>
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEnlargeQrOpen(true)}
                          className="text-[11px] px-2 py-1 rounded bg-slate-800 text-cyan-400 hover:bg-slate-700 flex items-center space-x-1 font-mono transition-colors"
                          title="Enlarge QR code for easy camera scanning"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>Enlarge QR</span>
                        </button>
                        <button
                          onClick={handleCopyProof}
                          className="text-[11px] px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center space-x-1 font-mono transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* QR Code Presentation Box */}
                    <div className="p-4 bg-white rounded-xl flex flex-col sm:flex-row items-center justify-center gap-4 shadow-lg shadow-cyan-950/20">
                      <div 
                        onClick={() => setEnlargeQrOpen(true)}
                        className="p-1 bg-white rounded-lg border border-slate-200 shrink-0 cursor-pointer hover:ring-2 hover:ring-cyan-500 transition-all"
                        title="Click to expand full screen"
                      >
                        <QRCodeSVG
                          value={JSON.stringify({
                            protocol: "openid4vp",
                            proofId: activeProof.proofId,
                            verifier: activeProof.verifierBinding,
                            nonce: activeProof.nonceBinding,
                            commitment: activeProof.randomizedCommitment,
                            revealedStatements: activeProof.revealedStatements,
                            deviceProof: activeProof.deviceProofRaw || activeProof.deviceBindingSignature,
                            devicePublicKey: activeProof.devicePublicKey,
                            timestamp: activeProof.timestamp,
                            rawProof: activeProof.rawProof
                          })}
                          size={165}
                          level="L"
                          includeMargin={true}
                        />
                      </div>

                      <div className="text-slate-900 text-left space-y-1">
                        <span className="text-[10px] font-mono uppercase font-bold text-cyan-800 block">OpenID4VP Dynamic QR</span>
                        <p className="text-xs font-semibold leading-tight">Ready for Smart Turnstile / Kiosk Tap or Camera Scan</p>
                        <p className="text-[10px] text-slate-600 font-mono">Bound Nonce: {activeProof.nonceBinding.substring(0, 14)}...</p>
                        <div className="flex items-center space-x-1.5 pt-1">
                          <span className="inline-block text-[9px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                            Zero Personal Data
                          </span>
                          <span className="inline-block text-[9px] px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 font-mono font-semibold">
                            High-Density Mode
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 italic pt-0.5">Click QR to enlarge or copy payload for instant tap</p>
                      </div>
                    </div>

                    {/* Cryptographic breakdown */}
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

              {/* Local Consent Receipts Log */}
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
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono text-slate-500">{rcpt.timestamp}</span>
                          <button
                            onClick={() => exportReceiptAsJson(rcpt)}
                            title="Download Signed DPDP Act Receipt (.json)"
                            className="p-1 rounded bg-slate-800 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 transition-colors flex items-center space-x-1"
                          >
                            <Download className="w-3 h-3" />
                            <span className="text-[9px] font-mono">JSON</span>
                          </button>
                        </div>
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
        </div>
      )}

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

      {/* Enlarged High-Resolution QR Modal for Reliable Webcam / Phone Scanning */}
      {enlargeQrOpen && activeProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#0b101e] border-2 border-cyan-500/60 p-6 shadow-2xl shadow-cyan-950/80 space-y-4 text-center">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                Full-Size OpenID4VP QR
              </span>
              <button
                onClick={() => setEnlargeQrOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-white rounded-2xl mx-auto inline-block shadow-xl">
              <QRCodeSVG
                value={JSON.stringify({
                  protocol: "openid4vp",
                  proofId: activeProof.proofId,
                  verifier: activeProof.verifierBinding,
                  nonce: activeProof.nonceBinding,
                  commitment: activeProof.randomizedCommitment,
                  revealedStatements: activeProof.revealedStatements,
                  deviceProof: activeProof.deviceProofRaw || activeProof.deviceBindingSignature,
                  devicePublicKey: activeProof.devicePublicKey,
                  timestamp: activeProof.timestamp,
                  rawProof: activeProof.rawProof
                })}
                size={260}
                level="L"
                includeMargin={true}
              />
            </div>

            <div className="space-y-1 text-xs font-mono">
              <p className="text-white font-bold">Ready for Webcam or Phone Scan</p>
              <p className="text-[11px] text-slate-400">Target: {currentVerifier.name}</p>
              <p className="text-[10px] text-emerald-400 font-bold">0 Bytes Personal Data Leaked</p>
            </div>

            <button
              onClick={() => setEnlargeQrOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

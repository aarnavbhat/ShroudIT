import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Database,
  UserCheck,
  BadgeCheck,
  UserPlus,
  LogIn,
  Eye,
  LogOut,
  Building2,
  ArrowRight,
  Clock,
  Key,
  UserCircle
} from 'lucide-react';
import CredentialCard from '../components/CredentialCard';
import ConsentExplainerModal from '../components/ConsentExplainerModal';
import { CREDENTIALS, VERIFIERS, INITIAL_CONSENT_RECEIPTS } from '../lib/mockData';
import { useAuth } from '../lib/authContext';
import { deriveBbsProof, generateNonce } from '../lib/cryptoSim';
import { evaluatePurposeFirewall } from '../lib/firewallEngine';
import { 
  initWalletStorage, 
  getStoredCredentials, 
  getStoredReceipts, 
  saveConsentReceipt, 
  exportReceiptAsJson 
} from '../lib/walletStorage';

export default function WalletPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const currentUser = auth?.currentUser;
  const allVerifiers = auth?.allVerifiers || VERIFIERS;
  const allIssuers = auth?.allIssuers || [];
  const allResidents = auth?.allResidents || [];
  const userCredentials = auth?.userCredentials || CREDENTIALS;
  const loginAsResident = auth?.loginAsResident;
  const createCustomResident = auth?.createCustomResident;
  const logout = auth?.logout;

  // Authentication & Embedded Login Portal State
  const isUserVerified = !!(currentUser && (currentUser.isGovernmentVerified === true || (Array.isArray(currentUser.certifications) && currentUser.certifications.length > 0)));
  const [showAuthPortal, setShowAuthPortal] = useState(!isUserVerified);
  const [authTab, setAuthTab] = useState('signin'); // 'signin' | 'register'

  // Username & Password credentials
  const [loginUsername, setLoginUsername] = useState('aarav');
  const [loginPassword, setLoginPassword] = useState('aarav123');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authSuccess, setAuthSuccess] = useState(null);

  // Registration state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDob, setRegDob] = useState('2002-05-18');
  const [regDomicile, setRegDomicile] = useState('Bengaluru Urban');
  const [regIsStudent, setRegIsStudent] = useState(false);
  const [recentlyCreated, setRecentlyCreated] = useState(null);

  // Keep portal synchronized
  useEffect(() => {
    if (!isUserVerified) {
      setShowAuthPortal(true);
    }
  }, [isUserVerified]);

  const handleLoginSubmit = (e) => {
    if (e) e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!loginUsername.trim()) return;

    const result = loginAsResident({
      username: loginUsername.trim(),
      password: loginPassword
    });

    if (result.success) {
      setAuthSuccess(`Identity authenticated! Welcome, ${result.resident.name}.`);
      setTimeout(() => {
        setShowAuthPortal(false);
        setAuthSuccess(null);
      }, 500);
    } else {
      setAuthError({
        title: result.error === "not verified by government"
          ? "Login Blocked: Not Verified by Government"
          : "Authentication Failed",
        phrase: result.error || "not verified by government",
        message: result.message || result.error,
        resident: result.resident
      });
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!regName.trim() || !regPassword) return;

    const res = createCustomResident({
      name: regName.trim(),
      username: regUsername.trim() || regName.toLowerCase().replace(/[^a-z0-9]/g, ''),
      password: regPassword,
      dob: regDob,
      domicile: regDomicile.trim(),
      isStudent: regIsStudent
    });

    setRecentlyCreated(res.resident);
    setLoginUsername(res.resident.username);
    setLoginPassword(regPassword);
    setAuthTab('signin');

    setAuthError({
      title: "Account Created: Pending Government Verification",
      phrase: "not verified by government",
      message: `Account created for "${res.resident.name}" (@${res.resident.username}). As required by protocol rules, this account is not verified by government yet and cannot log in until an accredited authority sends an official certification.`,
      resident: res.resident,
      isNoticeOnly: true
    });
  };

  const handleSelectQuickAccount = (res) => {
    setLoginUsername(res.username || res.id);
    setLoginPassword(res.password || 'password123');
    setAuthError(null);
    setAuthSuccess(null);
  };

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
  const [firewallAudit, setFirewallAudit] = useState(null);
  const [receipts, setReceipts] = useState(INITIAL_CONSENT_RECEIPTS);
  const [copied, setCopied] = useState(false);
  const [storageInitialized, setStorageInitialized] = useState(false);
  const [enlargeQrOpen, setEnlargeQrOpen] = useState(false);
  const [qrMode, setQrMode] = useState('compact'); // 'compact' (fast camera scan) | 'full' (all raw curve points)

  const getQrPayloadString = (proof, mode = qrMode) => {
    if (!proof) return '';
    const base = {
      protocol: "openid4vp",
      proofId: proof.proofId,
      nonceBinding: proof.nonceBinding,
      verifierBinding: proof.verifierBinding,
      randomizedCommitment: proof.randomizedCommitment,
      revealedStatements: proof.revealedStatements,
      deviceProofRaw: proof.deviceProofRaw || proof.deviceBindingSignature,
      devicePublicKey: proof.devicePublicKey,
      timestamp: proof.timestamp,
      issuerDid: proof.issuerDid,
      issuer: proof.issuer,
      credentialSchema: proof.credentialSchema
    };
    if (mode === 'full' && proof.rawProof) {
      base.rawProof = proof.rawProof;
    }
    return JSON.stringify(base);
  };

  useEffect(() => {
    async function loadWalletStorage() {
      await initWalletStorage();
      const storedCreds = await getStoredCredentials();
      const storedReceipts = await getStoredReceipts();
      if (storedCreds && storedCreds.length > 0) {
        setCredentials(storedCreds);

        // Check if a newly verified document card was just saved
        let targetCred = storedCreds[0];
        try {
          const autoSelectedId = localStorage.getItem('shroudit_selected_credential_id');
          if (autoSelectedId) {
            const found = storedCreds.find(c => c.id === autoSelectedId);
            if (found) {
              targetCred = found;
            }
            localStorage.removeItem('shroudit_selected_credential_id');
          }
        } catch (e) {}

        setSelectedCredId(targetCred.id);
        if (targetCred.predicates && targetCred.predicates.length > 0) {
          setSelectedPredicates(targetCred.predicates.map(p => p.id));
        }
      }
      if (storedReceipts && storedReceipts.length > 0) {
        setReceipts(storedReceipts);
      }

      // Restore active presentation if present in localStorage
      try {
        const storedActive = localStorage.getItem('shroudit_active_presentation');
        if (storedActive) {
          const parsed = JSON.parse(storedActive);
          if (parsed && (parsed.revealedStatements || parsed.nonceBinding || parsed.proofId)) {
            setActiveProof(parsed);
          }
        }
      } catch (e) {}

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

    // Dynamically align target city verifier to the selected credential's accepted service
    const matchingVerifier = allVerifiers.find(v => 
      v.allowedCredentialIds && v.allowedCredentialIds.includes(cred.id)
    );
    if (matchingVerifier) {
      setSelectedVerifierId(matchingVerifier.id);
    }
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
    const rogueVerifierRequest = {
      verifierDid: "did:shroud:rogue-unregistered-wifi-kiosk",
      verifierName: "Municipal Public Wi-Fi Portal (Unregistered)",
      purpose: "Public Internet Access at Central Majestic Station",
      demandedFields: [
        "National Aadhaar Number (UIDAI)",
        "Raw Date of Birth (YYYY-MM-DD)",
        "Mobile Phone Number (Primary)",
        "Permanent Residential Street Address"
      ]
    };
    const audit = evaluatePurposeFirewall(rogueVerifierRequest, currentCred);
    setFirewallAudit(audit);
    setOverAskingTriggered(true);
  };

  const handleCopyProof = () => {
    if (activeProof) {
      const payloadStr = getQrPayloadString(activeProof, qrMode);
      navigator.clipboard.writeText(payloadStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQrPng = () => {
    const svg = document.querySelector("#resident-qr-code svg") || document.querySelector("svg.qr-presentation-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = 600;
      canvas.height = 600;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 600, 600);
      ctx.drawImage(img, 0, 0, 600, 600);
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `shroudit-bbs-proof-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleDownloadProofJson = () => {
    if (!activeProof) return;
    const jsonStr = getQrPayloadString(activeProof, qrMode);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bbs-presentation-proof.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

      {/* EMBEDDED CITIZEN LOGIN & REGISTRATION PORTAL */}
      {showAuthPortal ? (
        <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-mono text-xs font-semibold">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Resident Enclave • Citizen Authentication</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white">
              Citizen Login & Enclave Access
            </h2>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              Sign in with your username & password to decrypt your zero-knowledge wallet. Newly created accounts <strong>only become valid once certified by the government</strong>.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex justify-center">
            <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => { setAuthTab('signin'); setAuthError(null); }}
                className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  authTab === 'signin'
                    ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Citizen Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => { setAuthTab('register'); setAuthError(null); }}
                className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  authTab === 'register'
                    ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Create New Account</span>
              </button>
            </div>
          </div>

          {/* Rejection / Blocking Banner: "not verified by government" */}
          {authError && (
            <div className={`p-4 rounded-2xl border transition-all animate-fadeIn ${
              authError.isNoticeOnly
                ? 'bg-amber-950/30 border-amber-500/60 text-amber-200'
                : 'bg-rose-950/40 border-rose-500/80 text-rose-200'
            }`}>
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-xl border shrink-0 ${
                  authError.isNoticeOnly
                    ? 'bg-amber-900/40 border-amber-600/60 text-amber-400'
                    : 'bg-rose-900/50 border-rose-600/70 text-rose-300'
                }`}>
                  {authError.isNoticeOnly ? <Clock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-white">
                      {authError.title}
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 text-rose-300 border border-rose-800 uppercase font-bold">
                      {authError.phrase}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {authError.message}
                  </p>

                  <div className="pt-1.5 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => navigate('/documents')}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs flex items-center space-x-1 shadow-md shadow-cyan-500/20"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Open Gov Ingestion Gateway</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] text-slate-400">
                      Accredited authorities issue certifications to unverified citizens there.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {authSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/70 text-emerald-200 flex items-center space-x-2.5 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold">{authSuccess}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN WITH USERNAME & PASSWORD */}
          {authTab === 'signin' && (
            <div className="rounded-3xl glass-panel p-6 border border-cyan-500/30 space-y-5">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Citizen Username:
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="e.g. aarav, priya, or custom username"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Password:
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Key className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-extrabold uppercase tracking-wider text-xs shadow-lg shadow-cyan-500/20 hover:brightness-110 flex items-center justify-center space-x-2 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In & Decrypt Wallet Enclave</span>
                </button>
              </form>

              {/* Quick Autofill Account Selector */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 block">
                  Quick Select Citizen Account (Click to Autofill):
                </span>
                <div className="flex flex-wrap gap-2">
                  {allResidents.map((res) => {
                    const isVerified = res.isGovernmentVerified === true || (Array.isArray(res.certifications) && res.certifications.length > 0);
                    const isSelected = loginUsername.toLowerCase() === (res.username || res.id).toLowerCase();
                    return (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => handleSelectQuickAccount(res)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-mono border transition-all flex items-center space-x-1.5 ${
                          isSelected
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-500 ring-1 ring-cyan-500/40'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <span className="font-bold">{res.name}</span>
                        <span className="text-slate-400">(@{res.username || res.id})</span>
                        {isVerified ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                            Verified
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                            Unverified
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Return to active wallet if verified */}
              {isUserVerified && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setShowAuthPortal(false)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 underline font-mono"
                  >
                    ← Return to active wallet ({currentUser?.name})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REGISTER NEW CITIZEN ACCOUNT */}
          {authTab === 'register' && (
            <div className="rounded-3xl glass-panel p-6 border border-cyan-500/30 space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
                <UserPlus className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Create New Citizen Account</h3>
              </div>

              <p className="text-xs text-slate-400">
                You can create as many citizen accounts as needed. Accounts derive local Ed25519 hardware keys, but <strong>only become valid once certified by the government</strong>.
              </p>

              <form onSubmit={handleRegisterSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Full Legal Name:</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-medium"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Username:</label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. john_doe (optional)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Password:</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Choose password"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Date of Birth:</label>
                  <input
                    type="date"
                    value={regDob}
                    onChange={(e) => setRegDob(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-medium"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Domicile (City / State):</label>
                  <input
                    type="text"
                    value={regDomicile}
                    onChange={(e) => setRegDomicile(e.target.value)}
                    placeholder="e.g. Bengaluru Urban or Mumbai"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-medium"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={regIsStudent}
                      onChange={(e) => setRegIsStudent(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <span>Enrolled Student</span>
                  </label>
                </div>

                <div className="md:col-span-2 pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-extrabold uppercase tracking-wider text-xs shadow-lg shadow-cyan-500/20 hover:brightness-110 flex items-center justify-center space-x-2 transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Register Citizen Profile (Pending Government Certification)</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Active Verified Citizen Identity Ribbon */}
          {isUserVerified && (
            <div className="p-4 rounded-2xl glass-panel border border-cyan-500/30 bg-cyan-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{currentUser?.name}</span>
                    <span className="text-[11px] font-mono text-cyan-300">@{currentUser?.username || currentUser?.id}</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold flex items-center space-x-1">
                      <BadgeCheck className="w-2.5 h-2.5" />
                      <span>Government Verified</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    DID: <span className="font-mono text-cyan-400">{currentUser?.did || "did:key:..."}</span> • Domicile: {currentUser?.domicile}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShowAuthPortal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-xs text-cyan-300 font-bold flex items-center space-x-1.5 transition-colors"
                  title="Switch to another citizen account or register new profile"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Switch Citizen / Register</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setShowAuthPortal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500 hover:bg-rose-950/30 text-xs text-slate-400 hover:text-rose-400 font-bold flex items-center space-x-1 transition-colors"
                  title="Sign out of current citizen enclave"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
      {overAskingTriggered && firewallAudit && (
        <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-600/60 text-rose-200 animate-fadeIn space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-bold text-white">ShroudIT Purpose Firewall: Request Intercepted & Blocked</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900/80 text-rose-200 border border-rose-700 font-mono">
                    {firewallAudit.statutoryProvision.split('—')[0].trim()}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-mono font-bold">
                    SEVERITY: {firewallAudit.severity}
                  </span>
                </div>
                <p className="text-xs text-rose-200/90 mt-1.5">
                  Rogue Relying Party: <span className="font-mono text-white font-bold">{firewallAudit.verifierName}</span> ({firewallAudit.verifierDid})
                </p>
                <p className="text-xs text-rose-200/80 mt-1">
                  Stated Purpose: <span className="italic text-slate-300">"{firewallAudit.purposeStatement}"</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => { setOverAskingTriggered(false); setFirewallAudit(null); }}
              className="text-xs text-rose-400 hover:text-white px-2.5 py-1 font-semibold rounded bg-rose-950/60 border border-rose-800"
            >
              Dismiss
            </button>
          </div>

          <div className="p-3 rounded-xl bg-black/60 border border-rose-900/50 space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-rose-300 font-semibold">
              <EyeOff className="w-4 h-4 text-rose-400" />
              <span>Statutory Over-Asking Violations Detected ({firewallAudit.prohibitedFieldsCount} forbidden fields demanded):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-6">
              {firewallAudit.violatingDemands.map((demand, idx) => (
                <div key={idx} className="font-mono text-[11px] text-rose-200 flex items-center space-x-1.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>{demand}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] pt-2 border-t border-rose-900/50 text-rose-300 font-mono gap-2">
            <div>
              <span className="text-slate-400">Enclave Action: </span>
              <strong className="text-white">Zero Bytes Transmitted</strong> (Execution Halted)
            </div>
            <div>
              <span className="text-slate-400">Safe Alternative: </span>
              <span className="text-cyan-300 font-bold">{firewallAudit.safeAlternative}</span>
            </div>
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

            {/* Mobile AI Consent Explainer Button */}
            <button
              onClick={() => setExplainerOpen(true)}
              className="w-full py-2.5 rounded-xl bg-cyan-950/50 text-cyan-300 border border-cyan-800/80 hover:bg-cyan-900/60 font-semibold text-xs flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Consent Explainer (EN / ಕನ್ನಡ / हिन्दी)</span>
            </button>

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
                    value={getQrPayloadString(activeProof, qrMode)}
                    size={210}
                    level="L"
                    includeMargin={true}
                    className="mx-auto"
                  />
                </div>
                <div className="flex justify-center space-x-1 text-[10px] font-mono">
                  <button
                    onClick={() => setQrMode('compact')}
                    className={`px-2 py-0.5 rounded ${qrMode === 'compact' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 bg-slate-800'}`}
                  >
                    ⚡ Fast Scan
                  </button>
                  <button
                    onClick={() => setQrMode('full')}
                    className={`px-2 py-0.5 rounded ${qrMode === 'full' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 bg-slate-800'}`}
                  >
                    🔒 Full Proof
                  </button>
                  <button
                    onClick={handleDownloadQrPng}
                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
                    title="Save QR PNG"
                  >
                    PNG
                  </button>
                  <button
                    onClick={handleCopyProof}
                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => navigate('/verifier')}
                    className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800"
                  >
                    Verifier →
                  </button>
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
                  onClick={() => setExplainerOpen(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-800 hover:bg-cyan-900/80 transition-all shadow-sm"
                  title="Open AI Multilingual Consent Explainer (DPDP Act §6)"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>AI Consent Explainer</span>
                </button>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Issued Smart City Credentials</span>
                  </h3>
                  <p className="text-xs text-slate-400">Select a card to derive a privacy-preserving selective disclosure proof</p>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => navigate('/documents')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800 hover:bg-cyan-900/90 transition-all shadow-sm"
                    title="Upload and verify government-signed document (ECDSA P-256)"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>+ Ingest Gov Document</span>
                  </button>
                  <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    {credentials.length} Cards
                  </span>
                </div>
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

                {/* AI Multilingual Consent Explainer Quick Action */}
                <button
                  type="button"
                  onClick={() => setExplainerOpen(true)}
                  className="w-full py-2 px-3 rounded-xl bg-cyan-950/40 text-cyan-300 border border-cyan-800/80 hover:bg-cyan-900/60 font-medium text-xs flex items-center justify-center space-x-2 transition-all shadow-sm"
                  title="DPDP Act §6 Contextual Consent Notice"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>View AI Consent Notice (EN / ಕನ್ನಡ / हिन्दी)</span>
                </button>

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
                        <button
                          type="button"
                          onClick={() => navigate('/verifier')}
                          className="text-[11px] px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 hover:bg-cyan-900/80 flex items-center space-x-1 font-mono transition-colors"
                          title="Open City Service Verifier Turnstile to scan or tap"
                        >
                          <span>Open Verifier →</span>
                        </button>
                      </div>
                    </div>

                    {/* QR Code Presentation Box */}
                    <div className="p-5 bg-white rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-5 shadow-xl shadow-cyan-950/30">
                      <div 
                        id="resident-qr-code"
                        onClick={() => setEnlargeQrOpen(true)}
                        className="p-2 bg-white rounded-xl border-2 border-slate-200 shrink-0 cursor-pointer hover:ring-4 hover:ring-cyan-500/50 transition-all text-center shadow-inner"
                        title="Click to expand full screen"
                      >
                        <QRCodeSVG
                          value={getQrPayloadString(activeProof, qrMode)}
                          size={240}
                          level="L"
                          includeMargin={true}
                          className="qr-presentation-svg mx-auto"
                        />
                      </div>

                      <div className="text-slate-900 text-left space-y-2.5 flex-1 w-full">
                        <div>
                          <span className="text-[10px] font-mono uppercase font-bold text-cyan-800 block">OpenID4VP Dynamic QR</span>
                          <p className="text-xs font-semibold leading-tight">Ready for Smart Turnstile / Kiosk Tap or Camera Scan</p>
                          <p className="text-[10px] text-slate-600 font-mono mt-0.5">Bound Nonce: {activeProof.nonceBinding.substring(0, 14)}...</p>
                        </div>

                        {/* Density / Speed Switcher for Cameras */}
                        <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-lg text-[10px] font-mono">
                          <button
                            type="button"
                            onClick={() => setQrMode('compact')}
                            className={`flex-1 py-1 px-2 rounded font-semibold transition-all ${
                              qrMode === 'compact'
                                ? 'bg-cyan-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="4x larger dots, scans in 0.2s on any camera or phone"
                          >
                            ⚡ Camera-Fast QR
                          </button>
                          <button
                            type="button"
                            onClick={() => setQrMode('full')}
                            className={`flex-1 py-1 px-2 rounded font-semibold transition-all ${
                              qrMode === 'full'
                                ? 'bg-slate-800 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="Embeds all raw BLS12-381 G1 curve points (ultra dense)"
                          >
                            🔒 Full Proof
                          </button>
                        </div>

                        {/* Export Action Buttons: PNG Image & JSON */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={handleDownloadQrPng}
                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center space-x-1 hover:bg-slate-800 transition-colors shadow-sm"
                            title="Save crisp 600x600 PNG image of QR code to upload into Verifier"
                          >
                            <Download className="w-3 h-3 text-cyan-400" />
                            <span>Save QR (.png)</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleDownloadProofJson}
                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-cyan-900 text-cyan-100 text-[11px] font-bold flex items-center justify-center space-x-1 hover:bg-cyan-800 transition-colors shadow-sm"
                            title="Download BBS+ Proof JSON to upload into Verifier"
                          >
                            <FileCheck className="w-3 h-3 text-cyan-300" />
                            <span>Download Proof (.json)</span>
                          </button>
                        </div>

                        <div className="flex items-center space-x-1.5 pt-0.5">
                          <span className="inline-block text-[9px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                            Zero Personal Data
                          </span>
                          <span className="inline-block text-[9px] px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 font-mono font-semibold">
                            {qrMode === 'compact' ? 'High Contrast (Camera-Ready)' : 'Deep Audit (2.2KB)'}
                          </span>
                        </div>
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
      </>
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
          <div className="relative w-full max-w-md rounded-3xl bg-[#0b101e] border-2 border-cyan-500/60 p-6 shadow-2xl shadow-cyan-950/80 space-y-4 text-center">
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

            {/* Density Selector */}
            <div className="flex items-center justify-center space-x-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono">
              <button
                onClick={() => setQrMode('compact')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all ${
                  qrMode === 'compact'
                    ? 'bg-cyan-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ⚡ Camera-Fast (High Contrast)
              </button>
              <button
                onClick={() => setQrMode('full')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all ${
                  qrMode === 'full'
                    ? 'bg-slate-700 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🔒 Full Curve Vectors
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl mx-auto inline-block shadow-2xl border-4 border-white">
              <QRCodeSVG
                value={getQrPayloadString(activeProof, qrMode)}
                size={290}
                level="L"
                includeMargin={true}
              />
            </div>

            <div className="space-y-1 text-xs font-mono">
              <p className="text-white font-bold">
                {qrMode === 'compact' ? '⚡ 572-Byte Payload: Instant Camera & Phone Capture' : '🔒 2,187-Byte Payload: Deep Mathematical Vectors'}
              </p>
              <p className="text-[11px] text-slate-400">Target: {currentVerifier.name}</p>
              <p className="text-[10px] text-emerald-400 font-bold">0 Bytes Personal Identity Leaked</p>
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

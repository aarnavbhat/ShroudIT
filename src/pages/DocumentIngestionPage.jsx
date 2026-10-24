import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileCheck, 
  Upload, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  AlertTriangle, 
  Copy, 
  Check, 
  ArrowRight, 
  Download, 
  Eye, 
  EyeOff,
  Layers, 
  Lock,
  FileText,
  Ban,
  Building2,
  RefreshCw,
  Award,
  BadgePercent,
  Train,
  Shield,
  Key,
  Cpu,
  Send,
  UserCheck,
  BadgeCheck,
  Landmark,
  Search,
  Users,
  Filter
} from 'lucide-react';
import { GOV_PUBLIC_KEY_BASE64, verifyGovernmentSignature } from '../lib/governmentSigner';
import { analyzeDocumentAndGenerateCredential, analyzeDocumentWithAi } from '../lib/documentAiEngine';
import { SAMPLE_GOV_DOCUMENTS } from '../lib/sampleGovernmentDocs';
import { saveCredential } from '../lib/walletStorage';
import { useAuth } from '../lib/authContext';

export default function DocumentIngestionPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const allResidents = auth?.allResidents || [];
  const bindGovernmentCertificationToUser = auth?.bindGovernmentCertificationToUser;
  const loginAsResident = auth?.loginAsResident;
  const currentUser = auth?.currentUser;

  const [uploadedFile, setUploadedFile] = useState(null);
  const [documentContent, setDocumentContent] = useState(null);
  const [rawTextJson, setRawTextJson] = useState('');
  const [selectedSampleId, setSelectedSampleId] = useState(null);

  // Government citizen recipient selection state
  const [selectedCitizenId, setSelectedCitizenId] = useState(() => {
    const unverified = allResidents.find(r => !r.isGovernmentVerified);
    return unverified ? unverified.id : (allResidents[0]?.id || 'res-priya');
  });
  const [certSentSuccess, setCertSentSuccess] = useState(null);
  const [isSendingCert, setIsSendingCert] = useState(false);
  const [citizenSearch, setCitizenSearch] = useState('');
  const [citizenFilter, setCitizenFilter] = useState('all'); // 'all' | 'unverified' | 'verified'

  // Filtered scalable citizen list
  const filteredResidents = allResidents.filter((res) => {
    const isVerified = res.isGovernmentVerified === true || (Array.isArray(res.certifications) && res.certifications.length > 0);
    if (citizenFilter === 'unverified' && isVerified) return false;
    if (citizenFilter === 'verified' && !isVerified) return false;

    if (!citizenSearch.trim()) return true;
    const q = citizenSearch.toLowerCase().trim();
    return (
      (res.name && res.name.toLowerCase().includes(q)) ||
      (res.username && res.username.toLowerCase().includes(q)) ||
      (res.nationalId && res.nationalId.toLowerCase().includes(q)) ||
      (res.domicile && res.domicile.toLowerCase().includes(q))
    );
  });

  // Automatically keep selected citizen aligned
  useEffect(() => {
    if (allResidents.length > 0) {
      const exists = allResidents.some(r => r.id === selectedCitizenId);
      if (!exists) {
        const unverified = allResidents.find(r => !r.isGovernmentVerified);
        setSelectedCitizenId(unverified ? unverified.id : allResidents[0].id);
      }
    }
  }, [allResidents, selectedCitizenId]);

  // Gemini AI Engine configuration state
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    try {
      return localStorage.getItem('shroudit_gemini_api_key') || (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || '';
    } catch (e) {
      return (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || '';
    }
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [keySavedNotice, setKeySavedNotice] = useState(false);
  const [serverHasGemini, setServerHasGemini] = useState(false);
  const [aiProcessingStatus, setAiProcessingStatus] = useState('');

  // Verification & AI processing state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [generatedCredential, setGeneratedCredential] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isSavedToWallet, setIsSavedToWallet] = useState(false);

  // Check backend Gemini status on mount
  useEffect(() => {
    fetch('http://localhost:4000/api/ai/status')
      .then(res => res.json())
      .then(data => {
        if (data.geminiConfigured) {
          setServerHasGemini(true);
        }
      })
      .catch(() => {});
  }, []);

  // Save Gemini API key to local storage
  const handleSaveApiKey = () => {
    try {
      localStorage.setItem('shroudit_gemini_api_key', geminiApiKey.trim());
      setKeySavedNotice(true);
      setTimeout(() => setKeySavedNotice(false), 2500);
    } catch (e) {}
  };

  // Clear Gemini API key
  const handleClearApiKey = () => {
    try {
      localStorage.removeItem('shroudit_gemini_api_key');
      setGeminiApiKey('');
    } catch (e) {}
  };

  // Copy Govt Public Key
  const handleCopyKey = () => {
    navigator.clipboard.writeText(GOV_PUBLIC_KEY_BASE64);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Handle disk file upload (JSON or Text)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    setSelectedSampleId(null);
    setVerificationResult(null);
    setGeneratedCredential(null);
    setIsSavedToWallet(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setRawTextJson(text);
      try {
        const parsed = JSON.parse(text);
        setDocumentContent(parsed);
      } catch (err) {
        setDocumentContent({ rawText: text, fileName: file.name });
      }
    };
    reader.readAsText(file);
  };

  // Select pre-loaded sample government document
  const handleSelectSample = (sample) => {
    setSelectedSampleId(sample.id);
    setUploadedFile({ name: `${sample.id}.json`, size: 1024 });
    setDocumentContent(sample.data);
    setRawTextJson(JSON.stringify(sample.data, null, 2));
    setVerificationResult(null);
    setGeneratedCredential(null);
    setIsSavedToWallet(false);
  };

  // Run Cryptographic Verification + Gemini AI Purpose Limitation Pipeline
  const handleVerifyAndAnalyze = async () => {
    if (!documentContent) return;

    setIsVerifying(true);
    setAiProcessingStatus("Authenticating Government Cryptographic Signature (ECDSA P-256)...");
    setVerificationResult(null);
    setGeneratedCredential(null);

    try {
      // 1. Cryptographic Signature Verification against Government Public Key
      const sigCheck = await verifyGovernmentSignature(documentContent, null, rawTextJson);

      if (!sigCheck.valid) {
        setVerificationResult({
          valid: false,
          reason: sigCheck.reason,
          algorithm: sigCheck.algorithm,
          publicKey: sigCheck.publicKey
        });
        setIsVerifying(false);
        setAiProcessingStatus('');
        return;
      }

      setVerificationResult({
        valid: true,
        algorithm: sigCheck.algorithm,
        signatureFormat: sigCheck.signatureFormat,
        derSignatureHex: sigCheck.derSignatureHex,
        publicKey: sigCheck.publicKey,
        verifiedAt: sigCheck.verifiedAt,
        issuerAuthority: sigCheck.issuerAuthority
      });

      // 2. Real AI Categorization & Purpose Limitation via Google Gemini
      const activeKey = geminiApiKey?.trim() || null;
      setAiProcessingStatus(
        activeKey || serverHasGemini
          ? "Prompting Google Gemini 2.5 Flash to comprehend document & decide eligible categories..."
          : "Evaluating document eligibility & DPDP Act §6 statutory rules..."
      );

      const credCard = await analyzeDocumentWithAi({
        document: documentContent,
        verificationMeta: sigCheck,
        geminiApiKey: activeKey,
        rawText: rawTextJson
      });

      setGeneratedCredential(credCard);
    } catch (err) {
      console.error("Verification and AI processing error:", err);
    } finally {
      setIsVerifying(false);
      setAiProcessingStatus('');
    }
  };

  // Save dynamically generated credential tab to Resident Wallet
  const handleSaveToWallet = async () => {
    if (!generatedCredential) return;

    try {
      const targetCitizen = allResidents.find(r => r.id === selectedCitizenId) || currentUser || allResidents[0];
      const enrichedCred = {
        ...generatedCredential,
        holderId: targetCitizen?.id,
        holderUsername: targetCitizen?.username,
        holderDid: targetCitizen?.did,
        holderName: targetCitizen?.name
      };

      await saveCredential(enrichedCred);
      if (bindGovernmentCertificationToUser && targetCitizen) {
        bindGovernmentCertificationToUser(targetCitizen.id, enrichedCred);
      }
      if (loginAsResident && targetCitizen) {
        loginAsResident(targetCitizen);
      }
      try {
        localStorage.setItem('shroudit_selected_credential_id', enrichedCred.id);
      } catch (err) {}
      setIsSavedToWallet(true);

      // Auto-navigate to resident wallet after 750ms so user can immediately derive proofs
      setTimeout(() => {
        navigate('/wallet');
      }, 750);
    } catch (e) {
      console.error("Failed to save credential to wallet enclave:", e);
    }
  };

  // Government officer sends certification to selected citizen
  const handleSendCertificationToCitizen = () => {
    if (!generatedCredential || !selectedCitizenId) return;

    setIsSendingCert(true);
    const target = allResidents.find(r => r.id === selectedCitizenId);

    setTimeout(() => {
      const enrichedCred = {
        ...generatedCredential,
        holderId: target?.id,
        holderUsername: target?.username,
        holderDid: target?.did,
        holderName: target?.name
      };
      if (bindGovernmentCertificationToUser && target) {
        bindGovernmentCertificationToUser(target.id, enrichedCred);
      }
      setIsSendingCert(false);
      setCertSentSuccess({
        citizen: target,
        credential: enrichedCred,
        timestamp: new Date().toLocaleTimeString()
      });
    }, 450);
  };

  // Download sample document as real JSON file to computer
  const handleDownloadSample = (sample, e) => {
    e.stopPropagation();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sample.data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${sample.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>Accredited Ingestion Gateway</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              NIST P-256 ECDSA
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Government Document Ingestion & AI Verification
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Upload official government-signed documents. The system verifies cryptographic signatures with the Government Authority Public Key, then applies AI purpose limitation to generate compliant zero-knowledge credential tabs.
          </p>
        </div>

        <button
          onClick={() => navigate('/wallet')}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-mono text-cyan-300 bg-slate-900 border border-slate-700 hover:border-cyan-500 transition-colors shrink-0 self-start md:self-auto"
        >
          <span>View Resident Wallet</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Government Public Key Verification Standard Ribbon */}
      <div className="rounded-2xl glass-panel p-4 border border-cyan-500/30 bg-cyan-950/20 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Accredited Government Authority Public Key (ECDSA P-256 / SHA-256)
              </span>
              <p className="text-[11px] text-slate-400">
                Only documents cryptographically signed by this authority key are admitted for wallet minting.
              </p>
            </div>
          </div>
          <button
            onClick={handleCopyKey}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-mono text-cyan-300 hover:text-white transition-colors self-start sm:self-auto shrink-0"
          >
            {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
          </button>
        </div>
        <div className="p-2.5 rounded-xl bg-black/60 font-mono text-[11px] text-cyan-300/90 break-all select-all border border-slate-800">
          {GOV_PUBLIC_KEY_BASE64}
        </div>
      </div>

      {/* Google Gemini AI Purpose Limitation Engine Configuration Bar */}
      <div className="rounded-2xl glass-panel p-4 border border-violet-500/30 bg-violet-950/20 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-900/60 border border-violet-500/40 flex items-center justify-center text-violet-300 shrink-0">
              <Sparkles className="w-4 h-4 text-violet-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Google Gemini 2.5 Flash Purpose Limitation Engine
                </span>
                {(geminiApiKey || serverHasGemini) ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Live LLM Connected</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                    Awaiting Gemini API Key
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Gemini dynamically analyzes uploaded files, comprehends income & qualifications, and decides which categories & ZK-predicates to form under DPDP Act §6.
              </p>
            </div>
          </div>

          {keySavedNotice && (
            <span className="text-xs text-emerald-400 font-mono flex items-center space-x-1 shrink-0">
              <Check className="w-3.5 h-3.5" />
              <span>Key saved to local session!</span>
            </span>
          )}
        </div>

        {/* API Key Input Field */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-violet-900/40">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Key className="w-3.5 h-3.5" />
            </div>
            <input
              type={showApiKey ? 'text' : 'password'}
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="Paste Google Gemini API Key (e.g. AIzaSy...)"
              className="w-full pl-9 pr-10 py-2 rounded-xl text-xs font-mono bg-black/60 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
            >
              {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleSaveApiKey}
              className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-colors flex items-center space-x-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Key</span>
            </button>
            {geminiApiKey && (
              <button
                type="button"
                onClick={handleClearApiKey}
                className="px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-xs transition-colors"
                title="Clear Key"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Upload & Select (Left 6 cols) vs Verification & AI Decision (Right 6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: File Ingestion & Pre-signed Sample Templates */}
        <div className="lg:col-span-6 space-y-5">
          {/* File Upload Dropzone */}
          <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Upload Government Signed Document</span>
            </h3>

            <div className="relative rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-500/70 p-6 flex flex-col items-center justify-center text-center space-y-3 bg-black/40 transition-colors">
              <input
                type="file"
                accept=".json,.txt,.pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  {uploadedFile ? uploadedFile.name : 'Choose a signed JSON document or drag & drop'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Accepts `.json`, `.txt` containing embedded ECDSA P-256 signature
                </p>
              </div>
              <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-slate-800 text-slate-300">
                Browse Local Files
              </span>
            </div>
          </div>

          {/* Pre-authenticated Sample Government Documents (Instant 1-Click Testing) */}
          <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Interactive Sample Documents</span>
                </h3>
                <p className="text-xs text-slate-400">Click any document to test cryptographic verification & AI rules:</p>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                {SAMPLE_GOV_DOCUMENTS.length} Test Cases
              </span>
            </div>

            <div className="space-y-2.5">
              {SAMPLE_GOV_DOCUMENTS.map((sample) => {
                const isSelected = selectedSampleId === sample.id;
                const isForged = sample.id === 'doc-forged-tampered';
                return (
                  <div
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-500 shadow-md shadow-cyan-950/50'
                        : isForged
                        ? 'bg-rose-950/20 border-rose-900/60 hover:bg-rose-950/40'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1 pr-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-semibold ${isForged ? 'text-rose-300' : 'text-slate-200'}`}>
                          {sample.title}
                        </span>
                        {isForged && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                            Forged Signature
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{sample.department}</p>
                      <p className={`text-[10px] font-mono ${isForged ? 'text-rose-400' : 'text-cyan-400'}`}>
                        Expected: {sample.expectedOutcome}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleDownloadSample(sample, e)}
                        title="Download raw signed JSON file to test disk upload"
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-cyan-300 hover:bg-slate-700 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        isSelected ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {isSelected ? 'Loaded' : 'Select'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trigger Verification Action Button */}
          {documentContent && (
            <button
              onClick={handleVerifyAndAnalyze}
              disabled={isVerifying}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>{aiProcessingStatus || "Verifying P-256 Signature & Evaluating AI Rules..."}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 fill-black" />
                  <span>Cryptographically Verify Document & Run AI Categorization</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Right Column: Live Verification Pipeline & AI Generated Credential Tab */}
        <div className="lg:col-span-6 space-y-5">
          {/* Empty State */}
          {!documentContent && !verificationResult && (
            <div className="rounded-2xl glass-panel p-12 border border-slate-800 text-center space-y-3 flex flex-col items-center justify-center min-h-[380px]">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-300">No Document Loaded Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Upload a government-signed document or select a sample template on the left to trigger cryptographic signature checks and AI category decisions.
              </p>
            </div>
          )}

          {/* Verification Failed: Signature Mismatch / Tampered Document */}
          {verificationResult && !verificationResult.valid && (
            <div className="rounded-2xl glass-panel p-6 border-2 border-rose-500/50 bg-rose-950/20 space-y-4 animate-fadeIn">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-rose-950 text-rose-400 border border-rose-800 shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Cryptographic Verification Rejected</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 border border-rose-700 font-bold uppercase">
                    Upload Blocked • Signature Invalid
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-rose-900/40 text-xs text-rose-200 leading-relaxed font-mono">
                {verificationResult.reason}
              </div>

              <div className="space-y-1.5 text-xs text-slate-400">
                <p className="font-semibold text-slate-200">Security Guarantee:</p>
                <p>
                  Documents must be signed by the government body public key (`{GOV_PUBLIC_KEY_BASE64.substring(0, 14)}...`).
                  Any altered numbers, changed names, or unsigned documents are quarantined immediately.
                </p>
              </div>
            </div>
          )}

          {/* Verification Success: Cryptographic Check Passed + AI Decision Pipeline */}
          {verificationResult && verificationResult.valid && generatedCredential && (
            <div className="space-y-5 animate-fadeIn">
              {/* Step 1: Cryptographic Seal Badge */}
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Government Signature Authenticated
                      </h4>
                      <p className="text-[11px] text-emerald-400 font-mono">
                        {verificationResult.algorithm}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 border border-emerald-700">
                    PASSED
                  </span>
                </div>
                {verificationResult.signatureFormat && (
                  <div className="pt-2 border-t border-emerald-900/50 flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono text-emerald-300/90">
                    <span>Format: {verificationResult.signatureFormat}</span>
                    {verificationResult.derSignatureHex && (
                      <span className="text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800" title={verificationResult.derSignatureHex}>
                        DER: {verificationResult.derSignatureHex.substring(0, 16)}...
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: AI Eligibility & Disqualification Audit Box */}
              <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>AI Purpose Limitation & Categorization Decision</span>
                  </span>
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800 flex items-center space-x-1">
                    <Cpu className="w-3 h-3 text-cyan-400" />
                    <span>{generatedCredential.aiEngine || "DPDP Act §6 Compliant"}</span>
                  </span>
                </div>

                {generatedCredential.rawData?.summary && (
                  <div className="p-3 rounded-xl bg-violet-950/20 border border-violet-800/40 text-xs text-violet-200">
                    <strong className="text-violet-300 block mb-0.5">AI Synthesis:</strong>
                    {generatedCredential.rawData.summary}
                  </div>
                )}

                <div className="space-y-2">
                  {generatedCredential.aiAuditReport.decisions.map((dec, idx) => (
                    <div key={idx} className="text-xs text-slate-300 flex items-start space-x-2">
                      <span className="text-cyan-400 font-mono text-[11px] mt-0.5">↳</span>
                      <span>{dec}</span>
                    </div>
                  ))}
                </div>

                {/* Specifically Highlight Disqualified Categories (e.g. Income > 3L) */}
                {generatedCredential.aiAuditReport.disqualifiedCategories.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-rose-950/30 border border-rose-800/60 space-y-1.5">
                    <span className="text-xs font-bold text-rose-300 flex items-center space-x-1.5">
                      <Ban className="w-3.5 h-3.5 text-rose-400" />
                      <span>Disqualified Categories (Strictly Suppressed by AI):</span>
                    </span>
                    {generatedCredential.aiAuditReport.disqualifiedCategories.map((dis, idx) => (
                      <div key={idx} className="text-[11px] font-mono text-rose-200/90 pl-5">
                        ✕ <strong className="text-white">{dis.label}:</strong> {dis.reason}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 3: Generated Credential Tab (Card Preview) */}
              <div className="rounded-2xl glass-panel-glow p-6 border border-cyan-500/40 bg-slate-900/90 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                        Generated Credential Tab
                      </span>
                      {generatedCredential.aiEngine && generatedCredential.aiEngine.includes('Gemini') && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800 flex items-center space-x-1">
                          <Sparkles className="w-2.5 h-2.5 text-violet-400" />
                          <span>Gemini Live Reasoned</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-white mt-0.5">
                      {generatedCredential.title}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {generatedCredential.category}
                  </span>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <p>Issuer: <span className="text-slate-200 font-semibold">{generatedCredential.issuer}</span></p>
                  <p>Document Ref: <span className="font-mono text-cyan-300">{generatedCredential.documentNumber}</span></p>
                  <p>Holder: <span className="text-slate-200">{generatedCredential.rawData.fullName}</span></p>
                </div>

                {/* The only generated options he is eligible for */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-slate-300 block">
                    AI-Granted Zero-Knowledge Predicates (Only Eligible Options Generated):
                  </span>
                  <div className="space-y-2">
                    {generatedCredential.predicates.map((p) => (
                      <div key={p.id} className="p-2.5 rounded-xl bg-black/60 border border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <span className="font-semibold text-white">{p.label}</span>
                            <span className="block text-[10px] text-slate-400">{p.statement}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                          BBS+ ZK-Proof
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 3B: Government Citizen Recipient Dispatch Panel */}
                <div className="pt-4 border-t border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Landmark className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Select Citizen Recipient & Issue Certification
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                      Authority Dispatch
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    The government body selects which citizen account should receive this official certification. Unverified accounts become accredited and authorized to log in.
                  </p>

                  {/* Scalable Search & Filter Bar */}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={citizenSearch}
                          onChange={(e) => setCitizenSearch(e.target.value)}
                          placeholder="Search citizens by name, @username, civic ID, or city..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/60 border border-slate-700/80 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      {/* Filter Chips */}
                      <div className="flex items-center space-x-1 shrink-0 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-[10px] font-mono">
                        <button
                          type="button"
                          onClick={() => setCitizenFilter('all')}
                          className={`px-2 py-1 rounded-lg transition-all ${
                            citizenFilter === 'all'
                              ? 'bg-cyan-500 text-black font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          All ({allResidents.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCitizenFilter('unverified')}
                          className={`px-2 py-1 rounded-lg transition-all ${
                            citizenFilter === 'unverified'
                              ? 'bg-rose-500 text-black font-bold'
                              : 'text-rose-400 hover:text-rose-300'
                          }`}
                        >
                          🔴 Unverified ({allResidents.filter(r => !r.isGovernmentVerified).length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCitizenFilter('verified')}
                          className={`px-2 py-1 rounded-lg transition-all ${
                            citizenFilter === 'verified'
                              ? 'bg-emerald-500 text-black font-bold'
                              : 'text-emerald-400 hover:text-emerald-300'
                          }`}
                        >
                          🟢 Verified ({allResidents.filter(r => r.isGovernmentVerified).length})
                        </button>
                      </div>
                    </div>

                    {/* Scalable High-Density Citizen List */}
                    <div className="rounded-xl border border-slate-800 bg-black/50 divide-y divide-slate-800/80 max-h-52 overflow-y-auto pr-1">
                      {filteredResidents.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          No citizens found matching "{citizenSearch}".
                        </div>
                      ) : (
                        filteredResidents.map((res) => {
                          const isSelected = selectedCitizenId === res.id;
                          const isVerified = res.isGovernmentVerified === true || (Array.isArray(res.certifications) && res.certifications.length > 0);
                          return (
                            <div
                              key={res.id}
                              onClick={() => setSelectedCitizenId(res.id)}
                              className={`px-3 py-2 cursor-pointer transition-colors flex items-center justify-between text-xs gap-2 ${
                                isSelected
                                  ? 'bg-cyan-950/70 border-l-4 border-l-cyan-400 ring-1 ring-cyan-500/30'
                                  : 'hover:bg-slate-900/60'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'border-cyan-400 bg-cyan-400'
                                    : 'border-slate-600 bg-slate-900'
                                }`}>
                                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black"></div>}
                                </div>
                                <span className="font-bold text-white truncate">{res.name}</span>
                                <span className="font-mono text-[10px] text-cyan-400 shrink-0">@{res.username || res.id}</span>
                                <span className="text-[11px] text-slate-400 hidden sm:inline truncate">• {res.domicile}</span>
                              </div>

                              <div className="flex items-center space-x-2 shrink-0">
                                <span className="text-[10px] font-mono text-slate-500 hidden md:inline">
                                  {res.nationalId}
                                </span>
                                {isVerified ? (
                                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center space-x-0.5 font-bold">
                                    <BadgeCheck className="w-2.5 h-2.5" />
                                    <span>Verified</span>
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 flex items-center space-x-0.5 font-bold">
                                    <Lock className="w-2.5 h-2.5" />
                                    <span>Unverified</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Active Selected Recipient Summary Bar */}
                    {selectedCitizenId && (
                      <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-slate-300 flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 truncate">
                          <span className="text-slate-400 font-semibold">Selected Recipient:</span>
                          <span className="text-white font-bold">{allResidents.find(r => r.id === selectedCitizenId)?.name}</span>
                          <span className="text-cyan-400 font-mono">(@{allResidents.find(r => r.id === selectedCitizenId)?.username})</span>
                          <span className="text-slate-400 hidden sm:inline">— {allResidents.find(r => r.id === selectedCitizenId)?.domicile}</span>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 shrink-0">
                          {allResidents.find(r => r.id === selectedCitizenId)?.isGovernmentVerified ? "🟢 Verified" : "🔴 Pending"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dispatch Action Button */}
                  <button
                    type="button"
                    onClick={handleSendCertificationToCitizen}
                    disabled={isSendingCert || !selectedCitizenId}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 hover:brightness-110 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isSendingCert ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        <span>Binding & Sending Government Certification...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          Send Certification to {allResidents.find(r => r.id === selectedCitizenId)?.name || "Selected Citizen"}
                        </span>
                      </>
                    )}
                  </button>

                  {/* Confirmation Notice */}
                  {certSentSuccess && (
                    <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/70 text-emerald-200 space-y-2 animate-fadeIn">
                      <div className="flex items-center space-x-2 font-bold text-white text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Certification Sent! Account is now Verified by Government</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        <strong>{certSentSuccess.citizen.name}</strong> has received this official government credential. Their account is validated and they can now log in at the Citizen Login portal.
                      </p>
                      <div className="pt-1.5 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => {
                            if (loginAsResident) loginAsResident(certSentSuccess.citizen);
                            navigate('/wallet');
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center space-x-1 shadow-md shadow-emerald-500/20"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Open Resident Wallet as {certSentSuccess.citizen.name}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => navigate('/wallet')}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-semibold"
                        >
                          Return to Wallet Login Portal
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Save to Resident Wallet CTA */}
                <button
                  onClick={handleSaveToWallet}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all flex items-center justify-center space-x-2"
                >
                  {isSavedToWallet ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Saved! Redirecting to Resident Wallet...</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-4 h-4" />
                      <span>Save as Active Tab in Resident Wallet Enclave & Derive BBS+ Proof</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

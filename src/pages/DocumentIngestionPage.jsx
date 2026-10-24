import React, { useState } from 'react';
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
  Layers, 
  Lock,
  FileText,
  Ban,
  Building2,
  RefreshCw,
  Award,
  BadgePercent,
  Train,
  Shield
} from 'lucide-react';
import { GOV_PUBLIC_KEY_BASE64, verifyGovernmentSignature } from '../lib/governmentSigner';
import { analyzeDocumentAndGenerateCredential } from '../lib/documentAiEngine';
import { SAMPLE_GOV_DOCUMENTS } from '../lib/sampleGovernmentDocs';
import { saveCredential } from '../lib/walletStorage';

export default function DocumentIngestionPage() {
  const navigate = useNavigate();

  const [uploadedFile, setUploadedFile] = useState(null);
  const [documentContent, setDocumentContent] = useState(null);
  const [rawTextJson, setRawTextJson] = useState('');
  const [selectedSampleId, setSelectedSampleId] = useState(null);

  // Verification & AI processing state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [generatedCredential, setGeneratedCredential] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isSavedToWallet, setIsSavedToWallet] = useState(false);

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

  // Run Cryptographic Verification + AI Categorization Pipeline
  const handleVerifyAndAnalyze = async () => {
    if (!documentContent) return;

    setIsVerifying(true);
    setVerificationResult(null);
    setGeneratedCredential(null);

    // Simulate brief cryptographic check delay for UX feedback
    setTimeout(async () => {
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
        return;
      }

      // 2. AI Categorization & Purpose Limitation Engine
      // Evaluates categories person is eligible for (e.g. blocks income < 3L if income > 3L)
      const credCard = analyzeDocumentAndGenerateCredential({
        document: documentContent,
        verificationMeta: sigCheck
      });

      setVerificationResult({
        valid: true,
        algorithm: sigCheck.algorithm,
        signatureFormat: sigCheck.signatureFormat,
        derSignatureHex: sigCheck.derSignatureHex,
        publicKey: sigCheck.publicKey,
        verifiedAt: sigCheck.verifiedAt,
        issuerAuthority: sigCheck.issuerAuthority
      });

      setGeneratedCredential(credCard);
      setIsVerifying(false);
    }, 600);
  };

  // Save dynamically generated credential tab to Resident Wallet
  const handleSaveToWallet = async () => {
    if (!generatedCredential) return;

    try {
      await saveCredential(generatedCredential);
      try {
        localStorage.setItem('shroudit_selected_credential_id', generatedCredential.id);
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
                5 Test Cases
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
                  <span>Verifying P-256 Signature & Evaluating AI Rules...</span>
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
                  <span className="text-[10px] font-mono text-cyan-400">
                    DPDP Act §6 Compliant
                  </span>
                </div>

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
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block font-bold">
                      Generated Credential Tab
                    </span>
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

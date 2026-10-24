import React, { useState } from 'react';
import { 
  Landmark, 
  Key, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Plus, 
  History, 
  ArrowRight,
  Database,
  Lock,
  Cpu
} from 'lucide-react';
import { useAuth } from '../lib/authContext';

export default function IssuerStudioPage() {
  const { 
    currentUser, 
    currentRole, 
    allResidents, 
    issueCredentialToResident 
  } = useAuth();

  const [selectedResidentId, setSelectedResidentId] = useState(allResidents[0]?.id || 'res-aarav');
  const [templateType, setTemplateType] = useState('transit');
  const [cardTitle, setCardTitle] = useState('BMTC Student Transit Pass');
  const [cardCategory, setCardCategory] = useState('Public Transit Concession');
  const [isMinting, setIsMinting] = useState(false);
  const [mintedCredential, setMintedCredential] = useState(null);
  const [issuanceHistory, setIssuanceHistory] = useState([]);

  // Predicate toggles for the newly minted credential
  const [predAge18, setPredAge18] = useState(true);
  const [predResident, setPredResident] = useState(true);
  const [predStudent, setPredStudent] = useState(true);
  const [predIncomeLow, setPredIncomeLow] = useState(false);
  const [customAttributeName, setCustomAttributeName] = useState('');

  const targetResident = allResidents.find(r => r.id === selectedResidentId) || allResidents[0];

  const handleTemplateChange = (tmpl) => {
    setTemplateType(tmpl);
    if (tmpl === 'transit') {
      setCardTitle('BMTC Student Transit Pass');
      setCardCategory('Public Transit Concession');
      setPredStudent(true);
      setPredAge18(true);
      setPredResident(true);
    } else if (tmpl === 'welfare') {
      setCardTitle('Yuva Nidhi Skilling Stipend Scheme');
      setCardCategory('Citizen Welfare');
      setPredIncomeLow(true);
      setPredResident(true);
      setPredStudent(false);
    } else if (tmpl === 'resident') {
      setCardTitle('Karnataka Smart City Domicile Certificate');
      setCardCategory('Municipal Identity');
      setPredResident(true);
      setPredAge18(true);
      setPredStudent(false);
    } else {
      setCardTitle('Custom Municipal Welfare Pass');
      setCardCategory('Government Service');
    }
  };

  const handleMintCredential = () => {
    setIsMinting(true);
    setMintedCredential(null);

    setTimeout(() => {
      const predicates = [];
      if (predAge18) {
        predicates.push({ id: "over_18", label: "Age ≥ 18", statement: "Holder is 18 years or older", value: true });
      }
      if (predResident) {
        predicates.push({ id: "blr_resident", label: "Bengaluru Resident", statement: `Holder resides in ${targetResident.domicile}`, value: true });
      }
      if (predStudent) {
        predicates.push({ id: "valid_student", label: "Student Concession", statement: "Enrolled student at accredited institution", value: true });
      }
      if (predIncomeLow) {
        predicates.push({ id: "income_below_3L", label: "Income Under 3L", statement: "Family annual income below ₹3,00,000 threshold", value: true });
      }
      if (customAttributeName.trim()) {
        const cleanId = customAttributeName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        predicates.push({ id: cleanId, label: customAttributeName.trim(), statement: `Verified ${customAttributeName.trim()}`, value: true });
      }

      const newCard = issueCredentialToResident({
        residentId: targetResident.id,
        title: cardTitle,
        category: cardCategory,
        rawData: {
          issuanceEpoch: 142,
          schemeCode: "KA-GOV-BLR-2026"
        },
        predicates
      });

      setMintedCredential(newCard);
      setIssuanceHistory(prev => [newCard, ...prev]);
      setIsMinting(false);
    }, 600);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono uppercase tracking-widest text-purple-400 font-semibold flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
              <span>Civic Credential Issuance Studio</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-mono">
              BLS12-381 G2 Signing Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Government Authority Minting Kiosk
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Digitally sign and issue tamper-proof smart city credentials directly into any citizen's encrypted local enclave.
          </p>
        </div>

        {/* Current Issuer Identity Pill */}
        <div className="p-3 rounded-2xl bg-slate-900 border border-purple-500/40 text-left space-y-0.5">
          <span className="text-[10px] font-mono text-purple-300 uppercase block font-bold">
            Authenticated Authority
          </span>
          <p className="text-xs font-bold text-white truncate max-w-xs">{currentUser?.name || "Karnataka CeG"}</p>
          <p className="text-[10px] font-mono text-slate-400 truncate max-w-xs">{currentUser?.did || "did:shroud:gov-karnataka-ceg"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Minting Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl glass-panel p-6 border border-purple-500/30 space-y-5">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Issue New Civic Credential</h3>
                <p className="text-xs text-slate-400">Signs attributes with municipal BLS12-381 private key</p>
              </div>
            </div>

            {/* Target Citizen Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Target Citizen (Recipient DID):
              </label>
              <select
                value={selectedResidentId}
                onChange={(e) => setSelectedResidentId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-400"
              >
                {allResidents.map(res => (
                  <option key={res.id} value={res.id}>
                    {res.name} — {res.domicile} ({res.nationalId})
                  </option>
                ))}
              </select>
              <p className="text-[11px] font-mono text-slate-400 mt-1">
                Recipient Enclave DID: <span className="text-cyan-400">{targetResident.did}</span>
              </p>
            </div>

            {/* Template Presets */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Credential Scheme Template:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'transit', label: 'Transit Pass' },
                  { id: 'welfare', label: 'Yuva Nidhi' },
                  { id: 'resident', label: 'Domicile Card' },
                  { id: 'custom', label: 'Custom Scheme' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTemplateChange(t.id)}
                    className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                      templateType === t.id
                        ? 'bg-purple-950/80 border-purple-500 text-purple-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Credential Title:</label>
                <input
                  type="text"
                  value={cardTitle}
                  onChange={(e) => setCardTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Category / Purpose:</label>
                <input
                  type="text"
                  value={cardCategory}
                  onChange={(e) => setCardCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            {/* Attested Predicates Toggles */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-300 block">
                Attested Selective Disclosure Predicates:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={predAge18}
                    onChange={(e) => setPredAge18(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-purple-500 focus:ring-0"
                  />
                  <span>Attest Age ≥ 18 (True)</span>
                </label>

                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={predResident}
                    onChange={(e) => setPredResident(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-purple-500 focus:ring-0"
                  />
                  <span>Attest Domicile Residency</span>
                </label>

                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={predStudent}
                    onChange={(e) => setPredStudent(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-purple-500 focus:ring-0"
                  />
                  <span>Attest Student Concession</span>
                </label>

                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={predIncomeLow}
                    onChange={(e) => setPredIncomeLow(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-purple-500 focus:ring-0"
                  />
                  <span>Attest Income Under ₹3L</span>
                </label>
              </div>

              {/* Custom predicate input */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center space-x-2">
                <input
                  type="text"
                  value={customAttributeName}
                  onChange={(e) => setCustomAttributeName(e.target.value)}
                  placeholder="Add custom predicate (e.g. Disability Concession)"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-black/60 border border-slate-700 text-xs text-white"
                />
                <span className="text-[10px] font-mono text-purple-400">Optional</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleMintCredential}
              disabled={isMinting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 text-white font-extrabold uppercase tracking-wider text-xs shadow-lg shadow-purple-500/20 hover:brightness-110 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {isMinting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing BLS12-381 Polynomials...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Digitally Sign & Deliver to Citizen Enclave</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Minted Output & History */}
        <div className="lg:col-span-5 space-y-6">
          {/* Latest Minted Card Preview */}
          {mintedCredential ? (
            <div className="p-5 rounded-3xl bg-slate-900 border border-emerald-500/50 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5 font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>CREDENTIAL ISSUED & DELIVERED</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">{mintedCredential.issuedAt}</span>
              </div>

              {/* Holographic Card Render */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/40 space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono text-purple-300 uppercase">{mintedCredential.category}</span>
                    <h4 className="text-sm font-bold text-white mt-0.5">{mintedCredential.title}</h4>
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 font-mono">
                  Holder: <strong className="text-white">{mintedCredential.rawData.fullName}</strong>
                </p>

                <div className="flex flex-wrap gap-1 pt-1">
                  {mintedCredential.predicates.map(p => (
                    <span key={p.id} className="text-[9px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800 font-mono">
                      ✓ {p.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cryptographic breakdown */}
              <div className="p-3 rounded-xl bg-black/60 font-mono text-[10px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Curve Signature (A):</span>
                  <span className="text-purple-300 truncate max-w-[180px]">{mintedCredential.bbsSignature.A_hex}</span>
                </div>
                <div className="flex justify-between">
                  <span>Randomized Factor (e):</span>
                  <span className="text-cyan-400">{mintedCredential.bbsSignature.e.substring(0, 16)}...</span>
                </div>
                <div className="flex justify-between">
                  <span>Enclave Status:</span>
                  <span className="text-emerald-400 font-bold">Saved in IndexedDB</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-dashed border-slate-800 text-center space-y-2 flex flex-col items-center justify-center min-h-[220px]">
              <Cpu className="w-8 h-8 text-slate-600" />
              <p className="text-xs text-slate-400 font-medium">Ready to issue new credentials</p>
              <p className="text-[10px] text-slate-500 font-mono max-w-xs">
                Select a citizen and template, then click "Digitally Sign & Deliver"
              </p>
            </div>
          )}

          {/* Minting Audit Log */}
          <div className="rounded-3xl glass-panel p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5 font-mono">
                <History className="w-3.5 h-3.5 text-purple-400" />
                <span>Authority Issuance Log</span>
              </h4>
              <span className="text-[10px] font-mono text-slate-500">{issuanceHistory.length} Minted</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
              {issuanceHistory.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic text-center py-4">No credentials minted in this active session yet.</p>
              ) : (
                issuanceHistory.map(item => (
                  <div key={item.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">{item.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Recipient: {item.rawData.fullName}</span>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      DELIVERED
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

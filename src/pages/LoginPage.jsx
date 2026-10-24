import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Smartphone, 
  Building2, 
  CheckCircle2, 
  Plus, 
  ArrowRight, 
  Lock, 
  Key, 
  Sparkles, 
  UserCheck, 
  Landmark, 
  Cpu, 
  Eye, 
  FileText,
  BadgeCheck,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../lib/authContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { 
    currentRole,
    currentUser,
    allResidents, 
    allIssuers, 
    allVerifiers, 
    loginAsResident, 
    createCustomResident,
    verifyAndLoginGovIssuer,
    accreditNewGovDepartment,
    loginAsVerifier,
    registerNewVerifierBody
  } = useAuth();

  const [activeTab, setActiveTab] = useState(currentRole || 'resident');

  // Custom Resident registration form state
  const [newResName, setNewResName] = useState('');
  const [newResDob, setNewResDob] = useState('2002-05-18');
  const [newResDomicile, setNewResDomicile] = useState('Bengaluru Urban (Indiranagar)');
  const [newResIsStudent, setNewResIsStudent] = useState(true);

  // Custom Gov Issuer accreditation form state
  const [newIssuerName, setNewIssuerName] = useState('');
  const [newIssuerDept, setNewIssuerDept] = useState('');
  const [newIssuerJurisdiction, setNewIssuerJurisdiction] = useState('Karnataka State');
  const [challengeAuthenticating, setChallengeAuthenticating] = useState(false);

  // Custom Verifier registration form state
  const [newVerName, setNewVerName] = useState('');
  const [newVerDept, setNewVerDept] = useState('Municipal Services');
  const [newVerPurpose, setNewVerPurpose] = useState('Age and residence verification for automated service access');

  // Handlers
  const handleSelectResident = (res) => {
    loginAsResident(res);
    navigate('/wallet');
  };

  const handleCreateResident = (e) => {
    e.preventDefault();
    if (!newResName.trim()) return;
    const created = createCustomResident({
      name: newResName.trim(),
      dob: newResDob,
      domicile: newResDomicile,
      isStudent: newResIsStudent
    });
    navigate('/wallet');
  };

  const handleGovAuth = (issuerId) => {
    setChallengeAuthenticating(true);
    setTimeout(() => {
      verifyAndLoginGovIssuer(issuerId);
      setChallengeAuthenticating(false);
      navigate('/issuer');
    }, 600);
  };

  const handleAccreditNewGov = (e) => {
    e.preventDefault();
    if (!newIssuerName.trim()) return;
    accreditNewGovDepartment({
      name: newIssuerName.trim(),
      department: newIssuerDept.trim() || "State Digital Administration",
      jurisdiction: newIssuerJurisdiction,
      schemas: ["MunicipalIdentitySchemaV1", "UrbanServiceConcessionSchemaV1"]
    });
    navigate('/issuer');
  };

  const handleSelectVerifier = (verId) => {
    loginAsVerifier(verId);
    navigate('/verifier');
  };

  const handleRegisterVerifier = (e) => {
    e.preventDefault();
    if (!newVerName.trim()) return;
    registerNewVerifierBody({
      name: newVerName.trim(),
      department: newVerDept.trim(),
      registeredPurpose: newVerPurpose.trim()
    });
    navigate('/verifier');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-16">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-mono text-xs font-semibold">
          <Shield className="w-3.5 h-3.5" />
          <span>Multi-Persona Identity & Governance Portal</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">
          Sign In / Choose Operating Persona
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          ShroudIT is zero-knowledge from end to end. Select an existing identity or register a brand new citizen profile, accredited government authority, or verifier body.
        </p>
      </div>

      {/* Role Tabs */}
      <div className="flex justify-center">
        <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('resident')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeTab === 'resident'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Citizen / Resident</span>
          </button>

          <button
            onClick={() => setActiveTab('issuer')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeTab === 'issuer'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Government Issuer</span>
          </button>

          <button
            onClick={() => setActiveTab('verifier')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeTab === 'verifier'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>City Verifier Body</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CITIZEN / RESIDENT LOGIN */}
      {activeTab === 'resident' && (
        <div className="space-y-6">
          <div className="rounded-3xl glass-panel p-6 border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Select Existing Citizen Profile</h3>
                  <p className="text-xs text-slate-400">Loads local device Ed25519 hardware key and encrypted wallet enclave</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                {allResidents.length} Personas Available
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {allResidents.map((res) => {
                const isCurrent = currentUser?.id === res.id && currentRole === 'resident';
                return (
                  <div
                    key={res.id}
                    onClick={() => handleSelectResident(res)}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all hover:scale-[1.02] ${
                      isCurrent
                        ? 'bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/40'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-bold text-white">{res.name}</span>
                      {isCurrent && (
                        <span className="p-1 rounded-full bg-cyan-500 text-black">
                          <CheckCircle2 className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{res.domicile}</p>
                    <p className="text-[10px] font-mono text-cyan-400 mt-1 truncate">{res.did}</p>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>DOB: {res.dob}</span>
                      <span>{res.isStudent ? "Student Pass" : "Adult Domicile"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form: Register Brand New Citizen Profile */}
          <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
              <Plus className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Create New Custom Citizen Identity</h3>
            </div>
            <p className="text-xs text-slate-400">
              Enter any custom name or details. ShroudIT will derive a brand-new <strong>Ed25519 hardware key</strong> and mint an initial Smart City identity card in your device enclave.
            </p>

            <form onSubmit={handleCreateResident} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Full Legal Name:</label>
                <input
                  type="text"
                  required
                  value={newResName}
                  onChange={(e) => setNewResName(e.target.value)}
                  placeholder="e.g. Your Name / John Doe"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Date of Birth:</label>
                <input
                  type="date"
                  value={newResDob}
                  onChange={(e) => setNewResDob(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Domicile Jurisdiction:</label>
                <input
                  type="text"
                  value={newResDomicile}
                  onChange={(e) => setNewResDomicile(e.target.value)}
                  placeholder="e.g. Bengaluru Urban (Koramangala)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-medium"
                />
              </div>

              <div className="flex items-center space-x-3 pt-5">
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newResIsStudent}
                    onChange={(e) => setNewResIsStudent(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span>Enrolled Student (Eligible for transit concessions)</span>
                </label>
              </div>

              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-extrabold uppercase tracking-wider text-xs shadow-lg shadow-cyan-500/20 hover:brightness-110 flex items-center justify-center space-x-2 transition-all"
                >
                  <Key className="w-4 h-4" />
                  <span>Derive Keys & Create Citizen Wallet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: GOVERNMENT ISSUER LOGIN */}
      {activeTab === 'issuer' && (
        <div className="space-y-6">
          <div className="rounded-3xl glass-panel p-6 border border-purple-500/30 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Accredited Civic Issuer Authentication</h3>
                  <p className="text-xs text-slate-400">
                    Government bodies authenticate via <strong>On-Chain DID Challenge-Response</strong> anchored in <code className="text-purple-300">IssuerRegistry.sol</code>
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                BLS12-381 G2 Keys Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {allIssuers.map((issuer) => {
                const isCurrent = currentUser?.id === issuer.id && currentRole === 'issuer';
                return (
                  <div
                    key={issuer.id}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/40'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-bold text-white leading-tight">{issuer.name}</span>
                        <BadgeCheck className="w-4 h-4 text-purple-400 shrink-0 ml-1" />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{issuer.department}</p>
                      <p className="text-[10px] font-mono text-purple-300 mt-1 truncate">{issuer.did}</p>
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                        Accredited On-Chain
                      </span>
                      <button
                        onClick={() => handleGovAuth(issuer.id)}
                        disabled={challengeAuthenticating}
                        className="px-3 py-1.5 rounded-lg bg-purple-500 text-white font-bold text-xs hover:bg-purple-400 transition-colors flex items-center space-x-1"
                      >
                        <span>Verify & Login</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Accredit Brand New Government Authority */}
          <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
              <Plus className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-white">Accredit New Municipal Authority</h3>
            </div>
            <p className="text-xs text-slate-400">
              Deploys a new accredited DID authority with on-chain accreditation, generating a dedicated BLS12-381 G2 keypair for credential signing.
            </p>

            <form onSubmit={handleAccreditNewGov} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Authority / Department Name:</label>
                <input
                  type="text"
                  required
                  value={newIssuerName}
                  onChange={(e) => setNewIssuerName(e.target.value)}
                  placeholder="e.g. BBMP Urban Development Authority"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-400 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Parent Ministry / Department:</label>
                <input
                  type="text"
                  value={newIssuerDept}
                  onChange={(e) => setNewIssuerDept(e.target.value)}
                  placeholder="e.g. Urban Development Department, GoK"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-400 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">State Jurisdiction:</label>
                <input
                  type="text"
                  value={newIssuerJurisdiction}
                  onChange={(e) => setNewIssuerJurisdiction(e.target.value)}
                  placeholder="e.g. Karnataka State"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-400 font-medium"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-extrabold uppercase tracking-wider text-xs shadow-lg shadow-purple-500/20 hover:brightness-110 flex items-center justify-center space-x-2 transition-all"
                >
                  <Landmark className="w-4 h-4" />
                  <span>Accredit & Open Issuer Studio</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: CITY VERIFIER BODY LOGIN */}
      {activeTab === 'verifier' && (
        <div className="space-y-6">
          <div className="rounded-3xl glass-panel p-6 border border-emerald-500/30 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Select City Verifier Terminal</h3>
                  <p className="text-xs text-slate-400">
                    Each verifier has a registered <strong>DPDP Act §6 Purpose Charter</strong> defining lawful predicate checks
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                {allVerifiers.length} Kiosks Online
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allVerifiers.map((ver) => {
                const isCurrent = currentUser?.id === ver.id && currentRole === 'verifier';
                return (
                  <div
                    key={ver.id}
                    onClick={() => handleSelectVerifier(ver.id)}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all hover:scale-[1.01] ${
                      isCurrent
                        ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/40'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-bold text-white">{ver.name}</span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {ver.purposeId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1.5 italic">"{ver.registeredPurpose}"</p>
                    <p className="text-[10px] font-mono text-emerald-400 mt-1 truncate">{ver.did}</p>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Department: {ver.department}</span>
                      <span className="text-cyan-400 font-bold">Open Kiosk →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Register Brand New City Verifier Kiosk */}
          <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
              <Plus className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Register New City Verifier Terminal</h3>
            </div>
            <p className="text-xs text-slate-400">
              Registers a new city terminal under <strong>DPDP Act §6</strong>. The verifier can only request attributes that match its registered statutory purpose.
            </p>

            <form onSubmit={handleRegisterVerifier} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Verifier Kiosk / Service Name:</label>
                <input
                  type="text"
                  required
                  value={newVerName}
                  onChange={(e) => setNewVerName(e.target.value)}
                  placeholder="e.g. Kempegowda Airport e-Gate"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-400 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Department / Authority:</label>
                <input
                  type="text"
                  value={newVerDept}
                  onChange={(e) => setNewVerDept(e.target.value)}
                  placeholder="e.g. Airport Transport Division"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-400 font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-slate-300 font-semibold block mb-1">DPDP Statutory Purpose Limitation Statement:</label>
                <input
                  type="text"
                  required
                  value={newVerPurpose}
                  onChange={(e) => setNewVerPurpose(e.target.value)}
                  placeholder="e.g. Age and ticket validation for automated transit gate boarding without personal data storage"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-400 font-medium"
                />
              </div>

              <div className="md:col-span-2 pt-1">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-extrabold uppercase tracking-wider text-xs shadow-lg shadow-emerald-500/20 hover:brightness-110 flex items-center justify-center space-x-2 transition-all"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Register Verifier & Launch Terminal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

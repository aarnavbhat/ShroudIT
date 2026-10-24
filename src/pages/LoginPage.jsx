import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Smartphone, 
  CheckCircle2, 
  XCircle,
  Plus, 
  ArrowRight, 
  Lock, 
  Key, 
  Sparkles, 
  UserCheck, 
  FileText,
  BadgeCheck,
  AlertTriangle,
  UserPlus,
  LogIn,
  Check,
  ExternalLink,
  ShieldCheck,
  Building2,
  Clock
} from 'lucide-react';
import { useAuth } from '../lib/authContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { 
    currentUser, 
    allResidents, 
    loginAsResident, 
    createCustomResident,
    logout 
  } = useAuth();

  // Active view: 'signin' | 'register'
  const [activeMode, setActiveMode] = useState('signin');

  // Manual username / civic ID sign-in state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  
  // Registration form state (allows creating as many accounts as desired)
  const [newResName, setNewResName] = useState('');
  const [newResUsername, setNewResUsername] = useState('');
  const [newResDob, setNewResDob] = useState('2002-05-18');
  const [newResDomicile, setNewResDomicile] = useState('Bengaluru Urban');
  const [newResIsStudent, setNewResIsStudent] = useState(false);

  // Rejection & Feedback states
  const [authError, setAuthError] = useState(null);
  const [authSuccess, setAuthSuccess] = useState(null);
  const [recentlyCreatedUser, setRecentlyCreatedUser] = useState(null);

  // Attempt login with a specific resident object or identifier
  const handleAttemptLogin = (resOrId) => {
    setAuthError(null);
    setAuthSuccess(null);

    const result = loginAsResident(resOrId);

    if (result.success) {
      setAuthSuccess(`Identity authenticated! Welcome, ${result.resident.name}. Opening resident enclave...`);
      setTimeout(() => {
        navigate('/wallet');
      }, 700);
    } else {
      // STRICT REQUIREMENT: Display "not verified by government"
      setAuthError({
        title: "Login Blocked: Not Verified by Government",
        phrase: result.error || "not verified by government",
        message: result.message || "This citizen account is not verified by government. You cannot log in until an accredited government department issues an official certification.",
        resident: result.resident
      });
    }
  };

  // Form submit for manual username / ID login
  const handleManualLogin = (e) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) return;
    handleAttemptLogin(loginIdentifier.trim());
  };

  // Create brand new custom resident account
  const handleCreateResident = (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!newResName.trim()) return;

    const res = createCustomResident({
      name: newResName.trim(),
      username: newResUsername.trim() || newResName.toLowerCase().replace(/[^a-z0-9]/g, ''),
      dob: newResDob,
      domicile: newResDomicile.trim(),
      isStudent: newResIsStudent
    });

    setRecentlyCreatedUser(res.resident);

    // Reset form inputs
    setNewResName('');
    setNewResUsername('');
    
    // Switch to sign-in view and present the pending verification notice
    setActiveMode('signin');
    setAuthError({
      title: "Account Created: Pending Government Verification",
      phrase: "not verified by government",
      message: `Account created for "${res.resident.name}" (@${res.resident.username}). As required by protocol rules, this account is not verified by government yet and cannot log in until an accredited authority sends a verified certification.`,
      resident: res.resident,
      isNoticeOnly: true
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-16">
      {/* Page Header: Citizen Dedicated Portal Only */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-mono text-xs font-semibold">
          <Smartphone className="w-3.5 h-3.5" />
          <span>Citizen & Resident Enclave Access Point</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">
          Citizen Login & Identity Enclave
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Dedicated portal for citizens and residents. You can create as many user accounts as needed, but accounts <strong>only become valid once certified by the government</strong>.
        </p>
      </div>

      {/* Mode Switcher Tabs: Sign In vs Create Account */}
      <div className="flex justify-center">
        <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-2">
          <button
            onClick={() => { setActiveMode('signin'); setAuthError(null); }}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeMode === 'signin'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Citizen Sign In</span>
          </button>

          <button
            onClick={() => { setActiveMode('register'); setAuthError(null); }}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeMode === 'register'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New Citizen Account</span>
          </button>
        </div>
      </div>

      {/* Rejection / Blocking Banner: "not verified by government" */}
      {authError && (
        <div className={`p-5 rounded-2xl border transition-all animate-fadeIn ${
          authError.isNoticeOnly
            ? 'bg-amber-950/30 border-amber-500/60 text-amber-200'
            : 'bg-rose-950/40 border-rose-500/80 text-rose-200'
        }`}>
          <div className="flex items-start space-x-3.5">
            <div className={`p-2.5 rounded-xl border shrink-0 ${
              authError.isNoticeOnly
                ? 'bg-amber-900/40 border-amber-600/60 text-amber-400'
                : 'bg-rose-900/50 border-rose-600/70 text-rose-300'
            }`}>
              {authError.isNoticeOnly ? <Clock className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {authError.title}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 text-rose-300 border border-rose-800 uppercase font-bold">
                  {authError.phrase}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {authError.message}
              </p>

              {/* Action guidance for the user */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate('/documents')}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-500 text-black font-extrabold text-xs flex items-center space-x-1.5 hover:brightness-110 shadow-md shadow-cyan-500/20"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Go to Gov Ingestion to Issue Certification</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] text-slate-400">
                  Government authorities can select this citizen to send certifications.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {authSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/70 text-emerald-200 flex items-center space-x-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{authSuccess}</span>
        </div>
      )}

      {/* MODE 1: CITIZEN SIGN IN */}
      {activeMode === 'signin' && (
        <div className="space-y-6">
          {/* Quick Citizen Account Selector */}
          <div className="rounded-3xl glass-panel p-6 border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Select Citizen Profile to Sign In</h3>
                  <p className="text-xs text-slate-400">
                    Accounts marked with a green badge have an official government certification. Unverified accounts cannot log in.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                {allResidents.length} Registered Citizens
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {allResidents.map((res) => {
                const isVerified = res.isGovernmentVerified === true || (Array.isArray(res.certifications) && res.certifications.length > 0);
                const isCurrent = currentUser?.id === res.id && isVerified;
                const isHighlight = recentlyCreatedUser?.id === res.id;

                return (
                  <div
                    key={res.id}
                    onClick={() => handleAttemptLogin(res)}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between ${
                      isHighlight
                        ? 'ring-2 ring-amber-400 bg-amber-950/20 border-amber-500/60'
                        : isCurrent
                        ? 'bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/40'
                        : isVerified
                        ? 'bg-slate-900/90 border-slate-700/80 hover:border-emerald-500/60'
                        : 'bg-slate-900/50 border-slate-800/80 hover:border-rose-500/50 opacity-90'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <span className="text-sm font-bold text-white block">{res.name}</span>
                          <span className="text-[11px] font-mono text-slate-400">@{res.username || res.id}</span>
                        </div>

                        {/* Government Status Badge */}
                        {isVerified ? (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center space-x-1 shrink-0 font-bold">
                            <BadgeCheck className="w-3 h-3" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800 flex items-center space-x-1 shrink-0 font-bold">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Unverified</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-2">{res.domicile}</p>
                      <p className="text-[10px] font-mono text-cyan-400 mt-0.5 truncate">{res.nationalId || res.did}</p>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-500">
                        {res.isStudent ? "Student Pass" : "Citizen Resident"}
                      </span>
                      <span className={`font-bold flex items-center space-x-1 ${
                        isVerified ? 'text-emerald-400 hover:text-emerald-300' : 'text-rose-400'
                      }`}>
                        <span>{isVerified ? 'Sign In →' : 'Attempt Login'}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form: Manual Citizen Username / National ID Sign-In */}
          <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
              <Key className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Manual Citizen Sign In</h3>
            </div>
            <p className="text-xs text-slate-400">
              Enter your username or civic ID reference. If your account has not been certified by an accredited government body, login is strictly prevented.
            </p>

            <form onSubmit={handleManualLogin} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Enter Username (e.g. 'aarav', 'priya') or National ID ('IN-BLR-RES-884920')"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-cyan-500 text-black font-extrabold uppercase tracking-wider text-xs shadow-lg shadow-cyan-500/20 hover:brightness-110 flex items-center justify-center space-x-2 shrink-0"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODE 2: CREATE CITIZEN ACCOUNT (UNLIMITED ACCOUNTS ALLOWED) */}
      {activeMode === 'register' && (
        <div className="rounded-3xl glass-panel p-6 border border-cyan-500/30 space-y-5 animate-fadeIn">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <UserPlus className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Create New Citizen Account</h3>
          </div>

          {/* Explanatory Notice */}
          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-slate-300 space-y-2">
            <div className="flex items-center space-x-2 font-bold text-cyan-300">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Government Certification Requirement:</span>
            </div>
            <p className="leading-relaxed">
              You can create as many citizen accounts as needed. Each account derives a unique <strong>Ed25519 hardware key</strong> and civic identifier. However, under network rules, newly created accounts <strong>only become valid once they have received a government certification</strong>. Attempting to log in before certification will state <code className="text-cyan-300 font-mono">not verified by government</code>.
            </p>
          </div>

          <form onSubmit={handleCreateResident} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Full Legal Name:</label>
              <input
                type="text"
                required
                value={newResName}
                onChange={(e) => setNewResName(e.target.value)}
                placeholder="e.g. Vikramaditya Rao"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-medium"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Preferred Username:</label>
              <input
                type="text"
                value={newResUsername}
                onChange={(e) => setNewResUsername(e.target.value)}
                placeholder="e.g. vikram_rao (optional)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-medium font-mono"
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
              <label className="text-slate-300 font-semibold block mb-1">Domicile (City / Ward / State):</label>
              <input
                type="text"
                value={newResDomicile}
                onChange={(e) => setNewResDomicile(e.target.value)}
                placeholder="e.g. Mumbai, Maharashtra or Bengaluru Urban"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-medium"
              />
            </div>

            <div className="md:col-span-2 pt-1">
              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newResIsStudent}
                  onChange={(e) => setNewResIsStudent(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Enrolled Student (Eligible for student transit & skilling passes)</span>
              </label>
            </div>

            <div className="md:col-span-2 pt-3">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-extrabold uppercase tracking-wider text-xs shadow-lg shadow-cyan-500/20 hover:brightness-110 flex items-center justify-center space-x-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Register Citizen Profile (Pending Government Certification)</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Information Banner: Government Authority Ingestion Reference */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <FileText className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <span className="font-bold text-white text-sm">Government Ingestion & Certification Portal</span>
            <p className="text-slate-400 mt-0.5">
              Government authorities verify signed documents and select citizen recipients to issue credentials and validate citizen logins.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/documents')}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-extrabold uppercase tracking-wider text-xs flex items-center space-x-1.5 shrink-0 transition-colors"
        >
          <span>Open Gov Portal</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

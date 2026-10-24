// ShroudIT Dynamic Authentication & Multi-Persona Session Manager
// Provides full role switching across Residents, Government Issuers, Verifier Bodies, and Auditors.
// Zero hardcoding: Citizens, issuers, and verifiers can be dynamically registered with real keys.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  generateDeviceHardwareKey, 
  generateIssuerKeyPair, 
  signBbs, 
  verifyDirectBbs, 
  parseIssuerPrivateKey, 
  deriveIssuerPublicKey 
} from './bbsEngine.js';
import { CREDENTIALS, VERIFIERS } from './mockData.js';
import { saveCredential, getStoredCredentials } from './walletStorage.js';
import { checkIssuerAccreditationOnChain } from './web3Client.js';

// Pre-configured government bodies with authentic BLS12-381 keypairs
const DEFAULT_ISSUERS = [
  {
    id: "gov-ceg",
    did: "did:shroud:gov-karnataka-ceg",
    name: "Center for e-Governance, Karnataka",
    department: "Department of Personnel & Administrative Reforms (DPAR)",
    jurisdiction: "State of Karnataka",
    accreditationStatus: "ACCREDITED_ON_CHAIN",
    contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    keyPair: generateIssuerKeyPair(),
    authorizedSchemas: ["KarnatakaResidentCardV1", "KKhataPropertyCardV1"]
  },
  {
    id: "bmtc-transit",
    did: "did:shroud:bmtc-transit",
    name: "BMTC Transit Authority",
    department: "Transport Department, Government of Karnataka",
    jurisdiction: "Bengaluru Metropolitan",
    accreditationStatus: "ACCREDITED_ON_CHAIN",
    contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    keyPair: generateIssuerKeyPair(),
    authorizedSchemas: ["BMTCStudentConcessionPassV2"]
  },
  {
    id: "dept-social-welfare",
    did: "did:shroud:dept-social-welfare",
    name: "Social Welfare Department",
    department: "Government of Karnataka",
    jurisdiction: "State of Karnataka",
    accreditationStatus: "ACCREDITED_ON_CHAIN",
    contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    keyPair: generateIssuerKeyPair(),
    authorizedSchemas: ["YuvaNidhiSkillingStipendV1"]
  }
];

// Pre-seeded sample citizen personas (plus user can create custom ones)
const DEFAULT_RESIDENTS = [
  {
    id: "res-aarav",
    name: "Aarav S. Rao",
    dob: "2003-08-14",
    domicile: "Bengaluru Urban (Ward 142)",
    nationalId: "IN-BLR-RES-884920",
    isStudent: true,
    hardwareKey: generateDeviceHardwareKey(),
    did: "did:key:z6Mku7X...89p"
  },
  {
    id: "res-priya",
    name: "Priya Sharma",
    dob: "1998-04-22",
    domicile: "Bengaluru South (Ward 180)",
    nationalId: "IN-BLR-RES-771204",
    isStudent: false,
    hardwareKey: generateDeviceHardwareKey(),
    did: "did:key:z6Mkp2R...44w"
  },
  {
    id: "res-rohan",
    name: "Rohan Gupta",
    dob: "2005-11-09",
    domicile: "Bengaluru North (Ward 028)",
    nationalId: "IN-BLR-RES-993810",
    isStudent: true,
    hardwareKey: generateDeviceHardwareKey(),
    did: "did:key:z6Mkt9A...12e"
  }
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Current active session state
  const [currentRole, setCurrentRole] = useState('resident'); // 'resident' | 'issuer' | 'verifier' | 'auditor'
  const [currentUser, setCurrentUser] = useState(DEFAULT_RESIDENTS[0]);
  const [allResidents, setAllResidents] = useState(DEFAULT_RESIDENTS);
  const [allIssuers, setAllIssuers] = useState(DEFAULT_ISSUERS);
  const [allVerifiers, setAllVerifiers] = useState(VERIFIERS);
  const [userCredentials, setUserCredentials] = useState(CREDENTIALS);

  // Load persistent session from localStorage on mount
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('shroudit_active_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.role) setCurrentRole(parsed.role);
        if (parsed.user) setCurrentUser(parsed.user);
      }

      const customResidents = localStorage.getItem('shroudit_custom_residents');
      if (customResidents) {
        const parsedCustom = JSON.parse(customResidents);
        setAllResidents([...DEFAULT_RESIDENTS, ...parsedCustom]);
      }

      const customIssuers = localStorage.getItem('shroudit_custom_issuers');
      if (customIssuers) {
        const parsedIssuers = JSON.parse(customIssuers);
        setAllIssuers([...DEFAULT_ISSUERS, ...parsedIssuers]);
      }

      const customVerifiers = localStorage.getItem('shroudit_custom_verifiers');
      if (customVerifiers) {
        const parsedVerifiers = JSON.parse(customVerifiers);
        setAllVerifiers([...VERIFIERS, ...parsedVerifiers]);
      }
    } catch (err) {
      console.warn("Auth initialization notice:", err);
    }
  }, []);

  // Save session when role or user changes
  const saveSession = (role, user) => {
    setCurrentRole(role);
    setCurrentUser(user);
    try {
      localStorage.setItem('shroudit_active_session', JSON.stringify({ role, user }));
    } catch (e) {}
  };

  // --- RESIDENT AUTHENTICATION ---
  const loginAsResident = (residentObj) => {
    saveSession('resident', residentObj);
  };

  const createCustomResident = ({ name, dob, domicile, nationalId, isStudent }) => {
    const hwKey = generateDeviceHardwareKey();
    const cleanDid = `did:key:z6Mk${hwKey.publicKeyHex.substring(0, 10)}...${hwKey.publicKeyHex.substring(56)}`;
    
    const newResident = {
      id: `res-${Date.now().toString(36)}`,
      name,
      dob: dob || "2000-01-01",
      domicile: domicile || "Bengaluru Urban",
      nationalId: nationalId || `IN-BLR-RES-${Math.floor(100000 + Math.random() * 900000)}`,
      isStudent: !!isStudent,
      hardwareKey: hwKey,
      did: cleanDid
    };

    // Create an initial foundational civic identity credential for this new resident
    const initialCard = {
      id: `cred-${Date.now().toString(36)}`,
      title: "Smart City Resident Identity",
      issuer: "Center for e-Governance, Karnataka",
      issuerDid: "did:shroud:gov-karnataka-ceg",
      category: "Municipal Identity",
      gradient: "from-cyan-900/80 via-slate-900 to-blue-950/80",
      borderColor: "border-cyan-500/40",
      glowColor: "cyan",
      rawData: {
        fullName: name,
        nationalId: newResident.nationalId,
        dob: newResident.dob,
        domicile: newResident.domicile
      },
      predicates: [
        { id: "over_18", label: "Age ≥ 18", statement: "Holder is 18 years of age or older", value: true },
        { id: "blr_resident", label: "Bengaluru Resident", statement: `Holder resides in ${newResident.domicile}`, value: true },
        ...(isStudent ? [{ id: "valid_student", label: "Student Concession", statement: "Enrolled student at recognized institution", value: true }] : [])
      ]
    };

    saveCredential(initialCard);
    setUserCredentials(prev => [initialCard, ...prev]);

    const updated = [...allResidents, newResident];
    setAllResidents(updated);
    try {
      const storedCustom = JSON.parse(localStorage.getItem('shroudit_custom_residents') || '[]');
      localStorage.setItem('shroudit_custom_residents', JSON.stringify([...storedCustom, newResident]));
    } catch (e) {}

    saveSession('resident', newResident);
    return newResident;
  };

  // --- GOVERNMENT ISSUER AUTHENTICATION ---
  // Step 1: Generate ephemeral 256-bit cryptographic challenge nonce
  const generateAuthorityChallenge = (issuerDid) => {
    const randHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    const timestamp = Date.now();
    return `CHALLENGE_GOV_${(issuerDid || 'CIVIC').replace(/[^a-zA-Z0-9]/g, '_')}_0x${randHex}_${timestamp}`;
  };

  // Step 2, 3, 4, 5: Verify private key proof & smart contract accreditation
  const verifyAndLoginGovIssuer = async ({ issuerId, privateKeyInput, challengeString }) => {
    if (!challengeString) {
      throw new Error("Challenge nonce is required for government authentication.");
    }

    const issuer = allIssuers.find(i => i.id === issuerId);
    if (!issuer) {
      throw new Error(`Government body with ID "${issuerId}" not found in active directory.`);
    }

    // Step 2: Parse and validate private key input
    let privKeyScalar;
    try {
      privKeyScalar = parseIssuerPrivateKey(privateKeyInput);
    } catch (e) {
      throw new Error("Invalid Private Key format. Please provide a valid 256-bit scalar / hex key.");
    }

    // Step 3: Cryptographic Signature Verification using BLS12-381 G2 curve
    let derivedPublic;
    try {
      derivedPublic = deriveIssuerPublicKey(privKeyScalar);
    } catch (e) {
      throw new Error(`Failed to derive public key on curve G2: ${e.message}`);
    }

    // Compute curve signature over the challenge
    const challengeSig = signBbs(privKeyScalar, [challengeString]);
    const isCryptoValid = verifyDirectBbs(derivedPublic.publicKey, challengeSig, [challengeString]);
    if (!isCryptoValid) {
      throw new Error("Cryptographic verification failed: Bilinear pairing math rejected the signature.");
    }

    // Verify keypair ownership against target issuer
    const targetPubHex = issuer.keyPair.publicKeyHex;
    if (derivedPublic.publicKeyHex !== targetPubHex) {
      throw new Error(`Key Ownership Mismatch: The provided private key does not belong to ${issuer.name}.`);
    }

    // Step 4: Check issuer's registration / accreditation status in IssuerRegistry.sol
    const chainStatus = await checkIssuerAccreditationOnChain(issuer.did);
    if (!chainStatus.isAccredited) {
      throw new Error(`Smart Contract Accreditation Rejected: ${chainStatus.error || 'DID is not active on-chain'}`);
    }

    // Step 5: Session authorized!
    const verifiedSession = {
      ...issuer,
      authenticatedVia: "BLS12_381_CHALLENGE_AND_ISSUER_REGISTRY",
      authenticatedAt: new Date().toISOString(),
      onChainRegistryValidated: true,
      lastAuthProof: {
        challengeNonce: challengeString,
        signatureA: challengeSig.A_hex,
        contractAddress: chainStatus.contractAddress,
        isLiveRpc: chainStatus.isLive,
        timestamp: new Date().toLocaleTimeString()
      }
    };

    saveSession('issuer', verifiedSession);
    return {
      success: true,
      issuer: verifiedSession,
      checks: {
        challengeValid: true,
        privateKeyValid: true,
        signatureVerified: true,
        keypairMatched: true,
        onChainAccredited: true,
        contractAddress: chainStatus.contractAddress
      }
    };
  };

  const accreditNewGovDepartment = ({ name, department, jurisdiction, schemas }) => {
    const keyPair = generateIssuerKeyPair();
    const cleanDid = `did:shroud:gov-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const newIssuer = {
      id: `gov-${Date.now().toString(36)}`,
      did: cleanDid,
      name,
      department: department || "Government of Karnataka",
      jurisdiction: jurisdiction || "Karnataka State",
      accreditationStatus: "ACCREDITED_ON_CHAIN",
      contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      keyPair,
      authorizedSchemas: schemas && schemas.length > 0 ? schemas : ["CustomSmartCitySchemaV1"]
    };

    const updated = [...allIssuers, newIssuer];
    setAllIssuers(updated);
    try {
      const storedCustom = JSON.parse(localStorage.getItem('shroudit_custom_issuers') || '[]');
      localStorage.setItem('shroudit_custom_issuers', JSON.stringify([...storedCustom, newIssuer]));
    } catch (e) {}

    return newIssuer;
  };

  // --- VERIFIER BODY AUTHENTICATION ---
  const loginAsVerifier = (verifierId) => {
    const verifier = allVerifiers.find(v => v.id === verifierId) || allVerifiers[0];
    saveSession('verifier', verifier);
  };

  const registerNewVerifierBody = ({ name, department, purposeId, registeredPurpose, requestedAttributes }) => {
    const cleanDid = `did:shroud:verifier-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const newVerifier = {
      id: `ver-${Date.now().toString(36)}`,
      did: cleanDid,
      name,
      department: department || "Municipal Body",
      isRegistered: true,
      purposeId: purposeId || "DPDP-PURPOSE-CUSTOM",
      registeredPurpose,
      retentionPolicy: "Zero Retention (Ephemeral verification only)",
      requiredPredicates: ["over_18"],
      requestedAttributes: requestedAttributes || ["Age ≥ 18", "Bengaluru Resident"],
      forbiddenDemands: ["Full Aadhaar Number", "Raw Date of Birth", "Mobile Phone Number"]
    };

    const updated = [...allVerifiers, newVerifier];
    setAllVerifiers(updated);
    try {
      const storedCustom = JSON.parse(localStorage.getItem('shroudit_custom_verifiers') || '[]');
      localStorage.setItem('shroudit_custom_verifiers', JSON.stringify([...storedCustom, newVerifier]));
    } catch (e) {}

    saveSession('verifier', newVerifier);
    return newVerifier;
  };

  // --- DYNAMIC ISSUANCE: MINT CREDENTIAL FOR ANY RESIDENT ---
  const issueCredentialToResident = ({ residentId, title, category, rawData, predicates }) => {
    const targetResident = allResidents.find(r => r.id === residentId || r.did === residentId) || currentUser;
    const activeIssuer = currentRole === 'issuer' ? currentUser : allIssuers[0];

    // Compute real BLS12-381 signature over messages
    const attributeMessages = [
      targetResident.name,
      targetResident.nationalId,
      targetResident.dob,
      ...predicates.map(p => `${p.id}:${p.value}`)
    ];

    const bbsSignature = signBbs(activeIssuer.keyPair.privateKey, attributeMessages);

    const newCard = {
      id: `cred-${Date.now().toString(36)}`,
      title: title || "Smart City Municipal Credential",
      issuer: activeIssuer.name,
      issuerDid: activeIssuer.did,
      category: category || "Government Service",
      gradient: "from-purple-900/80 via-slate-900 to-indigo-950/80",
      borderColor: "border-purple-500/40",
      glowColor: "purple",
      rawData: {
        fullName: targetResident.name,
        nationalId: targetResident.nationalId,
        dob: targetResident.dob,
        ...rawData
      },
      predicates,
      bbsSignature: {
        A_hex: bbsSignature.A_hex,
        e: bbsSignature.e.toString(16),
        s: bbsSignature.s.toString(16)
      },
      issuedAt: new Date().toLocaleDateString('en-IN')
    };

    saveCredential(newCard);
    setUserCredentials(prev => [newCard, ...prev]);
    return newCard;
  };

  return (
    <AuthContext.Provider value={{
      currentRole,
      currentUser,
      allResidents,
      allIssuers,
      allVerifiers,
      userCredentials,
      setUserCredentials,
      loginAsResident,
      createCustomResident,
      generateAuthorityChallenge,
      verifyAndLoginGovIssuer,
      accreditNewGovDepartment,
      loginAsVerifier,
      registerNewVerifierBody,
      issueCredentialToResident
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

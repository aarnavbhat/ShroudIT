// ShroudIT Dynamic Authentication & Multi-Persona Session Manager
// Provides citizen identity management, government authority accreditation, and verifier kiosks.
// Rule: Citizens can create unlimited accounts, but accounts ONLY become valid once they receive a government certification.
// Attempting to log in without government verification strictly rejects with "not verified by government".

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
import { saveCredential, getStoredCredentials, HARDCODED_MOCK_IDS } from './walletStorage.js';
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

// Pre-seeded sample citizen personas:
// Aarav is pre-verified by government for instant testing.
// Priya and Rohan start unverified (awaiting government certification).
const DEFAULT_RESIDENTS = [
  {
    id: "res-aarav",
    username: "aarav",
    password: "aarav123",
    name: "Aarav S. Rao",
    dob: "2003-08-14",
    domicile: "Bengaluru Urban (Ward 142)",
    nationalId: "IN-BLR-RES-884920",
    isStudent: true,
    isGovernmentVerified: true,
    status: "GOVERNMENT_VERIFIED",
    certifications: [],
    hardwareKey: generateDeviceHardwareKey(),
    did: "did:key:z6Mku7X...89p"
  },
  {
    id: "res-priya",
    username: "priya",
    password: "priya123",
    name: "Priya Sharma",
    dob: "1998-04-22",
    domicile: "Bengaluru South (Ward 180)",
    nationalId: "IN-BLR-RES-771204",
    isStudent: false,
    isGovernmentVerified: false,
    status: "PENDING_GOV_VERIFICATION",
    certifications: [],
    hardwareKey: generateDeviceHardwareKey(),
    did: "did:key:z6Mkp2R...44w"
  },
  {
    id: "res-rohan",
    username: "rohan",
    password: "rohan123",
    name: "Rohan Gupta",
    dob: "2005-11-09",
    domicile: "Bengaluru North (Ward 028)",
    nationalId: "IN-BLR-RES-993810",
    isStudent: true,
    isGovernmentVerified: false,
    status: "PENDING_GOV_VERIFICATION",
    certifications: [],
    hardwareKey: generateDeviceHardwareKey(),
    did: "did:key:z6Mkt9A...12e"
  }
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Current active session state
  const [currentRole, setCurrentRole] = useState('resident'); // 'resident' | 'issuer' | 'verifier' | 'guest'
  const [currentUser, setCurrentUser] = useState(DEFAULT_RESIDENTS[0]);
  const [allResidents, setAllResidents] = useState(DEFAULT_RESIDENTS);
  const [allIssuers, setAllIssuers] = useState(DEFAULT_ISSUERS);
  const [allVerifiers, setAllVerifiers] = useState(VERIFIERS);
  const [userCredentials, setUserCredentials] = useState([]);

  // Load persistent session and custom accounts from localStorage on mount
  useEffect(() => {
    try {
      // 1. Load custom and updated residents
      const customResidents = localStorage.getItem('shroudit_custom_residents');
      let combinedResidents = [...DEFAULT_RESIDENTS];
      if (customResidents) {
        const parsedCustom = JSON.parse(customResidents);
        const map = new Map();
        DEFAULT_RESIDENTS.forEach(r => map.set(r.id, r));
        parsedCustom.forEach(r => { const cleaned = (r.certifications || []).filter(c => !HARDCODED_MOCK_IDS.has(c.id)); map.set(r.id, { ...r, certifications: cleaned }); });
        combinedResidents = Array.from(map.values());
        setAllResidents(combinedResidents);
      }

      // 2. Load custom issuers
      const customIssuers = localStorage.getItem('shroudit_custom_issuers');
      if (customIssuers) {
        const parsedIssuers = JSON.parse(customIssuers);
        setAllIssuers([...DEFAULT_ISSUERS, ...parsedIssuers]);
      }

      // 3. Load custom verifiers
      const customVerifiers = localStorage.getItem('shroudit_custom_verifiers');
      if (customVerifiers) {
        const parsedVerifiers = JSON.parse(customVerifiers);
        setAllVerifiers([...VERIFIERS, ...parsedVerifiers]);
      }

      // 4. Load saved session if valid and verified
      const savedSession = localStorage.getItem('shroudit_active_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.role) setCurrentRole(parsed.role);
        if (parsed.user) {
          const fresh = combinedResidents.find(r => r.id === parsed.user.id) || parsed.user;
          if (parsed.role !== 'resident' || fresh.isGovernmentVerified) {
            setCurrentUser(fresh);
          } else {
            setCurrentUser(null);
            setCurrentRole('guest');
          }
        }
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
      if (user) {
        localStorage.setItem('shroudit_active_session', JSON.stringify({ role, user }));
      } else {
        localStorage.removeItem('shroudit_active_session');
      }
    } catch (e) {}
  };

  // Logout
  const logout = () => {
    setCurrentUser(null);
    setCurrentRole('guest');
    try {
      localStorage.removeItem('shroudit_active_session');
    } catch (e) {}
  };

  // --- RESIDENT AUTHENTICATION (USERNAME & PASSWORD BASED) ---
  // Core Rule: Accounts ONLY become valid once they have government certification.
  // Otherwise, user cannot log in and receives: "not verified by government".
  const loginAsResident = (residentOrIdentifier, password) => {
    let target = null;
    let pass = password;

    if (typeof residentOrIdentifier === 'string') {
      const query = residentOrIdentifier.trim().toLowerCase();
      target = allResidents.find(r => 
        r.id === residentOrIdentifier || 
        (r.username && r.username.toLowerCase() === query) ||
        (r.nationalId && r.nationalId.toLowerCase() === query) ||
        (r.name && r.name.toLowerCase() === query)
      );
    } else if (residentOrIdentifier && typeof residentOrIdentifier === 'object') {
      if (residentOrIdentifier.username) {
        const query = residentOrIdentifier.username.trim().toLowerCase();
        target = allResidents.find(r => 
          r.id === residentOrIdentifier.username || 
          (r.username && r.username.toLowerCase() === query) ||
          (r.nationalId && r.nationalId.toLowerCase() === query)
        );
        if (residentOrIdentifier.password !== undefined) {
          pass = residentOrIdentifier.password;
        }
      } else {
        target = allResidents.find(r => r.id === residentOrIdentifier.id) || residentOrIdentifier;
      }
    }

    if (!target) {
      return {
        success: false,
        error: "Citizen account not found. Please check your username or register a new account."
      };
    }

    // Password validation (when password is provided)
    if (pass !== undefined && pass !== null && pass !== '') {
      const expectedPass = target.password || "password123";
      if (pass !== expectedPass) {
        return {
          success: false,
          error: "Invalid username or password. Please try again.",
          resident: target
        };
      }
    }

    // STRICT VERIFICATION CHECK:
    const isVerified = target.isGovernmentVerified === true || (Array.isArray(target.certifications) && target.certifications.length > 0);
    if (!isVerified) {
      return {
        success: false,
        error: "not verified by government",
        message: "not verified by government. Your account has been registered, but cannot log in until an accredited government department issues an official certification.",
        resident: target
      };
    }

    saveSession('resident', target);
    return {
      success: true,
      resident: target
    };
  };

  // Option to create as many citizen accounts as possible.
  // Newly created accounts start as unverified (pending government certification).
  const createCustomResident = ({ name, username, password, dob, domicile, nationalId, isStudent }) => {
    const hwKey = generateDeviceHardwareKey();
    const cleanDid = `did:key:z6Mk${hwKey.publicKeyHex.substring(0, 10)}...${hwKey.publicKeyHex.substring(56)}`;
    const cleanUsername = (username || name.toLowerCase().replace(/[^a-z0-9]/g, '')).trim();
    
    const newResident = {
      id: `res-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
      username: cleanUsername,
      password: password || "password123",
      name: name.trim(),
      dob: dob || "2000-01-01",
      domicile: domicile || "Bengaluru Urban",
      nationalId: nationalId || `IN-BLR-RES-${Math.floor(100000 + Math.random() * 900000)}`,
      isStudent: !!isStudent,
      isGovernmentVerified: false,
      status: "PENDING_GOV_VERIFICATION",
      certifications: [],
      hardwareKey: hwKey,
      did: cleanDid,
      createdAt: new Date().toISOString()
    };

    const updated = [...allResidents, newResident];
    setAllResidents(updated);
    try {
      const storedCustom = JSON.parse(localStorage.getItem('shroudit_custom_residents') || '[]');
      localStorage.setItem('shroudit_custom_residents', JSON.stringify([...storedCustom, newResident]));
    } catch (e) {}

    // Account created, but intentionally NOT logged in because it has not yet received a government certification!
    return {
      success: true,
      resident: newResident,
      message: "Citizen account created successfully. Status: Pending Government Verification."
    };
  };

  // Government action: Selects a user and binds/sends an official certification to them.
  // This turns their account to isGovernmentVerified: true, making it valid for login!
  const bindGovernmentCertificationToUser = (residentId, credential) => {
    const targetId = typeof residentId === 'object' ? residentId.id : residentId;
    const targetResident = allResidents.find(r => r.id === targetId || r.did === targetId || (r.username && r.username.toLowerCase() === String(targetId).toLowerCase()));

    if (!targetResident) {
      return {
        success: false,
        error: "Target citizen not found in directory."
      };
    }

    const credWithHolder = {
      ...(credential || {}),
      holderId: targetResident.id,
      holderUsername: targetResident.username,
      holderDid: targetResident.did,
      holderName: targetResident.name
    };

    const certRecord = {
      id: credWithHolder?.id || `gov-cert-${Date.now().toString(36)}`,
      title: credWithHolder?.title || "Government Certified Credential",
      category: credWithHolder?.category || "Government Service",
      issuer: credWithHolder?.issuer || "Center for e-Governance, Karnataka",
      issuerDid: credWithHolder?.issuerDid || "did:shroud:gov-karnataka-ceg",
      verifiedAt: new Date().toISOString(),
      predicates: credWithHolder?.predicates || [],
      rawData: credWithHolder?.rawData || {},
      credentialData: credWithHolder
    };

    const existingCerts = (Array.isArray(targetResident.certifications) ? targetResident.certifications : [])
      .filter(c => !HARDCODED_MOCK_IDS.has(c.id));
    const updatedResident = {
      ...targetResident,
      isGovernmentVerified: true,
      status: "GOVERNMENT_VERIFIED",
      verifiedAt: new Date().toISOString(),
      certifications: [certRecord, ...existingCerts.filter(c => c.id !== certRecord.id)]
    };

    const updatedAll = allResidents.map(r => r.id === targetResident.id ? updatedResident : r);
    setAllResidents(updatedAll);

    // Save to localStorage
    try {
      const storedCustom = JSON.parse(localStorage.getItem('shroudit_custom_residents') || '[]');
      const filtered = storedCustom.filter(r => r.id !== updatedResident.id);
      localStorage.setItem('shroudit_custom_residents', JSON.stringify([...filtered, updatedResident]));
    } catch (e) {}

    // If currently logged-in user matches target, update session
    if (currentUser?.id === updatedResident.id) {
      saveSession('resident', updatedResident);
    }

    // Save credential to wallet storage
    if (credWithHolder) {
      saveCredential(credWithHolder);
      setUserCredentials(prev => [credWithHolder, ...prev.filter(c => c.id !== credWithHolder.id)]);
    }

    return {
      success: true,
      resident: updatedResident,
      credential: certRecord
    };
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

    // Automatically bind certification and mark resident as government verified
    bindGovernmentCertificationToUser(targetResident.id, newCard);

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
      logout,
      createCustomResident,
      bindGovernmentCertificationToUser,
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

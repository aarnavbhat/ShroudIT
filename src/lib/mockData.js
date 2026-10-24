// Synthetic civic credential dataset for Bengaluru / Cities of the Future
// Aligned with ShroudIT DPDP Act compliance and OpenID4VP privacy standards

export const CREDENTIALS = [
  {
    id: "cred-resident-01",
    title: "Karnataka Smart Resident ID",
    subtitle: "Department of e-Governance, Karnataka",
    issuer: "CeG Karnataka (did:cv:gov-karnataka-ceg)",
    category: "Identity & Residency",
    badgeColor: "cyan",
    status: "Active (Epoch 142)",
    icon: "Shield",
    issueDate: "2026-01-15",
    expiryDate: "2031-01-15",
    rawData: {
      fullName: "Aarav S. Rao",
      nationalId: "XXXX-XXXX-9948", // synthetic masked
      dob: "2003-08-14",
      age: 22,
      gender: "Male",
      address: "#42, 5th Cross, 12th Main, Indiranagar",
      city: "Bengaluru",
      district: "Bengaluru Urban",
      state: "Karnataka",
      pincode: "560038"
    },
    predicates: [
      { id: "over_18", label: "Age ≥ 18", statement: "Holder is 18 years or older", value: true, derivedFrom: "dob: 2003-08-14" },
      { id: "blr_resident", label: "Bengaluru Resident", statement: "Holder resides within BBMP jurisdiction", value: true, derivedFrom: "district: Bengaluru Urban" },
      { id: "karnataka_domicile", label: "Karnataka Domicile", statement: "Holder is a verified resident of Karnataka", value: true, derivedFrom: "state: Karnataka" }
    ],
    deviceKeyFingerprint: "ed25519:e4:91:fb:22:8a:c1:0d:66",
    bbsPublicKey: "bbs1pk_q879fh3j8s90dfh2839dh238f9h32f"
  },
  {
    id: "cred-transit-02",
    title: "BMTC Bengaluru Metro Student Pass",
    subtitle: "Bengaluru Metropolitan Transport Corporation",
    issuer: "BMTC Transit Authority (did:cv:bmtc-transit)",
    category: "Mobility & Transit",
    badgeColor: "emerald",
    status: "Active (Epoch 142)",
    icon: "Train",
    issueDate: "2026-02-01",
    expiryDate: "2026-12-31",
    rawData: {
      studentName: "Aarav S. Rao",
      collegeName: "National Institute of Technology (NITK)",
      studentRollNo: "22-CS-891",
      concessionTier: "Metro + Feeder Pass (Tier-1)",
      passType: "Unlimited Student Concession",
      zone: "Purple & Green Lines + BMTC Volvo"
    },
    predicates: [
      { id: "valid_student", label: "Active Student Status", statement: "Enrollment is active for current academic year", value: true, derivedFrom: "expiry: 2026-12-31" },
      { id: "tier1_concession", label: "Tier 1 Concession Eligible", statement: "Authorized for student metro rate", value: true, derivedFrom: "tier: Tier-1" }
    ],
    deviceKeyFingerprint: "ed25519:e4:91:fb:22:8a:c1:0d:66",
    bbsPublicKey: "bbs1pk_bmtc9927hf9283yh9dfh283f"
  },
  {
    id: "cred-income-03",
    title: "Socio-Economic Welfare Eligibility",
    subtitle: "Directorate of Social Welfare & Food Dept",
    issuer: "Dept of Social Welfare (did:cv:karnataka-dsw)",
    category: "Public Benefit & Welfare",
    badgeColor: "amber",
    status: "Active (Epoch 142)",
    icon: "BadgePercent",
    issueDate: "2026-01-20",
    expiryDate: "2027-01-20",
    rawData: {
      holderName: "Aarav S. Rao",
      rationCardCategory: "Priority Household (PHH)",
      annualFamilyIncome: "₹1,85,000",
      bplStatus: "Verified BPL Beneficiary",
      subsidyCategory: "Band 1 (< 2.5 LPA)"
    },
    predicates: [
      { id: "income_below_3L", label: "Income < ₹3,00,000", statement: "Household annual income is below statutory threshold", value: true, derivedFrom: "income: ₹1,85,000" },
      { id: "welfare_eligible", label: "Welfare Scheme Subsidy Eligible", statement: "Holder meets poverty eradication concession guidelines", value: true, derivedFrom: "category: PHH" }
    ],
    deviceKeyFingerprint: "ed25519:e4:91:fb:22:8a:c1:0d:66",
    bbsPublicKey: "bbs1pk_dsw39847fh92384yf9823f"
  },
  {
    id: "cred-cert-04",
    title: "Digital Skill Certification",
    subtitle: "Karnataka Digital Economy Mission (KDEM)",
    issuer: "KDEM Academy (did:cv:kdem-cert)",
    category: "Professional Credential",
    badgeColor: "violet",
    status: "Active (Epoch 142)",
    icon: "Award",
    issueDate: "2025-11-10",
    expiryDate: "2028-11-10",
    rawData: {
      holderName: "Aarav S. Rao",
      course: "Cybersecurity & Cryptographic Systems Analyst",
      certificationId: "KDEM-SEC-2025-9921",
      grade: "Distinction (Score: 89%)",
      skills: ["Zero Knowledge Proofs", "Identity Protocols", "Security Auditing"]
    },
    predicates: [
      { id: "certified_analyst", label: "Certified Cybersecurity Analyst", statement: "Holder holds accredited level 5 certification", value: true, derivedFrom: "grade: Distinction" },
      { id: "cert_valid_2026", label: "Certificate in Good Standing", statement: "Credential has not expired or been revoked", value: true, derivedFrom: "expiry: 2028-11-10" }
    ],
    deviceKeyFingerprint: "ed25519:e4:91:fb:22:8a:c1:0d:66",
    bbsPublicKey: "bbs1pk_kdem99238h48f72384f"
  }
];

export const VERIFIERS = [
  {
    id: "verifier-library",
    name: "Bengaluru City Central Library",
    department: "Public Libraries Department, Govt. of Karnataka",
    did: "did:cv:verifier-blr-library",
    icon: "BookOpen",
    registeredPurpose: "Age and residency verification for adult digital media borrowing access",
    purposeId: "purp:bbmp-lib-v1",
    retentionPolicy: "Zero retention (ephemeral proof check, discarded immediately)",
    isRegistered: true,
    requiredPredicates: ["over_18", "blr_resident"],
    requestedAttributes: ["over_18 (Predicate)", "blr_resident (Predicate)"],
    forbiddenDemands: ["Aadhaar Number", "Phone Number", "Exact Street Address", "DOB"],
    allowedCredentialIds: ["cred-resident-01"]
  },
  {
    id: "verifier-metro",
    name: "Namma Metro - Majestic Interchange Gate",
    department: "Bangalore Metro Rail Corporation Ltd (BMRCL)",
    did: "did:cv:verifier-bmrcl-gate",
    icon: "Train",
    registeredPurpose: "Instant validation of student transit concession for automated smart turnstile entry",
    purposeId: "purp:bmrcl-transit-pass",
    retentionPolicy: "Zero retention (cryptographic token logged without student persona ID)",
    isRegistered: true,
    requiredPredicates: ["valid_student", "tier1_concession"],
    requestedAttributes: ["valid_student (Predicate)", "tier1_concession (Predicate)"],
    forbiddenDemands: ["Student Roll No", "College Name", "Personal Phone", "Aadhaar"],
    allowedCredentialIds: ["cred-transit-02"]
  },
  {
    id: "verifier-welfare",
    name: "Yuva Nidhi & Citizen Welfare Portal",
    department: "Directorate of Social Security & Welfare",
    did: "did:cv:verifier-yuva-nidhi",
    icon: "Landmark",
    registeredPurpose: "Income band and residency verification for subsidized urban skilling stipend",
    purposeId: "purp:karnataka-welfare-subsidy",
    retentionPolicy: "Signed consent receipt stored on resident device; verifier records only audit commitment",
    isRegistered: true,
    requiredPredicates: ["blr_resident", "income_below_3L"],
    requestedAttributes: ["blr_resident (Predicate)", "income_below_3L (Predicate)"],
    forbiddenDemands: ["Exact Income Figure", "Bank Account Number", "Tax Returns", "Family Details"],
    allowedCredentialIds: ["cred-resident-01", "cred-income-03"]
  },
  {
    id: "verifier-cyber-park",
    name: "KDEM Cyber Corridor & Tech Gateway",
    department: "Karnataka Digital Economy Mission (KDEM)",
    did: "did:cv:verifier-kdem-cyber",
    icon: "ShieldCheck",
    registeredPurpose: "Validation of accredited Level 5 Cybersecurity Certification for secure cyber corridor entry under DPDP Act §6.",
    purposeId: "purp:kdem-cybersec-auth-99",
    retentionPolicy: "Zero retention (ephemeral proof check, discarded immediately)",
    isRegistered: true,
    requiredPredicates: ["certified_analyst", "cert_valid_2026"],
    requestedAttributes: ["Certified Cybersecurity Analyst (Predicate)", "Valid Skill Attestation (Predicate)"],
    forbiddenDemands: ["Original Degree Certificate", "University Roll Number", "Personal Mobile Number", "Home Address"],
    allowedCredentialIds: ["cred-cert-04"]
  },
  {
    id: "verifier-rogue-cafe",
    name: "Suspicious City WiFi Portal (Over-Asking Simulation)",
    department: "Unverified Commercial Advertising Entity",
    did: "did:cv:rogue-unregistered-wifi-kiosk",
    icon: "WifiOff",
    registeredPurpose: "Claims: 'Complimentary Public Smart City WiFi Login'",
    purposeId: "unverified:data-harvesting-probe",
    retentionPolicy: "Commercial retention & third-party marketing sharing",
    isRegistered: false, // FLAG!
    isOverAsking: true,
    requiredPredicates: [],
    requestedAttributes: [
      "FULL Aadhaar / National ID",
      "Raw Date of Birth",
      "Mobile Phone Number",
      "Full Physical Home Address",
      "Annual Family Income",
      "College Enrollment Roll Number"
    ],
    forbiddenDemands: ["Exceeds DPDP Act Data Minimization Threshold by 600%"],
    allowedCredentialIds: []
  }
];

export const ON_CHAIN_REGISTRY = {
  network: "ShroudIT Public Trust Ledger (Hardhat L2 Sandbox)",
  latestBlock: 489214,
  blockTimeSec: 2.1,
  currentEpoch: 142,
  epochTimeRemaining: "4h 22m",
  totalAnchoredIssuers: 6,
  totalRevocationRoots: 142,
  totalIssuanceBatches: 38,
  merkleRootHash: "0x9bf41a67d028b1e4c398e09f58cb2142e88f7c9e0a2948719280efca117a4c9b",
  issuers: [
    {
      name: "Center for e-Governance, Karnataka",
      did: "did:cv:gov-karnataka-ceg",
      publicKey: "0x04e8b394f...99a1",
      status: "Accredited",
      credentialsIssued: "1,248,500",
      schemas: ["ResidentIdentity_v2", "AddressCredential_v1"],
      lastAnchoredTx: "0x7a3f89...11c2"
    },
    {
      name: "BMTC Transit Authority",
      did: "did:cv:bmtc-transit",
      publicKey: "0x03a74b921...84c9",
      status: "Accredited",
      credentialsIssued: "410,200",
      schemas: ["StudentTransitPass_v3"],
      lastAnchoredTx: "0x88e1bc...5f90"
    },
    {
      name: "Directorate of Social Welfare",
      did: "did:cv:karnataka-dsw",
      publicKey: "0x02c89281a...d91e",
      status: "Accredited",
      credentialsIssued: "320,150",
      schemas: ["SocioEconomicBenefit_v2"],
      lastAnchoredTx: "0x19dfa2...77ab"
    },
    {
      name: "Karnataka Digital Economy Mission",
      did: "did:cv:kdem-cert",
      publicKey: "0x04481b99f...33e4",
      status: "Accredited",
      credentialsIssued: "94,800",
      schemas: ["ProfessionalSkillCert_v1"],
      lastAnchoredTx: "0x66c3a1...88b2"
    },
    {
      name: "Center for e-Governance, Karnataka",
      did: "did:shroud:gov-karnataka-ceg",
      publicKey: "0x04e8b394f...99a1",
      status: "Accredited",
      credentialsIssued: "1,248,500",
      schemas: ["ResidentIdentity_v2", "AddressCredential_v1"],
      lastAnchoredTx: "0x7a3f89...11c2"
    },
    {
      name: "Government Accredited Authority (Civic Ingestion)",
      did: "did:cv:gov-accredited-authority",
      publicKey: "0x04e8b394f...99a1",
      status: "Accredited",
      credentialsIssued: "1,248,500",
      schemas: ["ResidentIdentity_v2", "CivicAttestation_v1"],
      lastAnchoredTx: "0x7a3f89...11c2"
    },
    {
      name: "Government Accredited Authority (Civic Ingestion)",
      did: "did:shroud:gov-accredited-authority",
      publicKey: "0x04e8b394f...99a1",
      status: "Accredited",
      credentialsIssued: "1,248,500",
      schemas: ["ResidentIdentity_v2", "CivicAttestation_v1"],
      lastAnchoredTx: "0x7a3f89...11c2"
    }
  ],
  transparencyLogs: [
    {
      batchId: "BATCH-2026-042",
      issuer: "CeG Karnataka",
      count: 2450,
      timestamp: "10 mins ago",
      merkleRoot: "0x3f8a...92b1",
      txHash: "0x44bf...991a",
      status: "Verified On-Chain"
    },
    {
      batchId: "BATCH-2026-041",
      issuer: "BMTC Transit",
      count: 850,
      timestamp: "32 mins ago",
      merkleRoot: "0x892a...c09e",
      txHash: "0x28dc...411e",
      status: "Verified On-Chain"
    },
    {
      batchId: "BATCH-2026-040",
      issuer: "Dept of Social Welfare",
      count: 620,
      timestamp: "1 hour ago",
      merkleRoot: "0x77c2...e810",
      txHash: "0x90af...b304",
      status: "Verified On-Chain"
    }
  ]
};

export const INITIAL_CONSENT_RECEIPTS = [
  {
    id: "rcpt-2026-091",
    timestamp: "2026-10-21 16:42:10 IST",
    verifierName: "Bengaluru City Central Library",
    purpose: "Age and residency verification for adult digital media borrowing access",
    attributesDisclosed: ["Age ≥ 18 (True)", "Bengaluru Resident (True)"],
    zeroPiiLeaked: true,
    nonceHash: "0x4e892c...991a",
    bbsProofCommitment: "0x7b119a...32fe",
    dpdpActNotice: "Compliant with Digital Personal Data Protection Act §6 (Purpose Limitation)"
  },
  {
    id: "rcpt-2026-090",
    timestamp: "2026-10-21 14:15:22 IST",
    verifierName: "Namma Metro - Majestic Interchange Gate",
    purpose: "Instant validation of student transit concession",
    attributesDisclosed: ["Active Student Status (True)", "Tier 1 Concession (True)"],
    zeroPiiLeaked: true,
    nonceHash: "0x12fa88...67dc",
    bbsProofCommitment: "0x91df42...55ba",
    dpdpActNotice: "Compliant with Digital Personal Data Protection Act §6 (Purpose Limitation)"
  }
];

export const EXPLAINER_TRANSLATIONS = {
  en: {
    title: "AI Privacy & Consent Guardian",
    badge: "DPDP Act 2023 Compliant",
    summary: "The verifier requests proof that you meet their service criteria. ShroudIT ensures they learn ONLY the true/false predicate and CANNOT track or link your identity across other city services.",
    points: [
      {
        title: "Zero Personal Data Exposure",
        desc: "Your real name, Aadhaar number, birth date, and exact address are completely withheld."
      },
      {
        title: "Cryptographic Unlinkability",
        desc: "A freshly randomized BBS+ zero-knowledge signature proof is generated. The library and the metro cannot correlate your visits."
      },
      {
        title: "Ephemeral Nonce Protection",
        desc: "The proof is mathematically bound to this specific verifier's one-time challenge. It cannot be intercepted or replayed."
      }
    ],
    actionButton: "Authorize Selective Disclosure",
    cancelButton: "Reject Request"
  },
  kn: {
    title: "AI ಗೌಪ್ಯತೆ ಮತ್ತು ಸಮ್ಮತಿ ರಕ್ಷಕ",
    badge: "DPDP ಕಾಯ್ದೆ 2023 ಅನುಸರಣೆ",
    summary: "ಸೇವಾ ಪೂರೈಕೆದಾರರು ನೀವು ನಿಯಮಗಳನ್ನು ಪೂರೈಸುತ್ತೀರಾ ಎಂದು ಮಾತ್ರ ತಿಳಿಯಲು ವಿನಂತಿಸಿದ್ದಾರೆ. ಶ್ರೌಡ್‌ಐಟಿ (ShroudIT) ಮೂಲಕ ಅವರಿಗೆ ಕೇವಲ ಸರಿ/ತಪ್ಪು ಮಾಹಿತಿ ಮಾತ್ರ ತಲುಪುತ್ತದೆ ಮತ್ತು ಇತರ ನಗರ ಸೇವೆಗಳೊಂದಿಗೆ ನಿಮ್ಮನ್ನು ಗುರುತಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.",
    points: [
      {
        title: "ಯಾವುದೇ ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ ಸೋರಿಕೆಯಾಗುವುದಿಲ್ಲ",
        desc: "ನಿಮ್ಮ ನಿಜವಾದ ಹೆಸರು, ಆಧಾರ್ ಸಂಖ್ಯೆ, ಜನ್ಮ ದಿನಾಂಕ ಅಥವಾ ವಿಳಾಸವನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ಮರೆಮಾಡಲಾಗಿದೆ."
      },
      {
        title: "ಲಿಂಕ್ ಮಾಡಲಾಗದ ಕ್ರಿಪ್ಟೋಗ್ರಾಫಿಕ್ ಪುರಾವೆ",
        desc: "ಪ್ರತಿ ಬಾರಿಯೂ ಹೊಸ ಯಾದೃಚ್ಛಿಕ BBS+ ರುಜುವಾತು ಪುರಾವೆಯನ್ನು ನೀಡಲಾಗುತ್ತದೆ. ಗ್ರಂಥಾಲಯ ಮತ್ತು ಮೆಟ್ರೋ ನೀವು ಒಂದೇ ವ್ಯಕ್ತಿ ಎಂದು ತಿಳಿಯಲು ಸಾಧ್ಯವಿಲ್ಲ."
      },
      {
        title: "ಮರುಬಳಕೆ ತಡೆಗಟ್ಟುವಿಕೆ (Nonce)",
        desc: "ಈ ಪುರಾವೆಯನ್ನು ಕೇವಲ ಈ ಕ್ಷಣದ ಪರಿಶೀಲನೆಗೆ ಮಾತ್ರ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ. ಬೇರೆ ಯಾರೂ ಇದನ್ನು ಕದಿಯಲು ಅಥವಾ ಬಳಸಲು ಸಾಧ್ಯವಿಲ್ಲ."
      }
    ],
    actionButton: "ಆಯ್ದ ಪುರಾವೆಯನ್ನು ಅನುಮೋದಿಸಿ",
    cancelButton: "ತಿರಸ್ಕರಿಸಿ"
  },
  hi: {
    title: "एआई गोपनीयता एवं सहमति रक्षक",
    badge: "DPDP अधिनियम 2023 के अनुरूप",
    summary: "सत्यापनकर्ता केवल यह पुष्टि चाहता है कि आप सेवा की शर्तों को पूरा करते हैं। ShroudIT सुनिश्चित करता है कि उन्हें केवल सही/गलत का प्रमाण मिले और वे आपको किसी अन्य नगर सेवा से लिंक या ट्रैक न कर सकें।",
    points: [
      {
        title: "शून्य व्यक्तिगत डेटा प्रकटीकरण",
        desc: "आपका वास्तविक नाम, आधार संख्या, जन्मतिथि और पूरा पता पूरी तरह से गुप्त रखा जाता है।"
      },
      {
        title: "असंबंधित क्रिप्टोग्राफिक प्रमाण (Unlinkable)",
        desc: "प्रत्येक प्रस्तुति के लिए एक नया यादृच्छिक BBS+ प्रमाण बनता है। लाइब्रेरी और मेट्रो यह पता नहीं लगा सकते कि दोनों जगह एक ही व्यक्ति था।"
      },
      {
        title: "रीप्ले सुरक्षा (Ephemeral Nonce)",
        desc: "यह प्रमाण केवल इसी एक बार के सत्यापन से बंधा है। इसे कॉपी करके कहीं और इस्तेमाल नहीं किया जा सकता।"
      }
    ],
    actionButton: "चयनात्मक प्रकटीकरण को अधिकृत करें",
    cancelButton: "अस्वीकार करें"
  }
};

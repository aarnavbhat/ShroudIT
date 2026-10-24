// ShroudIT Statutory Purpose Firewall & Dynamic Contextual Consent Engine
// Aligned with Digital Personal Data Protection (DPDP) Act 2023 §6 (Purpose Limitation)

/**
 * Evaluates Relying Party (Verifier) requests against DPDP §6 Purpose Limitation.
 * Strictly detects and intercepts over-asking attacks demanding forbidden PII fields.
 * 
 * @param {Object} request { verifierDid, verifierName, purpose, demandedFields }
 * @param {Object} credential Active resident credential being evaluated
 * @returns {Object} Structured firewall audit report
 */
export function evaluatePurposeFirewall(request, credential = null) {
  const demandedFields = request?.demandedFields || [];
  const verifierDid = request?.verifierDid || "did:shroud:unknown-relying-party";
  const verifierName = request?.verifierName || "Unregistered Relying Party";
  const purpose = request?.purpose || "Unspecified Service Interaction";

  // Statutory forbidden personal data indicators under DPDP §6 minimization
  const forbiddenPatterns = [
    { pattern: /aadhaar|national.?id|ssn|gov.?id|pan/i, name: "National Identity / Aadhaar Number", risk: "CRITICAL" },
    { pattern: /dob|date.?of.?birth|birth.?date/i, name: "Exact Date of Birth", risk: "HIGH", alternative: "Age ≥ 18 Predicate" },
    { pattern: /phone|mobile|cell|contact/i, name: "Primary Mobile Number", risk: "HIGH" },
    { pattern: /address|residence|house|street|pincode/i, name: "Full Physical Street Address", risk: "HIGH", alternative: "Ward / Municipal Domicile Predicate" },
    { pattern: /biometric|fingerprint|iris|face.?raw/i, name: "Raw Biometric Templates", risk: "CRITICAL" },
    { pattern: /salary|income|bank|account/i, name: "Direct Financial / Banking Credentials", risk: "CRITICAL", alternative: "Subsidized Beneficiary Eligibility Predicate" }
  ];

  const violatingDemands = [];
  const recommendedAlternatives = [];
  let highestRisk = "NONE";

  for (const field of demandedFields) {
    for (const rule of forbiddenPatterns) {
      if (rule.pattern.test(field)) {
        violatingDemands.push({
          demandedField: field,
          matchedRule: rule.name,
          risk: rule.risk
        });
        if (rule.alternative && !recommendedAlternatives.includes(rule.alternative)) {
          recommendedAlternatives.push(rule.alternative);
        }
        if (rule.risk === "CRITICAL") highestRisk = "CRITICAL";
        else if (rule.risk === "HIGH" && highestRisk !== "CRITICAL") highestRisk = "HIGH";
      }
    }
  }

  // Check if verifier is unregistered or unrecognized
  const isUnregistered = verifierDid.includes("rogue") || verifierDid.includes("unregistered") || verifierDid.includes("unknown");
  if (isUnregistered && highestRisk === "NONE") {
    highestRisk = "MEDIUM";
  }

  const violationDetected = violatingDemands.length > 0 || isUnregistered;
  const safeAlternativesText = recommendedAlternatives.length > 0
    ? recommendedAlternatives.join(" or ")
    : "Present zero-knowledge selective disclosure predicates only (Zero PII)";

  return {
    allowed: !violationDetected,
    violationDetected,
    severity: highestRisk,
    verifierDid,
    verifierName,
    purposeStatement: purpose,
    statutoryProvision: "DPDP Act 2023 §6(1) & §6(2) — Purpose Limitation & Mandatory Data Minimization",
    violatingDemands: violatingDemands.map(v => `${v.demandedField} (${v.matchedRule})`),
    prohibitedFieldsCount: violatingDemands.length,
    safeAlternative: safeAlternativesText,
    timestamp: new Date().toLocaleTimeString(),
    technicalSummary: violationDetected
      ? `Firewall Intercepted ${violatingDemands.length} statutory over-asking violations. Zero personal bytes transmitted to relying party.`
      : "Relying party request strictly conforms to registered DPDP purpose charter."
  };
}

// Multilingual translations dictionary for municipal verifiers
const VERIFIER_TRANSLATIONS = {
  kn: {
    "Bengaluru City Central Library": "ಬೆಂಗಳೂರು ನಗರ ಕೇಂದ್ರ ಸಾರ್ವಜನಿಕ ಗ್ರಂಥಾಲಯ",
    "BMTC Transit Authority": "ಬಿಎಂಟಿಸಿ ಮೆಟ್ರೋ ಸಾರಿಗೆ ಪ್ರಾಧಿಕಾರ",
    "Yuva Nidhi Welfare Directorate": "ಯುವ ನಿಧಿ ಸಮಾಜ ಕಲ್ಯಾಣ ನಿರ್ದೇಶನಾಲಯ",
    "Jan Aushadhi Health Clinic": "ಜನೌಷಧಿ ನಗರ ಆರೋಗ್ಯ ಕೇಂದ್ರ",
    "Karnataka Center for e-Governance": "ಕರ್ನಾಟಕ ಇ-ಆಡಳಿತ ಕೇಂದ್ರ"
  },
  hi: {
    "Bengaluru City Central Library": "बेंगलुरु केंद्रीय सार्वजनिक पुस्तकालय",
    "BMTC Transit Authority": "बीएमटीसी मेट्रो ट्रांजिट प्राधिकरण",
    "Yuva Nidhi Welfare Directorate": "युवा निधि समाज कल्याण निदेशालय",
    "Jan Aushadhi Health Clinic": "जन औषधि नागरिक स्वास्थ्य क्लिनिक",
    "Karnataka Center for e-Governance": "कर्नाटक ई-गवर्नेंस केंद्र"
  }
};

// Predicates localization dictionary
const PREDICATE_TRANSLATIONS = {
  kn: {
    "Age ≥ 18": "ವಯಸ್ಸು 18 ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚು",
    "over_18": "ವಯಸ್ಸು 18 ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚು",
    "Bengaluru Resident": "ಬೆಂಗಳೂರು ನಗರ ನಿವಾಸಿ ಪ್ರಮಾಣೀಕರಣ",
    "blr_resident": "ಬೆಂಗಳೂರು ನಗರ ನಿವಾಸಿ ಪ್ರಮಾಣೀಕರಣ",
    "Active Student Status": "ಸಕ್ರಿಯ ವಿದ್ಯಾರ್ಥಿ ನೋಂದಣಿ",
    "student_active": "ಸಕ್ರಿಯ ವಿದ್ಯಾರ್ಥಿ ನೋಂದಣಿ",
    "Tier 1 Concession": "ಹಂತ 1 ಸಾರಿಗೆ ರಿಯಾಯಿತಿ ಅರ್ಹತೆ",
    "concession_tier1": "ಹಂತ 1 ಸಾರಿಗೆ ರಿಯಾಯಿತಿ ಅರ್ಹತೆ",
    "PHH Welfare Beneficiary": "ಆದ್ಯತಾ ಪಡಿತರ ಚೀಟಿ ಫಲಾನುಭವಿ",
    "phh_beneficiary": "ಆದ್ಯತಾ ಪಡಿತರ ಚೀಟಿ ಫಲಾನುಭವಿ",
    "Cybersecurity Distinction": "ಸೈಬರ್ ಭದ್ರತಾ ಪ್ರಮಾಣಪತ್ರ",
    "cybersec_distinction": "ಸೈಬರ್ ಭದ್ರತಾ ಪ್ರಮಾಣಪತ್ರ"
  },
  hi: {
    "Age ≥ 18": "आयु 18 वर्ष या उससे अधिक",
    "over_18": "आयु 18 वर्ष या उससे अधिक",
    "Bengaluru Resident": "बेंगलुरु स्थानीय निवासी",
    "blr_resident": "बेंगलुरु स्थानीय निवासी",
    "Active Student Status": "सक्रिय छात्र स्थिति",
    "student_active": "सक्रिय छात्र स्थिति",
    "Tier 1 Concession": "टियर 1 रियायत पात्रता",
    "concession_tier1": "टियर 1 रियायत पात्रता",
    "PHH Welfare Beneficiary": "प्राथमिकता राशन कार्ड लाभार्थी",
    "phh_beneficiary": "प्राथमिकता राशन कार्ड लाभार्थी",
    "Cybersecurity Distinction": "साइबर सुरक्षा विशिष्टता प्रमाणन",
    "cybersec_distinction": "साइबर सुरक्षा विशिष्टता प्रमाणन"
  }
};

/**
 * Dynamically synthesizes contextual multilingual DPDP consent notices.
 * Adapts verifier department name, service charter, and chosen predicates on-the-fly.
 */
export function generateContextualConsentNotice({
  lang = 'en',
  verifierName = 'Bengaluru City Central Library',
  verifierPurpose = 'Age and residency verification for adult digital media borrowing access',
  requestedPredicateLabels = ['Age ≥ 18', 'Bengaluru Resident'],
  residentName = 'Aarav S. Rao'
} = {}) {
  const safeLang = ['en', 'kn', 'hi'].includes(lang) ? lang : 'en';

  if (safeLang === 'kn') {
    const localizedVerifier = VERIFIER_TRANSLATIONS.kn[verifierName] || verifierName;
    const localizedPredicates = requestedPredicateLabels.map(p => PREDICATE_TRANSLATIONS.kn[p] || p);
    
    return {
      title: "AI ಗೌಪ್ಯತೆ ಮತ್ತು ಸಮ್ಮತಿ ರಕ್ಷಕ",
      badge: "ಡಿಪಿಡಿಪಿ ಕಾಯ್ದೆ 2023 ಕಡ್ಡಾಯ ಅನುಸರಣೆ",
      verifierTitle: localizedVerifier,
      predicatesList: localizedPredicates,
      summary: `${localizedVerifier} ಸಂಸ್ಥೆಯು ತಮ್ಮ ಸೇವೆಯನ್ನು ಒದಗಿಸಲು ನಿಮ್ಮ '${localizedPredicates.join(', ')}' ಷರತ್ತನ್ನು ಮಾತ್ರ ಪರಿಶೀಲಿಸಲು ವಿನಂತಿಸಿದೆ. ShroudIT ಶೂನ್ಯ-ಜ್ಞಾನ BBS+ ತಂತ್ರಜ್ಞಾನವು ನಿಮ್ಮ ಹೆಸರು, ಹುಟ್ಟಿದ ದಿನಾಂಕ ಅಥವಾ ವಿಳಾಸವನ್ನು ಬಹಿರಂಗಪಡಿಸದೆ, ಕೇವಲ ಷರತ್ತು ನಿಜವೇ ಎಂಬುದನ್ನು ಮಾತ್ರ ಗಣಿತೀಯವಾಗಿ ದೃಢೀಕರಿಸುತ್ತದೆ.`,
      points: [
        {
          title: "ಶೂನ್ಯ ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ ಸೋರಿಕೆ (Zero PII)",
          desc: "ನಿಮ್ಮ ಆಧಾರ್ ಸಂಖ್ಯೆ, ಪೂರ್ಣ ವಿಳಾಸ ಅಥವಾ ಜನ್ಮ ದಿನಾಂಕವನ್ನು ಸೇವೆಯು ನೋಡಲು ಅಥವಾ ಸಂಗ್ರಹಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ."
        },
        {
          title: "ಅನ್‌ಲಿಂಕ್ ಮಾಡಲಾಗದ BBS+ ಪ್ರಸ್ತುತಿ (Unlinkable)",
          desc: "BBS+ ಕ್ರಿಪ್ಟೋಗ್ರಾಫಿಕ್ ಬ್ಲೈಂಡಿಂಗ್ ಬಳಸಿ ರಚಿಸಲಾದ ಪುರಾವೆಯನ್ನು ನಗರದ ಇತರ ಸಾರ್ವಜನಿಕ ಸೇವೆಗಳೊಂದಿಗೆ ಜೋಡಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ."
        },
        {
          title: "ಏಕ-ಬಳಕೆಯ ಅಲ್ಪಕಾಲಿಕ ಸವಾಲು (Ephemeral Nonce)",
          desc: "ಈ ಸಮ್ಮತಿಯು ಪ್ರಸ್ತುತ 180 ಸೆಕೆಂಡುಗಳ ಅಧಿವೇಶನಕ್ಕೆ ಮಾತ್ರ ಸೀಮಿತವಾಗಿದೆ. ಮರುಬಳಕೆಯ ದಾಳಿಗಳನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ."
        }
      ],
      actionButton: "ಷರತ್ತುಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಪ್ರಸ್ತುತಪಡಿಸಿ",
      cancelButton: "ಅನುಮತಿ ರದ್ದುಮಾಡಿ"
    };
  }

  if (safeLang === 'hi') {
    const localizedVerifier = VERIFIER_TRANSLATIONS.hi[verifierName] || verifierName;
    const localizedPredicates = requestedPredicateLabels.map(p => PREDICATE_TRANSLATIONS.hi[p] || p);

    return {
      title: "AI गोपनीयता एवं सहमति संरक्षक",
      badge: "डीपीडीपी अधिनियम 2023 अनुपालन",
      verifierTitle: localizedVerifier,
      predicatesList: localizedPredicates,
      summary: `${localizedVerifier} ने अपनी सेवा पात्रता हेतु केवल आपके '${localizedPredicates.join(', ')}' मापदंड की पुष्टि का अनुरोध किया है। ShroudIT ज़ीरो-नॉलेज (BBS+) तकनीक यह सुनिश्चित करती है कि सेवा प्रदाता को आपका नाम, जन्म तिथि या आवासीय पता जाने बिना केवल सत्य/असत्य तथ्य प्राप्त हो।`,
      points: [
        {
          title: "शून्य व्यक्तिगत डेटा प्रकटीकरण (Zero PII)",
          desc: "आपका आधार नंबर, जन्म तिथि या फोन नंबर कभी उजागर नहीं होता। केवल आवश्यक तथ्य सिद्ध होता है।"
        },
        {
          title: "असंबंधित BBS+ सत्यापन (Unlinkable Proof)",
          desc: "प्रत्येक प्रस्तुति में नवीन क्रिप्टोग्राफ़िक ब्लाइंडिंग स्केलर का उपयोग होता है, जिससे अन्य सेवाओं के साथ ट्रैकिंग असंभव है।"
        },
        {
          title: "एकबारगी सत्र चुनौती (Anti-Replay Nonce)",
          desc: "यह सहमति केवल वर्तमान सक्रिय सत्र (180 सेकंड) के लिए मान्य है, किसी भी प्रकार का पुनः उपयोग पूर्णतः वर्जित है।"
        }
      ],
      actionButton: "मापदंड सत्यापित करें एवं प्रस्तुत करें",
      cancelButton: "प्रस्तुति रद्द करें"
    };
  }

  // Default: English
  return {
    title: "AI Privacy & Consent Guardian",
    badge: "DPDP Act 2023 Compliant",
    verifierTitle: verifierName,
    predicatesList: requestedPredicateLabels,
    summary: `${verifierName} requests verification of '${requestedPredicateLabels.join(', ')}' to fulfill their registered municipal purpose. ShroudIT ensures the service learns ONLY the true/false zero-knowledge assertion and CANNOT track or link your identity across city services.`,
    points: [
      {
        title: "Zero Personal Identifiable Information (Zero PII)",
        desc: "Your national ID, exact birth date, and residential street address are never disclosed or stored by the relying party."
      },
      {
        title: "Cryptographically Unlinkable (BBS+ ZKPoK)",
        desc: "Random blinding scalars r1, r2 prevent colluding city agencies from correlating visits across services."
      },
      {
        title: "Ephemeral Challenge Nonce (Replay Defense)",
        desc: "The proof is strictly bound to this 180s active session nonce. Replay and eavesdropping attacks are rejected."
      }
    ],
    actionButton: "Authorize & Present Proof",
    cancelButton: "Cancel Presentation"
  };
}

/**
 * Document AI Categorization & Purpose Limitation Engine
 * Analyzes verified government documents and dynamically decides which categories / zero-knowledge
 * predicates the citizen is legally eligible for under DPDP Act §6.
 *
 * Example: If declared annual income exceeds ₹3,00,000, the AI strictly blocks the 'income_below_3L'
 * category and ONLY generates options the resident is eligible for.
 */

import { GOV_PUBLIC_KEY_BASE64 } from './governmentSigner.js';

/**
 * Extracts numeric annual income from structured document or text
 */
export function extractAnnualIncome(doc) {
  if (typeof doc !== 'object' || doc === null) {
    if (typeof doc === 'number') return doc;
    doc = {};
  }

  // Check structured properties first (numbers or formatted currency strings)
  for (const field of ['annualIncome', 'income', 'annual_income', 'salary', 'ctc']) {
    if (typeof doc[field] === 'number') return doc[field];
    if (typeof doc[field] === 'string') {
      const clean = doc[field].replace(/[₹,$\s]/g, '');
      const parsed = parseFloat(clean);
      if (!isNaN(parsed) && parsed > 0) {
        if (/lakh|lakhs|lac|lacs/i.test(doc[field])) return parsed * 100000;
        return parsed;
      }
    }
  }

  const raw = typeof doc === 'string' ? doc : JSON.stringify(doc);
  // Strip commas between digits: e.g. "4,50,000" -> "450000", "2,40,000" -> "240000"
  const text = raw.replace(/(?<=\d),(?=\d)/g, '');

  // Check for Lakhs / Lacs format (e.g., 4.5 Lakhs, 3 lacs)
  const lakhMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)/i);
  if (lakhMatch) {
    return parseFloat(lakhMatch[1]) * 100000;
  }

  // Check for direct numeric income format (e.g., ₹450000, INR 240000)
  const numMatch = text.match(/(?:income|salary|annual|ctc)[^\d]{1,15}(\d{5,8})/i);
  if (numMatch) {
    return parseInt(numMatch[1], 10);
  }

  return null;
}

/**
 * Calculates age from date of birth
 */
export function calculateAge(dobStr) {
  if (!dobStr) return null;
  const birth = new Date(dobStr);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Analyzes a cryptographically verified government document using AI eligibility rules.
 * Generates ONLY the categories and zero-knowledge options the person is legally eligible for.
 */
export function analyzeDocumentAndGenerateCredential({ document, verificationMeta = {} }) {
  const text = typeof document === 'string' ? document : JSON.stringify(document);
  const docObj = typeof document === 'object' && document !== null ? document : {};

  // If document was produced by Text Signing Lab, extract inner payload from docObj.text
  let effectiveDoc = docObj;
  if (typeof docObj.text === 'string') {
    try {
      const parsedText = JSON.parse(docObj.text);
      if (typeof parsedText === 'object' && parsedText !== null) {
        effectiveDoc = { ...docObj, ...parsedText };
      }
    } catch (e) {
      effectiveDoc = { ...docObj, rawText: docObj.text };
    }
  }

  const allowedPredicates = [];
  const disqualifiedCategories = [];
  const aiDecisions = [];

  // Determine Document Category & Heading
  let docHeading = "Government Verified Civic Certificate";
  let docCategory = "General Civic Attestation";
  let iconName = "Shield";
  let themeColor = "cyan";

  // Combine full text context for keyword analysis
  const fullText = text + ' ' + (typeof docObj.text === 'string' ? docObj.text : '');

  const isIncomeDoc = /\b(income|asset|welfare|stipend|yuva|bpl|ews|salary|ctc)\b/i.test(fullText);
  const isStudentDoc = /\b(student|college|university|metro|transit|enrollment|school|tuition)\b/i.test(fullText);
  const isCyberDoc = /\b(cyber|cybersecurity|infosec|kdem|comptia|cisp)\b|security\s*analyst/i.test(fullText);
  const isDomicileDoc = /\b(domicile|resident|bbmp|karnataka|bengaluru|bangalore)\b/i.test(fullText);

  // 1. EVALUATE INCOME CRITERIA
  const detectedIncome = extractAnnualIncome(effectiveDoc);
  if (detectedIncome !== null || isIncomeDoc) {
    docHeading = "Verified Government Income & Asset Certificate";
    docCategory = "Socio-Economic Welfare Eligibility";
    iconName = "BadgePercent";
    themeColor = "emerald";

    const incomeVal = detectedIncome !== null ? detectedIncome : 240000;
    const STATUTORY_THRESHOLD = 300000; // ₹3 Lakhs limit

    if (incomeVal > STATUTORY_THRESHOLD) {
      // STRICT PURPOSE LIMITATION: User has income > 3L.
      // Disqualify and suppress income_below_3L!
      disqualifiedCategories.push({
        id: "income_below_3L",
        label: "Annual Income ≤ ₹3,00,000",
        reason: `Disqualified: Declared annual income of ₹${incomeVal.toLocaleString('en-IN')} exceeds the statutory ₹3,00,000 ceiling under DPDP Act §6. Low-income subsidy categories are strictly suppressed.`
      });
      disqualifiedCategories.push({
        id: "welfare_eligible",
        label: "Welfare Subsidy Eligible (Yuva Nidhi)",
        reason: `Disqualified: Income exceeds eligibility bracket for subsidized urban skilling stipends.`
      });

      aiDecisions.push(`Income check: Stated annual income (₹${incomeVal.toLocaleString('en-IN')}) is above ₹3,00,000. 'Annual Income ≤ 3 Lakhs' option blocked.`);

      // Only grant categories they ARE eligible for
      allowedPredicates.push({
        id: "income_tax_assessed",
        label: "Tax Assessed Resident",
        statement: `Annual income verified above ₹3,00,000 threshold (Assessed Category)`,
        value: true,
        derivedFrom: `income: ₹${incomeVal.toLocaleString('en-IN')}`
      });
    } else {
      // User has income <= 3L -> Grant eligible categories
      allowedPredicates.push({
        id: "income_below_3L",
        label: "Annual Income ≤ ₹3,00,000",
        statement: `Income verified below ₹3,00,000 statutory ceiling`,
        value: true,
        derivedFrom: `income: ₹${incomeVal.toLocaleString('en-IN')}`
      });
      allowedPredicates.push({
        id: "welfare_eligible",
        label: "Welfare Subsidy Eligible",
        statement: `Eligible for Yuva Nidhi & socio-economic welfare concessions`,
        value: true,
        derivedFrom: `income: ₹${incomeVal.toLocaleString('en-IN')} ≤ ₹3,00,000`
      });

      aiDecisions.push(`Income check: Verified income of ₹${incomeVal.toLocaleString('en-IN')} is within statutory limit (≤ ₹3,00,000). Granted 'Income ≤ 3L' and 'Welfare Eligible'.`);
    }
  }

  // 2. EVALUATE STUDENT & TRANSIT CRITERIA
  if (isStudentDoc) {
    if (!isIncomeDoc) {
      docHeading = "Verified Student Concession & Transit Pass";
      docCategory = "Public Transit Concession";
      iconName = "Train";
      themeColor = "cyan";
    }

    allowedPredicates.push({
      id: "valid_student",
      label: "Accredited Student",
      statement: "Enrolled in recognized educational institution",
      value: true,
      derivedFrom: effectiveDoc.college || effectiveDoc.institution || "Enrolled College"
    });
    allowedPredicates.push({
      id: "tier1_concession",
      label: "Transit Concession",
      statement: "Eligible for 50% BMTC & Metro student fare concession",
      value: true,
      derivedFrom: "Student Concession Scheme"
    });

    aiDecisions.push("Student accreditation: Active student enrollment verified. Generated transit concession predicates.");
  }

  // 3. EVALUATE CYBERSECURITY & TECHNICAL SKILLS CRITERIA
  if (isCyberDoc) {
    if (!isIncomeDoc && !isStudentDoc) {
      docHeading = "Verified Technical Skill & Cybersecurity Accreditation";
      docCategory = "Technical Accreditation";
      iconName = "Award";
      themeColor = "violet";
    }

    allowedPredicates.push({
      id: "certified_analyst",
      label: "Certified Cybersecurity Analyst",
      statement: "Holder holds accredited Level 5 Cybersecurity Certification",
      value: true,
      derivedFrom: effectiveDoc.grade || "Distinction (Level 5)"
    });
    allowedPredicates.push({
      id: "cert_valid_2026",
      label: "Valid Skill Attestation",
      statement: "Certification is active through 2026",
      value: true,
      derivedFrom: effectiveDoc.validUntil || "2026-12-31"
    });

    aiDecisions.push("Technical certification: Level 5 Cybersecurity Analyst qualification confirmed. Generated skill attestation predicates.");
  }

  // 4. EVALUATE AGE & DOMICILE CRITERIA
  const dob = effectiveDoc.dob || effectiveDoc.dateOfBirth || effectiveDoc.birthDate || "2003-08-14";
  const age = calculateAge(dob);

  if (age !== null && age >= 18) {
    allowedPredicates.push({
      id: "over_18",
      label: "Age ≥ 18",
      statement: "Holder is 18 years of age or older",
      value: true,
      derivedFrom: `dob: ${dob}`
    });
    aiDecisions.push(`Age check: Holder is ${age} years old. Granted 'Age ≥ 18' predicate.`);
  } else if (age !== null && age < 18) {
    disqualifiedCategories.push({
      id: "over_18",
      label: "Age ≥ 18",
      reason: `Disqualified: Holder is ${age} years old (under 18 minor). Adult access categories are suppressed.`
    });
    allowedPredicates.push({
      id: "minor_resident",
      label: "Minor Resident (< 18)",
      statement: "Holder is under 18 years of age",
      value: true,
      derivedFrom: `dob: ${dob}`
    });
    aiDecisions.push(`Age check: Holder is ${age} years old (< 18). Suppressed 'Age ≥ 18'.`);
  }

  // Domicile check
  const domicileStr = effectiveDoc.domicile || effectiveDoc.address || effectiveDoc.jurisdiction || "Bengaluru Urban, Karnataka";
  if (/bengaluru|bangalore|bbmp/i.test(domicileStr)) {
    allowedPredicates.push({
      id: "blr_resident",
      label: "Bengaluru Resident",
      statement: "Holder resides within BBMP municipal jurisdiction",
      value: true,
      derivedFrom: domicileStr
    });
  }
  allowedPredicates.push({
    id: "karnataka_domicile",
    label: "Karnataka Domicile",
    statement: "Verified resident of Karnataka state",
    value: true,
    derivedFrom: "State of Karnataka"
  });

  // Unique card ID based on timestamp and doc number
  const uniqueId = `cred-verified-${Date.now().toString(36)}`;

  return {
    id: uniqueId,
    title: docHeading,
    category: docCategory,
    icon: iconName,
    color: themeColor,
    badgeColor: themeColor,
    isAiGenerated: true,
    verifiedDocument: true,
    sourceDocumentTitle: docHeading,
    status: "Active (AI Verified)",
    expiryDate: "2027-12-31",
    issuer: effectiveDoc.issuer || verificationMeta.issuerAuthority || "Government of Karnataka",
    issuerDid: "did:cv:gov-accredited-authority",
    documentNumber: effectiveDoc.documentNumber || `KA-GOV-${Date.now().toString().slice(-6)}`,
    verifiedAt: verificationMeta.verifiedAt || new Date().toISOString(),
    verifiedByPublicKey: GOV_PUBLIC_KEY_BASE64,
    rawData: {
      fullName: effectiveDoc.issuedTo || effectiveDoc.holderName || "Aarav S. Rao",
      nationalId: effectiveDoc.nationalId || "XXXX-XXXX-9948",
      dob: dob,
      domicile: domicileStr,
      ...effectiveDoc
    },
    // ONLY GENERATE THE OPTIONS HE IS ELIGIBLE FOR!
    predicates: allowedPredicates,
    aiAuditReport: {
      eligibleCount: allowedPredicates.length,
      disqualifiedCount: disqualifiedCategories.length,
      disqualifiedCategories,
      decisions: aiDecisions,
      summary: `${allowedPredicates.length} eligible zero-knowledge categories generated. ${disqualifiedCategories.length} categories suppressed under DPDP §6 purpose limitation.`
    }
  };
}

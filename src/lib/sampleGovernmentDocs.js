/**
 * Pre-authenticated Sample Government Documents
 * Pre-signed with the Government Authority Public Key for instant demonstration:
 * MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEPWzb3JslJgiW2SDcKayLl6Z6/s/9sXcYh06CEb1MlsKuaVtY9ecD0/g+r1+/sstxoYWkFe9mYaKi8LjV5UtSaQ==
 */

import { GOV_PUBLIC_KEY_BASE64, GOV_SEAL_PREFIX } from './governmentSigner.js';

export const SAMPLE_GOV_DOCUMENTS = [
  {
    id: "doc-low-income",
    title: "Income Certificate (₹2,40,000 / Below 3L)",
    department: "Department of Revenue, Govt. of Karnataka",
    expectedOutcome: "Eligible for 'Income ≤ 3 Lakhs' and 'Welfare Subsidies'",
    data: {
      documentType: "Income and Asset Certificate",
      documentNumber: "KA-REV-2026-LOW-9921",
      issuer: "Department of Revenue, Govt. of Karnataka",
      issuedTo: "Aarav S. Rao",
      nationalId: "XXXX-XXXX-9948",
      annualIncome: 240000,
      currency: "INR",
      incomeBand: "Economically Weaker Section (≤ 3 Lakhs)",
      domicile: "Bengaluru Urban (Indiranagar)",
      dob: "2003-08-14",
      issuedAt: "2026-03-15",
      validUntil: "2027-03-31",
      signature: `${GOV_SEAL_PREFIX}${GOV_PUBLIC_KEY_BASE64}`
    }
  },
  {
    id: "doc-high-income",
    title: "Income Certificate (₹4,50,000 / Above 3L)",
    department: "Department of Revenue, Govt. of Karnataka",
    expectedOutcome: "AI Blocks 'Income ≤ 3 Lakhs' (Exceeds limit by ₹1.5L)",
    data: {
      documentType: "Income and Asset Certificate",
      documentNumber: "KA-REV-2026-HIGH-4482",
      issuer: "Department of Revenue, Govt. of Karnataka",
      issuedTo: "Aarav S. Rao",
      nationalId: "XXXX-XXXX-9948",
      annualIncome: 450000,
      currency: "INR",
      incomeBand: "Above Statutory Welfare Ceiling (> 3 Lakhs)",
      domicile: "Bengaluru Urban (Koramangala)",
      dob: "2003-08-14",
      issuedAt: "2026-04-01",
      validUntil: "2027-03-31",
      signature: `${GOV_SEAL_PREFIX}${GOV_PUBLIC_KEY_BASE64}`
    }
  },
  {
    id: "doc-student-transit",
    title: "Higher Education Student Transit Pass",
    department: "Department of Higher Education & BMTC",
    expectedOutcome: "Eligible for 50% Transit Concession & Student Attestation",
    data: {
      documentType: "Student Enrollment & Transit Concession Attestation",
      documentNumber: "KA-EDU-BMTC-2026-8812",
      issuer: "Department of Collegiate Education, Govt. of Karnataka",
      issuedTo: "Aarav S. Rao",
      college: "BMS College of Engineering, Bengaluru",
      enrollmentStatus: "Active Regular Full-Time Student",
      dob: "2003-08-14",
      domicile: "Bengaluru Urban",
      issuedAt: "2026-01-10",
      validUntil: "2026-12-31",
      signature: `${GOV_SEAL_PREFIX}${GOV_PUBLIC_KEY_BASE64}`
    }
  },
  {
    id: "doc-kdem-cyber",
    title: "KDEM Cybersecurity Certification",
    department: "Karnataka Digital Economy Mission (KDEM)",
    expectedOutcome: "Eligible for 'Certified Cybersecurity Analyst (Level 5)'",
    data: {
      documentType: "Technical Skill & Cyber Certification",
      documentNumber: "KDEM-CYBER-2026-7731",
      issuer: "Karnataka Digital Economy Mission (KDEM)",
      issuedTo: "Aarav S. Rao",
      course: "Cybersecurity & Cryptographic Systems Analyst",
      grade: "Distinction (Level 5 National Accreditation)",
      validUntil: "2026-12-31",
      issuedAt: "2026-02-20",
      signature: `${GOV_SEAL_PREFIX}${GOV_PUBLIC_KEY_BASE64}`
    }
  },
  {
    id: "doc-mumbai-residence",
    title: "Mumbai Municipal Domicile & Asset Certificate",
    department: "Brihanmumbai Municipal Corporation (BMC), Maharashtra",
    expectedOutcome: "Generates 'Mumbai Resident' & 'Maharashtra Domicile' Categories",
    data: {
      documentType: "Municipal Domicile & Income Attestation",
      documentNumber: "MH-BMC-2026-MUM-5519",
      issuer: "Brihanmumbai Municipal Corporation (BMC), Maharashtra",
      issuedTo: "Rohan M. Kulkarni",
      nationalId: "XXXX-XXXX-8812",
      annualIncome: 280000,
      city: "Mumbai",
      state: "Maharashtra",
      domicile: "Andheri West, Mumbai, Maharashtra",
      dob: "2001-11-22",
      issuedAt: "2026-04-10",
      validUntil: "2027-03-31",
      signature: `${GOV_SEAL_PREFIX}${GOV_PUBLIC_KEY_BASE64}`
    }
  },
  {
    id: "doc-forged-tampered",
    title: "Forged / Tampered Document (Invalid Signature)",
    department: "Fake Municipal Service (Adversarial Probe)",
    expectedOutcome: "Cryptographic Verification Fails ➔ Upload Blocked",
    data: {
      documentType: "Forged Civic Pass",
      documentNumber: "FAKE-PROBE-0000",
      issuer: "Unauthorized Entity",
      issuedTo: "Malicious Actor",
      annualIncome: 50000,
      signature: "0xdeadbeef_invalid_signature_tampered_payload_776182"
    }
  }
];

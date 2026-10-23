// AI Linkability Auditor & Anomaly Detection Simulation
// Demonstrates measurable unlinkability (BBS+ vs Baseline SD-JWT)
// and Isolation Forest metadata anomaly detection

export function runLinkabilitySimulation() {
  const services = [
    { name: "Central Library", icon: "BookOpen", color: "#38bdf8" },
    { name: "Namma Metro Gate", icon: "Train", color: "#34d399" },
    { name: "Yuva Nidhi Portal", icon: "Landmark", color: "#fbbf24" },
    { name: "Smart Health Clinic", icon: "Activity", color: "#a78bfa" }
  ];

  // Generate 8 sample civic interactions
  const baselineEvents = [];
  const civicVeilEvents = [];

  const rawPersonaId = "IN-BLR-RES-884920";
  const constantIssuerSig = "0x89f4b1c9...33aa";

  for (let i = 0; i < 8; i++) {
    const svc = services[i % services.length];
    const time = `${10 + Math.floor(i / 2)}:${(i * 14) % 60 < 10 ? '0' : ''}${(i * 14) % 60} AM`;

    // Baseline: Reused signature, persistent pseudonym/token
    baselineEvents.push({
      id: `ev-base-${i + 1}`,
      service: svc.name,
      time,
      reusedSignature: constantIssuerSig,
      pseudonym: `did:holder:${rawPersonaId}`,
      linkableToken: `tok_usr_${rawPersonaId.substring(10)}`,
      collusionCorrelated: true
    });

    // CivicVeil: Ephemeral randomized BBS+ blinded proof
    const randomHex = Math.random().toString(36).substring(2, 8);
    civicVeilEvents.push({
      id: `ev-cv-${i + 1}`,
      service: svc.name,
      time,
      randomizedSignature: `0x${randomHex}9e...${Math.random().toString(36).substring(2, 6)}`,
      ephemeralCommitment: `0xcomm_${Math.random().toString(36).substring(2, 8)}`,
      disclosedPredicate: i % 2 === 0 ? "Age ≥ 18" : "Transit Concession",
      collusionCorrelated: false
    });
  }

  return {
    baseline: {
      name: "Standard SD-JWT / mDoc Baseline",
      totalInteractions: 8,
      linkedPersonasIdentified: 1, // Single individual caught across all 8 visits!
      correlationRate: 100.0,
      crossServiceTrackingPossible: true,
      entropyScore: 0.04, // High predictability
      threatVerdict: "CRITICAL: Resident trajectory completely stitched across 4 city services.",
      events: baselineEvents
    },
    civicVeil: {
      name: "ShroudIT BBS+ Zero-Knowledge Layer",
      totalInteractions: 8,
      linkedPersonasIdentified: 0, // Impossible to correlate!
      correlationRate: 0.0,
      crossServiceTrackingPossible: false,
      entropyScore: 0.99, // Maximum cryptographic entropy
      threatVerdict: "SECURE: Perfect forward privacy. Colluding verifiers cannot correlate any two visits.",
      events: civicVeilEvents
    }
  };
}

export const ANOMALY_SCENARIOS = [
  {
    id: "anom-01",
    vector: "Silent Mass Issuance Spike",
    description: "Suspicious issuer did:cv:fake-bbmp-dept minted 8,500 credentials in 4 minutes without on-chain schema endorsement.",
    model: "Isolation Forest (Contamination=0.01)",
    anomalyScore: 0.94,
    status: "CRITICAL ALERT",
    statusColor: "rose",
    timestamp: "2 mins ago",
    details: "Issuance rate 142x above historical baseline (μ=6.2 cards/hr). Flagged for automated revocation quarantine."
  },
  {
    id: "anom-02",
    vector: "Revocation List Probing",
    description: "External IP sequentially queried 1,200 status indices in 30 seconds against the status registry endpoint.",
    model: "Isolation Forest + Heuristic Rate Monitor",
    anomalyScore: 0.88,
    status: "BLOCKED",
    statusColor: "amber",
    timestamp: "18 mins ago",
    details: "Probing attack deflected. Epoch status vectors are distributed as compressed Merkle roots to prevent individual holder tracking."
  },
  {
    id: "anom-03",
    vector: "Proof Replay Attack Attempt",
    description: "A captured presentation for Bengaluru Central Library was submitted to Namma Metro gate turnstile.",
    model: "Cryptographic Nonce Verifier Engine",
    anomalyScore: 0.99,
    status: "REJECTED (0ms)",
    statusColor: "rose",
    timestamp: "45 mins ago",
    details: "Nonce binding violation. Proof binds verifier DID 'did:cv:verifier-blr-library', rejecting replay at Metro gate."
  },
  {
    id: "anom-04",
    vector: "Normal City Verifications",
    description: "1,420 valid predicate presentations processed across BMTC, Public Library, and Welfare counters.",
    model: "Baseline Statistical Model",
    anomalyScore: 0.08,
    status: "HEALTHY",
    statusColor: "emerald",
    timestamp: "Ongoing",
    details: "Zero PII leakage recorded across all nodes. DPDP purpose guidelines strictly adhered to."
  }
];

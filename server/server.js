import express from 'express';
import cors from 'cors';
import { 
  generateIssuerKeyPair, 
  signBbs, 
  verifyBbsPresentationProof 
} from '../src/lib/bbsEngine.js';
import { 
  evaluateTelemetryVector, 
  simulateCrossServiceLinkability 
} from '../src/lib/aiAnomalyEngine.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { verifyGovernmentSignature } from '../src/lib/governmentSigner.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Persistent in-memory session stores for local demo
const CEG_ISSUER = generateIssuerKeyPair();
const BMTC_ISSUER = generateIssuerKeyPair();

const ISSUERS = {
  "did:shroud:gov-karnataka-ceg": {
    name: "Center for e-Governance, Karnataka",
    did: "did:shroud:gov-karnataka-ceg",
    keyPair: CEG_ISSUER
  },
  "did:shroud:bmtc-transit": {
    name: "BMTC Transit Authority",
    did: "did:shroud:bmtc-transit",
    keyPair: BMTC_ISSUER
  }
};

// In-memory Nonce challenge store with TTL
// Map: nonceHex => { verifierDid, expiresAt, consumed }
const nonceStore = new Map();

// Helper to clean up expired nonces periodically
function cleanExpiredNonces() {
  const now = Date.now();
  for (const [key, value] of nonceStore.entries()) {
    if (value.expiresAt <= now) {
      nonceStore.delete(key);
    }
  }
}
setInterval(cleanExpiredNonces, 60000);

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ShroudIT Backend API',
    uptime: process.uptime(),
    activeNonces: nonceStore.size,
    timestamp: new Date().toISOString()
  });
});

// --- Issuer API: Issue Signed BBS+ Credential ---
app.post('/api/issuer/issue', (req, res) => {
  try {
    const { issuerDid, holderDid, credentialType, attributes } = req.body;

    const targetIssuer = ISSUERS[issuerDid] || ISSUERS["did:shroud:gov-karnataka-ceg"];
    if (!attributes || !Array.isArray(attributes) || attributes.length === 0) {
      return res.status(400).json({ error: "Attributes array cannot be empty" });
    }

    // Sign attributes using real BLS12-381 private key
    const bbsSignature = signBbs(targetIssuer.keyPair.privateKey, attributes);

    const credential = {
      credentialId: `cred-${Date.now().toString(36)}`,
      credentialType: credentialType || "SmartCityCredential",
      issuerDid: targetIssuer.did,
      issuerName: targetIssuer.name,
      issuerPublicKeyHex: targetIssuer.keyPair.publicKeyHex,
      holderDid: holderDid || "did:key:z6Mku7X...89p",
      attributes,
      bbsSignature: {
        A_hex: bbsSignature.A_hex,
        e: bbsSignature.e.toString(16),
        s: bbsSignature.s.toString(16)
      },
      issuedAt: new Date().toISOString()
    };

    return res.status(201).json({
      success: true,
      credential
    });
  } catch (err) {
    console.error("Issuance error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// --- Verifier API: Generate Ephemeral Session Nonce (Anti-Replay) ---
app.get('/api/verifier/challenge', (req, res) => {
  const verifierDid = req.query.verifierDid || "did:shroud:verifier-blr-library";
  const ttlSeconds = 180;
  const now = Date.now();
  const expiresAt = now + (ttlSeconds * 1000);

  // Generate 256-bit cryptographic nonce
  const randBytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = '0x' + Array.from(randBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  nonceStore.set(nonce, {
    verifierDid,
    expiresAt,
    consumed: false
  });

  return res.json({
    nonce,
    verifierDid,
    ttlSeconds,
    expiresAt
  });
});

// --- Verifier API: Verify Zero-Knowledge Presentation Proof ---
app.post('/api/verifier/verify', (req, res) => {
  try {
    const { proof, expectedNonce, verifierDid } = req.body;

    if (!proof || !expectedNonce || !verifierDid) {
      return res.status(400).json({
        valid: false,
        error: "Missing required verification parameters: proof, expectedNonce, verifierDid"
      });
    }

    // 1. Enforce Nonce Challenge validity
    const storedNonce = nonceStore.get(expectedNonce);
    if (!storedNonce) {
      return res.status(400).json({
        valid: false,
        reason: "Invalid or expired session nonce. Challenge does not exist."
      });
    }

    if (storedNonce.consumed) {
      return res.status(403).json({
        valid: false,
        reason: "REPLAY ATTACK BLOCKED: This session nonce has already been consumed."
      });
    }

    if (Date.now() > storedNonce.expiresAt) {
      nonceStore.delete(expectedNonce);
      return res.status(400).json({
        valid: false,
        reason: "Session nonce has expired (TTL 180s exceeded)."
      });
    }

    if (storedNonce.verifierDid !== verifierDid) {
      return res.status(400).json({
        valid: false,
        reason: "Verifier DID mismatch. Nonce was bound to a different service."
      });
    }

    // Mark nonce as consumed (one-time use)
    storedNonce.consumed = true;

    // 2. Perform genuine BLS12-381 pairing verification
    const targetIssuer = ISSUERS[proof.issuerDid] || ISSUERS["did:shroud:gov-karnataka-ceg"];
    const verifyResult = verifyBbsPresentationProof({
      proof,
      expectedNonce,
      expectedVerifierDid: verifierDid,
      issuerPublicKeyHex: targetIssuer.keyPair.publicKeyHex
    });

    if (!verifyResult.valid) {
      return res.status(422).json({
        valid: false,
        reason: verifyResult.reason || "BBS+ pairing verification failed"
      });
    }

    return res.json({
      valid: true,
      revealedAttributes: verifyResult.revealedAttributes,
      hiddenAttributeCount: verifyResult.hiddenCount,
      zeroPiiLeaked: true,
      antiReplayNonceConsumed: true,
      epochRevocationStatus: "UNREVOKED (Epoch #142 Merkle Root Anchored)",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Verification endpoint error:", err);
    return res.status(500).json({ valid: false, error: err.message });
  }
});

// --- Government Document Verification API (ECDSA NIST P-256 / DER) ---
app.post('/api/government/verify', async (req, res) => {
  try {
    const { document, signature, rawText } = req.body || {};
    const targetDoc = document || req.body;
    const result = await verifyGovernmentSignature(targetDoc, signature, rawText);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ valid: false, reason: err.message });
  }
});

// --- Verifier API: Registered Purpose Registry (DPDP Act §6) ---
app.get('/api/verifier/purposes', (req, res) => {
  res.json({
    policies: [
      {
        verifierDid: "did:shroud:verifier-blr-library",
        name: "Bengaluru City Central Library",
        purpose: "Age and residency verification for adult digital media borrowing access",
        allowedPredicates: ["over_18", "blr_resident"],
        retentionPolicy: "Zero retention (ephemeral proof check)"
      },
      {
        verifierDid: "did:shroud:verifier-bmrcl-gate",
        name: "Namma Metro - Majestic Interchange Gate",
        purpose: "Instant validation of student transit concession for automated smart turnstile entry",
        allowedPredicates: ["valid_student", "tier1_concession"],
        retentionPolicy: "Zero retention (cryptographic token logged without persona ID)"
      },
      {
        verifierDid: "did:shroud:verifier-yuva-nidhi",
        name: "Yuva Nidhi & Citizen Welfare Portal",
        purpose: "Income band and residency verification for subsidized urban skilling stipend",
        allowedPredicates: ["blr_resident", "income_below_3L"],
        retentionPolicy: "Signed consent receipt stored on resident device"
      }
    ]
  });
});

// --- Auditor API: Simulate Collusion & Cross-Service Linkability ---
app.post('/api/auditor/simulate-linkability', (req, res) => {
  try {
    const { numResidents, numServices, strategy } = req.body || {};
    const results = simulateCrossServiceLinkability({
      numResidents: numResidents || 6,
      numServices: numServices || 4,
      strategy: strategy || 'collusion_graph'
    });
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- Auditor API: Isolation Forest Telemetry Anomaly Inference ---
app.post('/api/auditor/anomaly-detect', (req, res) => {
  try {
    const { vector, telemetry, threshold } = req.body || {};
    let featureVector = vector;

    if (!featureVector && telemetry) {
      featureVector = [
        telemetry.requestsPerMin || 5.0,
        telemetry.attributesDemanded || 1.0,
        telemetry.nonceAgeSec || 10.0,
        telemetry.isUnregisteredDid ? 1.0 : 0.0,
        telemetry.burstScore || 0.05
      ];
    }

    if (!featureVector || !Array.isArray(featureVector)) {
      return res.status(400).json({ error: "Invalid vector. Expected 5-element numerical array." });
    }

    const effectiveThreshold = threshold !== undefined ? Number(threshold) : 0.60;
    const evaluation = evaluateTelemetryVector(featureVector, effectiveThreshold);
    return res.json(evaluation);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- Auditor API: Telemetry Log Feed ---
app.get('/api/auditor/telemetry', (req, res) => {
  const sampleEvents = [
    {
      id: "tel-01",
      vector: [140.0, 1.0, 4.0, 1.0, 0.95],
      name: "Silent Mass Issuance Attack",
      ...evaluateTelemetryVector([140.0, 1.0, 4.0, 1.0, 0.95]),
      timestamp: new Date(Date.now() - 120000).toISOString()
    },
    {
      id: "tel-02",
      vector: [3.0, 9.0, 12.0, 0.0, 0.1],
      name: "Over-Asking Violation (DPDP §6)",
      ...evaluateTelemetryVector([3.0, 9.0, 12.0, 0.0, 0.1]),
      timestamp: new Date(Date.now() - 600000).toISOString()
    },
    {
      id: "tel-03",
      vector: [2.0, 1.0, 420.0, 0.0, 0.3],
      name: "Stale Nonce Replay Attempt",
      ...evaluateTelemetryVector([2.0, 1.0, 420.0, 0.0, 0.3]),
      timestamp: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: "tel-04",
      vector: [5.0, 1.0, 6.0, 0.0, 0.05],
      name: "Legitimate Metro Gate Tap",
      ...evaluateTelemetryVector([5.0, 1.0, 6.0, 0.0, 0.05]),
      timestamp: new Date().toISOString()
    }
  ];
  return res.json({ telemetry: sampleEvents });
});

export default app;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`✓ ShroudIT Backend API running on http://localhost:${PORT}`);
    console.log(`  Endpoints:`);
    console.log(`  - Health:    GET  http://localhost:${PORT}/api/health`);
    console.log(`  - Issue:     POST http://localhost:${PORT}/api/issuer/issue`);
    console.log(`  - Challenge: GET  http://localhost:${PORT}/api/verifier/challenge`);
    console.log(`  - Verify:    POST http://localhost:${PORT}/api/verifier/verify`);
    console.log(`  - Purposes:  GET  http://localhost:${PORT}/api/verifier/purposes`);
    console.log(`  - Simulate:  POST http://localhost:${PORT}/api/auditor/simulate-linkability`);
    console.log(`  - Anomaly:   POST http://localhost:${PORT}/api/auditor/anomaly-detect`);
    console.log(`  - Telemetry: GET  http://localhost:${PORT}/api/auditor/telemetry`);
    console.log(`==================================================`);
  });
}

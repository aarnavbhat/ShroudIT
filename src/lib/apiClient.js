// API Client for ShroudIT Backend Services
// Provides live HTTP calls to Express backend (http://localhost:4000)
// with graceful local fallback if offline.

export const BACKEND_URL = "http://localhost:4000";

/**
 * Check if backend API server is online
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, { method: "GET" });
    if (!res.ok) return { isOnline: false };
    const data = await res.json();
    return { isOnline: true, data };
  } catch (e) {
    return { isOnline: false };
  }
}

/**
 * Request real 256-bit session challenge nonce from verifier service
 */
export async function fetchVerifierChallenge(verifierDid) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/verifier/challenge?verifierDid=${encodeURIComponent(verifierDid)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Fallback to local crypto generation if backend offline
  }
  return null;
}

/**
 * Submit ZK presentation proof to verifier service
 */
export async function submitVerificationProof(proof, expectedNonce, verifierDid) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/verifier/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proof, expectedNonce, verifierDid })
    });
    const body = await res.json();
    return { ok: res.ok, status: res.status, data: body };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/**
 * Request real credential issuance from issuer service
 */
export async function requestCredentialIssuance(issuerDid, holderDid, credentialType, attributes) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/issuer/issue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issuerDid, holderDid, credentialType, attributes })
    });
    return await res.json();
  } catch (e) {
    return null;
  }
}

/**
 * Run adversary cross-service linkability simulation via API
 */
export async function fetchLinkabilitySimulation(params = {}) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auditor/simulate-linkability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Handled by local fallback
  }
  return null;
}

/**
 * Score telemetry vector through Isolation Forest via API
 */
export async function fetchAnomalyInference(vector) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auditor/anomaly-detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vector })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Handled by local fallback
  }
  return null;
}

/**
 * Fetch telemetry event stream from Auditor service
 */
export async function fetchAuditorTelemetry() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auditor/telemetry`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Handled by local fallback
  }
  return null;
}

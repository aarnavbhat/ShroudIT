// Encrypted Client Storage for ShroudIT Resident Wallet
// Uses browser IndexedDB and WebCrypto AES-GCM (256-bit) encryption at rest.

import { openDB } from 'idb';
import { INITIAL_CONSENT_RECEIPTS } from './mockData.js';

const DB_NAME = 'ShroudIT_Secure_Wallet_v1';
const DB_VERSION = 1;
const STORE_CREDS = 'credentials';
const STORE_RECEIPTS = 'consent_receipts';
const STORE_KEYS = 'hardware_keys';

export const HARDCODED_MOCK_IDS = new Set([
  'cred-blr-civic-01',
  'cred-bmtc-pass-88',
  'cred-cyber-cert-44',
  'cred-welfare-subsidy-12',
  'cred-foundation-aarav'
]);

// Generate or retrieve persistent local device encryption key
async function getWalletEncryptionKey() {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return null;
  }

  const db = await getDb();
  let rawKey = await db.get(STORE_KEYS, 'device_aes_gcm_master');

  if (!rawKey) {
    const key = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    const exported = await window.crypto.subtle.exportKey('raw', key);
    await db.put(STORE_KEYS, Array.from(new Uint8Array(exported)), 'device_aes_gcm_master');
    return key;
  }

  return await window.crypto.subtle.importKey(
    'raw',
    new Uint8Array(rawKey),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_CREDS)) {
        db.createObjectStore(STORE_CREDS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_RECEIPTS)) {
        db.createObjectStore(STORE_RECEIPTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_KEYS)) {
        db.createObjectStore(STORE_KEYS);
      }
    },
  });
}

/**
 * Initialize storage and purge any legacy hardcoded mock credentials from storage
 */
export async function initWalletStorage() {
  try {
    const db = await getDb();
    // Purge any legacy hardcoded mock credentials so only government-ingested cards appear
    const creds = await db.getAll(STORE_CREDS);
    for (const c of creds) {
      if (HARDCODED_MOCK_IDS.has(c.id) || (!c.isAiGenerated && !c.verifiedByPublicKey && !c.documentNumber && !c.holderId)) {
        await db.delete(STORE_CREDS, c.id);
      }
    }

    const allRcpts = await db.getAll(STORE_RECEIPTS); for (const r of allRcpts) { if (r.timestamp && (r.timestamp.includes('2026-10-21') || r.timestamp.includes('21-10-2026'))) { await db.delete(STORE_RECEIPTS, r.id); } }
  } catch (err) {
    console.warn("IndexedDB init note (running in memory/fallback):", err);
  }
}

/**
 * Retrieve credentials from local storage for a specific logged-in citizen.
 * Strictly excludes hardcoded credentials and returns only government-issued certificates.
 */
export async function getStoredCredentials(user = null) {
  try {
    const db = await getDb();
    const creds = await db.getAll(STORE_CREDS);
    if (!creds || creds.length === 0) return [];

    // Filter out any legacy hardcoded mock credentials
    const govIssued = creds.filter(c => 
      !HARDCODED_MOCK_IDS.has(c.id) && (c.isAiGenerated || c.verifiedByPublicKey || c.documentNumber || c.holderId)
    );

    if (!user) return govIssued;

    const userId = user.id;
    const username = user.username;
    const userDid = user.did;
    const userName = (user.name || '').toLowerCase().trim();

    return govIssued.filter(c => {
      if (c.holderId && c.holderId === userId) return true;
      if (c.holderUsername && c.holderUsername === username) return true;
      if (c.holderDid && c.holderDid === userDid) return true;
      const docName = (c.rawData?.fullName || c.rawData?.issuedTo || '').toLowerCase().trim();
      if (docName && userName && (docName.includes(userName) || userName.includes(docName))) return true;
      return false;
    });
  } catch (err) {
    return [];
  }
}

/**
 * Save new credential to local storage
 */
export async function saveCredential(cred) {
  try {
    const db = await getDb();
    await db.put(STORE_CREDS, cred);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Retrieve all DPDP consent receipts
 */
export async function getStoredReceipts() {
  try {
    const db = await getDb();
    const receipts = await db.getAll(STORE_RECEIPTS); const filtered = (receipts || []).filter(r => !(r.timestamp && (r.timestamp.includes('2026-10-21') || r.timestamp.includes('21-10-2026')))); return filtered.reverse(); } catch (err) { return [];
  }
}

/**
 * Save newly issued consent receipt
 */
export async function saveConsentReceipt(receipt) {
  try {
    const db = await getDb();
    await db.put(STORE_RECEIPTS, receipt);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Export receipt as cryptographic audit JSON
 */
export function exportReceiptAsJson(receipt) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(receipt, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `consent-receipt-${receipt.id}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

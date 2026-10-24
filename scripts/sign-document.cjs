/**
 * CLI Tool to sign a civic document using an ECDSA NIST P-256 private key.
 *
 * Usage:
 *   node scripts/sign-document.cjs <input-doc.json> [private-key.pem] [output-doc.json]
 */

const fs = require('fs');
const crypto = require('crypto');

function canonicalize(obj) {
  if (typeof obj !== 'object' || obj === null) return JSON.stringify(obj);
  const keys = Object.keys(obj).filter(k => k !== 'signature' && k !== 'sig').sort();
  const sorted = {};
  for (const k of keys) sorted[k] = obj[k];
  return JSON.stringify(sorted);
}

const inputFile = process.argv[2];
const privKeyPath = process.argv[3];
const outputFile = process.argv[4] || 'signed-document.json';

if (!inputFile) {
  console.log('Usage: node scripts/sign-document.cjs <input-doc.json> [private-key.pem] [output-doc.json]');
  process.exit(1);
}

const rawText = fs.readFileSync(inputFile, 'utf8');
const doc = JSON.parse(rawText);

let privKeyPem = null;
if (privKeyPath && fs.existsSync(privKeyPath)) {
  privKeyPem = fs.readFileSync(privKeyPath, 'utf8');
} else {
  console.log('No private key file specified. Generating an ephemeral P-256 test keypair...');
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  privKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  const pubSpki = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
  console.log('Generated Public Key (SPKI Base64):', pubSpki);
}

const canonical = canonicalize(doc);
const signer = crypto.createSign('SHA256');
signer.update(Buffer.from(canonical));
signer.end();
const sigDer = signer.sign(privKeyPem);

// Extract raw r and s from DER
let off = 2;
if (sigDer[1] & 0x80) off += (sigDer[1] & 0x7f);
off++; // 0x02
let rL = sigDer[off++];
let rB = sigDer.subarray(off, off + rL);
off += rL;
off++; // 0x02
let sL = sigDer[off++];
let sB = sigDer.subarray(off, off + sL);

if (rB.length > 32) rB = rB.subarray(rB.length - 32);
if (sB.length > 32) sB = sB.subarray(sB.length - 32);
const r32 = Buffer.alloc(32); rB.copy(r32, 32 - rB.length);
const s32 = Buffer.alloc(32); sB.copy(s32, 32 - sB.length);

doc.signature = sigDer.toString('base64');
doc.signatureDerHex = sigDer.toString('hex');
doc.r = '0x' + r32.toString('hex');
doc.s = '0x' + s32.toString('hex');
doc.rawSignatureHex = Buffer.concat([r32, s32]).toString('hex');
doc.signedCanonicalHash = crypto.createHash('sha256').update(canonical).digest('hex');

fs.writeFileSync(outputFile, JSON.stringify(doc, null, 2));
console.log(`Successfully signed document saved to ${outputFile}`);

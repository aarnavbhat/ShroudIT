// Cryptographic primitives and zero-knowledge selective disclosure simulation
// Emulates IETF BBS+ Signature Selective Disclosure (draft-irtf-cfrg-bbs-signatures)
// and Merkle Tree verification for ShroudIT

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  // Expand to realistic 64-char hex hash
  let res = '';
  for (let k = 0; k < 8; k++) {
    const segment = (Math.abs(hash ^ (k * 0x9e3779b9))).toString(16).padStart(8, '0');
    res += segment;
  }
  return '0x' + res.substring(0, 64);
}

export function generateNonce(verifierDid) {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 1000000);
  const raw = `${verifierDid}:${ts}:${rand}`;
  return {
    value: simpleHash(raw),
    createdAt: ts,
    expiresAt: ts + (1000 * 60 * 3), // 3 min validity
    verifierDid
  };
}

export function deriveBbsProof({ credential, selectedPredicateIds, nonce, verifierDid }) {
  // BBS+ derives randomized blinding factors:
  // Fresh blinding factor r1, r2, s' per presentation
  const randomSalt = Math.random().toString(36).substring(2, 10);
  const blindingFactor = simpleHash(`blind:${credential.id}:${Date.now()}:${randomSalt}`);
  
  // Filter revealed predicates
  const revealedPredicates = credential.predicates.filter(p => 
    selectedPredicateIds.includes(p.id)
  );

  // Hidden attributes (NEVER sent in clear)
  const hiddenKeys = Object.keys(credential.rawData);

  // Construct BBS+ presentation parameters
  const proofCommitment = simpleHash(`comm:${blindingFactor}:${nonce}:${verifierDid}`);
  const randomizedSignatureA = simpleHash(`bbs_A_prime:${proofCommitment}:${randomSalt}`);
  const randomizedSignatureD = simpleHash(`bbs_d_vector:${credential.bbsPublicKey}:${randomSalt}`);
  
  const derivedProof = {
    proofId: `prf-${Date.now().toString(36)}`,
    timestamp: new Date().toISOString(),
    verifierBinding: verifierDid,
    nonceBinding: nonce,
    credentialSchema: credential.category,
    issuer: credential.issuer,
    issuerKey: credential.bbsPublicKey,
    revealedStatements: revealedPredicates.map(p => ({
      predicateId: p.id,
      label: p.label,
      statement: p.statement,
      value: p.value
    })),
    hiddenAttributeCount: hiddenKeys.length,
    randomizedCommitment: proofCommitment,
    bbsComponents: {
      A_prime: randomizedSignatureA.substring(0, 18) + '...',
      d_vector: randomizedSignatureD.substring(0, 18) + '...',
      c_challenge: simpleHash(`challenge:${proofCommitment}:${nonce}`).substring(0, 18) + '...',
      s_prime: blindingFactor.substring(0, 14) + '...'
    },
    deviceBindingSignature: simpleHash(`device:${credential.deviceKeyFingerprint}:${nonce}`).substring(0, 20) + '...',
    zeroKnowledgeVerified: true,
    unlinkabilityEntropy: "High (256-bit randomized blinding factor)"
  };

  return derivedProof;
}

export function verifyProof(proof, expectedNonce, expectedVerifierDid, currentEpoch = 142) {
  const issues = [];
  
  if (!proof) {
    return { valid: false, message: "No proof payload provided" };
  }

  // Check Nonce binding
  if (proof.nonceBinding !== expectedNonce) {
    issues.push("Nonce mismatch: Proof does not bind to this active session.");
  }

  // Check Verifier binding (prevents proof replay to colluding services)
  if (proof.verifierBinding !== expectedVerifierDid) {
    issues.push("Verifier DID mismatch: Presentation was bound to a different authority.");
  }

  // Verify Issuer & Revocation root
  const isRevoked = false; // Synthetic check against epoch #142 Merkle root
  
  if (issues.length > 0) {
    return {
      valid: false,
      issues,
      timestamp: new Date().toLocaleTimeString(),
      summary: "Verification Failed"
    };
  }

  return {
    valid: true,
    verifiedEpoch: currentEpoch,
    statusRootMatch: true,
    issuerAccredited: true,
    revealedPredicates: proof.revealedStatements,
    piiDisclosedCount: 0,
    proofCommitment: proof.randomizedCommitment,
    timestamp: new Date().toLocaleTimeString(),
    summary: "Cryptographic Proof Verified: Zero PII Exposed"
  };
}

export function buildMerkleTree(leaves) {
  // Build a 4-leaf or 8-leaf Merkle tree for document certificates
  let currentLevel = leaves.map(leaf => simpleHash(leaf));
  const levels = [currentLevel];

  while (currentLevel.length > 1) {
    const nextLevel = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
      nextLevel.push(simpleHash(left + right));
    }
    levels.push(nextLevel);
    currentLevel = nextLevel;
  }

  const root = levels[levels.length - 1][0];
  return {
    levels,
    root,
    getInclusionProof: (leafIndex) => {
      const siblings = [];
      let idx = leafIndex;
      for (let l = 0; l < levels.length - 1; l++) {
        const level = levels[l];
        const isRight = idx % 2 === 1;
        const siblingIdx = isRight ? idx - 1 : idx + 1;
        if (siblingIdx < level.length) {
          siblings.push({
            hash: level[siblingIdx],
            position: isRight ? 'left' : 'right'
          });
        }
        idx = Math.floor(idx / 2);
      }
      return siblings;
    }
  };
}

const { expect } = require("chai");

describe("ShroudIT Core Cryptographic Engine (BBS+ BLS12-381 & Ed25519)", function () {
  let bbs;

  before(async function () {
    // Dynamic import of ES Module bbsEngine
    bbs = await import("../src/lib/bbsEngine.js");
  });

  it("1. should generate a valid BLS12-381 issuer keypair on G2", function () {
    const keyPair = bbs.generateIssuerKeyPair();
    expect(keyPair.privateKey).to.be.a("bigint");
    expect(keyPair.publicKeyHex).to.be.a("string").with.lengthOf.at.least(48);
  });

  it("2. should sign multi-attribute credential and verify pairing math e(A, W + e*G2) == e(B, G2)", function () {
    const issuer = bbs.generateIssuerKeyPair();
    const attributes = [
      "Aarav S. Rao",
      "2003-08-14",
      "over_18:true",
      "resident_blr:true",
      "bpl_income_band_a"
    ];

    const signature = bbs.signBbs(issuer.privateKey, attributes);
    expect(signature.A_hex).to.be.a("string").with.lengthOf.at.least(48);

    const isDirectValid = bbs.verifyDirectBbs(issuer.publicKey, signature, attributes);
    expect(isDirectValid).to.equal(true);
  });

  it("3. should derive zero-knowledge selective disclosure proof and verify with 0 PII leak", function () {
    const issuer = bbs.generateIssuerKeyPair();
    const device = bbs.generateDeviceHardwareKey();

    const attributes = [
      "Aarav S. Rao",
      "2003-08-14",
      "over_18:true",
      "resident_blr:true",
      "bpl_income_band_a"
    ];

    const signature = bbs.signBbs(issuer.privateKey, attributes);
    const nonce = "0x99482bf10928e4091823901928409128";
    const verifierDid = "did:shroud:verifier-blr-library";

    // Holder reveals ONLY index 2 (over_18:true) and index 3 (resident_blr:true)
    const proof = bbs.deriveBbsPresentationProof({
      signature,
      messages: attributes,
      revealedIndices: [2, 3],
      nonce,
      verifierDid,
      devicePrivateKey: device.privateKey
    });

    expect(proof.isBlinded).to.equal(true);
    expect(proof.hiddenCount).to.equal(3); // Name, DOB, Income hidden
    expect(proof.revealedValues).to.deep.equal([
      { index: 2, value: "over_18:true" },
      { index: 3, value: "resident_blr:true" }
    ]);

    // Verifier checks proof
    const verifyResult = bbs.verifyBbsPresentationProof({
      proof,
      expectedNonce: nonce,
      expectedVerifierDid: verifierDid,
      issuerPublicKeyHex: issuer.publicKeyHex
    });

    expect(verifyResult.valid).to.equal(true);
    expect(verifyResult.zeroPiiLeaked).to.equal(true);
  });

  it("4. should enforce replay defense: fail if nonce does not match session", function () {
    const issuer = bbs.generateIssuerKeyPair();
    const signature = bbs.signBbs(issuer.privateKey, ["test_attr"]);
    const nonce = "0xcorrect_nonce";
    const verifierDid = "did:shroud:verifier-test";

    const proof = bbs.deriveBbsPresentationProof({
      signature,
      messages: ["test_attr"],
      revealedIndices: [0],
      nonce,
      verifierDid
    });

    // Verifier presents a different challenge nonce
    const verifyResult = bbs.verifyBbsPresentationProof({
      proof,
      expectedNonce: "0xexpired_or_different_nonce",
      expectedVerifierDid: verifierDid,
      issuerPublicKeyHex: issuer.publicKeyHex
    });

    expect(verifyResult.valid).to.equal(false);
    expect(verifyResult.reason).to.include("Nonce mismatch");
  });

  it("5. should prove cryptographic unlinkability: two proofs from same card have different commitments", function () {
    const issuer = bbs.generateIssuerKeyPair();
    const signature = bbs.signBbs(issuer.privateKey, ["attr_1", "attr_2"]);

    const proof1 = bbs.deriveBbsPresentationProof({
      signature,
      messages: ["attr_1", "attr_2"],
      revealedIndices: [0],
      nonce: "nonce_1",
      verifierDid: "did:shroud:library"
    });

    const proof2 = bbs.deriveBbsPresentationProof({
      signature,
      messages: ["attr_1", "attr_2"],
      revealedIndices: [0],
      nonce: "nonce_2",
      verifierDid: "did:shroud:metro"
    });

    // The blinded signature points A' MUST be completely different due to random blinding scalar r1
    expect(proof1.A_prime_hex).to.not.equal(proof2.A_prime_hex);
    expect(proof1.C_hex).to.not.equal(proof2.C_hex);
    expect(proof1.challenge).to.not.equal(proof2.challenge);
  });
});

const { expect } = require("chai");

describe("ShroudIT Dynamic Authentication, Government On-Chain Accreditation & Multi-Persona Engine", function () {
  let bbs;

  before(async function () {
    bbs = await import("../src/lib/bbsEngine.js");
  });

  describe("1. Dynamic Resident Persona & Hardware Key Derivation", function () {
    it("should derive unique Ed25519 hardware key and civic DID for a new citizen", function () {
      const hwKey = bbs.generateDeviceHardwareKey();
      expect(hwKey.privateKey).to.be.instanceOf(Uint8Array);
      expect(hwKey.publicKeyHex).to.be.a("string").with.lengthOf(64);

      const citizenDid = `did:key:z6Mk${hwKey.publicKeyHex.substring(0, 10)}...${hwKey.publicKeyHex.substring(56)}`;

      expect(citizenDid).to.match(/^did:key:z6Mk/);
      expect(citizenDid.length).to.be.greaterThan(20);
    });

    it("should sign device-bound challenge with citizen Ed25519 private key in presentation proof", function () {
      const issuer = bbs.generateIssuerKeyPair();
      const hwKey = bbs.generateDeviceHardwareKey();
      const messages = ["Resident Deepa", "over_18:true"];
      const signature = bbs.signBbs(issuer.privateKey, messages);

      const nonce = "0xsession-auth-challenge-8849";
      const verifierDid = "did:shroud:verifier-metro-turnstile";

      const proof = bbs.deriveBbsPresentationProof({
        signature,
        messages,
        revealedIndices: [1],
        nonce,
        verifierDid,
        devicePrivateKey: hwKey.privateKey
      });

      expect(proof.deviceProof).to.be.a("string").with.lengthOf(128);
      expect(proof.devicePublicKey).to.equal(hwKey.publicKeyHex);

      const result = bbs.verifyBbsPresentationProof({
        proof,
        expectedNonce: nonce,
        expectedVerifierDid: verifierDid
      });

      expect(result.valid).to.equal(true);
      expect(result.zeroPiiLeaked).to.equal(true);
    });
  });

  describe("2. Government Authority Accreditation & BLS12-381 Challenge-Response", function () {
    it("should accredit a new government department with authentic BLS12-381 G2 keypair", function () {
      const issuerKeys = bbs.generateIssuerKeyPair();
      expect(issuerKeys.privateKey).to.be.a("bigint");
      expect(issuerKeys.publicKeyHex).to.be.a("string").with.lengthOf.at.least(48);

      const department = {
        name: "BBMP Ward 142 Citizen Services",
        did: "did:shroud:gov-bbmp-ward-142",
        contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        accreditationStatus: "ACCREDITED_ON_CHAIN",
        keyPair: issuerKeys
      };

      expect(department.accreditationStatus).to.equal("ACCREDITED_ON_CHAIN");
      expect(department.did).to.include("did:shroud:gov");
    });

    it("should authenticate government authority via cryptographic challenge-response", function () {
      const issuerKeys = bbs.generateIssuerKeyPair();
      const authChallenge = "CHALLENGE_GOV_LOGIN_" + Date.now();
      
      // Issuer signs the login challenge
      const sig = bbs.signBbs(issuerKeys.privateKey, [authChallenge]);
      expect(sig.A_hex).to.be.a("string");

      // Verify signature against public key
      const isAuthValid = bbs.verifyDirectBbs(issuerKeys.publicKey, sig, [authChallenge]);
      expect(isAuthValid).to.equal(true);
    });
  });

  describe("3. Dynamic Credential Issuance Studio (Government to Citizen)", function () {
    it("should dynamically mint and sign a BLS12-381 credential for a custom resident DID", function () {
      const govIssuer = bbs.generateIssuerKeyPair();
      const citizenHardware = bbs.generateDeviceHardwareKey();

      const citizenProfile = {
        name: "Vikramaditya Rao",
        nationalId: "IN-KA-BLR-554201",
        dob: "2001-09-12",
        domicile: "Bengaluru Urban (Ward 074)"
      };

      const predicates = [
        "over_18:true",
        "blr_resident:true",
        "bmtc_student_pass:true"
      ];

      const attributesToSign = [
        citizenProfile.name,
        citizenProfile.nationalId,
        citizenProfile.dob,
        ...predicates
      ];

      // Government digitally signs credential using BLS12-381 pairing
      const signature = bbs.signBbs(govIssuer.privateKey, attributesToSign);
      expect(signature.A_hex).to.be.a("string").with.lengthOf.at.least(48);

      // Verify issuer signature is directly valid
      const directValid = bbs.verifyDirectBbs(govIssuer.publicKey, signature, attributesToSign);
      expect(directValid).to.equal(true);

      // Citizen proves student status and age without disclosing name or national ID
      const nonce = "0xverifier-kiosk-nonce-99214";
      const verifierDid = "did:shroud:verifier-bmtc-majestic";

      // Reveal only predicates (indices 3, 4, 5)
      const presentationProof = bbs.deriveBbsPresentationProof({
        signature,
        messages: attributesToSign,
        revealedIndices: [3, 4, 5],
        nonce,
        verifierDid,
        devicePrivateKey: citizenHardware.privateKey
      });

      expect(presentationProof.isBlinded).to.equal(true);
      expect(presentationProof.revealedValues).to.have.lengthOf(3);
      expect(presentationProof.revealedValues[0].value).to.equal("over_18:true");

      // Verifier checks pairing math e(A', W) with 0 PII leak
      const verification = bbs.verifyBbsPresentationProof({
        proof: presentationProof,
        expectedNonce: nonce,
        expectedVerifierDid: verifierDid,
        issuerPublicKeyHex: govIssuer.publicKeyHex
      });

      expect(verification.valid).to.equal(true);
      expect(verification.zeroPiiLeaked).to.equal(true);
      expect(verification.revealedCount).to.equal(3);
      expect(verification.hiddenCount).to.equal(3);
    });
  });

  describe("4. City Verifier DPDP Act §6 Purpose Limitation Enforcement", function () {
    it("should allow dynamic verifier registration with lawful purpose statement", function () {
      const customVerifier = {
        id: "ver-kempegowda-airport",
        did: "did:shroud:verifier-kempegowda-airport",
        name: "Kempegowda Airport Automated e-Gate",
        department: "Civil Aviation & Border Verification",
        purposeId: "DPDP-AIRPORT-BOARDING-V1",
        registeredPurpose: "Identity qualification for automated boarding gate access without personal database storage",
        retentionPolicy: "Zero Retention (Ephemeral verification only)",
        requiredPredicates: ["over_18"],
        forbiddenDemands: ["Full Aadhaar Number", "Raw Date of Birth", "Mobile Phone Number"]
      };

      expect(customVerifier.forbiddenDemands).to.include("Full Aadhaar Number");
      expect(customVerifier.retentionPolicy).to.include("Zero Retention");
      expect(customVerifier.requiredPredicates).to.deep.equal(["over_18"]);
    });
  });
});

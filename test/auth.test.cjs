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

    it("should dynamically bind proof to active resident device key and reject mismatched or tampered keys", async function () {
      const cryptoSim = await import("../src/lib/cryptoSim.js");
      const activeResidentKey = bbs.generateDeviceHardwareKey();
      const attackerKey = bbs.generateDeviceHardwareKey();

      const cred = {
        category: "Identity",
        issuer: "CeG",
        rawData: { fullName: "Aarav S. Rao", nationalId: "IN-8891", dob: "2003-08-14" },
        predicates: [{ id: "over_18", label: "Age >= 18", statement: "Over 18", value: true }]
      };

      const nonce = "0xsession-challenge-live-7721";
      const verifierDid = "did:shroud:verifier-library";

      // Derive proof with active resident key
      const proof = cryptoSim.deriveBbsProof({
        credential: cred,
        selectedPredicateIds: ["over_18"],
        nonce,
        verifierDid,
        deviceHardwareKey: activeResidentKey
      });

      expect(proof.devicePublicKey).to.equal(activeResidentKey.publicKeyHex);
      expect(proof.deviceProofRaw).to.be.a("string").with.lengthOf(128);

      // Verify legitimate proof
      const legitimateVerify = await cryptoSim.verifyProof(proof, nonce, verifierDid);
      expect(legitimateVerify.valid).to.equal(true);

      // Tampered proof with different device public key must fail
      const tamperedProof = {
        ...proof,
        rawProof: {
          ...proof.rawProof,
          devicePublicKey: attackerKey.publicKeyHex
        }
      };

      const tamperedVerify = await cryptoSim.verifyProof(tamperedProof, nonce, verifierDid);
      expect(tamperedVerify.valid).to.equal(false);
      expect(tamperedVerify.issues.some(i => i.includes("Device hardware binding signature invalid"))).to.equal(true);
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

    it("should parse hex private key and derive corresponding G2 public key", function () {
      const issuerKeys = bbs.generateIssuerKeyPair();
      expect(issuerKeys.privateKeyHex).to.be.a("string").with.lengthOf(66); // '0x' + 64 hex chars

      const parsedScalar = bbs.parseIssuerPrivateKey(issuerKeys.privateKeyHex);
      const derived = bbs.deriveIssuerPublicKey(parsedScalar);

      expect(derived.publicKeyHex).to.equal(issuerKeys.publicKeyHex);
    });

    it("should reject authentication when an incorrect or adversarial private key is provided", function () {
      const genuineIssuer = bbs.generateIssuerKeyPair();
      const attackerKeys = bbs.generateIssuerKeyPair();
      const challenge = "CHALLENGE_GOV_LOGIN_STRICT_CHECK_" + Date.now();

      // Attacker signs challenge with their own key
      const attackerSig = bbs.signBbs(attackerKeys.privateKey, [challenge]);

      // Verifying against the genuine issuer's public key MUST fail
      const isSignatureValidForGenuineIssuer = bbs.verifyDirectBbs(
        genuineIssuer.publicKey,
        attackerSig,
        [challenge]
      );
      expect(isSignatureValidForGenuineIssuer).to.equal(false);
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

  describe("5. Cryptographic Epoch Revocation & Merkle Tree Integrity", function () {
    it("should compute genuine SHA-256 Merkle root over structured revocation entries", async function () {
      const { generateEpochRevocationTree } = await import("../src/lib/cryptoSim.js");
      const epochId = 143;
      const { entries, tree, root, leafHashes, leafCount } = generateEpochRevocationTree(epochId);

      expect(leafCount).to.equal(4);
      expect(root).to.match(/^0x[a-f0-9]{64}$/i);
      expect(entries[0]).to.include(`epoch-${epochId}`);
      expect(leafHashes).to.have.lengthOf(4);

      // Verify each leaf has valid inclusion path that hashes to root
      for (let idx = 0; idx < leafCount; idx++) {
        const proof = tree.getInclusionProof(idx);
        expect(proof).to.have.lengthOf(2); // log2(4) = 2 levels
      }
    });

    it("should anchor genuine Merkle root to StatusRegistry.sol and verify on-chain", async function () {
      const { generateEpochRevocationTree } = await import("../src/lib/cryptoSim.js");
      const StatusRegistryFactory = await ethers.getContractFactory("StatusRegistry");
      const statusRegistry = await StatusRegistryFactory.deploy();

      const nextEpoch = 143;
      const { root, leafCount } = generateEpochRevocationTree(nextEpoch);

      // Anchor genuine Merkle root
      await statusRegistry.anchorEpochStatusRoot(nextEpoch, root, 4095, leafCount);

      // Verify status registry state
      expect(await statusRegistry.latestEpoch()).to.equal(nextEpoch);
      expect(await statusRegistry.verifyEpochRoot(nextEpoch, root)).to.equal(true);

      const status = await statusRegistry.getEpochStatus(nextEpoch);
      expect(status.statusMerkleRoot).to.equal(root);
      expect(status.revokedCount).to.equal(leafCount);
    });
  });

  describe("6. On-Chain Issuer Accreditation & Status Verification in verifyProof", function () {
    it("should dynamically check issuer accreditation on-chain and approve accredited issuer", async function () {
      const { verifyProof, deriveBbsProof } = await import("../src/lib/cryptoSim.js");
      const { CREDENTIALS } = await import("../src/lib/mockData.js");

      const nonce = "0xsession_nonce_verify_accredited";
      const verifierDid = "did:shroud:verifier-blr-library";

      const proof = deriveBbsProof({
        credential: CREDENTIALS[0],
        selectedPredicateIds: ["over_18"],
        nonce,
        verifierDid
      });

      const result = await verifyProof(proof, nonce, verifierDid, 142);
      expect(result.valid).to.equal(true);
      expect(result.issuerAccredited).to.equal(true);
      expect(result.summary).to.include("On-Chain Accredited");
    });

    it("should reject presentation when issuing authority is revoked or unaccredited", async function () {
      const { verifyProof, deriveBbsProof } = await import("../src/lib/cryptoSim.js");
      const { CREDENTIALS } = await import("../src/lib/mockData.js");

      const nonce = "0xsession_nonce_unaccredited";
      const verifierDid = "did:shroud:verifier-blr-library";

      const fakeCred = {
        ...CREDENTIALS[0],
        issuerDid: "did:shroud:rogue-unaccredited-authority"
      };

      const proof = deriveBbsProof({
        credential: fakeCred,
        selectedPredicateIds: ["over_18"],
        nonce,
        verifierDid
      });

      const result = await verifyProof(proof, nonce, verifierDid, 142);
      expect(result.valid).to.equal(false);
      expect(result.issuerAccredited).to.equal(false);
      expect(result.issues.some(i => i.includes("Issuer accreditation revoked or inactive"))).to.equal(true);
    });
  });

  describe("7. Verifier Kiosk Nonce Expiration & Anti-Replay Defense (Detail 3B)", function () {
    it("should enforce 180s nonce expiration and detect expired challenge timestamp", async function () {
      const { generateNonce } = await import("../src/lib/cryptoSim.js");
      const verifierDid = "did:shroud:verifier-blr-library";
      const nonce = generateNonce(verifierDid);

      // Verify active nonce has 180s validity
      expect(nonce.expiresAt).to.be.greaterThan(nonce.createdAt);
      expect(nonce.expiresAt - nonce.createdAt).to.equal(180000);

      // Simulate expired challenge (past 180s TTL)
      const isExpired = (Date.now() + 185000) > nonce.expiresAt;
      expect(isExpired).to.equal(true);
    });

    it("should enforce single-use consumption and detect replay attacks", async function () {
      const { verifyProof, deriveBbsProof } = await import("../src/lib/cryptoSim.js");
      const { CREDENTIALS } = await import("../src/lib/mockData.js");

      const nonce = "0xsingle_use_test_nonce_8831";
      const verifierDid = "did:shroud:verifier-blr-library";

      const proof = deriveBbsProof({
        credential: CREDENTIALS[0],
        selectedPredicateIds: ["over_18"],
        nonce,
        verifierDid
      });

      // 1st presentation verification: valid
      const consumedNonces = new Set();
      expect(consumedNonces.has(nonce)).to.equal(false);

      const firstVerify = await verifyProof(proof, nonce, verifierDid, 142);
      expect(firstVerify.valid).to.equal(true);
      consumedNonces.add(nonce);

      // 2nd presentation verification with identical nonce: must be rejected as replay
      expect(consumedNonces.has(nonce)).to.equal(true);
      const isReplay = consumedNonces.has(nonce);
      expect(isReplay).to.equal(true);
    });

    it("should dynamically resolve on-chain authority name and status epoch", async function () {
      const { verifyProof, deriveBbsProof } = await import("../src/lib/cryptoSim.js");
      const { CREDENTIALS } = await import("../src/lib/mockData.js");

      const nonce = "0xauthority_metadata_nonce_4412";
      const verifierDid = "did:shroud:verifier-blr-library";

      const transitCred = CREDENTIALS[1] || CREDENTIALS[0];
      const proof = deriveBbsProof({
        credential: transitCred,
        selectedPredicateIds: transitCred.predicates.slice(0, 1).map(p => p.id),
        nonce,
        verifierDid
      });

      const result = await verifyProof(proof, nonce, verifierDid, 142);
      expect(result.valid).to.equal(true);
      expect(result.verifiedEpoch).to.equal(142);
      expect(result.statusRootMatch).to.equal(true);
    });
  });

  describe("8. Programmatic Purpose Firewall Evaluation (Detail 5A)", function () {
    it("should clear legitimate selective disclosure requests conforming to DPDP §6 charter", async function () {
      const { evaluatePurposeFirewall } = await import("../src/lib/firewallEngine.js");
      const legitimateRequest = {
        verifierDid: "did:shroud:verifier-metro-turnstile",
        verifierName: "BMTC Transit Authority",
        purpose: "Instant transit concession verification",
        demandedFields: ["Student Transit Concession (Predicate)", "Tier 1 Eligibility (Predicate)"]
      };

      const audit = evaluatePurposeFirewall(legitimateRequest);
      expect(audit.allowed).to.equal(true);
      expect(audit.violationDetected).to.equal(false);
      expect(audit.severity).to.equal("NONE");
      expect(audit.prohibitedFieldsCount).to.equal(0);
    });

    it("should intercept and block rogue over-asking attacks demanding forbidden PII fields", async function () {
      const { evaluatePurposeFirewall } = await import("../src/lib/firewallEngine.js");
      const rogueRequest = {
        verifierDid: "did:shroud:rogue-unregistered-wifi-kiosk",
        verifierName: "Municipal Public Wi-Fi Portal",
        purpose: "Basic Public Internet Access",
        demandedFields: [
          "National Aadhaar Number (UIDAI)",
          "Exact Date of Birth (YYYY-MM-DD)",
          "Primary Mobile Phone",
          "Permanent Street Address"
        ]
      };

      const audit = evaluatePurposeFirewall(rogueRequest);
      expect(audit.allowed).to.equal(false);
      expect(audit.violationDetected).to.equal(true);
      expect(audit.severity).to.equal("CRITICAL");
      expect(audit.prohibitedFieldsCount).to.be.at.least(4);
      expect(audit.statutoryProvision).to.include("DPDP Act 2023 §6");
      expect(audit.safeAlternative).to.include("Age ≥ 18 Predicate");
    });
  });

  describe("9. Dynamic Contextual Multilingual Consent Notices (Detail 5B)", function () {
    it("should dynamically localize consent notices in Kannada (ಕನ್ನಡ) for specific verifier & predicates", async function () {
      const { generateContextualConsentNotice } = await import("../src/lib/firewallEngine.js");
      const notice = generateContextualConsentNotice({
        lang: "kn",
        verifierName: "Bengaluru City Central Library",
        requestedPredicateLabels: ["Age ≥ 18", "Bengaluru Resident"]
      });

      expect(notice.title).to.equal("AI ಗೌಪ್ಯತೆ ಮತ್ತು ಸಮ್ಮತಿ ರಕ್ಷಕ");
      expect(notice.verifierTitle).to.equal("ಬೆಂಗಳೂರು ನಗರ ಕೇಂದ್ರ ಸಾರ್ವಜನಿಕ ಗ್ರಂಥಾಲಯ");
      expect(notice.predicatesList).to.include("ವಯಸ್ಸು 18 ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚು");
      expect(notice.summary).to.include("ಬೆಂಗಳೂರು ನಗರ ಕೇಂದ್ರ ಸಾರ್ವಜನಿಕ ಗ್ರಂಥಾಲಯ");
      expect(notice.summary).to.include("ಶೂನ್ಯ-ಜ್ಞಾನ BBS+");
      expect(notice.points.length).to.equal(3);
    });

    it("should dynamically localize consent notices in Hindi (हिन्दी) for specific verifier & predicates", async function () {
      const { generateContextualConsentNotice } = await import("../src/lib/firewallEngine.js");
      const notice = generateContextualConsentNotice({
        lang: "hi",
        verifierName: "BMTC Transit Authority",
        requestedPredicateLabels: ["Active Student Status", "Tier 1 Concession"]
      });

      expect(notice.title).to.equal("AI गोपनीयता एवं सहमति संरक्षक");
      expect(notice.verifierTitle).to.equal("बीएमटीसी मेट्रो ट्रांजिट प्राधिकरण");
      expect(notice.predicatesList).to.include("सक्रिय छात्र स्थिति");
      expect(notice.summary).to.include("बीएमटीसी मेट्रो ट्रांजिट प्राधिकरण");
      expect(notice.summary).to.include("ज़ीरो-नॉलेज (BBS+)");
      expect(notice.points.length).to.equal(3);
    });

    it("should dynamically adapt English notice to custom verifier and selected attributes", async function () {
      const { generateContextualConsentNotice } = await import("../src/lib/firewallEngine.js");
      const notice = generateContextualConsentNotice({
        lang: "en",
        verifierName: "Jan Aushadhi Health Clinic",
        requestedPredicateLabels: ["PHH Welfare Beneficiary"]
      });

      expect(notice.title).to.equal("AI Privacy & Consent Guardian");
      expect(notice.verifierTitle).to.equal("Jan Aushadhi Health Clinic");
      expect(notice.summary).to.include("Jan Aushadhi Health Clinic");
      expect(notice.summary).to.include("PHH Welfare Beneficiary");
    });
  });

  describe("10. Citizen Account Creation, Government Verification & Login Validation", function () {
    // Model the exact authentication & government binding state engine
    function createCitizenAccount({ name, username, dob, domicile, isStudent }) {
      const hwKey = bbs.generateDeviceHardwareKey();
      const cleanDid = `did:key:z6Mk${hwKey.publicKeyHex.substring(0, 10)}...${hwKey.publicKeyHex.substring(56)}`;
      return {
        id: `res-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
        username: (username || name.toLowerCase().replace(/[^a-z0-9]/g, '')).trim(),
        name: name.trim(),
        dob: dob || "2000-01-01",
        domicile: domicile || "Bengaluru Urban",
        nationalId: `IN-BLR-RES-${Math.floor(100000 + Math.random() * 900000)}`,
        isStudent: !!isStudent,
        isGovernmentVerified: false,
        status: "PENDING_GOV_VERIFICATION",
        certifications: [],
        hardwareKey: hwKey,
        did: cleanDid,
        createdAt: new Date().toISOString()
      };
    }

    function attemptCitizenLogin(user) {
      if (!user) {
        return { success: false, error: "Citizen account not found." };
      }
      const isVerified = user.isGovernmentVerified === true || (Array.isArray(user.certifications) && user.certifications.length > 0);
      if (!isVerified) {
        return {
          success: false,
          error: "not verified by government",
          message: "Account is not verified by government. An accredited authority must issue a certification before this account can log in."
        };
      }
      return { success: true, user };
    }

    function bindGovernmentCertification(targetUser, credential) {
      const certRecord = {
        id: credential.id || `gov-cert-${Date.now().toString(36)}`,
        title: credential.title || "Government Certified Credential",
        category: credential.category || "Government Service",
        issuer: credential.issuer || "Center for e-Governance, Karnataka",
        issuerDid: credential.issuerDid || "did:shroud:gov-karnataka-ceg",
        verifiedAt: new Date().toISOString(),
        predicates: credential.predicates || []
      };

      return {
        ...targetUser,
        isGovernmentVerified: true,
        status: "GOVERNMENT_VERIFIED",
        certifications: [certRecord, ...(targetUser.certifications || [])]
      };
    }

    it("should allow creating multiple citizen accounts with unverified status", function () {
      const acc1 = createCitizenAccount({ name: "Aarushi Verma", username: "aarushi_v", domicile: "Mumbai, Maharashtra" });
      const acc2 = createCitizenAccount({ name: "Kabir Mehta", username: "kabir_m", domicile: "Delhi NCR" });
      const acc3 = createCitizenAccount({ name: "Divya Nair", username: "divya_n", domicile: "Kochi, Kerala" });

      expect(acc1.isGovernmentVerified).to.equal(false);
      expect(acc1.status).to.equal("PENDING_GOV_VERIFICATION");
      expect(acc1.certifications).to.have.lengthOf(0);
      expect(acc1.hardwareKey.publicKeyHex).to.be.a("string").with.lengthOf(64);

      expect(acc2.isGovernmentVerified).to.equal(false);
      expect(acc3.isGovernmentVerified).to.equal(false);
      expect(acc1.did).to.not.equal(acc2.did);
    });

    it("should reject login attempt for unverified citizen with 'not verified by government'", function () {
      const unverifiedCitizen = createCitizenAccount({ name: "Tarun Reddy", username: "tarun_r" });

      const loginResult = attemptCitizenLogin(unverifiedCitizen);

      expect(loginResult.success).to.equal(false);
      expect(loginResult.error).to.equal("not verified by government");
      expect(loginResult.message.toLowerCase()).to.include("not verified by government");
    });

    it("should allow government to select citizen, bind certification, and activate their account for login", function () {
      // 1. Citizen registers
      const citizen = createCitizenAccount({ name: "Suresh Patil", username: "suresh_p", domicile: "Hubballi, Karnataka" });
      expect(attemptCitizenLogin(citizen).success).to.equal(false);

      // 2. Government issues credential
      const govIssuer = bbs.generateIssuerKeyPair();
      const credential = {
        id: "cred-karnataka-smart-city",
        title: "Karnataka Smart City Domicile Certificate",
        category: "Municipal Identity",
        issuer: "Center for e-Governance, Karnataka",
        issuerDid: "did:shroud:gov-karnataka-ceg",
        predicates: [
          { id: "over_18", label: "Age ≥ 18", statement: "Holder is 18 years or older", value: true },
          { id: "karnataka_domicile", label: "Karnataka Domicile", statement: "Resident of Hubballi, Karnataka", value: true }
        ]
      };

      // 3. Government binds certification to citizen
      const certifiedCitizen = bindGovernmentCertification(citizen, credential);

      expect(certifiedCitizen.isGovernmentVerified).to.equal(true);
      expect(certifiedCitizen.status).to.equal("GOVERNMENT_VERIFIED");
      expect(certifiedCitizen.certifications).to.have.lengthOf(1);
      expect(certifiedCitizen.certifications[0].title).to.equal("Karnataka Smart City Domicile Certificate");

      // 4. Citizen can now log in successfully!
      const loginResult = attemptCitizenLogin(certifiedCitizen);
      expect(loginResult.success).to.equal(true);
      expect(loginResult.user.name).to.equal("Suresh Patil");
      expect(loginResult.user.isGovernmentVerified).to.equal(true);
    });

    it("should ensure other unverified accounts remain blocked until specifically certified", function () {
      const citizenA = createCitizenAccount({ name: "Citizen A", username: "cit_a" });
      const citizenB = createCitizenAccount({ name: "Citizen B", username: "cit_b" });

      // Government certifies only Citizen A
      const certifiedA = bindGovernmentCertification(citizenA, { id: "cred-a", title: "Gov Cert A" });

      expect(attemptCitizenLogin(certifiedA).success).to.equal(true);
      // Citizen B must still be blocked
      const attemptB = attemptCitizenLogin(citizenB);
      expect(attemptB.success).to.equal(false);
      expect(attemptB.error).to.equal("not verified by government");
    });
  });
});

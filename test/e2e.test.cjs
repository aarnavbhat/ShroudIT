const { expect } = require("chai");
const http = require("http");

describe("ShroudIT End-to-End Lifecycle & Presentation Hardening Suite", function () {
  this.timeout(10000);

  let ethers;
  let issuerRegistry, statusRegistry, issuanceLog, documentVerifier;
  let owner, oracle, verifierAccount;
  let bbs;
  let aiEngine;
  let serverApp;
  let server;
  let baseUrl;

  before(async function () {
    // 1. Setup Web3 Contracts on in-process Hardhat Network
    const hardhat = require("hardhat");
    ethers = hardhat.ethers;
    [owner, oracle, verifierAccount] = await ethers.getSigners();

    const IssuerRegistry = await ethers.getContractFactory("IssuerRegistry");
    issuerRegistry = await IssuerRegistry.deploy();

    const StatusRegistry = await ethers.getContractFactory("StatusRegistry");
    statusRegistry = await StatusRegistry.deploy();
    await statusRegistry.setOracle(oracle.address, true);

    const IssuanceLog = await ethers.getContractFactory("IssuanceLog");
    issuanceLog = await IssuanceLog.deploy(await issuerRegistry.getAddress());

    const DocumentVerifier = await ethers.getContractFactory("DocumentVerifier");
    documentVerifier = await DocumentVerifier.deploy();

    // 2. Setup BBS+ and AI Engine
    bbs = await import("../src/lib/bbsEngine.js");
    aiEngine = await import("../src/lib/aiAnomalyEngine.js");

    // 3. Setup Microservices Server on dynamic port
    const serverModule = await import("../server/server.js");
    serverApp = serverModule.default;

    await new Promise((resolve) => {
      server = serverApp.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(function (done) {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const options = {
        method,
        headers: { "Content-Type": "application/json" }
      };

      const req = http.request(url, options, (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });

      req.on("error", reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  it("Step 1: On-Chain Trust Accreditation & Epoch Revocation Anchoring", async function () {
    // Register Karnataka Center for e-Governance (CeG) on-chain
    const cegDid = "did:shroud:gov-karnataka-ceg";
    const cegKeyBytes = ethers.toUtf8Bytes("BLS12381_G2_PUBKEY_KARNATAKA_CEG");
    const schemaHash = ethers.keccak256(ethers.toUtf8Bytes("SmartCityKarnatakaResidentSchemaV1"));

    await issuerRegistry.registerIssuer(cegDid, "Karnataka CeG", cegKeyBytes, [schemaHash]);
    const issuerInfo = await issuerRegistry.getIssuer(cegDid);

    expect(issuerInfo.isActive).to.be.true;
    expect(issuerInfo.name).to.equal("Karnataka CeG");

    // Oracle anchors Epoch #142 Merkle root for private revocation
    const epochRoot = ethers.keccak256(ethers.toUtf8Bytes("Epoch_142_Revocation_Merkle_Root"));
    await statusRegistry.connect(oracle).anchorEpochStatusRoot(142, epochRoot, 8500, 12);

    const rootInfo = await statusRegistry.getEpochStatus(142);
    expect(rootInfo.statusMerkleRoot).to.equal(epochRoot);
    expect(rootInfo.activeCount).to.equal(8500n);
    expect(rootInfo.revokedCount).to.equal(12n);
  });

  it("Step 2: Microservice Credential Issuance with Real BLS12-381 KeyPair", async function () {
    // Generate real BLS12-381 issuer key
    const issuerKey = bbs.generateIssuerKeyPair();
    const attributes = [
      "Aarav S. Rao",
      "IN-BLR-RES-884920",
      "2003-08-14",
      "over_18:true",
      "blr_resident:true",
      "transit_concession:true"
    ];

    // Issue BBS+ signature over all 6 attributes
    const signature = bbs.signBbs(issuerKey.privateKey, attributes);
    expect(signature).to.have.property("A_hex");
    expect(signature.e).to.be.a("bigint");
    expect(signature.s).to.be.a("bigint");
  });

  it("Step 3: Anti-Replay Session Challenge Nonce Lifecycle", async function () {
    const verifierDid = "did:shroud:verifier-blr-library";
    const res = await makeRequest("GET", `/api/verifier/challenge?verifierDid=${encodeURIComponent(verifierDid)}`);

    expect(res.status).to.equal(200);
    expect(res.body.nonce).to.match(/^0x[0-9a-fA-F]{64}$/); // 256-bit hex
    expect(res.body.ttlSeconds).to.equal(180);
    expect(res.body.verifierDid).to.equal(verifierDid);
  });

  it("Step 4: Zero-Knowledge Selective Disclosure Derivation & Verification", async function () {
    const issuerKey = bbs.generateIssuerKeyPair();
    const deviceKey = bbs.generateDeviceHardwareKey();
    const verifierDid = "did:shroud:verifier-bmrcl-gate";
    const nonce = "0x" + "a1".repeat(32);

    const attributes = [
      "Aarav S. Rao",
      "IN-BLR-RES-884920",
      "2003-08-14",
      "over_18:true",
      "blr_resident:true"
    ];

    const signature = bbs.signBbs(issuerKey.privateKey, attributes);

    // Resident selectively discloses ONLY attributes [3, 4] (over_18, blr_resident)
    // and blinds [0, 1, 2] (name, national ID, dob)
    const proof = bbs.deriveBbsPresentationProof({
      signature,
      messages: attributes,
      revealedIndices: [3, 4],
      nonce,
      verifierDid,
      devicePrivateKey: deviceKey.privateKey
    });

    expect(proof.revealedValues.length).to.equal(2);
    expect(proof.revealedValues.map(r => r.value)).to.deep.equal(["over_18:true", "blr_resident:true"]);

    // Verifier checks pairing equations e(A', ...) == e(...)
    const verifyResult = bbs.verifyBbsPresentationProof({
      proof,
      expectedNonce: nonce,
      expectedVerifierDid: verifierDid,
      issuerPublicKeyHex: issuerKey.publicKeyHex
    });

    expect(verifyResult.valid).to.be.true;
    expect(verifyResult.zeroPiiLeaked).to.be.true;
    expect(verifyResult.hiddenCount).to.equal(3);
  });

  it("Step 5: AI Isolation Forest Evaluates Access Pattern as Low Risk", async function () {
    // Normal single-predicate verification telemetry
    const normalTelemetry = [6.0, 1.0, 10.0, 0.0, 0.05];
    const evalResult = aiEngine.evaluateTelemetryVector(normalTelemetry);

    expect(evalResult.score).to.be.below(0.60);
    expect(evalResult.isAnomaly).to.be.false;
    expect(evalResult.riskLevel).to.equal("LOW");
  });

  it("Step 6: AI Auditor Proves 0.00% Cross-Service Linkability Across 4 City Verifiers", async function () {
    const linkabilityResult = aiEngine.simulateCrossServiceLinkability({
      numResidents: 6,
      numServices: 4
    });

    // Baseline SD-JWT: 100% linkable
    expect(linkabilityResult.baseline.linkabilityPct).to.equal(100.0);
    expect(linkabilityResult.baseline.linkedPairs).to.equal(18);

    // ShroudIT BBS+: 0.00% linkable
    expect(linkabilityResult.shroudit.linkabilityPct).to.equal(0.00);
    expect(linkabilityResult.shroudit.linkedPairs).to.equal(0);
    expect(linkabilityResult.shroudit.entropyScore).to.be.above(0.90);
  });

  it("Step 7: Merkle Path Document Inclusion Verification on Smart Contract", async function () {
    // 4-leaf salted training certificate Merkle tree using SHA-256
    const leaves = [
      ethers.sha256(ethers.toUtf8Bytes("cert-student-1-pass")),
      ethers.sha256(ethers.toUtf8Bytes("cert-student-2-pass")),
      ethers.sha256(ethers.toUtf8Bytes("cert-student-3-pass")),
      ethers.sha256(ethers.toUtf8Bytes("cert-student-4-pass"))
    ];

    // Compute binary tree nodes with SHA-256
    const h01 = ethers.sha256(ethers.concat([leaves[0], leaves[1]]));
    const h23 = ethers.sha256(ethers.concat([leaves[2], leaves[3]]));
    const merkleRoot = ethers.sha256(ethers.concat([h01, h23]));

    // Proof for leaf[0]: sibling leaves[1] on right (true), then sibling h23 on right (true)
    const siblings = [leaves[1], h23];
    const isRight = [true, true];

    const isLeaf0Valid = await documentVerifier.verifyInclusionProof(leaves[0], merkleRoot, siblings, isRight);
    expect(isLeaf0Valid).to.be.true;

    // Tampered leaf must fail verification
    const tamperedLeaf = ethers.sha256(ethers.toUtf8Bytes("cert-student-1-FAILED"));
    const isTamperedValid = await documentVerifier.verifyInclusionProof(tamperedLeaf, merkleRoot, siblings, isRight);
    expect(isTamperedValid).to.be.false;
  });
});

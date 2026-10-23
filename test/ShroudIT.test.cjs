const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ShroudIT On-Chain Trust Registry", function () {
  let issuerRegistry;
  let statusRegistry;
  let issuanceLog;
  let documentVerifier;
  let owner;
  let oracle;
  let unauthorized;

  const CEG_DID = "did:shroud:gov-karnataka-ceg";
  const BMTC_DID = "did:shroud:bmtc-transit";
  const DSW_DID = "did:shroud:karnataka-dsw";

  const FAKE_BLS_KEY = "0x04e8b394f99a128e4091ab7721cd882194f10928e4912984019284091823901928409128";
  const SCHEMA_RESIDENT = ethers.id("ResidentIdentity_v2");
  const SCHEMA_TRANSIT = ethers.id("StudentTransitPass_v3");

  beforeEach(async function () {
    [owner, oracle, unauthorized] = await ethers.getSigners();

    // 1. Deploy IssuerRegistry
    const IssuerRegistryFactory = await ethers.getContractFactory("IssuerRegistry");
    issuerRegistry = await IssuerRegistryFactory.deploy();

    // 2. Deploy StatusRegistry
    const StatusRegistryFactory = await ethers.getContractFactory("StatusRegistry");
    statusRegistry = await StatusRegistryFactory.deploy();

    // Authorize oracle
    await statusRegistry.setOracle(oracle.address, true);

    // 3. Deploy IssuanceLog linked to IssuerRegistry
    const IssuanceLogFactory = await ethers.getContractFactory("IssuanceLog");
    issuanceLog = await IssuanceLogFactory.deploy(await issuerRegistry.getAddress());

    // 4. Deploy DocumentVerifier
    const DocumentVerifierFactory = await ethers.getContractFactory("DocumentVerifier");
    documentVerifier = await DocumentVerifierFactory.deploy();
  });

  describe("1. IssuerRegistry", function () {
    it("should allow owner to register accredited civic issuers", async function () {
      await issuerRegistry.registerIssuer(
        CEG_DID,
        "Center for e-Governance, Karnataka",
        FAKE_BLS_KEY,
        [SCHEMA_RESIDENT]
      );

      expect(await issuerRegistry.isIssuerAccredited(CEG_DID)).to.equal(true);
      expect(await issuerRegistry.supportsSchema(CEG_DID, SCHEMA_RESIDENT)).to.equal(true);
      expect(await issuerRegistry.supportsSchema(CEG_DID, SCHEMA_TRANSIT)).to.equal(false);

      const issuerData = await issuerRegistry.getIssuer(CEG_DID);
      expect(issuerData.name).to.equal("Center for e-Governance, Karnataka");
      expect(issuerData.isActive).to.equal(true);
    });

    it("should reject duplicate issuer registration", async function () {
      await issuerRegistry.registerIssuer(CEG_DID, "CeG", FAKE_BLS_KEY, []);
      await expect(
        issuerRegistry.registerIssuer(CEG_DID, "CeG Duplicate", FAKE_BLS_KEY, [])
      ).to.be.revertedWith("IssuerRegistry: issuer already active");
    });

    it("should allow revocation of a compromised issuer", async function () {
      await issuerRegistry.registerIssuer(BMTC_DID, "BMTC Transit", FAKE_BLS_KEY, []);
      expect(await issuerRegistry.isIssuerAccredited(BMTC_DID)).to.equal(true);

      await issuerRegistry.revokeIssuer(BMTC_DID, "Key compromise detected in security audit");
      expect(await issuerRegistry.isIssuerAccredited(BMTC_DID)).to.equal(false);
    });

    it("should reject registration from non-owner accounts", async function () {
      await expect(
        issuerRegistry.connect(unauthorized).registerIssuer(
          "did:shroud:rogue-authority",
          "Fake Dept",
          FAKE_BLS_KEY,
          []
        )
      ).to.be.revertedWith("IssuerRegistry: caller is not the owner");
    });
  });

  describe("2. StatusRegistry (Epoch Revocation Roots)", function () {
    const SAMPLE_ROOT = ethers.id("Epoch_142_Merkle_Revocation_Bitvector_Root");

    it("should allow authorized oracle to anchor epoch status root", async function () {
      await statusRegistry.connect(oracle).anchorEpochStatusRoot(
        142,
        SAMPLE_ROOT,
        4080,
        16
      );

      expect(await statusRegistry.latestEpoch()).to.equal(142);
      expect(await statusRegistry.verifyEpochRoot(142, SAMPLE_ROOT)).to.equal(true);

      const status = await statusRegistry.getEpochStatus(142);
      expect(status.statusMerkleRoot).to.equal(SAMPLE_ROOT);
      expect(status.activeCount).to.equal(4080);
      expect(status.revokedCount).to.equal(16);
      expect(status.anchoredBy).to.equal(oracle.address);
    });

    it("should reject anchoring from unauthorized accounts", async function () {
      await expect(
        statusRegistry.connect(unauthorized).anchorEpochStatusRoot(
          143,
          SAMPLE_ROOT,
          100,
          0
        )
      ).to.be.revertedWith("StatusRegistry: caller not authorized to anchor roots");
    });
  });

  describe("3. IssuanceLog (Batch Mint Audits)", function () {
    const BATCH_ROOT = ethers.id("Batch_2026_042_Root");

    it("should log a batch for an accredited issuer and prevent silent mass issuance", async function () {
      // First register the issuer
      await issuerRegistry.registerIssuer(CEG_DID, "CeG", FAKE_BLS_KEY, [SCHEMA_RESIDENT]);

      await issuanceLog.logBatch("BATCH-2026-042", CEG_DID, BATCH_ROOT, 2450);

      expect(await issuanceLog.totalBatches()).to.equal(1);

      const batch = await issuanceLog.getBatch(0);
      expect(batch.batchId).to.equal("BATCH-2026-042");
      expect(batch.issuerDid).to.equal(CEG_DID);
      expect(batch.count).to.equal(2450);
      expect(batch.batchMerkleRoot).to.equal(BATCH_ROOT);
    });

    it("should reject batch logging for unaccredited issuer", async function () {
      await expect(
        issuanceLog.logBatch("ROGUE-BATCH-001", "did:shroud:unaccredited-rogue-entity", BATCH_ROOT, 99999)
      ).to.be.revertedWith("IssuanceLog: issuer is not accredited");
    });
  });

  describe("4. DocumentVerifier (Merkle Path Inclusion Proofs)", function () {
    it("should verify cryptographic inclusion proof for document credentials", async function () {
      // Construct a small 2-leaf Merkle tree using sha256
      const leaf0 = ethers.sha256(ethers.toUtf8Bytes("Aarav_S_Rao:ResidentID:Salt_991"));
      const leaf1 = ethers.sha256(ethers.toUtf8Bytes("BMTC_Pass:Student_2026:Salt_442"));

      // Parent root = sha256(leaf0 + leaf1)
      const root = ethers.sha256(ethers.concat([leaf0, leaf1]));

      // Sibling of leaf0 is leaf1, and leaf1 is on the right
      const siblings = [leaf1];
      const isRight = [true];

      const validProof = await documentVerifier.verifyInclusionProof(
        leaf0,
        root,
        siblings,
        isRight
      );
      expect(validProof).to.equal(true);

      // Verify that tampering with leaf fails proof
      const tamperedLeaf = ethers.sha256(ethers.toUtf8Bytes("Tampered_Data"));
      const invalidProof = await documentVerifier.verifyInclusionProof(
        tamperedLeaf,
        root,
        siblings,
        isRight
      );
      expect(invalidProof).to.equal(false);
    });
  });
});

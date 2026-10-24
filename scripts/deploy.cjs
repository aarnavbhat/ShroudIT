const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log("Deploying ShroudIT Smart Contracts to Network...");
  console.log("==================================================");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer Account: ${deployer.address}`);

  // 1. Deploy IssuerRegistry
  const IssuerRegistry = await ethers.getContractFactory("IssuerRegistry");
  const issuerRegistry = await IssuerRegistry.deploy();
  await issuerRegistry.waitForDeployment();
  const issuerRegistryAddress = await issuerRegistry.getAddress();
  console.log(`✓ IssuerRegistry deployed to: ${issuerRegistryAddress}`);

  // 2. Deploy StatusRegistry
  const StatusRegistry = await ethers.getContractFactory("StatusRegistry");
  const statusRegistry = await StatusRegistry.deploy();
  await statusRegistry.waitForDeployment();
  const statusRegistryAddress = await statusRegistry.getAddress();
  console.log(`✓ StatusRegistry deployed to: ${statusRegistryAddress}`);

  // 3. Deploy IssuanceLog
  const IssuanceLog = await ethers.getContractFactory("IssuanceLog");
  const issuanceLog = await IssuanceLog.deploy(issuerRegistryAddress);
  await issuanceLog.waitForDeployment();
  const issuanceLogAddress = await issuanceLog.getAddress();
  console.log(`✓ IssuanceLog deployed to:    ${issuanceLogAddress}`);

  // 4. Deploy DocumentVerifier
  const DocumentVerifier = await ethers.getContractFactory("DocumentVerifier");
  const documentVerifier = await DocumentVerifier.deploy();
  await documentVerifier.waitForDeployment();
  const documentVerifierAddress = await documentVerifier.getAddress();
  console.log(`✓ DocumentVerifier deployed to:${documentVerifierAddress}`);

  // Seed initial civic issuers (Center for e-Governance, BMTC, Social Welfare, KDEM)
  console.log("\nSeeding Accredited Civic Authorities with Authentic BLS12-381 G2 Public Keys...");

  const { bls12_381 } = await import("@noble/curves/bls12-381.js");
  const { sha256 } = await import("@noble/hashes/sha2.js");
  const Fr = bls12_381.fields.Fr;

  function deriveAuthorityKey(seed) {
    const hash = sha256(new TextEncoder().encode(seed));
    let num = 0n;
    for (let i = 0; i < hash.length; i++) {
      num = (num << 8n) + BigInt(hash[i]);
    }
    const privScalar = Fr.create(num);
    const pubPoint = bls12_381.G2.Point.BASE.multiply(privScalar);
    return {
      privateKeyHex: "0x" + privScalar.toString(16).padStart(64, "0"),
      publicKeyHex: "0x" + pubPoint.toHex()
    };
  }

  const CEG_DID = "did:shroud:gov-karnataka-ceg";
  const BMTC_DID = "did:shroud:bmtc-transit";
  const DSW_DID = "did:shroud:karnataka-dsw";
  const KDEM_DID = "did:shroud:kdem-cert";

  const CEG_KEYS = deriveAuthorityKey("ShroudIT:Authority:gov-karnataka-ceg:v1");
  const BMTC_KEYS = deriveAuthorityKey("ShroudIT:Authority:bmtc-transit:v1");
  const DSW_KEYS = deriveAuthorityKey("ShroudIT:Authority:karnataka-dsw:v1");
  const KDEM_KEYS = deriveAuthorityKey("ShroudIT:Authority:kdem-cert:v1");

  await issuerRegistry.registerIssuer(
    CEG_DID,
    "Center for e-Governance, Karnataka",
    CEG_KEYS.publicKeyHex,
    [ethers.id("ResidentIdentity_v2"), ethers.id("AddressCredential_v1")]
  );
  console.log(`  ✓ Registered: Center for e-Governance (${CEG_DID}) [BLS12-381 G2 PK: ${CEG_KEYS.publicKeyHex.substring(0, 18)}...]`);

  await issuerRegistry.registerIssuer(
    BMTC_DID,
    "BMTC Transit Authority",
    BMTC_KEYS.publicKeyHex,
    [ethers.id("StudentTransitPass_v3")]
  );
  console.log(`  ✓ Registered: BMTC Transit (${BMTC_DID}) [BLS12-381 G2 PK: ${BMTC_KEYS.publicKeyHex.substring(0, 18)}...]`);

  await issuerRegistry.registerIssuer(
    DSW_DID,
    "Directorate of Social Welfare",
    DSW_KEYS.publicKeyHex,
    [ethers.id("SocioEconomicBenefit_v2")]
  );
  console.log(`  ✓ Registered: Dept of Social Welfare (${DSW_DID}) [BLS12-381 G2 PK: ${DSW_KEYS.publicKeyHex.substring(0, 18)}...]`);

  await issuerRegistry.registerIssuer(
    KDEM_DID,
    "Karnataka Digital Economy Mission",
    KDEM_KEYS.publicKeyHex,
    [ethers.id("ProfessionalSkillCert_v1")]
  );
  console.log(`  ✓ Registered: KDEM Academy (${KDEM_DID}) [BLS12-381 G2 PK: ${KDEM_KEYS.publicKeyHex.substring(0, 18)}...]`);

  // Register DID aliases for cross-compatibility
  const aliases = [
    { did: "did:cv:gov-karnataka-ceg", name: "Center for e-Governance, Karnataka", key: CEG_KEYS.publicKeyHex, schemas: [ethers.id("ResidentIdentity_v2"), ethers.id("AddressCredential_v1")] },
    { did: "did:cv:gov-accredited-authority", name: "Center for e-Governance, Karnataka (Accredited)", key: CEG_KEYS.publicKeyHex, schemas: [ethers.id("ResidentIdentity_v2"), ethers.id("CivicAttestation_v1")] },
    { did: "did:shroud:gov-accredited-authority", name: "Center for e-Governance, Karnataka (Accredited)", key: CEG_KEYS.publicKeyHex, schemas: [ethers.id("ResidentIdentity_v2"), ethers.id("CivicAttestation_v1")] },
    { did: "did:cv:bmtc-transit", name: "BMTC Transit Authority", key: BMTC_KEYS.publicKeyHex, schemas: [ethers.id("StudentTransitPass_v3")] },
    { did: "did:cv:karnataka-dsw", name: "Directorate of Social Welfare", key: DSW_KEYS.publicKeyHex, schemas: [ethers.id("SocioEconomicBenefit_v2")] },
    { did: "did:cv:kdem-cert", name: "Karnataka Digital Economy Mission", key: KDEM_KEYS.publicKeyHex, schemas: [ethers.id("ProfessionalSkillCert_v1")] }
  ];

  for (const alias of aliases) {
    await issuerRegistry.registerIssuer(alias.did, alias.name, alias.key, alias.schemas);
    console.log(`  ✓ Registered Alias: ${alias.did}`);
  }

  // Anchor Initial Epoch #142 Merkle Status Root
  console.log("\nAnchoring Initial Epoch #142 Merkle Revocation Root...");
  const { generateEpochRevocationTree } = await import("../src/lib/cryptoSim.js");
  const epoch142Data = generateEpochRevocationTree(142);
  const EPOCH_142_ROOT = epoch142Data.root;
  await statusRegistry.anchorEpochStatusRoot(142, EPOCH_142_ROOT, 4080, epoch142Data.leafCount);
  console.log(`  ✓ Anchored Epoch #142 Root: ${EPOCH_142_ROOT}`);

  // Log Initial Batches
  console.log("\nLogging Transparency Batches...");
  await issuanceLog.logBatch(
    "BATCH-2026-042",
    CEG_DID,
    "0x3f8a92b100000000000000000000000000000000000000000000000000000000",
    2450
  );
  await issuanceLog.logBatch(
    "BATCH-2026-041",
    BMTC_DID,
    "0x892ac09e00000000000000000000000000000000000000000000000000000000",
    850
  );
  console.log("  ✓ Logged Batch #042 & #041");

  // Write deployment manifest
  const manifest = {
    network: "hardhat-local",
    chainId: 31337,
    deployedAt: new Date().toISOString(),
    contracts: {
      IssuerRegistry: issuerRegistryAddress,
      StatusRegistry: statusRegistryAddress,
      IssuanceLog: issuanceLogAddress,
      DocumentVerifier: documentVerifierAddress,
    },
  };

  const outputPath = path.join(__dirname, "../src/lib/deployedContracts.json");
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
  console.log(`\n✓ Contract manifest saved to: ${outputPath}`);

  // Save authentic authority keystore matching on-chain registrations
  const authorityKeystore = {
    [CEG_DID]: {
      name: "Center for e-Governance, Karnataka",
      did: CEG_DID,
      keyPair: CEG_KEYS
    },
    [BMTC_DID]: {
      name: "BMTC Transit Authority",
      did: BMTC_DID,
      keyPair: BMTC_KEYS
    },
    [DSW_DID]: {
      name: "Directorate of Social Welfare",
      did: DSW_DID,
      keyPair: DSW_KEYS
    },
    [KDEM_DID]: {
      name: "Karnataka Digital Economy Mission",
      did: KDEM_DID,
      keyPair: KDEM_KEYS
    }
  };

  const keystorePath = path.join(__dirname, "../src/lib/authorityKeystore.json");
  fs.writeFileSync(keystorePath, JSON.stringify(authorityKeystore, null, 2));
  console.log(`✓ Authority keystore saved to: ${keystorePath}`);
  console.log("==================================================");
  console.log("Deployment Complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

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
  console.log("\nSeeding Accredited Civic Authorities...");

  const CEG_DID = "did:shroud:gov-karnataka-ceg";
  const BMTC_DID = "did:shroud:bmtc-transit";
  const DSW_DID = "did:shroud:karnataka-dsw";
  const KDEM_DID = "did:shroud:kdem-cert";

  const DUMMY_BLS_KEY_CEG = "0x04e8b394f99a128e4091ab7721cd882194f10928e4912984019284091823901928409128";
  const DUMMY_BLS_KEY_BMTC = "0x03a74b92184c98e21940192849120938401928401928409128409128409128409128";

  await issuerRegistry.registerIssuer(
    CEG_DID,
    "Center for e-Governance, Karnataka",
    DUMMY_BLS_KEY_CEG,
    [ethers.id("ResidentIdentity_v2"), ethers.id("AddressCredential_v1")]
  );
  console.log(`  ✓ Registered: Center for e-Governance (${CEG_DID})`);

  await issuerRegistry.registerIssuer(
    BMTC_DID,
    "BMTC Transit Authority",
    DUMMY_BLS_KEY_BMTC,
    [ethers.id("StudentTransitPass_v3")]
  );
  console.log(`  ✓ Registered: BMTC Transit (${BMTC_DID})`);

  await issuerRegistry.registerIssuer(
    DSW_DID,
    "Directorate of Social Welfare",
    DUMMY_BLS_KEY_CEG,
    [ethers.id("SocioEconomicBenefit_v2")]
  );
  console.log(`  ✓ Registered: Dept of Social Welfare (${DSW_DID})`);

  await issuerRegistry.registerIssuer(
    KDEM_DID,
    "Karnataka Digital Economy Mission",
    DUMMY_BLS_KEY_BMTC,
    [ethers.id("ProfessionalSkillCert_v1")]
  );
  console.log(`  ✓ Registered: KDEM Academy (${KDEM_DID})`);

  // Anchor Initial Epoch #142 Merkle Status Root
  console.log("\nAnchoring Initial Epoch #142 Merkle Revocation Root...");
  const EPOCH_142_ROOT = "0x9bf41a67d028b1e4c398e09f58cb2142e88f7c9e0a2948719280efca117a4c9b";
  await statusRegistry.anchorEpochStatusRoot(142, EPOCH_142_ROOT, 4080, 16);
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
  console.log("==================================================");
  console.log("Deployment Complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

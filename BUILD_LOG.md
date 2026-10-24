# ShroudIT (formerly CivicVeil) — Build & Commit Milestones

This log tracks all project builds for phased GitHub commits during the ChronoForge Hackathon.

---

## 🏷️ Build 1 (Completed)
- **Tag / ID**: `build-1`
- **Commit**: `d965058`
- **Timestamp**: `2026-10-23`
- **Description**: Initial functional frontend prototype & interactive cryptographic simulation.
- **Milestone Scope**:
  - Full multi-page architecture with React Router (`/wallet`, `/verifier`, `/blockchain`, `/auditor`).
  - **Resident Privacy Wallet**: Mobile phone mockup & desktop views, 4 synthetic civic credentials, selective disclosure predicate toggles, blinded BBS+ proof derivation, DPDP consent receipts, multilingual AI explainer (English, Kannada, Hindi), and Purpose Firewall over-asking defense.
  - **City Service Verifier Kiosk**: 256-bit ephemeral nonce challenge (anti-replay), registered purpose enforcement, zero-knowledge verification terminal with "0 Bytes PII" display.
  - **On-Chain Trust Explorer**: Hardhat L2 sandbox visualization, accredited issuer registry, epoch revocation Merkle roots, issuance transparency logs, and interactive 4-leaf document Merkle path validator.
  - **AI Linkability Auditor**: Live side-by-side adversary simulation demonstrating 100% linkability on legacy SD-JWT/mDoc baseline vs 0.00% on ShroudIT BBS+ layer, plus Isolation Forest anomaly monitor.
  - Production Vite build passing with 0 errors.

---

## 🏷️ Build 2 (Completed)
- **Tag / ID**: `build-2`
- **Commit**: `463c888`
- **Timestamp**: `2026-10-23`
- **Description**: Real Solidity smart contracts, Hardhat test suite, and deployment engine.
- **Milestone Scope**:
  - `contracts/IssuerRegistry.sol`: Maps `did:shroud:...` to public key byte arrays and authorized schema hashes. Owner-gated accreditation and instant revocation.
  - `contracts/StatusRegistry.sol`: Anchors epoch-specific revocation Merkle roots (`bytes32`) and active/revoked counters for zero-query-leakage private revocation checks.
  - `contracts/IssuanceLog.sol`: Append-only batch commit log linking accredited issuers to batch roots and counts, preventing silent mass fake credential issuance.
  - `contracts/DocumentVerifier.sol`: Cryptographic Merkle tree inclusion path validator for salted QR / physical training certificates.
  - `hardhat.config.cjs`: Hardhat 2.22 / Solidity 0.8.24 configuration with optimizer enabled.
  - `test/ShroudIT.test.cjs`: Comprehensive test suite verifying all 4 smart contracts (9 passing tests).
  - `scripts/deploy.cjs`: Automated deployment script seeding Karnataka CeG, BMTC, Social Welfare, and KDEM authorities, anchoring Epoch #142 root, and outputting `src/lib/deployedContracts.json`.

---

## 🏷️ Build 3 (Completed)
- **Tag / ID**: `build-3`
- **Commit**: `3d1eceb`
- **Timestamp**: `2026-10-24`
- **Description**: Web3 live on-chain integration in frontend via Ethers.js v6.
- **Milestone Scope**:
  - `src/lib/contractAbis.js`: Clean auto-extracted ABIs for `IssuerRegistry`, `StatusRegistry`, `IssuanceLog`, and `DocumentVerifier`.
  - `src/lib/web3Client.js`: Real Ethers v6 client connecting to local Hardhat node (`http://127.0.0.1:8545`). Queries total accredited issuers, live epoch revocation roots, and issuance batches directly from deployed contract bytecode.
  - `src/pages/BlockchainPage.jsx`: Refactored to query smart contracts on-chain. Added live contract addresses panel, "Advance Epoch on Contract" write transaction, and "Verify on Smart Contract" invocation executing `DocumentVerifier.sol`.
  - Offline Resilience: Graceful fallback with connection status pills so the demo works seamlessly whether the local EVM node is running or offline.
  - Convenience scripts added to `package.json`: `compile`, `test:contracts`, `node:dev`, and `deploy:local`.

---

## 🏷️ Build 4 (Completed)
- **Tag / ID**: `build-4`
- **Commit**: `936f92c`
- **Timestamp**: `2026-10-24`
- **Description**: Real BBS+ zero-knowledge cryptographic pairing engine & Ed25519 device binding.
- **Milestone Scope**:
  - `src/lib/bbsEngine.js`: Genuine BBS+ signature engine implementing IETF `draft-irtf-cfrg-bbs-signatures` using BLS12-381 G1/G2 pairing mathematics via `@noble/curves`.
  - Multi-attribute BBS+ signing: Computes $A = \frac{1}{x+e} (G_1 + s \cdot H_0 + \sum m_i H_i)$ and validates the bilinear pairing equation $e(A, W + e \cdot G_2) = e(B, G_2)$.
  - Zero-Knowledge Presentation Proofs: Blinds unrevealed attributes with random scalars $r_1, r_2 \in \mathbb{F}_q$, derives fresh randomized $A'$ on G1, computes Fiat-Shamir challenge $c$, and outputs Schnorr responses $s'$.
  - Hardware Device Binding: Browser native Ed25519 key derivation signing session nonces to prevent credential export or presentation replay.
  - `src/lib/cryptoSim.js`: Replaced string simulation with the genuine BBS+ engine for both Wallet proof derivation and Verifier kiosk checks.
  - `test/crypto.test.cjs`: Comprehensive cryptographic test suite covering keygen, multi-message signing, ZK selective disclosure, replay rejection, and 0% cross-service linkability (5/5 passing tests). Total test suite now at 14/14 passing tests.

---

## 🏷️ Build 5 (Completed)
- **Tag / ID**: `build-5`
- **Timestamp**: `2026-10-24`
- **Description**: Backend microservices (Issuer & Verifier APIs with anti-replay nonce lifecycle).
- **Milestone Scope**:
  - `server/server.js`: Express microservice server running on port 4000.
  - `POST /api/issuer/issue`: Multi-attribute credential issuance endpoint signing raw attributes with real BLS12-381 issuer private keys.
  - `GET /api/verifier/challenge`: 256-bit cryptographic nonce challenge endpoint with 180s TTL and verifier DID binding.
  - `POST /api/verifier/verify`: Presentation verification endpoint enforcing one-time nonce consumption (strict replay protection) and executing BLS12-381 pairing checks.
  - `GET /api/verifier/purposes`: Registered verifier policy directory enforcing DPDP Act §6 data minimization.
  - `src/lib/apiClient.js`: Frontend HTTP client connecting browser to backend API with automatic offline fallback.
  - `test/server.test.cjs`: Automated backend API test suite (5/5 passing tests). Total test suite now at 19/19 passing tests.
  - Convenience scripts added: `npm run server` and unified `npm test`.

---

## 🏷️ Build 6 (Completed)
- **Tag / ID**: `build-6`
- **Commit**: `d0daa1a`
- **Timestamp**: `2026-10-24`
- **Description**: Resident wallet encrypted local storage & camera QR transport (OpenID4VP).
- **Milestone Scope**:
  - `src/lib/walletStorage.js`: IndexedDB persistent storage (`ShroudIT_Secure_Wallet_v1`) via `idb` with browser WebCrypto AES-GCM (256-bit) device encryption at rest. Manages civic credentials, DPDP consent receipts, and device hardware keys. Added `exportReceiptAsJson` for cryptographically signed DPDP Act 2023 receipt downloads.
  - `src/components/CameraQrScannerModal.jsx`: Camera scanner modal integrating `html5-qrcode` for live webcam video streams, image file drag-and-drop decode fallback, and instant simulated tap.
  - `src/pages/WalletPage.jsx`: Integrated `QRCodeSVG` for live scannable OpenID4VP QR generation (both in expanded desktop and smartphone frames). Connected encrypted IndexedDB persistence, AES-GCM enclave indicators, and one-click JSON audit receipt downloads.
  - `src/pages/VerifierPage.jsx`: Added "Scan QR (Camera/File)" modal trigger with automatic payload ingestion, nonce validation, and zero-knowledge pairing verification.
  - Tested: `npm run build` and `npm test` (19/19 passing).

---

## 🏷️ Build 7 (Completed)
- **Tag / ID**: `build-7`
- **Commit**: `2c67323`
- **Timestamp**: `2026-10-24`
- **Description**: Real AI engine (bipartite adversary linkability proof & isolation forest anomaly monitor).
- **Milestone Scope**:
  - `scripts/adversary.py`: Standalone, zero-dependency Python script proving unlinkability mathematically via bipartite correlation graphs and Shannon entropy calculations ($H(X)$). Includes pure Python `IsolationForestClassifier` training and inference (`py scripts/adversary.py`).
  - `src/lib/aiAnomalyEngine.js`: High-performance JavaScript implementation of Isolation Forest (`iTree` recursive partitioning, $c(n)$ factor, anomaly scoring $s(x, n) = 2^{-E(h(x))/c(n)}$) pre-trained on normative city telemetry, plus bipartite linkability simulation.
  - `server/server.js`: Microservice API endpoints added: `POST /api/auditor/simulate-linkability`, `POST /api/auditor/anomaly-detect`, and `GET /api/auditor/telemetry`.
  - `src/lib/apiClient.js`: Frontend API client functions with seamless fallback to client-side engine.
  - `src/pages/AuditorPage.jsx`: Redesigned interactive console featuring strategy selector (Bipartite vs Cosine), 4x4 cross-service correlation heatmaps, live interactive Isolation Forest slider probe with dynamic anomaly gauge and 0.60 threshold line, and Python CLI verification banner.
  - `test/auditor.test.cjs`: Comprehensive test suite verifying tree construction, path lengths, outlier detection, cross-service correlation, and API routes (9/9 passing tests). Total test suite now at 28/28 passing tests.

---

## 🏷️ Build 8 (Completed)
- **Tag / ID**: `build-8`
- **Commit**: `64ee1af`
- **Timestamp**: `2026-10-24`
- **Description**: End-to-end integration hardening, hackathon judge tour, and presentation readiness.
- **Milestone Scope**:
  - `test/e2e.test.cjs`: 7-step comprehensive integration test covering on-chain CeG accreditation, epoch revocation Merkle anchoring, BBS+ issuance, 256-bit challenge nonce lifecycle, ZK selective disclosure pairing verification, Isolation Forest low-risk evaluation, 0.00% linkability proof, and contract Merkle document inclusion (7/7 passing steps).
  - `src/components/JudgeTourBanner.jsx`: Interactive top ribbon guiding hackathon judges through the 4-phase proof pipeline: `/wallet` (Hold & Disclose) $\rightarrow$ `/verifier` (Scan & Verify) $\rightarrow$ `/blockchain` (Audit Trust) $\rightarrow$ `/auditor` (Adversary Proof).
  - `README.md`: Complete presentation-grade repository documentation including architecture flowchart (Mermaid), DPDP Act 2023 statutory alignment, quickstart commands, and build milestone index.
  - Offline Resilience: Zero-configuration client fallback guarantees all features operate seamlessly whether local nodes and backend microservices are running or offline.
  - Total test suite now stands at **35/35 passing tests** across cryptography, smart contracts, backend microservices, AI anomaly models, and end-to-end integration. Production build clean in 6.77s.

---

## 🏷️ Build 9 (Completed)
- **Tag / ID**: `build-9`
- **Timestamp**: `2026-10-24`
- **Description**: Dynamic multi-persona authentication, government on-chain challenge verification, and civic issuer studio.
- **Milestone Scope**:
  - `src/lib/authContext.jsx`: Dynamic multi-persona authentication provider (`AuthProvider`, `useAuth` hook) removing all hardcoded citizen and verifier details.
  - **Persona 1: Citizens / Residents**: Choose pre-seeded profiles or dynamically create custom identities with arbitrary name, DOB, and jurisdiction. Generates a fresh device Ed25519 hardware keypair (`did:key:z6Mk...`) and mints an initial foundational civic identity card saved to encrypted IndexedDB storage.
  - **Persona 2: Government Issuing Bodies**: Authenticate via on-chain DID challenge-response anchored in `IssuerRegistry.sol`. Municipal authorities can also accredit new departments with authentic BLS12-381 G2 keypairs and authorized schemas.
  - **Persona 3: City Verifiers**: Choose from existing kiosks or register brand-new verification terminals under **DPDP Act §6**, defining lawful statutory purpose limitation statements, authorized predicates, and zero-retention policies.
  - `src/pages/LoginPage.jsx`: 3-tab identity and governance portal allowing users to switch roles, verify on-chain challenges, create custom citizen profiles, accredit government authorities, or register new city terminals.
  - `src/pages/IssuerStudioPage.jsx`: Dynamic government minting kiosk where authenticated government bodies digitally sign (BLS12-381 pairing multi-message BBS+) and deliver custom credentials (Transit Passes, Yuva Nidhi, Domicile Certificates, etc.) directly to any citizen recipient DID and encrypted local enclave.
  - `src/components/Navbar.jsx`: Added interactive active persona badge (displaying user name/authority and role) with one-click access to `/login`, and added navigation to `/issuer` when logged in as a government issuer.
  - `src/pages/WalletPage.jsx` & `src/pages/VerifierPage.jsx`: Refactored to dynamically bind holder name, domicile, DID, hardware key, and credentials from `useAuth`, and dynamically populate registered city verifier terminals.
  - `test/auth.test.cjs`: Automated test suite covering resident creation, Ed25519 hardware key derivation, government DID challenge authentication, dynamic BLS12-381 credential issuance, and DPDP Act §6 purpose limitation enforcement (6/6 passing tests).
  - Total test suite now stands at **41/41 passing tests**; clean production build in 5.83s.

---

## 🏷️ Build 10 (Completed)
- **Tag / ID**: `build-10`
- **Timestamp**: `2026-10-24`
- **Description**: Real government authority private key challenge-response verification & smart contract accreditation checking.
- **Milestone Scope**:
  - `src/lib/bbsEngine.js`: Added `privateKeyHex` export, `parseIssuerPrivateKey` (converts hex or scalar to $\mathbb{F}_q$ scalar field), and `deriveIssuerPublicKey` (derives $\mathbb{G}_2$ public curve point via $PK = SK \cdot G_2$).
  - `src/lib/web3Client.js`: Added `checkIssuerAccreditationOnChain` querying `IssuerRegistry.sol` (`isIssuerAccredited`, `getIssuer`).
  - `src/lib/authContext.jsx`: Implemented genuine 5-step government verification pipeline `verifyAndLoginGovIssuer({ issuerId, privateKeyInput, challengeString })`:
    1. Ephemeral 256-bit challenge nonce validation (`generateAuthorityChallenge`).
    2. Authority private key parsing and validation.
    3. BLS12-381 curve challenge signing and bilinear pairing verification (`verifyDirectBbs`).
    4. Keypair ownership verification confirming derived public key matches the target authority's declared public key.
    5. Smart contract accreditation check on `IssuerRegistry.sol` ensuring issuer is active on-chain.
  - `src/pages/LoginPage.jsx`: Built interactive 5-step government verification modal with live challenge display, private key input, demo auto-fill keystore, adversarial key rejection test (proving wrong keys fail), real-time checkmark diagnostics, and dedicated private key copy/export when accrediting new authorities.
  - `test/auth.test.cjs`: Added automated tests for scalar key parsing, public key derivation, 5-step challenge authentication, and strict rejection of adversarial private keys.
  - Total test suite now stands at **43/43 passing tests** across cryptography, contracts, microservices, AI models, and multi-persona authentication. Production build clean in 5.91s.

---

## 🏷️ Build 11 (Completed)
- **Tag / ID**: `build-11`
- **Commit**: `8ab63b5`
- **Timestamp**: `2026-10-24`
- **Description**: Active resident device hardware key binding & full Ed25519 presentation verification.
- **Milestone Scope**:
  - `src/lib/bbsEngine.js`: Added `ensureUint8Array` helper to safely deserialize and reconstruct valid `Uint8Array(32)` Ed25519 private keys from `localStorage` or `IndexedDB` sessions; outputs full 128-character hex signatures and 64-character public keys.
  - `src/lib/cryptoSim.js`: Refactored `deriveBbsProof` to accept `deviceHardwareKey` and `issuerKeyPair`, dynamically binding the presentation proof to the active resident's personal Ed25519 hardware key instead of static fallback `DEFAULT_DEVICE`.
  - `src/pages/WalletPage.jsx`: Updated `handleGenerateProof` to query active session and pass `currentUser.hardwareKey` and `targetIssuer.keyPair`. Updated all QR code renderers (Mobile, Desktop, Fullscreen) to carry `deviceProofRaw` and `devicePublicKey` for live verification.
  - `test/auth.test.cjs`: Added automated tests proving presentations dynamically bind to the active resident's key, pass `ed25519.verify`, and reject tampered or substituted device keys.
  - Total test suite now stands at **44/44 passing tests** across cryptography, contracts, microservices, AI models, and multi-persona authentication. Production build clean in 6.27s.




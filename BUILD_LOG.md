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

## 🏷️ Build 6 (Upcoming)
- **Target**: Resident Wallet Local Storage & Real Transport (QR Scanning).
- **Scope**: IndexedDB encrypted storage, dynamic binary QR code rendering, camera scanner integration (`html5-qrcode`).

---

## 🏷️ Build 7 (Upcoming)
- **Target**: Real AI Engine (Linkability Auditor & Anomaly Monitor).
- **Scope**: Python bipartite graph correlation engine (`adversary.py`), scikit-learn Isolation Forest anomaly pipeline.

---

## 🏷️ Build 8 (Upcoming)
- **Target**: End-to-End Hardening, Offline Mode & Judge Demo Runthrough.
- **Scope**: Full integration test, presentation mode toggle, disaster-recovery offline fallback, and final judge walkthrough.

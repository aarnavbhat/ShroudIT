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
- **Timestamp**: `2026-10-24`
- **Description**: Web3 live on-chain integration in frontend via Ethers.js v6.
- **Milestone Scope**:
  - `src/lib/contractAbis.js`: Clean auto-extracted ABIs for `IssuerRegistry`, `StatusRegistry`, `IssuanceLog`, and `DocumentVerifier`.
  - `src/lib/web3Client.js`: Real Ethers v6 client connecting to local Hardhat node (`http://127.0.0.1:8545`). Queries total accredited issuers, live epoch revocation roots, and issuance batches directly from deployed contract bytecode.
  - `src/pages/BlockchainPage.jsx`: Refactored to query smart contracts on-chain. Added live contract addresses panel, "Advance Epoch on Contract" write transaction, and "Verify on Smart Contract" invocation executing `DocumentVerifier.sol`.
  - Offline Resilience: Graceful fallback with connection status pills so the demo works seamlessly whether the local EVM node is running or offline.
  - Convenience scripts added to `package.json`: `compile`, `test:contracts`, `node:dev`, and `deploy:local`.

---

## 🏷️ Build 4 (Upcoming)
- **Target**: Core Cryptography Engine (Real BBS+ & Device Binding).
- **Scope**: BLS12-381 G2 key generation, multi-attribute BBS+ signing, ZK presentation proof derivation, WebCrypto Ed25519 hardware key binding.

---

## 🏷️ Build 5 (Upcoming)
- **Target**: Backend Microservices (Issuer & Verifier APIs).
- **Scope**: FastAPI/Express backend, 256-bit nonce challenge generation with TTL, OpenID4VP pairing verification endpoint.

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

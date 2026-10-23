# ShroudIT (formerly CivicVeil) — Build & Commit Milestones

This log tracks all project builds for phased GitHub commits during the ChronoForge Hackathon.

---

## 🏷️ Build 1 (Current Checkpoint)
- **Tag / ID**: `build-1`
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

## 🏷️ Build 2 (Upcoming)
- **Target**: Real Smart Contracts & Local Blockchain Deployment (Hardhat/Foundry).
- **Scope**: `IssuerRegistry.sol`, `StatusRegistry.sol`, `IssuanceLog.sol`, deploy scripts, local Hardhat node.

---

## 🏷️ Build 3 (Upcoming)
- **Target**: Backend Services & Real BBS+ Cryptography Engine.
- **Scope**: FastAPI/Node.js backend, real BLS12-381 BBS+ keypair generation, blinded proof verification, Ed25519 device keys.

---

## 🏷️ Build 4 (Upcoming)
- **Target**: Real AI Models & Adversary Graph Engine.
- **Scope**: scikit-learn Isolation Forest pipeline, graph linkability attack engine, live camera QR scanning.

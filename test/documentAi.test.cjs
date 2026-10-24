const { expect } = require("chai");

describe("Government Document Cryptographic Verification & AI Purpose Limitation Suite", function () {
  let govSigner;
  let docAi;
  let sampleDocs;

  before(async function () {
    govSigner = await import("../src/lib/governmentSigner.js");
    docAi = await import("../src/lib/documentAiEngine.js");
    sampleDocs = await import("../src/lib/sampleGovernmentDocs.js");
  });

  describe("1. Government Public Key & Signature Verification", function () {
    it("should match the exact accredited Government Authority public key", function () {
      expect(govSigner.GOV_PUBLIC_KEY_BASE64).to.equal(
        "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAElJT2HV6b1OLXYtD51vqiI/G3qftapiaGGPzy0RYFzDzeukfnDA0SpTxnIOIYbHo3YluzCZZvyBSsxX0eiRMqmA=="
      );
    });

    it("should successfully verify legitimate government-signed documents", async function () {
      const validDoc = sampleDocs.SAMPLE_GOV_DOCUMENTS.find(d => d.id === "doc-low-income");
      expect(validDoc).to.not.be.undefined;

      const result = await govSigner.verifyGovernmentSignature(validDoc.data);
      expect(result.valid).to.equal(true);
      expect(result.algorithm).to.include("ECDSA-P256-SHA256");
      expect(result.publicKey).to.equal(govSigner.GOV_PUBLIC_KEY_BASE64);
      expect(result.issuerAuthority).to.include("Department of Revenue");
    });

    it("should reject and quarantine forged or tampered documents", async function () {
      const forgedDoc = sampleDocs.SAMPLE_GOV_DOCUMENTS.find(d => d.id === "doc-forged-tampered");
      expect(forgedDoc).to.not.be.undefined;

      const result = await govSigner.verifyGovernmentSignature(forgedDoc.data);
      expect(result.valid).to.equal(false);
      expect(result.reason).to.be.a("string").with.lengthOf.at.least(5);
    });

    it("should reject unsigned documents missing cryptographic seals", async function () {
      const unsignedDoc = {
        title: "Random Plain Text Document",
        issuedTo: "Unknown User",
        income: 50000
      };

      const result = await govSigner.verifyGovernmentSignature(unsignedDoc);
      expect(result.valid).to.equal(false);
      expect(result.reason).to.include("signature");
    });
  });

  describe("2. AI Purpose Limitation: Income > ₹3,00,000 Disqualification Rule", function () {
    it("STRICT RULE: if income > 3 Lakhs, user is NOT allowed to select 'income_below_3L'", function () {
      const highIncomeDoc = sampleDocs.SAMPLE_GOV_DOCUMENTS.find(d => d.id === "doc-high-income");
      expect(highIncomeDoc).to.not.be.undefined;

      const verificationMeta = {
        valid: true,
        issuerAuthority: "Department of Revenue & Social Welfare, Govt of Karnataka",
        verifiedAt: new Date().toISOString()
      };

      const credential = docAi.analyzeDocumentAndGenerateCredential({
        document: highIncomeDoc.data,
        verificationMeta
      });

      // Heading must describe what the file is
      expect(credential.title).to.equal("Verified Government Income & Asset Certificate");

      // Extract generated predicate IDs
      const predicateIds = credential.predicates.map(p => p.id);

      // Must NOT include income_below_3L
      expect(predicateIds).to.not.include("income_below_3L");

      // Must NOT include welfare_eligible
      expect(predicateIds).to.not.include("welfare_eligible");

      // Must explicitly record income_below_3L as disqualified in AI audit report
      const disqualifiedIds = credential.aiAuditReport.disqualifiedCategories.map(d => d.id);
      expect(disqualifiedIds).to.include("income_below_3L");
      expect(disqualifiedIds).to.include("welfare_eligible");

      // Only granted categories they ARE eligible for
      expect(predicateIds).to.include("income_tax_assessed");
      expect(predicateIds).to.include("karnataka_domicile");
    });

    it("should permit 'income_below_3L' when verified income is <= ₹3,00,000", function () {
      const lowIncomeDoc = sampleDocs.SAMPLE_GOV_DOCUMENTS.find(d => d.id === "doc-low-income");
      expect(lowIncomeDoc).to.not.be.undefined;

      const verificationMeta = {
        valid: true,
        issuerAuthority: "Department of Revenue & Social Welfare, Govt of Karnataka",
        verifiedAt: new Date().toISOString()
      };

      const credential = docAi.analyzeDocumentAndGenerateCredential({
        document: lowIncomeDoc.data,
        verificationMeta
      });

      const predicateIds = credential.predicates.map(p => p.id);

      // Must include income_below_3L and welfare_eligible
      expect(predicateIds).to.include("income_below_3L");
      expect(predicateIds).to.include("welfare_eligible");

      // Disqualified list should NOT contain income_below_3L
      const disqualifiedIds = credential.aiAuditReport.disqualifiedCategories.map(d => d.id);
      expect(disqualifiedIds).to.not.include("income_below_3L");
    });

    it("should correctly parse income in Lakhs, Lacs, and plain numeric formats", function () {
      expect(docAi.extractAnnualIncome({ annualIncome: 450000 })).to.equal(450000);
      expect(docAi.extractAnnualIncome({ text: "Annual family income is 4.5 Lakhs" })).to.equal(450000);
      expect(docAi.extractAnnualIncome({ text: "Gross CTC 2.4 lacs per annum" })).to.equal(240000);
      expect(docAi.extractAnnualIncome({ text: "Total income: ₹180000" })).to.equal(180000);
    });
  });

  describe("3. AI Purpose Limitation: Student & Skills Categorization", function () {
    it("should generate student transit concession predicates for student passes", function () {
      const studentDoc = sampleDocs.SAMPLE_GOV_DOCUMENTS.find(d => d.id === "doc-student-transit");
      expect(studentDoc).to.not.be.undefined;

      const credential = docAi.analyzeDocumentAndGenerateCredential({
        document: studentDoc.data,
        verificationMeta: { valid: true }
      });

      expect(credential.title).to.equal("Verified Student Concession & Transit Pass");
      const predicateIds = credential.predicates.map(p => p.id);
      expect(predicateIds).to.include("valid_student");
      expect(predicateIds).to.include("tier1_concession");
    });

    it("should generate accredited cybersecurity predicates for technical certificates", function () {
      const cyberDoc = sampleDocs.SAMPLE_GOV_DOCUMENTS.find(d => d.id === "doc-kdem-cyber");
      expect(cyberDoc).to.not.be.undefined;

      const credential = docAi.analyzeDocumentAndGenerateCredential({
        document: cyberDoc.data,
        verificationMeta: { valid: true }
      });

      expect(credential.title).to.equal("Verified Technical Skill & Cybersecurity Accreditation");
      const predicateIds = credential.predicates.map(p => p.id);
      expect(predicateIds).to.include("certified_analyst");
      expect(predicateIds).to.include("cert_valid_2026");
    });

    it("should suppress adult access categories when age is under 18", function () {
      const minorDoc = {
        title: "Minor Birth Certificate",
        dob: "2010-06-15", // 16 years old
        domicile: "Bengaluru Urban, Karnataka"
      };

      const credential = docAi.analyzeDocumentAndGenerateCredential({
        document: minorDoc,
        verificationMeta: { valid: true }
      });

      const predicateIds = credential.predicates.map(p => p.id);
      expect(predicateIds).to.not.include("over_18");
      expect(predicateIds).to.include("minor_resident");

      const disqualifiedIds = credential.aiAuditReport.disqualifiedCategories.map(d => d.id);
      expect(disqualifiedIds).to.include("over_18");
    });
  });

  describe("4. Raw (r, s) to ASN.1 DER Signature Conversion & Verification", function () {
    it("should convert a raw (r, s) object to valid ASN.1 DER format", function () {
      const rawObj = {
        r: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
        s: "0x2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d"
      };

      const derBytes = govSigner.rawRsToDer(rawObj);
      expect(derBytes).to.be.an.instanceOf(Uint8Array);
      // DER sequence begins with tag 0x30
      expect(derBytes[0]).to.equal(0x30);
      // First integer tag 0x02
      expect(derBytes[2]).to.equal(0x02);
      expect(derBytes.length).to.be.at.least(70).and.at.most(73);
    });

    it("should prepend 0x00 when integer has high bit set (>= 0x80) to preserve non-negative DER encoding", function () {
      // 0x95 has high bit set (0x95 >= 0x80)
      const highR = new Uint8Array(32);
      highR.fill(0x95);
      const lowS = new Uint8Array(32);
      lowS.fill(0x15);

      const der = govSigner.rawRsToDer(highR, lowS);
      expect(der[0]).to.equal(0x30);
      expect(der[2]).to.equal(0x02);
      // r should have length 33 (0x21) because leading 0x00 is added
      expect(der[3]).to.equal(33);
      expect(der[4]).to.equal(0x00);
      expect(der[5]).to.equal(0x95);
    });

    it("should convert raw 64-byte hex and base64 strings to ASN.1 DER", function () {
      const raw64Hex = "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d";
      const derFromHex = govSigner.rawRsToDer(raw64Hex);
      expect(derFromHex).to.be.an.instanceOf(Uint8Array);
      expect(derFromHex[0]).to.equal(0x30);

      // Convert DER back to P1363 (64 bytes)
      const p1363 = govSigner.derToP1363(derFromHex);
      expect(p1363.length).to.equal(64);
    });

    it("should preserve already DER-encoded signatures", function () {
      const raw64Hex = "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d";
      const der1 = govSigner.rawRsToDer(raw64Hex);
      const der2 = govSigner.rawRsToDer(der1);
      expect(der2.length).to.equal(der1.length);
      expect(der2[0]).to.equal(0x30);
    });
  });
});

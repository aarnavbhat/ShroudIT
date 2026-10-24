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
});

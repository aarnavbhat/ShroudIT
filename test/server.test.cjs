const { expect } = require("chai");
const http = require("http");

describe("ShroudIT Backend Microservices API", function () {
  let app;
  let server;
  let baseUrl;
  let bbs;

  before(async function () {
    const serverModule = await import("../server/server.js");
    bbs = await import("../src/lib/bbsEngine.js");
    app = serverModule.default;

    // Start ephemeral test server on random port
    await new Promise((resolve) => {
      server = app.listen(0, () => {
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
        headers: {
          "Content-Type": "application/json"
        }
      };

      const req = http.request(url, options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({
              statusCode: res.statusCode,
              body: JSON.parse(data)
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              raw: data
            });
          }
        });
      });

      req.on("error", reject);
      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  it("1. GET /api/health should return service health", async function () {
    const res = await makeRequest("GET", "/api/health");
    expect(res.statusCode).to.equal(200);
    expect(res.body.status).to.equal("healthy");
    expect(res.body.service).to.equal("ShroudIT Backend API");
  });

  it("2. POST /api/issuer/issue should issue a real BLS12-381 signed civic credential", async function () {
    const payload = {
      issuerDid: "did:shroud:gov-karnataka-ceg",
      holderDid: "did:key:z6Mku7X...89p",
      credentialType: "KarnatakaResidentCard",
      attributes: [
        "Aarav S. Rao",
        "2003-08-14",
        "over_18:true",
        "resident_blr:true"
      ]
    };

    const res = await makeRequest("POST", "/api/issuer/issue", payload);
    expect(res.statusCode).to.equal(201);
    expect(res.body.success).to.equal(true);
    expect(res.body.credential.bbsSignature.A_hex).to.be.a("string");
    expect(res.body.credential.issuerDid).to.equal("did:shroud:gov-karnataka-ceg");
  });

  it("3. GET /api/verifier/challenge should generate 256-bit ephemeral nonce with 180s TTL", async function () {
    const res = await makeRequest("GET", "/api/verifier/challenge?verifierDid=did:shroud:verifier-blr-library");
    expect(res.statusCode).to.equal(200);
    expect(res.body.nonce).to.match(/^0x[a-f0-9]{64}$/i);
    expect(res.body.ttlSeconds).to.equal(180);
    expect(res.body.verifierDid).to.equal("did:shroud:verifier-blr-library");
  });

  it("4. End-to-End: Issue -> Challenge -> Derive ZK Proof -> Verify with 0 PII", async function () {
    // A. Issue credential
    const issueRes = await makeRequest("POST", "/api/issuer/issue", {
      issuerDid: "did:shroud:gov-karnataka-ceg",
      attributes: ["Aarav S. Rao", "2003-08-14", "over_18:true", "resident_blr:true"]
    });
    const cred = issueRes.body.credential;

    // B. Get active session challenge nonce from Verifier Kiosk
    const challengeRes = await makeRequest("GET", "/api/verifier/challenge?verifierDid=did:shroud:verifier-blr-library");
    const nonce = challengeRes.body.nonce;
    const verifierDid = challengeRes.body.verifierDid;

    // C. Derive client-side ZK proof (reveals ONLY over_18 and resident_blr)
    const { bls12_381 } = await import("@noble/curves/bls12-381.js");
    const A_point = bls12_381.G1.Point.fromHex(cred.bbsSignature.A_hex);
    const signature = {
      A: A_point,
      e: BigInt("0x" + cred.bbsSignature.e),
      s: BigInt("0x" + cred.bbsSignature.s)
    };

    const proof = bbs.deriveBbsPresentationProof({
      signature,
      messages: cred.attributes,
      revealedIndices: [2, 3], // Only booleans
      nonce,
      verifierDid
    });

    proof.issuerDid = cred.issuerDid;

    // D. Submit presentation proof to verifier API
    const verifyRes = await makeRequest("POST", "/api/verifier/verify", {
      proof,
      expectedNonce: nonce,
      verifierDid
    });

    expect(verifyRes.statusCode).to.equal(200);
    expect(verifyRes.body.valid).to.equal(true);
    expect(verifyRes.body.zeroPiiLeaked).to.equal(true);
    expect(verifyRes.body.antiReplayNonceConsumed).to.equal(true);
    expect(verifyRes.body.revealedAttributes).to.have.lengthOf(2);
  });

  it("5. Security Test: Replay attack blocked if nonce is reused", async function () {
    // Get challenge
    const challengeRes = await makeRequest("GET", "/api/verifier/challenge?verifierDid=did:shroud:verifier-test");
    const nonce = challengeRes.body.nonce;

    const mockProof = {
      A_prime_hex: "97f1d3a73197d7942695638c4fa9ac0fc3688c4f9774b905a14e3a3f171bac586c55e83ff97a1aeffb3af00adb22c6bb",
      nonce,
      verifierDid: "did:shroud:verifier-test",
      revealedValues: [],
      hiddenCount: 2
    };

    // First attempt consumes nonce (fails on curve math or consumes)
    await makeRequest("POST", "/api/verifier/verify", {
      proof: mockProof,
      expectedNonce: nonce,
      verifierDid: "did:shroud:verifier-test"
    });

    // Second attempt MUST be rejected with replay attack blocked
    const replayRes = await makeRequest("POST", "/api/verifier/verify", {
      proof: mockProof,
      expectedNonce: nonce,
      verifierDid: "did:shroud:verifier-test"
    });

    expect(replayRes.statusCode).to.equal(403);
    expect(replayRes.body.reason).to.include("REPLAY ATTACK BLOCKED");
  });
});

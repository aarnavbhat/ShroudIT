const { expect } = require("chai");
const http = require("http");

describe("ShroudIT AI Linkability Auditor & Anomaly Engine", function () {
  let aiEngine;
  let serverApp;
  let server;
  let baseUrl;

  before(async function () {
    aiEngine = await import("../src/lib/aiAnomalyEngine.js");
    const serverModule = await import("../server/server.js");
    serverApp = serverModule.default;

    // Start ephemeral test server on random port
    await new Promise((resolve) => {
      server = serverApp.listen(0, () => {
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
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
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

  describe("1. Isolation Forest Model & Telemetry Anomaly Detection", function () {
    it("should train Isolation Forest and compute mathematical path lengths", function () {
      const forest = new aiEngine.IsolationForestClassifier(40, 32);
      const trainingData = [
        [5.0, 1.0, 10.0, 0.0, 0.05],
        [6.0, 1.0, 12.0, 0.0, 0.08],
        [4.0, 2.0, 8.0, 0.0, 0.04],
        [7.0, 1.0, 15.0, 0.0, 0.06]
      ];
      forest.fit(trainingData);

      expect(forest.trees.length).to.equal(40);
      const score = forest.scoreSample([5.0, 1.0, 10.0, 0.0, 0.05]);
      expect(score).to.be.a("number");
      expect(score).to.be.within(0.0, 1.0);
    });

    it("should detect Silent Mass Issuance / Burst as critical anomaly (Score >= 0.60)", function () {
      // Vector: [140 req/min, 1 attr, 4s nonce, unregistered DID: 1, burst: 0.95]
      const attackVector = [140.0, 1.0, 4.0, 1.0, 0.95];
      const evaluation = aiEngine.evaluateTelemetryVector(attackVector);

      expect(evaluation.score).to.be.at.least(0.60);
      expect(evaluation.isAnomaly).to.be.true;
      expect(["CRITICAL", "MEDIUM"]).to.include(evaluation.riskLevel);
    });

    it("should detect DPDP §6 Over-Asking Violation (requesting 9 personal attributes)", function () {
      // Vector: [3 req/min, 9 attributes demanded, 12s nonce, registered DID: 0, burst: 0.1]
      const overAskingVector = [3.0, 9.0, 12.0, 0.0, 0.1];
      const evaluation = aiEngine.evaluateTelemetryVector(overAskingVector);

      expect(evaluation.score).to.be.at.least(0.60);
      expect(evaluation.isAnomaly).to.be.true;
    });

    it("should clear legitimate smart city turnstile verification as healthy (Score < 0.60)", function () {
      // Vector: [5 req/min, 1 predicate, 6s nonce, registered DID: 0, burst: 0.05]
      const normalVector = [5.0, 1.0, 6.0, 0.0, 0.05];
      const evaluation = aiEngine.evaluateTelemetryVector(normalVector);

      expect(evaluation.score).to.be.below(0.60);
      expect(evaluation.isAnomaly).to.be.false;
      expect(evaluation.riskLevel).to.equal("LOW");
    });
  });

  describe("2. Bipartite Cross-Service Linkability Simulation", function () {
    it("should mathematically prove 100% linkability on legacy SD-JWT vs 0.00% on ShroudIT", function () {
      const sim = aiEngine.simulateCrossServiceLinkability({
        numResidents: 6,
        numServices: 4,
        strategy: "collusion_graph"
      });

      expect(sim.baseline.linkabilityPct).to.equal(100.0);
      expect(sim.baseline.linkedPairs).to.equal(18); // 6 residents * 3 pairs
      expect(sim.baseline.entropyScore).to.be.below(0.10);

      expect(sim.shroudit.linkabilityPct).to.equal(0.00);
      expect(sim.shroudit.linkedPairs).to.equal(0);
      expect(sim.shroudit.entropyScore).to.be.above(0.90);
    });

    it("should compute cross-service correlation matrices for adversarial inspection", function () {
      const sim = aiEngine.simulateCrossServiceLinkability({ numResidents: 4, numServices: 4 });

      // Baseline has 1.0 cross-service correlation
      expect(sim.baseline.correlationMatrix[0][1]).to.equal(1.0);
      // ShroudIT has 0.0 cross-service correlation
      expect(sim.shroudit.correlationMatrix[0][1]).to.equal(0.0);
    });
  });

  describe("3. Backend Auditor API Endpoints", function () {
    it("POST /api/auditor/simulate-linkability should return correlation benchmarks", async function () {
      const res = await makeRequest("POST", "/api/auditor/simulate-linkability", {
        numResidents: 5,
        numServices: 3
      });

      expect(res.status).to.equal(200);
      expect(res.body.baseline.linkabilityPct).to.equal(100.0);
      expect(res.body.shroudit.linkabilityPct).to.equal(0.00);
    });

    it("POST /api/auditor/anomaly-detect should score incoming telemetry vectors", async function () {
      const res = await makeRequest("POST", "/api/auditor/anomaly-detect", {
        vector: [120.0, 1.0, 5.0, 1.0, 0.9]
      });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("score");
      expect(res.body).to.have.property("isAnomaly");
      expect(res.body.score).to.be.at.least(0.60);
    });

    it("GET /api/auditor/telemetry should return live event stream with anomaly flags", async function () {
      const res = await makeRequest("GET", "/api/auditor/telemetry");

      expect(res.status).to.equal(200);
      expect(res.body.telemetry).to.be.an("array");
      expect(res.body.telemetry.length).to.be.at.least(4);
    });
  });
});

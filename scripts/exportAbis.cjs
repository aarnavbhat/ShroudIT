const fs = require("fs");
const path = require("path");

const contracts = ["IssuerRegistry", "StatusRegistry", "IssuanceLog", "DocumentVerifier"];
const abis = {};

for (const name of contracts) {
  const p = path.join(__dirname, "../artifacts/contracts", `${name}.sol`, `${name}.json`);
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  abis[name] = data.abi;
}

const outContent = `// Auto-generated clean contract ABIs for ShroudIT Web3 client
export const CONTRACT_ABIS = ${JSON.stringify(abis, null, 2)};
`;

const dest = path.join(__dirname, "../src/lib/contractAbis.js");
fs.writeFileSync(dest, outContent);
console.log(`✓ Clean ABIs exported to: ${dest}`);

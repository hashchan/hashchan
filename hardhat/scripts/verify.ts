import hre from "hardhat";
import { resolveConfig } from "rocketh";
import { run } from "@rocketh/verifier";
import { config } from "../rocketh/config.js";
import { verifiers } from "../rocketh/verifiers.js";

// Submits whatever's recorded in deployments/<network>/ for verification on
// that network's block explorer - reads the deployment metadata (address,
// constructor args, source) already written by a real
// `hardhat deploy --network <network>` run.
// Run: `pnpm hardhat run scripts/verify.ts --network <network>`
const networkName = hre.globalOptions.network;
const getVerifier = verifiers[networkName];
if (!getVerifier) {
  throw new Error(`No verifier configured for network "${networkName}"`);
}

await run(resolveConfig(config), networkName, {
  verifier: getVerifier(),
  logErrorOnFailure: true,
});

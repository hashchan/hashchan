import type { VerificationOptions } from "@rocketh/verifier";

type VerifierConfig = VerificationOptions["verifier"];

// None of the contracts declare an SPDX-License-Identifier, so the etherscan
// submitter can't auto-detect one from source and refuses to submit without
// this. Passed explicitly rather than added to source.
const NO_SPDX_LICENSE = "UNLICENSED";

// Etherscan's V2 API is unified across chains: one API key, keyed by
// chainId, covers every chain it lists (mainnet, sepolia, polygon,
// optimism, base, arbitrum, fantom, avalanche, ...).
function etherscanV2(): VerifierConfig {
  const apiKey = process.env.ETHERSCAN;
  if (!apiKey) {
    throw new Error("Missing required environment variable: ETHERSCAN");
  }
  return { type: "etherscan", apiKey, license: NO_SPDX_LICENSE };
}

// These chains aren't on Etherscan's unified V2 API. Their explorers expose
// an Etherscan-compatible ("?module=contract&action=...") API at /api - the
// same shape hardhat-old drove through hardhat-verify's `customChains`. This
// is a different route/response shape than Blockscout's own REST v2 API
// (`/api/v2/smart-contracts/{address}/...`), so these use `type: "etherscan"`
// with a custom endpoint, not `type: "blockscout"`.
function etherscanCompatible(endpoint: string): () => VerifierConfig {
  return () => ({ type: "etherscan", endpoint, license: NO_SPDX_LICENSE });
}

export const verifiers: Record<string, () => VerifierConfig> = {
  mainnet: etherscanV2,
  sepolia: etherscanV2,
  polygon: etherscanV2,
  avalanche: etherscanV2,
  optimism: etherscanV2,
  "optimism-sepolia": etherscanV2,
  base: etherscanV2,
  "base-sepolia": etherscanV2,
  fantom: etherscanV2,
  "arbitrum-one": etherscanV2,
  "arbitrum-nova": etherscanV2,
  "arbitrum-sepolia": etherscanV2,
  classic: etherscanCompatible("https://etc.blockscout.com/api"),
  flow: etherscanCompatible("https://evm.flowscan.io/api"),
  "flow-testnet": etherscanCompatible("https://evm-testnet.flowscan.io/api"),
  fluent: etherscanCompatible("https://api.fluentscan.xyz/api"),
};

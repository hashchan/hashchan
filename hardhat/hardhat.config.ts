import "dotenv/config";
import { defineConfig } from "hardhat/config";
import hardhatNodeTestRunnerPlugin from "@nomicfoundation/hardhat-node-test-runner";
import hardhatKeyStorePlugin from "@nomicfoundation/hardhat-keystore";
import hardhatNetworkHelpersPlugin from "@nomicfoundation/hardhat-network-helpers";
import hardhatViemPlugin from "@nomicfoundation/hardhat-viem";
import hardhatViemAssertionsPlugin from "@nomicfoundation/hardhat-viem-assertions";
import HardhatDeploy from "hardhat-deploy";

const mnemonic = process.env.MNEMONIC;

export default defineConfig({
  plugins: [
    hardhatNodeTestRunnerPlugin,
    hardhatKeyStorePlugin,
    hardhatNetworkHelpersPlugin,
    HardhatDeploy,
    hardhatViemPlugin,
    hardhatViemAssertionsPlugin
  ],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    localhost: {
      type: "http",
      chainType: "l1",
      url: "http://127.0.0.1:8545",
    },
    classic: {
      type: "http",
      chainType: "l1",
      url: `https://etc.rpc.rivet.cloud/${process.env.ETC}`,
        chainId: 61,
      accounts: { mnemonic },
    },
    mainnet: {
      type: "http",
      chainType: "l1",
      url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY}`,
        chainId: 1,
      accounts: { mnemonic },
    },
    polygon: {
      type: "http",
      chainType: "l1",
      url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY}`,
        chainId: 137,
      accounts: { mnemonic },
    },
    avalanche: {
      type: "http",
      chainType: "l1",
      url: `https://avax-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY}`,
        chainId: 43114,
      accounts: { mnemonic },
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY}`,
        chainId: 11155111,
      accounts: { mnemonic },
    },
    "optimism-sepolia": {
      type: "http",
      chainType: "op",
      url: `https://optimism-sepolia.infura.io/v3/${process.env.INFURA}`,
        chainId: 11155420,
      accounts: { mnemonic },
    },
    optimism: {
      type: "http",
      chainType: "op",
      url: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY}`,
        chainId: 10,
      accounts: { mnemonic },
    },
    fantom: {
      type: "http",
      chainType: "l1",
      url: `https://fantom-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY}`,
        chainId: 250,
      accounts: { mnemonic },
    },
    base: {
      type: "http",
      chainType: "op",
      url: `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY}`,
        chainId: 8453,
      accounts: { mnemonic },
    },
    filecoin: {
      type: "http",
      chainType: "l1",
      url: `https://rpc.ankr.com/filecoin/${process.env.ANKR}`,
        chainId: 314,
      accounts: { mnemonic },
    },
    flow: {
      type: "http",
      chainType: "l1",
      url: `https://mainnet.evm.nodes.onflow.org`,
        chainId: 747,
      accounts: { mnemonic },
    },
    "flow-testnet": {
      type: "http",
      chainType: "l1",
      url: `https://flow-testnet.g.alchemy.com/v2/${process.env.ALCHEMY}`,
        chainId: 545,
      accounts: { mnemonic },
    },
    "base-sepolia": {
      type: "http",
      chainType: "op",
      url: `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY}`,
        chainId: 84532,
      accounts: { mnemonic },
    },
    "arbitrum-sepolia": {
      type: "http",
      chainType: "l1",
      url: `https://arb-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY}`,
        chainId: 421614,
      accounts: { mnemonic },
    },
    "arbitrum-one": {
      type: "http",
      chainType: "l1",
      url: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY}`,
        chainId: 42161,
      accounts: { mnemonic },
    },
    "arbitrum-nova": {
      type: "http",
      chainType: "l1",
      url: `https://arbnova-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY}`,
        chainId: 42170,
      accounts: { mnemonic },
    },
    fluent: {
      type: "http",
      chainType: "l1",
      url: `https://rpc.fluent.xyz/`,
        chainId: 25363,
      accounts: { mnemonic },
    },
    gnosis: {
      type: 'http',
      chainType: 'l1',
      url: `https://rpc.ankr.com/gnosis/${process.env.ANKR}`,
        chainId: 100,
      accounts: { mnemonic },
    }
  },
});

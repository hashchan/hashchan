import 'dotenv/config';
import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-verify";

const config: HardhatUserConfig = {
  solidity: "0.8.26",
  networks: {
    hardhat:{
      accounts: {
        mnemonic: process.env.MNEMONIC
      }
    },
    sepolia: {
      url: process.env.INFURA,
      chainId: 11155111,
      accounts: {
        mnemonic: process.env.MNEMONIC

      }
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN
  }
};

export default config;

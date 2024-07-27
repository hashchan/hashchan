import 'dotenv/config';
import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

const config: HardhatUserConfig = {
  solidity: "0.8.26",
  networks: {
    hardhat:{
      accounts: {
        mnemonic: process.env.MNEMONIC
      }
    }
  }
};

export default config;

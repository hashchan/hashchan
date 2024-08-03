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
      url: `https://sepolia.infura.io/v3/${process.env.INFURA}`,
      chainId: 11155111,
      accounts: {
        mnemonic: process.env.MNEMONIC

      }
    },
    'optimism-sepolia': {
      url: `https://optimism-sepolia.infura.io/v3/${process.env.INFURA}`,
      chainId: 11155420,
      accounts: {
        mnemonic: process.env.MNEMONIC

      }
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN,
      'optimism-sepolia': process.env.BLOCKSCOUT
    },
    customChains: [
      {
        network: "optimism-sepolia",
        chainId: 11155420,
        urls: {
          apiURL: "https://optimism-sepolia.blockscout.com/api",
          browserURL: "https://optimism-sepolia.blockscout.com",
        }
      }
    ]
  },
  sourcify: {
    enabled: true
  }

};

export default config;

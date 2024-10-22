import 'dotenv/config';
import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-verify";

const config: HardhatUserConfig = {
  solidity: "0.8.26",
  networks: {
    hardhat:{
      chainId: 31337,
      accounts: {
        mnemonic: process.env.MNEMONIC
      }
    },
    classic: {
      url:`https://etc.rpc.rivet.cloud/${process.env.ETC}`,
      chainId: 61,
      accounts: {
        mnemonic: process.env.MNEMONIC
      }
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA}`,
      chainId: 1,
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
    optimism: {
      url: `https://optimism-mainnet.infura.io/v3/${process.env.INFURA}`,
      chainId: 10,
      accounts: {
        mnemonic: process.env.MNEMONIC
      }
    },
    fantom: {
      url: `https://fantom-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY}`,
      chainId: 250,
      accounts: {
        mnemonic: process.env.MNEMONIC
      }
    }
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN,
      sepolia: process.env.ETHERSCAN,
      'optimism-sepolia': process.env.BLOCKSCOUT,
      fantom: process.env.FTMSCAN
    },
    customChains: [
      {
        network: "optimism-sepolia",
        chainId: 11155420,
        urls: {
          apiURL: "https://optimism-sepolia.blockscout.com/api",
          browserURL: "https://optimism-sepolia.blockscout.com",
        }
      },
      {
        network: "fantom",
        chainId: 250,
        urls: {
          apiURL: "https://api.ftmscan.com/api",
          browserURL: "https://ftmscan.com",
        }
      }
    ]
  },
  sourcify: {
    enabled: true
  }

};

export default config;

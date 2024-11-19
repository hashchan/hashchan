import 'dotenv/config';
import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-verify";
import "@nomicfoundation/hardhat-ignition-viem";

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
      url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY}`,
      chainId: 1,
      accounts: {
        mnemonic: process.env.MNEMONIC
      }
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY}`,
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
      url: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY}`,
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
    },
    base: {
      url: `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY}`,
      chainId: 8453,
      accounts: {
        mnemonic: process.env.MNEMONIC
      }
    },
    flow: {
      //url: `https://flow-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY}`,
      url: `https://mainnet.evm.nodes.onflow.org`,
      chainId: 747,
      ignition: {
        gasPrice: 100000n,
      },
      accounts: {
        mnemonic: process.env.MNEMONIC
      }
    },
    'flow-testnet': {
      url: `https://flow-testnet.g.alchemy.com/v2/${process.env.ALCHEMY}`,
      chainId: 545,
      ignition: {
        gasPrice: 10000n,
      },
      gasPrice: 10000,
      accounts: {
        mnemonic: process.env.MNEMONIC
      }
    },
    'base-sepolia': {
      url: `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY}`,
      chainId: 84532,
      accounts: {
        mnemonic: process.env.MNEMONIC
      }
    },
    'arbitrum-sepolia': {
      url: `https://arb-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY}`,
      chainId: 421614,
      accounts: {
        mnemonic: process.env.MNEMONIC
      }
    },
    'arbitrum-one': {
      url: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY}`,
      chainId: 42161,
      accounts: {
        mnemonic: process.env.MNEMONIC
      }
    },
    'arbitrum-nova': {
      url: `https://arbnova-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY}`,
      chainId: 42170,
      accounts: {
        mnemonic: process.env.MNEMONIC
      }
    }
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN || '',
      sepolia: process.env.ETHERSCAN || '',
      'optimism-sepolia': process.env.BLOCKSCOUT || '',
      fantom: process.env.FTMSCAN || '',
      base: process.env.BASESCAN || '',
      baseSepolia: process.env.BASESCAN || '',
      'arbitrum-sepolia': process.env.ARBISCAN || '',
      'arbitrum-one': process.env.ARBISCAN || '',
      'arbitrum-nova': process.env.ARBINOVASCAN || '',
      flow: 'nokey',
      'flow-testnet': 'nokey'
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
      },
      {
        network: "arbitrum-sepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io/",
        }
      },
      {
        network: "arbitrum-one",
        chainId: 42161,
        urls: {
          apiURL: "https://api.arbiscan.io/api",
          browserURL: "https://arbiscan.io/",
        }
      },
      {
        network: "arbitrum-nova",
        chainId: 42170,
        urls: {
          apiURL: "https://api-nova.arbiscan.io/api",
          browserURL: "https://arbiscan.io/",
        }
      },
			{
        network: "flow-testnet",
        chainId: 545,
        urls: {
          apiURL: "https://evm-testnet.flowscan.io/api",
          browserURL: "https://evm-testnet.flowscan.io/",
        }
      },
			{
        network: 'flow',
        chainId: 747,
        urls: {
          apiURL: "https://evm.flowscan.io/api",
          browserURL: "https://evm.flowscan.io/",
        }
      }
    ]
  },
  sourcify: {
    enabled: true
  }

};

export default config;

import { defineEventHandler } from 'h3';

// GET /api/networks
export default defineEventHandler(() => {
  return {
    networks: {
      // Sepolia testnet
      '0xaa36a7': {
        name: 'Sepolia',
        rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/',
        explorer: 'https://sepolia.etherscan.io',
        chainId: '0xaa36a7',
        nativeCurrency: {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18
        }
      },
      // Goerli testnet
      '0x5': {
        name: 'Goerli',
        rpcUrl: process.env.GOERLI_RPC_URL || 'https://goerli.infura.io/v3/',
        explorer: 'https://goerli.etherscan.io',
        chainId: '0x5',
        nativeCurrency: {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18
        }
      },
      // Mumbai testnet (Polygon)
      '0x13881': {
        name: 'Mumbai',
        rpcUrl: process.env.MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
        explorer: 'https://mumbai.polygonscan.com',
        chainId: '0x13881',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18
        }
      }
    },
    defaultNetwork: '0xaa36a7' // Sepolia
  };
}); 
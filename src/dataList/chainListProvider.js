export const avalancheChain = {
    id: 43114,
    name: 'Avalanche',
    network: 'avalanche',
    nativeCurrency: {
      decimals: 18,
      name: 'Avalanche',
      symbol: 'AVAX',
    },
    rpcUrls: {
      default: 'https://api.avax.network/ext/bc/C/rpc',
    },
    blockExplorers: {
      default: { name: 'SnowTrace', url: 'https://snowtrace.io' },
    },
    testnet: false,
  }
  
export const fantomChain = {
    id: 250,
    name: 'Fantom Opera',
    network: 'fantom',
    nativeCurrency: {
      decimals: 18,
      name: 'Fantom',
      symbol: 'FTM',
    },
    rpcUrls: {
      default: 'https://rpcapi.fantom.network',
    },
    blockExplorers: {
      default: { name: 'FTMScan', url: 'https://ftmscan.com/' },
    },
    testnet: false,
  }
  
export const bscChain = {
    id: 56,
    name: 'Binance Smart Chain',
    network: 'bsc',
    nativeCurrency: {
      decimals: 18,
      name: 'bnb',
      symbol: 'BNB',
    },
    rpcUrls: {
      default: 'https://binance.nodereal.io',
    },
    blockExplorers: {
      default: { name: 'BSCScan', url: 'https://bscscan.com/' },
    },
    testnet: false,
  }
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: true,
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  app: {
    head: {
      title: 'Mindfulness dAPP',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { hid: 'description', name: 'description', content: 'A decentralized application for voting on wellness professionals' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap' }
      ]
    }
  },
  runtimeConfig: {
    // Server-side environment variables
    dbPath: process.env.DB_PATH || './database.sqlite',
    infuraProjectId: process.env.INFURA_PROJECT_ID,
    privateKey: process.env.PRIVATE_KEY,
    contractAddress: process.env.CONTRACT_ADDRESS,
    sepoliaRpcUrl: process.env.SEPOLIA_RPC_URL,
    goerliRpcUrl: process.env.GOERLI_RPC_URL,
    mumbaiRpcUrl: process.env.MUMBAI_RPC_URL,
    defaultNetwork: process.env.DEFAULT_NETWORK || 'sepolia',
    
    // Public keys that are exposed to the client
    public: {
      apiBase: process.env.API_BASE || ''
    }
  },
  nitro: {
    // Server middleware configuration
    routeRules: {
      '/api/**': { cors: true }
    }
  }
}) 
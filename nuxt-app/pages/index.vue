<template>
  <div class="min-h-screen bg-black text-white">
    <header class="bg-green-600 p-4 text-center fixed w-full top-0 z-10 shadow-md">
      <div class="flex items-center justify-center">
        <img src="/logo.png" alt="Logo" class="h-10 mr-2">
        <h1 class="text-xl font-bold">Mindfulness dAPP</h1>
      </div>
    </header>

    <main class="pt-20 max-w-4xl mx-auto px-4 pb-20">
      <div class="bg-black border border-gray-800 rounded-lg p-6 shadow-lg">
        <section class="mb-8">
          <h2 class="text-2xl font-bold mb-4">Wellness Professionals</h2>
          <div v-if="loading" class="flex justify-center">
            <div class="loading-spinner"></div>
          </div>
          <ul v-else-if="profiles.length > 0" class="space-y-4">
            <li v-for="professional in profiles" :key="professional.address" class="border border-gray-800 rounded-lg p-4">
              <div class="flex flex-col md:flex-row md:items-center justify-between">
                <div class="mb-4 md:mb-0">
                  <h3 class="text-xl font-semibold">{{ professional.name }}</h3>
                  <p class="text-gray-400">{{ professional.bio }}</p>
                </div>
                <div class="flex space-x-2">
                  <button 
                    @click="handleVote(professional.address, 1)" 
                    class="vote-button bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-transform"
                    :disabled="!currentAccount || loadingVotes[`${professional.address}-1`]"
                  >
                    <span v-if="loadingVotes[`${professional.address}-1`]" class="loading-spinner mr-2"></span>
                    Upvote
                  </button>
                  <button 
                    @click="handleVote(professional.address, 2)" 
                    class="vote-button bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-transform"
                    :disabled="!currentAccount || loadingVotes[`${professional.address}-2`]"
                  >
                    <span v-if="loadingVotes[`${professional.address}-2`]" class="loading-spinner mr-2"></span>
                    Downvote
                  </button>
                </div>
              </div>
            </li>
          </ul>
          <div v-else class="text-center py-8">
            <p class="text-gray-400">No profiles found</p>
            <button @click="loadProfiles" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              Retry
            </button>
          </div>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-bold mb-4">About this dApp</h2>
          <p class="text-gray-300">
            This is a sample voting dApp frontend. In future updates, this dApp will be expanded with smart contract integration, 
            allowing for decentralized and transparent voting for wellness professionals.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold mb-4">MetaMask</h2>
          <button 
            @click="connectWallet" 
            class="btn-34 bg-black text-white border-2 border-white rounded-full px-6 py-3 font-bold uppercase transition-transform"
            :disabled="!!currentAccount"
          >
            <span>{{ currentAccount ? `Connected: ${shortAddress(currentAccount)}` : 'MetaMask' }}</span>
          </button>
          
          <div v-if="currentAccount" class="mt-4">
            <div :class="['network-indicator p-2 rounded text-center', networkConnected ? 'bg-green-600' : 'bg-yellow-600']">
              {{ networkIndicatorText }}
            </div>
          </div>
        </section>
      </div>
    </main>

    <footer class="bg-green-600 p-4 text-center fixed w-full bottom-0">
      <p>© 2025 Mindfulness Community</p>
    </footer>

    <!-- Notifications -->
    <div v-if="notification.show" :class="['notification fixed top-5 right-5 p-4 rounded-lg z-50', notification.type === 'error' ? 'bg-red-600' : 'bg-green-600']">
      {{ notification.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// State
const profiles = ref([]);
const loading = ref(true);
const loadingVotes = ref({});
const currentAccount = ref(null);
const networkConnected = ref(false);
const networkIndicatorText = ref('');
const notification = ref({ show: false, message: '', type: 'success' });
const retryAttempts = ref({});
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Ethereum network configuration
const SUPPORTED_NETWORKS = {
  // Sepolia testnet
  '0xaa36a7': {
    name: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    explorer: 'https://sepolia.etherscan.io',
    chainId: '0xaa36a7'
  },
  // Goerli testnet
  '0x5': {
    name: 'Goerli',
    rpcUrl: 'https://goerli.infura.io/v3/',
    explorer: 'https://goerli.etherscan.io',
    chainId: '0x5'
  },
  // Mumbai testnet (Polygon)
  '0x13881': {
    name: 'Mumbai',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    explorer: 'https://mumbai.polygonscan.com',
    chainId: '0x13881'
  }
};

// Default network to use
const DEFAULT_NETWORK = '0xaa36a7'; // Sepolia

// Methods
const showNotification = (message, type = 'success') => {
  notification.value = { show: true, message, type };
  setTimeout(() => {
    notification.value.show = false;
  }, 5000);
};

const shortAddress = (address) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const fetchWithRetry = async (url, options = {}, retryKey) => {
  let attempts = retryAttempts.value[retryKey] || 0;
  
  while (attempts < MAX_RETRY_ATTEMPTS) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      attempts++;
      retryAttempts.value[retryKey] = attempts;
      
      if (attempts === MAX_RETRY_ATTEMPTS) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
};

const loadProfiles = async () => {
  loading.value = true;
  try {
    const data = await fetchWithRetry('/api/profiles', {}, 'profiles');
    profiles.value = data;
  } catch (error) {
    console.error('Error loading profiles:', error);
    showNotification('Failed to load profiles. Please try again later.', 'error');
  } finally {
    loading.value = false;
  }
};

const handleVote = async (address, voteType) => {
  if (!currentAccount.value) {
    showNotification('Please connect your MetaMask wallet first', 'error');
    return;
  }

  const retryKey = `vote-${address}-${voteType}`;
  loadingVotes.value[retryKey] = true;

  try {
    const data = await fetchWithRetry('/api/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address,
        voteType,
        voter: currentAccount.value
      })
    }, retryKey);

    showNotification('Vote recorded successfully!');
    await loadProfiles(); // Refresh the list
  } catch (error) {
    console.error('Error recording vote:', error);
    showNotification(error.message || 'Failed to record vote. Please try again.', 'error');
  } finally {
    loadingVotes.value[retryKey] = false;
  }
};

const checkMetaMaskConnection = async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      // Check if we're on a supported network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (!SUPPORTED_NETWORKS[chainId]) {
        showNotification(`Please switch to a supported network: ${Object.values(SUPPORTED_NETWORKS).map(n => n.name).join(', ')}`, 'error');
        return;
      }
      
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        currentAccount.value = accounts[0];
        updateNetworkIndicator();
      }
    } catch (error) {
      console.error('Error checking MetaMask connection:', error);
      showNotification('Failed to check MetaMask connection', 'error');
    }
  }
};

const updateNetworkIndicator = async () => {
  if (!window.ethereum) return;
  
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    
    if (SUPPORTED_NETWORKS[chainId]) {
      networkIndicatorText.value = `Network: ${SUPPORTED_NETWORKS[chainId].name}`;
      networkConnected.value = true;
    } else {
      networkIndicatorText.value = 'Unsupported Network';
      networkConnected.value = false;
    }
  } catch (error) {
    console.error('Error updating network indicator:', error);
  }
};

const switchNetwork = async (targetChainId) => {
  if (!window.ethereum) return;
  
  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetChainId }],
    });
    
    // Update UI
    updateNetworkIndicator();
    showNotification(`Switched to ${SUPPORTED_NETWORKS[targetChainId].name} network`);
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        const network = SUPPORTED_NETWORKS[targetChainId];
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: targetChainId,
              chainName: network.name,
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: [network.rpcUrl],
              blockExplorerUrls: [network.explorer]
            },
          ],
        });
        
        // Try switching again
        await switchNetwork(targetChainId);
      } catch (addError) {
        console.error('Error adding network:', addError);
        showNotification('Failed to add network to MetaMask', 'error');
      }
    } else {
      console.error('Error switching network:', switchError);
      showNotification('Failed to switch network', 'error');
    }
  }
};

const connectWallet = async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      currentAccount.value = accounts[0];
      
      // Check if we're on a supported network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (!SUPPORTED_NETWORKS[chainId]) {
        // Switch to default network
        await switchNetwork(DEFAULT_NETWORK);
      }
      
      updateNetworkIndicator();
      showNotification('Wallet connected successfully!');
    } catch (error) {
      console.error('User denied account access:', error);
      showNotification('Please connect your MetaMask wallet to continue', 'error');
    }
  } else {
    showNotification('MetaMask is not installed. Please install MetaMask and try again.', 'error');
  }
};

// Lifecycle hooks
onMounted(() => {
  // Check MetaMask connection on load
  checkMetaMaskConnection();

  // Load initial profiles
  loadProfiles();

  // Handle MetaMask account change
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        currentAccount.value = null;
        showNotification('Wallet disconnected', 'error');
      } else {
        currentAccount.value = accounts[0];
        updateNetworkIndicator();
        showNotification('Wallet account changed');
      }
    });

    // Handle network changes
    window.ethereum.on('chainChanged', (chainId) => {
      if (SUPPORTED_NETWORKS[chainId]) {
        updateNetworkIndicator();
        showNotification(`Connected to ${SUPPORTED_NETWORKS[chainId].name} network`);
      } else {
        showNotification(`Please switch to a supported network: ${Object.values(SUPPORTED_NETWORKS).map(n => n.name).join(', ')}`, 'error');
      }
    });
  }
});

onUnmounted(() => {
  if (window.ethereum) {
    window.ethereum.removeAllListeners('accountsChanged');
    window.ethereum.removeAllListeners('chainChanged');
  }
});
</script>

<style>
.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.vote-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.notification {
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Button 34 Styles */
.btn-34,
.btn-34 *,
.btn-34:after,
.btn-34:before {
  border: 0 solid;
  box-sizing: border-box;
}
.btn-34 {
  -webkit-tap-highlight-color: transparent;
  -webkit-appearance: button;
  -moz-appearance: button;
  appearance: button;
  background-color: #000;
  background-image: none;
  color: #fff;
  cursor: pointer;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif,
    Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;
  font-size: 100%;
  font-weight: 900;
  line-height: 1.5;
  margin: 0;
  mask-image: radial-gradient(#000, #fff);
  padding: 0;
  text-transform: uppercase;
  border-radius: 99rem;
  border-width: 2px;
  overflow: hidden;
  padding: 0.8rem 3rem;
  position: relative;
}
.btn-34:disabled {
  cursor: default;
}
.btn-34:focus {
  outline: 2px solid #fff;
}
.btn-34:-moz-focusring {
  outline: auto;
}
.btn-34 svg {
  display: block;
  vertical-align: middle;
}
.btn-34 [hidden] {
  display: none;
}
.btn-34:hover {
  transform: scale(1.1);
}
.btn-34 span {
  font-weight: 900;
  mix-blend-mode: difference;
}
.btn-34:before {
  aspect-ratio: 1;
  background: #fff;
  border-radius: 50%;
  content: "";
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.2s;
  width: 0;
}
.btn-34:hover:before {
  width: 100%;
}
</style> 
// ABOUTME: Wallet connection state management
// ABOUTME: Handles connecting to MetaMask and tracking user's wallet address
import { writable, derived } from 'svelte/store';
import { ethers } from 'ethers';
import { loadTreasuryData } from './treasury.js';

export const walletAddress = writable(null);
export const provider = writable(null);
export const signer = writable(null);
export const isConnecting = writable(false);

export const isConnected = derived(walletAddress, $address => !!$address);

// Store event handlers so we can remove them later
let accountsChangedHandler = null;
let chainChangedHandler = null;

export async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    alert('Please install MetaMask to connect your wallet');
    return;
  }

  isConnecting.set(true);

  try {
    const web3Provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await web3Provider.send('eth_requestAccounts', []);
    const web3Signer = await web3Provider.getSigner();

    provider.set(web3Provider);
    signer.set(web3Signer);
    walletAddress.set(accounts[0]);

    // Remove old event listeners to prevent memory leaks
    if (accountsChangedHandler) {
      window.ethereum.removeListener('accountsChanged', accountsChangedHandler);
    }
    if (chainChangedHandler) {
      window.ethereum.removeListener('chainChanged', chainChangedHandler);
    }

    // Create new event handlers
    accountsChangedHandler = async (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        walletAddress.set(accounts[0]);
        // Refresh treasury data when account changes
        try {
          await loadTreasuryData();
        } catch (error) {
          console.error('Error refreshing treasury data:', error);
        }
      }
    };

    chainChangedHandler = () => {
      window.location.reload();
    };

    // Add new event listeners
    window.ethereum.on('accountsChanged', accountsChangedHandler);
    window.ethereum.on('chainChanged', chainChangedHandler);

  } catch (error) {
    console.error('Error connecting wallet:', error);
    alert('Failed to connect wallet: ' + error.message);
  } finally {
    isConnecting.set(false);
  }

  // Refresh treasury data AFTER setting isConnecting to false
  // This prevents the button from getting stuck if loadTreasuryData fails
  try {
    await loadTreasuryData();
  } catch (error) {
    console.error('Error loading treasury data after wallet connect:', error);
    // Don't alert - the treasury component will show the error
  }
}

export function disconnectWallet() {
  // Remove event listeners on disconnect
  if (accountsChangedHandler) {
    window.ethereum?.removeListener('accountsChanged', accountsChangedHandler);
    accountsChangedHandler = null;
  }
  if (chainChangedHandler) {
    window.ethereum?.removeListener('chainChanged', chainChangedHandler);
    chainChangedHandler = null;
  }

  walletAddress.set(null);
  provider.set(null);
  signer.set(null);
}

// Auto-connect if previously connected
if (typeof window !== 'undefined' && window.ethereum) {
  window.ethereum.request({ method: 'eth_accounts' })
    .then((accounts) => {
      if (accounts.length > 0) {
        connectWallet();
      }
    });
}

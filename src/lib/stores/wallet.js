// ABOUTME: Wallet connection state management
// ABOUTME: Handles connecting to MetaMask and tracking user's wallet address
import { writable, derived } from 'svelte/store';
import { ethers } from 'ethers';

export const walletAddress = writable(null);
export const provider = writable(null);
export const signer = writable(null);
export const isConnecting = writable(false);

export const isConnected = derived(walletAddress, $address => !!$address);

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

    // Listen for account changes
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        walletAddress.set(accounts[0]);
      }
    });

    // Listen for chain changes
    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });
  } catch (error) {
    console.error('Error connecting wallet:', error);
    alert('Failed to connect wallet: ' + error.message);
  } finally {
    isConnecting.set(false);
  }
}

export function disconnectWallet() {
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

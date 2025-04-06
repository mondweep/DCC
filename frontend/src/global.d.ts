import { ethers } from 'ethers';

declare global {
  interface Window {
    // Add ethereum property injected by MetaMask
    ethereum?: ethers.Eip1193Provider & { // Use Eip1193Provider for standard methods
        isMetaMask?: boolean;
        on: (event: string, handler: (...args: any[]) => void) => void;
        removeListener: (event: string, handler: (...args: any[]) => void) => void;
        // Add other specific methods if needed, or keep as 'any' for simplicity initially
    };
  }
}

// This empty export makes the file a module
export {};
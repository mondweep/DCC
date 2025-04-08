import React, { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { ethers } from 'ethers';

// Define contract addresses (replace with actual deployed addresses later)
// Using placeholders from environment variables
const MEMBERSHIP_CONTRACT_ADDRESS = import.meta.env.VITE_MEMBERSHIP_CONTRACT_ADDRESS || "0x...";
const GOVERNANCE_CONTRACT_ADDRESS = import.meta.env.VITE_GOVERNANCE_CONTRACT_ADDRESS || "0x...";
const INCOME_MANAGEMENT_CONTRACT_ADDRESS = import.meta.env.VITE_INCOME_MANAGEMENT_CONTRACT_ADDRESS || "0x...";
const PAYMENT_CONTRACT_ADDRESS = import.meta.env.VITE_PAYMENT_CONTRACT_ADDRESS || "0x...";


// Define the shape of the context data
interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  account: string | null;
  isMember: boolean | null; // null = loading, false = not member, true = member
  connectWallet: () => Promise<void>;
  checkMembershipStatus: () => Promise<void>;
  disconnectWallet: () => void; // Add disconnect function type
  // Contract instances
  membershipContract: ethers.Contract | null;
  governanceContract: any;
  incomeManagementContract: ethers.Contract | null;
  paymentContract: ethers.Contract | null;
}

// Create the context with a default value
export const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// Define the provider component props
interface Web3ProviderProps {
  children: ReactNode;
}

// Create the provider component
export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  // Initialize provider once using useState initializer
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(() => {
    // Check if window and window.ethereum are available (client-side check)
    if (typeof window !== 'undefined' && window.ethereum) {
      console.log("Initializing ethers BrowserProvider...");
      return new ethers.BrowserProvider(window.ethereum);
    }
    console.log("MetaMask (window.ethereum) not detected during initial provider setup.");
    return null;
  });
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  // State for contract instances
  const [membershipContract, setMembershipContract] = useState<ethers.Contract | null>(null);
  const [governanceContract, setGovernanceContract] = useState<ethers.Contract | null>(null);
  const [incomeManagementContract, setIncomeManagementContract] = useState<ethers.Contract | null>(null);
  const [paymentContract, setPaymentContract] = useState<ethers.Contract | null>(null);
  const [hasManuallyDisconnected, setHasManuallyDisconnected] = useState(false); // Add disconnect flag state

  // Memoized function to check membership status
  const checkMembershipStatus = useCallback(async (currentAccount?: string | null) => {
    const accountToCheck = currentAccount ?? account;
    if (membershipContract && accountToCheck) {
      console.log(`Checking membership status for ${accountToCheck}...`);
      setIsMember(null); // Set loading state
      try {
        const status = await membershipContract.isVotingMember(accountToCheck);
        console.log(`Membership status for ${accountToCheck}: ${status}`);
        setIsMember(status);
      } catch (error) {
        console.error("Error checking membership status:", error);
        setIsMember(false); // Assume not member on error
      }
    } else {
      setIsMember(false); // Not connected or contract not ready
    }
  }, [account, membershipContract]); // Dependencies

  // Handle account changes from wallet
  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      console.log('Wallet disconnected.');
      setAccount(null);
      setSigner(null);
      setIsMember(false); // Reset membership status
    } else if (accounts[0] !== account) {
      const newAccount = accounts[0];
      setAccount(newAccount);
      console.log('Account changed/connected:', newAccount);
      if (provider && window.ethereum) {
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(newProvider); // Update the provider
        newProvider.getSigner().then(signer => {
            setSigner(signer);
            // Status check will happen in the effect below that depends on signer/account
        }).catch(console.error);
      }
    }
  }, [account, provider]); // Dependencies


  // Effect to set up listeners and check initial connection/accounts
  useEffect(() => {
    // Only run if provider is successfully initialized
    if (provider) {
      console.log("Provider initialized, setting up listeners and checking accounts...");

      const initConnection = async () => {
        // Only attempt initial connection check if user hasn't manually disconnected
        if (!hasManuallyDisconnected) {
            console.log("Checking for existing connected accounts (initial load)...");
            try {
                const accounts = await window.ethereum!.request({ method: 'eth_accounts' }) as string[];
                if (accounts.length > 0) {
                    console.log("Found existing accounts:", accounts);
                    handleAccountsChanged(accounts); // Sets account and triggers signer fetch
                } else {
                    console.log("No existing accounts found connected.");
                }
            } catch (err) {
                console.error("Error checking initial accounts:", err);
            }
        } else {
            console.log("Skipping initial account check due to manual disconnect.");
        }
      };
      initConnection();

      // Ensure window.ethereum exists before attaching listener
      if (window.ethereum?.on) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
      }

      return () => {
        // Ensure window.ethereum exists before removing listener
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    } else {
      console.log('MetaMask not detected');
    }
  // Depend only on provider (stable) and handleAccountsChanged callback
  // This effect should run once when provider is ready, and re-run if handleAccountsChanged identity changes (due to its own dependencies changing)
  // Add hasManuallyDisconnected to dependency array so effect re-runs if it changes (e.g., after connect)
  }, [provider, handleAccountsChanged, hasManuallyDisconnected]);


  // Initialize contract instances when signer is available
  useEffect(() => {
    const initContracts = async () => {
        if (signer && MEMBERSHIP_CONTRACT_ADDRESS !== "0x..." ) { // Check for valid address
            console.log("Initializing contracts with signer...");
            try {
                // Fetch ABIs from the public directory
                const fetchABI = async (path: string) => {
                    // Use absolute path from root for files in public/
                    const response = await fetch(path);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ABI from ${path}: ${response.statusText}`);
                    }
                    return await response.json();
                };

                // Fetch all ABIs concurrently
                const [MembershipABI, GovernanceABI, IncomeManagementABI, PaymentABI] = await Promise.all([
                    fetchABI('/abis/MembershipContract.json'),
                    fetchABI('/abis/GovernanceContract.json'),
                    fetchABI('/abis/IncomeManagementContract.json'),
                    fetchABI('/abis/PaymentContract.json')
                ]);

                const memContract = new ethers.Contract(MEMBERSHIP_CONTRACT_ADDRESS, MembershipABI.abi, signer);
                const govContract = new ethers.Contract(GOVERNANCE_CONTRACT_ADDRESS, GovernanceABI.abi, signer);
                const incContract = new ethers.Contract(INCOME_MANAGEMENT_CONTRACT_ADDRESS, IncomeManagementABI.abi, signer);
                const payContract = new ethers.Contract(PAYMENT_CONTRACT_ADDRESS, PaymentABI.abi, signer);

                setMembershipContract(memContract);
                setGovernanceContract(govContract);
                setIncomeManagementContract(incContract);
                setPaymentContract(payContract);
                console.log("Contracts initialized.");
            } catch (error) {
                console.error("Error initializing contracts:", error);
                // Clear contracts on error
                 setMembershipContract(null);
                 setGovernanceContract(null);
                 setIncomeManagementContract(null);
                 setPaymentContract(null);
            }
        } else {
           console.log("Signer not available or contract addresses not set, clearing contracts.");
           setMembershipContract(null);
           setGovernanceContract(null);
           setIncomeManagementContract(null);
           setPaymentContract(null);
        }
    };

    initContracts(); // Call the async function

  }, [signer]); // Re-run when signer changes

  // Effect to check membership when contract instance is ready and account changes
  useEffect(() => {
    if (membershipContract && account) {
        checkMembershipStatus(account);
    } else {
        setIsMember(false); // Ensure status is false if contract/account not ready
    }
  }, [membershipContract, account, checkMembershipStatus]);


  // Connect wallet function
  const connectWallet = async () => {
    if (provider) {
      setHasManuallyDisconnected(false); // Reset disconnect flag on connection attempt
      try {
        // Request accounts, triggering handleAccountsChanged if successful
        await provider.send('eth_requestAccounts', []);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        setAccount(null);
        setSigner(null);
        setIsMember(false);
      }
    } else {
      alert('MetaMask is not installed. Please install it to use this app.');
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    console.log('Disconnecting wallet (manual action).');
    setHasManuallyDisconnected(true); // Set disconnect flag
    // Reset state variables related to the connection
    setAccount(null);
    setSigner(null);
    setIsMember(false); // Reset membership status
    // Clear contract instances as they depend on the signer
    setMembershipContract(null);
    setGovernanceContract(null);
    setIncomeManagementContract(null);
    setPaymentContract(null);
    // Note: We don't reset the provider itself, as it's tied to window.ethereum
  };


  // Context value
  const value = {
    provider,
    signer,
    account,
    isMember,
    connectWallet,
    checkMembershipStatus,
    membershipContract,
    governanceContract,
    incomeManagementContract,
    paymentContract,
    disconnectWallet, // Add disconnect function to context value
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

// Custom hook for easy context consumption
export const useWeb3 = (): Web3ContextType => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
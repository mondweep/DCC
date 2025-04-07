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
  // Contract instances
  membershipContract: ethers.Contract | null;
  governanceContract: ethers.Contract | null;
  incomeManagementContract: ethers.Contract | null;
  paymentContract: ethers.Contract | null;
}

// Create the context with a default value
const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// Define the provider component props
interface Web3ProviderProps {
  children: ReactNode;
}

// Create the provider component
export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  // State for contract instances
  const [membershipContract, setMembershipContract] = useState<ethers.Contract | null>(null);
  const [governanceContract, setGovernanceContract] = useState<ethers.Contract | null>(null);
  const [incomeManagementContract, setIncomeManagementContract] = useState<ethers.Contract | null>(null);
  const [paymentContract, setPaymentContract] = useState<ethers.Contract | null>(null);

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
      if (provider) {
        provider.getSigner().then(signer => {
            setSigner(signer);
            // Status check will happen in the effect below that depends on signer/account
        }).catch(console.error);
      }
    }
  }, [account, provider]); // Dependencies


  // Initialize provider and check for existing connection/accounts
  useEffect(() => {
    if (window.ethereum) {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);

      const initConnection = async () => {
          try {
              const accounts = await window.ethereum!.request({ method: 'eth_accounts' }) as string[];
              if (accounts.length > 0) {
                  handleAccountsChanged(accounts); // Sets account and triggers signer fetch
              }
          } catch (err) {
              console.error("Error checking initial accounts:", err);
          }
      };
      initConnection();

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    } else {
      console.log('MetaMask not detected');
    }
  }, [handleAccountsChanged]); // Add handleAccountsChanged dependency


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
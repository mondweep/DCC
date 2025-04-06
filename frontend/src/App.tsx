import { useState } from 'react';
import { useWeb3 } from './contexts/Web3Context';
import ProposalList from './components/ProposalList';
import CreateProposal from './components/CreateProposal'; // Import CreateProposal
import './App.css'; // Assuming App.css might be used alongside Tailwind

function App() {
  // Get state and functions from context
  const { account, connectWallet, isMember, membershipContract, checkMembershipStatus } = useWeb3();
  const [isJoining, setIsJoining] = useState(false); // State for loading indicator
  const [joinError, setJoinError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      <header className="w-full max-w-4xl flex justify-between items-center p-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold">DCC Portal</h1>
        {account ? (
          <div className="bg-gray-800 p-2 rounded">
            Connected: {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
          </div>
        ) : (
          <button
            onClick={connectWallet} // Use connectWallet from context
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Connect Wallet
          </button>
        )}
      </header>

      <main className="w-full max-w-4xl mt-8">
        {account ? (
          <div className="space-y-4">
            <p className="text-lg">Welcome, {account}!</p>

            {/* Membership Status / Join Button */}
            {isMember === null && <p>Checking membership status...</p>}
            {isMember === false && (
              <div className="p-4 border border-yellow-500 rounded bg-gray-800">
                <p className="mb-2">You are not currently a voting member.</p>
                <button
                  onClick={handleJoin}
                  disabled={isJoining || !membershipContract}
                  className={`bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2 ${isJoining || !membershipContract ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isJoining ? 'Joining...' : 'Join DCC (Fee: 0 ETH)'}
                </button>
                 <button
                    onClick={checkMembershipStatus} // Manual refresh button
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                    title="Refresh Status"
                 >
                    🔄
                 </button>
                {joinError && <p className="text-red-500 mt-2">{joinError}</p>}
              </div>
            )}
            {isMember === true &&
                 <>
                    <p className="text-green-400">Status: Voting Member ✅</p>
                    <CreateProposal /> {/* Add CreateProposal component */}
                    <ProposalList />
                 </>
            }

            <p className="text-gray-400 mt-8">(Other contract interaction components go here)</p>
          </div>
        ) : (
          <p className="text-center text-lg">Please connect your wallet to interact with the DCC platform.</p>
        )}
      </main>
    </div>
  );

  // Function to handle joining
  async function handleJoin() {
    if (!membershipContract || !account) {
      setJoinError("Wallet not connected or contract not loaded.");
      return;
    }
    setIsJoining(true);
    setJoinError(null);
    try {
      console.log("Attempting to join...");
      // Assuming fee is 0 for now, no value needed
      const tx = await membershipContract.join();
      console.log("Join transaction sent:", tx.hash);
      await tx.wait(); // Wait for transaction confirmation
      console.log("Join transaction confirmed.");
      // Re-check membership status after joining
      await checkMembershipStatus();
    } catch (error: any) {
      console.error("Error joining:", error);
      // Try to parse a more specific revert reason if available
      const reason = error?.reason || error?.message || "An unknown error occurred.";
      setJoinError(`Failed to join: ${reason}`);
    } finally {
      setIsJoining(false);
    }
  }

}

export default App;

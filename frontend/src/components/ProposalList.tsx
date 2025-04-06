import React, { useState, useEffect, useCallback } from 'react'; // Keep combined import
import { ethers } from 'ethers'; // Keep single ethers import
import { useWeb3 } from '../contexts/Web3Context';

interface ProposalCoreDetails {
    id: bigint;
    proposer: string;
    startTime: bigint;
    endTime: bigint;
    description: string;
    executed: boolean;
    canceled: boolean;
    forVotes: bigint;
    againstVotes: bigint;
}

const ProposalList: React.FC = () => {
    const { governanceContract, account, checkMembershipStatus } = useWeb3(); // Add checkMembershipStatus if needed for refresh
    const [proposals, setProposals] = useState<ProposalCoreDetails[]>([]);
    const [loading, setLoading] = useState<boolean>(true); // Start loading true
    const [error, setError] = useState<string | null>(null);
    const [actionState, setActionState] = useState<{ [proposalId: string]: { loading: boolean; error: string | null } }>({}); // Renamed for broader use (vote/execute)

    useEffect(() => {
        const fetchProposals = async () => {
            if (!governanceContract || !account) return;

            setLoading(true);
            setError(null);
            try {
                const counter = await governanceContract.proposalCounter();
                const proposalCount = Number(counter); // Convert BigInt to number
                console.log("Total proposals:", proposalCount);

                const fetchedProposals: ProposalCoreDetails[] = [];
                // Fetch proposals in reverse order (newest first) - adjust loop as needed
                for (let i = proposalCount - 1; i >= 0; i--) {
                    if (i < 0) break; // Should not happen, but safeguard
                    console.log("Fetching proposal ID:", i);
                    // Call the getter function that returns the tuple
                    const coreDetailsTuple = await governanceContract.getProposalCoreDetails(i);
                    // Map tuple to object based on return order
                    const proposal: ProposalCoreDetails = {
                        id: coreDetailsTuple[0],
                        proposer: coreDetailsTuple[1],
                        startTime: coreDetailsTuple[2],
                        endTime: coreDetailsTuple[3],
                        description: coreDetailsTuple[4],
                        executed: coreDetailsTuple[5],
                        canceled: coreDetailsTuple[6],
                        forVotes: coreDetailsTuple[7],
                        againstVotes: coreDetailsTuple[8],
                    };
                    // Filter out potentially empty proposals if ID 0 wasn't used or if there was an error
                    if (proposal.proposer !== ethers.ZeroAddress) {
                         fetchedProposals.push(proposal);
                    }
                }
                setProposals(fetchedProposals);
            } catch (err: any) {
                console.error("Error fetching proposals:", err);
                setError("Failed to fetch proposals. Ensure contracts are deployed and addresses are correct.");
            } finally {
                setLoading(false);
            }
        };

        if (governanceContract && account) {
            fetchProposals();
        } else {
            setLoading(false); // Not connected, don't show loading
            setProposals([]); // Clear proposals if disconnected
        }
        // TODO: Add listeners for new proposal events to update list automatically?
    }, [governanceContract, account]); // Re-fetch if contract or account changes

    // --- Vote Handling ---
    const handleVote = useCallback(async (proposalId: bigint, support: boolean) => {
        if (!governanceContract || !account) {
            console.error("Cannot vote: Wallet not connected or contract not loaded.");
            return;
        }

        const idString = proposalId.toString();
        setActionState(prev => ({ ...prev, [idString]: { loading: true, error: null } })); // Use actionState

        try {
            console.log(`Voting ${support ? 'For' : 'Against'} proposal ${idString}`);
            const tx = await governanceContract.vote(proposalId, support);
            console.log(`Vote transaction sent: ${tx.hash}`);
            await tx.wait();
            console.log(`Vote transaction confirmed for proposal ${idString}`);
            // Optionally re-fetch proposals or update specific proposal state after vote
            // fetchProposals(); // Re-fetch all might be simplest for now
        } catch (err: any) {
            console.error(`Error voting on proposal ${idString}:`, err);
            const reason = err?.reason || err?.message || "An unknown error occurred.";
            setActionState(prev => ({ ...prev, [idString]: { loading: false, error: `Vote failed: ${reason}` } })); // Use actionState
        } finally {
            // Keep loading false after success/error, only set true on action start
             setActionState(prev => ({ ...prev, [idString]: { ...prev[idString], loading: false } })); // Use actionState
        }
    }, [governanceContract, account]); // Dependencies for the callback

    // --- Execute Handling ---
    const handleExecute = useCallback(async (proposalId: bigint) => {
        if (!governanceContract || !account) {
            console.error("Cannot execute: Wallet not connected or contract not loaded.");
            return;
        }

        const idString = proposalId.toString();
        setActionState(prev => ({ ...prev, [idString]: { loading: true, error: null } }));

        try {
            console.log(`Executing proposal ${idString}`);
            const tx = await governanceContract.executeProposal(proposalId);
            console.log(`Execute transaction sent: ${tx.hash}`);
            await tx.wait();
            console.log(`Execute transaction confirmed for proposal ${idString}`);
            // Optionally re-fetch proposals or update specific proposal state after execution
            // fetchProposals(); // Re-fetch all might be simplest for now
        } catch (err: any) {
            console.error(`Error executing proposal ${idString}:`, err);
            const reason = err?.reason || err?.message || "An unknown error occurred.";
            setActionState(prev => ({ ...prev, [idString]: { loading: false, error: `Execute failed: ${reason}` } }));
        } finally {
             setActionState(prev => ({ ...prev, [idString]: { ...prev[idString], loading: false } }));
        }
    }, [governanceContract, account]); // Dependencies for the callback

    const formatTimestamp = (timestamp: bigint): string => {
        if (!timestamp || timestamp === 0n) return 'N/A';
        return new Date(Number(timestamp) * 1000).toLocaleString();
    }

    if (loading) return <p>Loading proposals...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3">Governance Proposals</h2>
            {proposals.length === 0 ? (
                <p>No proposals found.</p>
            ) : (
                <ul className="space-y-4">
                    {proposals.map((p) => (
                        <li key={p.id.toString()} className="p-4 border border-gray-700 rounded bg-gray-800">
                            <h3 className="font-bold mb-1">Proposal #{p.id.toString()}: {p.description}</h3>
                            <p className="text-sm text-gray-400">Proposer: {p.proposer}</p>
                            <p className="text-sm text-gray-400">Voting Ends: {formatTimestamp(p.endTime)}</p>
                            <p className="text-sm">Votes For: {p.forVotes.toString()}</p>
                            <p className="text-sm">Votes Against: {p.againstVotes.toString()}</p>
                            <p className={`text-sm ${p.executed ? 'text-green-500' : p.canceled ? 'text-red-500' : 'text-yellow-500'}`}>
                                Status: {p.executed ? 'Executed' : p.canceled ? 'Canceled' : 'Active/Pending'}
                            </p>

                            {/* Action Buttons */}
                            <div className="mt-2 space-x-2">
                                {/* Voting Buttons (only if proposal is active) */}
                                {!p.executed && !p.canceled && BigInt(Date.now()) / 1000n < p.endTime && (
                                    <>
                                        <button
                                            onClick={() => handleVote(p.id, true)}
                                            disabled={actionState[p.id.toString()]?.loading}
                                            className={`bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm ${actionState[p.id.toString()]?.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            Vote For {actionState[p.id.toString()]?.loading && '(...)'.substring(0, actionState[p.id.toString()]?.loading ? 3 : 0)}
                                        </button>
                                        <button
                                            onClick={() => handleVote(p.id, false)}
                                            disabled={actionState[p.id.toString()]?.loading}
                                            className={`bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm ${actionState[p.id.toString()]?.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            Vote Against {actionState[p.id.toString()]?.loading && '(...)'.substring(0, actionState[p.id.toString()]?.loading ? 3 : 0)}
                                        </button>
                                    </>
                                )}
                                {/* Execute Button (only if active, passed, and past deadline) */}
                                {!p.executed && !p.canceled && BigInt(Date.now()) / 1000n > p.endTime && p.forVotes > p.againstVotes && (
                                    // TODO: Add quorum check condition here if needed by UI
                                    <button
                                        onClick={() => handleExecute(p.id)}
                                        disabled={actionState[p.id.toString()]?.loading}
                                        className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm ${actionState[p.id.toString()]?.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        Execute {actionState[p.id.toString()]?.loading && '(...)'.substring(0, actionState[p.id.toString()]?.loading ? 3 : 0)}
                                    </button>
                                )}
                            </div>
                             {/* Display Error for specific proposal action */}
                             {actionState[p.id.toString()]?.error && (
                                <p className="text-red-500 text-xs mt-1">{actionState[p.id.toString()]?.error}</p>
                             )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ProposalList;
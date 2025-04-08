import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ethers } from 'ethers';
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
    const { governanceContract, account, checkMembershipStatus } = useWeb3();
    const [proposals, setProposals] = useState<ProposalCoreDetails[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [actionState, setActionState] = useState<{ [proposalId: string]: { loading: boolean; error: string | null } }>({});
    const [hasVoted, setHasVoted] = useState<{ [proposalId: string]: boolean }>({});
    const [selectedEndTime, setSelectedEndTime] = useState<{ [proposalId: string]: Date | null }>({});

    const fetchProposals = useCallback(async () => {
        if (!governanceContract || !account) return;

        setLoading(true);
        setError(null);
        try {
            const counter = await governanceContract.proposalCounter();
            const proposalCount = Number(counter);
            console.log("Total proposals:", proposalCount);

            const fetchedProposals: ProposalCoreDetails[] = [];
            const votedStatus: { [proposalId: string]: boolean } = {}; // Local object to collect voting statuses

            for (let i = proposalCount - 1; i >= 0; i--) {
                if (i < 0) break;
                console.log("Fetching proposal ID:", i);
                const coreDetailsTuple = await governanceContract.getProposalCoreDetails(i);
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
                if (proposal.proposer !== ethers.ZeroAddress) {
                     fetchedProposals.push(proposal);
                }

                // Check if user has already voted for this proposal
                try {
                    const voterHasVoted = await governanceContract.hasVoted(i, account);
                    votedStatus[i.toString()] = voterHasVoted; // Store status using string ID as key
                } catch (e) {
                    console.error(`Error getting vote status for proposal ${i}:`, e);
                    votedStatus[i.toString()] = false; // Assume not voted on error
                }
            }
            setProposals(fetchedProposals);
            setHasVoted(votedStatus); // Update state *after* fetching all statuses
        } catch (err: any) {
            console.error("Error fetching proposals:", err);
            setError("Failed to fetch proposals. Ensure contracts are deployed and addresses are correct.");
        } finally {
            setLoading(false);
        }
    }, [governanceContract, account]);

    useEffect(() => {
        if (governanceContract && account) {
            fetchProposals();
        } else {
            setLoading(false);
            setProposals([]);
            setHasVoted({}); // Clear voting status when disconnected
        }
        // TODO: Add listeners for new proposal events to update list automatically?
    }, [governanceContract, account, fetchProposals]);

    // --- Vote Handling ---
    const handleVote = useCallback(async (proposalId: bigint, support: boolean) => {
        if (!governanceContract || !account) {
            console.error("Cannot vote: Wallet not connected or contract not loaded.");
            setActionState(prev => ({ ...prev, [proposalId.toString()]: { loading: false, error: "Wallet not connected or contract not loaded." } }));
            return;
        }

        const idString = proposalId.toString();
        setActionState(prev => ({ ...prev, [idString]: { loading: true, error: null } }));

        try {
            console.log(`Voting ${support ? 'For' : 'Against'} proposal ${idString}`);
            const tx = await governanceContract.vote(proposalId, support);
            console.log(`Vote transaction sent: ${tx.hash}`);
            await tx.wait();
            console.log(`Vote transaction confirmed for proposal ${idString}`);
            // Explicitly update hasVoted state for this proposal
            setHasVoted(prev => ({ ...prev, [idString]: true }));
            // Re-fetch proposals to update vote counts
            fetchProposals();
        } catch (err: any) {
            console.error(`Error voting on proposal ${idString}:`, err);
            const reason = err?.reason || err?.message || "An unknown error occurred.";
            setActionState(prev => ({ ...prev, [idString]: { loading: false, error: `Vote failed: ${reason}` } }));
        } finally {
             setActionState(prev => ({ ...prev, [idString]: { ...prev[idString], loading: false } }));
        }
    }, [governanceContract, account, fetchProposals]);

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
            fetchProposals(); // Re-fetch to update status
        } catch (err: any) {
            console.error(`Error executing proposal ${idString}:`, err);
            const reason = err?.reason || err?.message || "An unknown error occurred.";
            setActionState(prev => ({ ...prev, [idString]: { loading: false, error: `Execute failed: ${reason}` } }));
        } finally {
             setActionState(prev => ({ ...prev, [idString]: { ...prev[idString], loading: false } }));
        }
    }, [governanceContract, account, fetchProposals]);

    const formatTimestamp = useCallback((timestamp: bigint): string => {
        if (!timestamp || timestamp === 0n) return 'N/A';
        return new Date(Number(timestamp) * 1000).toLocaleString();
    }, []);

    // --- Update End Time Handling ---
    const updateEndTime = useCallback(async (proposalId: bigint, newEndTime: Date | null) => {
        if (!governanceContract || !account || !newEndTime) {
            console.error("Cannot update end time: Wallet not connected or invalid end time.");
            return;
        }

        const idString = proposalId.toString();
        setActionState(prev => ({ ...prev, [idString]: { loading: true, error: null } }));

        try {
            console.log(`Updating end time for proposal ${idString} to ${newEndTime}`);
            const newEndTimeUnix = Math.floor(newEndTime.getTime() / 1000);
            const tx = await governanceContract.updateProposalEndTime(proposalId, newEndTimeUnix);
            console.log(`Update transaction sent: ${tx.hash}`);
            await tx.wait();
            console.log(`Update transaction confirmed for proposal ${idString}`);
            // Re-fetch proposals to update vote counts
            fetchProposals();
        } catch (err: any) {
            console.error(`Error updating end time for proposal ${idString}:`, err);
            const reason = err?.reason || err?.message || "An unknown error occurred.";
            setActionState(prev => ({ ...prev, [idString]: { loading: false, error: `Update end time failed: ${reason}` } }));
        } finally {
             setActionState(prev => ({ ...prev, [idString]: { ...prev[idString], loading: false } }));
        }
    }, [governanceContract, account, fetchProposals]);

    const handleEndTimeChange = useCallback((proposalId: bigint, date: Date | null) => {
        setSelectedEndTime(prev => ({ ...prev, [proposalId.toString()]: date }));
        console.log(`handleEndTimeChange called for proposal ${proposalId} with date ${date}`);
    }, []);

    const handleSubmitEndTime = useCallback((proposalId: bigint) => {
        const selectedDate = selectedEndTime[proposalId.toString()];
        console.log(`handleSubmitEndTime called for proposal ${proposalId} with date ${selectedDate}`);
        if (selectedDate) {
            updateEndTime(proposalId, selectedDate);
        } else {
            console.error("No end time selected.");
            setActionState(prev => ({ ...prev, [proposalId.toString()]: { loading: false, error: "No end time selected." } }));
        }
    }, [selectedEndTime, updateEndTime]);

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
                                <p className={`text-sm ${p.executed ? 'text-green-500' : p.canceled ? 'text-red-500' : BigInt(Date.now()) / 1000n > p.endTime ? 'text-gray-500' : 'text-yellow-500'}`}>
                                    Status: {p.executed ? 'Executed' : p.canceled ? 'Canceled' : BigInt(Date.now()) / 1000n > p.endTime ? 'Expired' : 'Active/Pending'}</p>

                                {/* Action Buttons */}
                                <div className="mt-2 space-x-2">
                                    {/* Voting Buttons (only if proposal is active and user hasn't voted) */}
                                    {!p.executed && !p.canceled && BigInt(Date.now()) / 1000n < p.endTime && !hasVoted[p.id.toString()] && (
                                       <>
                                           <button
                                               onClick={(e) => { e.preventDefault(); handleVote(p.id, true); }} // Prevent link navigation on button click
                                               disabled={actionState[p.id.toString()]?.loading || hasVoted[p.id.toString()]}
                                               className={`bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm ${actionState[p.id.toString()]?.loading || hasVoted[p.id.toString()] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                           >
                                               Vote For {actionState[p.id.toString()]?.loading && '(...)'.substring(0, actionState[p.id.toString()]?.loading ? 3 : 0)}
                                           </button>
                                           <button
                                               onClick={(e) => { e.preventDefault(); handleVote(p.id, false); }} // Prevent link navigation on button click
                                               disabled={actionState[p.id.toString()]?.loading || hasVoted[p.id.toString()]}
                                               className={`bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm ${actionState[p.id.toString()]?.loading || hasVoted[p.id.toString()] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                           >
                                               Vote Against {actionState[p.id.toString()]?.loading && '(...)'.substring(0, actionState[p.id.toString()]?.loading ? 3 : 0)}
                                           </button>
                                           {/* Display Error for specific proposal action */}
                                           {actionState[p.id.toString()]?.error && (
                                               <p className="text-red-500 text-xs mt-1">{actionState[p.id.toString()]?.error}</p>
                                           )}
                                       </>
                                    )}
                                    {/* Display message if already voted */}
                                    {!p.executed && !p.canceled && BigInt(Date.now()) / 1000n < p.endTime && hasVoted[p.id.toString()] && (
                                        <p className="text-sm text-gray-400 italic">You have already voted on this proposal.</p>
                                    )}
                                    {/* Execute Button (only if active, passed, and past deadline) */}
                                    {!p.executed && !p.canceled && BigInt(Date.now()) / 1000n > p.endTime && p.forVotes > p.againstVotes && (
                                        // TODO: Add quorum check condition here if needed by UI
                                        <button
                                            onClick={(e) => { e.preventDefault(); handleExecute(p.id); }} // Prevent link navigation on button click
                                            disabled={actionState[p.id.toString()]?.loading}
                                            className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm ${actionState[p.id.toString()]?.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            Execute {actionState[p.id.toString()]?.loading && '(...)'.substring(0, actionState[p.id.toString()]?.loading ? 3 : 0)}
                                        </button>
                                    )}
                                </div>
                                 {/* Date Picker to update end Time */}
                                 <div className="mt-2">
                                    <DatePicker
                                        selected={selectedEndTime[p.id.toString()] || (p.endTime ? new Date(Number(p.endTime) * 1000) : null)}
                                        onChange={(date) => handleEndTimeChange(p.id, date)}
                                        showTimeSelect
                                        timeFormat="HH:mm"
                                        timeIntervals={15}
                                        dateFormat="MMMM d, yyyy h:mm aa"
                                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        placeholderText="Select New End Time"
                                        disabled={BigInt(Date.now()) / 1000n > p.endTime}
                                    />
                                    <button
                                        onClick={() => handleSubmitEndTime(p.id)}
                                        disabled={actionState[p.id.toString()]?.loading || BigInt(Date.now()) / 1000n > p.endTime}
                                        className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm ${actionState[p.id.toString()]?.loading || BigInt(Date.now()) / 1000n > p.endTime ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        Update End Time
                                    </button>
                                    {actionState[p.id.toString()]?.error && (
                                        <p className="text-red-500 text-xs mt-1">{actionState[p.id.toString()]?.error}</p>
                                    )}
                                 </div>
                                 {/* Display Error for specific proposal action (redundant if shown above) */}
                                 {/* {actionState[p.id.toString()]?.error && (
                                    <p className="text-red-500 text-xs mt-1">{actionState[p.id.toString()]?.error}</p>
                                 )} */}
                            
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ProposalList;
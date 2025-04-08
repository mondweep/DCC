import React, { useState, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers'; // Needed for ZeroAddress

interface CreateProposalProps {}

const CreateProposal: React.FC<CreateProposalProps> = () => {
    const { governanceContract, account } = useWeb3();
    const [description, setDescription] = useState('');
    const [proposalId, setProposalId] = useState('');
    const [newEndTime, setNewEndTime] = useState<Date | null>(null);
    const [proposalType, setProposalType] = useState('simple');
    // For simplicity, we'll create proposals with no actions for now
    // TODO: Add fields for targets, values, calldatas later
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = useCallback(async (event: React.FormEvent) => {
        event.preventDefault();
        if (!governanceContract || !account) {
            setError("Please connect wallet.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        let targets: string[] = [];
        let values: ethers.BigNumberish[] = [];
        let signatures: string[] = [];
        let calldatas: string[] = [];

        try {
            if (proposalType === "simple") {
                if (!description || !description.trim()) {
                    setError("Please enter a description.");
                    return;
                }
                 else {
                    // Simple proposal with no actions for now
                    targets = []; // No target contracts
                    values = []; // No ETH value
                    signatures = [""]; // No function signatures needed
                    calldatas = ["0x"]; // Empty calldata

                    console.log("Creating simple proposal with description:", description);

                    const tx = await governanceContract.createProposal(
                        targets,
                        values,
                        signatures,
                        calldatas,
                        description.trim()
                    );
                    console.log("Proposal creation transaction sent:", tx.hash);
                    setSuccessMessage("Proposal submitted! Waiting for confirmation...");
                    await tx.wait(); // Wait for confirmation
                    console.log("Proposal creation confirmed.");
                    setSuccessMessage(`Proposal created successfully! Tx: ${tx.hash}`);
                    setDescription(''); // Clear form
                    setProposalId('');
                    setNewEndTime(null);
                    // TODO: Trigger proposal list refresh?
                }
            } else if (proposalType === "updateEndTime") {
                if (!proposalId) {
                    setError("Please enter a proposal ID.");
                    return;
                }
                if (!newEndTime) {
                    setError("Please select a new end time.");
                    return;
                }

                const newEndTimeUnix = Math.floor(newEndTime.getTime() / 1000);

                try {
                    const tx = await governanceContract.updateProposalEndTime(
                        proposalId,
                        newEndTimeUnix
                    );
                    console.log("Update end time transaction sent:", tx.hash);
                    setSuccessMessage("Update end time transaction submitted! Waiting for confirmation...");
                    await tx.wait(); // Wait for confirmation
                    console.log("Update end time transaction confirmed.");
                    setSuccessMessage(`Proposal end time updated successfully! Tx: ${tx.hash}`);
                    setProposalId('');
                    setNewEndTime(null);
                    // TODO: Trigger proposal list refresh?
                } catch (err: any) {
                    console.error("Error updating proposal end time:", err);
                    const reason = err?.reason || err?.message || "An unknown error occurred.";
                    setError(`Failed to update proposal end time: ${reason}`);
                    setSuccessMessage(null);
                }
            } else {
                // Description is not required for other proposal types
                targets = [];
                values = [];
                signatures = [];
                calldatas = [];
            }
        } catch (err: any) {
            console.error("Error creating proposal:", err);
            const reason = err?.reason || err?.message || "An unknown error occurred.";
            setError(`Failed to create proposal: ${reason}`);
            setSuccessMessage(null);
        } finally {
            setIsLoading(false);
        }
    }, [governanceContract, account, description, proposalId, newEndTime]);

    const handleNewEndTimeChange = useCallback((date: Date | null) => {
        setNewEndTime(date);
    }, []);

    return (
        <div className="mt-6 p-4 border border-gray-700 rounded bg-gray-800">
            <h2 className="text-xl font-semibold mb-3">Create New Proposal</h2>
            <form onSubmit={handleSubmit}>
                {proposalType === 'simple' && (
                    <div className="mb-3">
                        <label htmlFor="description" className="block mb-1 text-sm font-medium text-gray-300">
                            Description:
                        </label>
                        <textarea
                            id="description"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="Describe your proposal..."
                            required
                        ></textarea>
                    </div>
                )}
                <div className="mb-3">
                    <label htmlFor="proposalType" className="block mb-1 text-sm font-medium text-gray-300">
                        Proposal Type:
                    </label>
                    <select
                        id="proposalType"
                        value={proposalType}
                        onChange={(e) => setProposalType(e.target.value as any)}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                        <option value="simple">Simple Proposal</option>
                        <option value="updateEndTime">Update End Time</option>
                    </select>
                </div>
                {proposalType === 'updateEndTime' && (
                    <>
                        <div className="mb-3">
                            <label htmlFor="proposalId" className="block mb-1 text-sm font-medium text-gray-300">
                                Proposal ID:
                            </label>
                            <input
                                type="number"
                                id="proposalId"
                                value={proposalId}
                                onChange={(e) => setProposalId(e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="Enter Proposal ID"
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="newEndTime" className="block mb-1 text-sm font-medium text-gray-300">
                                New End Time:
                            </label>
                            <DatePicker
                                selected={newEndTime}
                                onChange={handleNewEndTimeChange}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="MMMM d, yyyy h:mm aa"
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholderText="Select New End Time"
                            />
                        </div>
                    </>
                )}
                 <button
                    type="submit"
                    disabled={isLoading || !governanceContract || !account}
                    className={`bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded ${isLoading || !governanceContract || !account ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isLoading ? 'Submitting...' : 'Create Proposal'}
                </button>
                {error && <p className="text-red-500 mt-2">{error}</p>}
                {successMessage && <p className="text-green-500 mt-2">{successMessage}</p>}
            </form>
        </div>
    );
};

export default CreateProposal;
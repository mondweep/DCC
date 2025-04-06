import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers'; // Needed for ZeroAddress

const CreateProposal: React.FC = () => {
    const { governanceContract, account } = useWeb3();
    const [description, setDescription] = useState('');
    // For simplicity, we'll create proposals with no actions for now
    // TODO: Add fields for targets, values, calldatas later
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!governanceContract || !account || !description.trim()) {
            setError("Please connect wallet and enter a description.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        // Simple proposal with no actions for now
        const targets: string[] = []; // No target contracts
        const values: ethers.BigNumberish[] = []; // No ETH value
        const signatures: string[] = [""]; // No function signatures needed
        const calldatas: string[] = ["0x"]; // Empty calldata

        try {
            console.log("Creating proposal with description:", description);
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
            // TODO: Trigger proposal list refresh?
        } catch (err: any) {
            console.error("Error creating proposal:", err);
            const reason = err?.reason || err?.message || "An unknown error occurred.";
            setError(`Failed to create proposal: ${reason}`);
            setSuccessMessage(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mt-6 p-4 border border-gray-700 rounded bg-gray-800">
            <h2 className="text-xl font-semibold mb-3">Create New Proposal</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="description" className="block mb-1 text-sm font-medium text-gray-300">
                        Description:
                    </label>
                    <textarea
                        id="description"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describe your proposal..."
                        required
                    />
                </div>
                {/* TODO: Add inputs for targets, values, calldatas later */}
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
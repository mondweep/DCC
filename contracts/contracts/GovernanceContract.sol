// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./MembershipContract.sol";
import "./IncomeManagementContract.sol";
import "./PaymentContract.sol";

contract GovernanceContract is Ownable {
    MembershipContract public membershipContract;
    address payable public incomeManagementContract; // Store as address payable
    PaymentContract public paymentContract;

    uint256 public proposalCounter;
    uint256 public votingPeriod = 7 days; // Default voting period (can be made configurable later)

    // --- Structs ---
    struct Proposal {
        uint256 id;
        address proposer;
        address[] targets;
        uint256[] values;
        string[] signatures;
        bytes[] calldatas;
        uint256 startTime;
        uint256 endTime;
        string description;
        bool executed;
        bool canceled;
        // --- Voting State ---
        uint256 forVotes;
        uint256 againstVotes;
        mapping(address => bool) hasVoted;
    }

    // --- Storage ---
    mapping(uint256 => Proposal) public proposals;

    // --- Events (Placeholders for future tests) ---
    event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startTime, uint256 endTime, string description);
    event Voted(uint256 proposalId, address voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 proposalId);
    event ProposalCanceled(uint256 proposalId); // If cancellation is implemented

    constructor(
        address _membershipContractAddress,
        address _incomeManagementContractAddress,
        address _paymentContractAddress,
        address initialOwner // Provided by Ownable's constructor mechanism
    ) Ownable(initialOwner) {
        require(_membershipContractAddress != address(0), "Governance: Invalid MembershipContract address");
        require(_incomeManagementContractAddress != address(0), "Governance: Invalid IncomeManagementContract address");
        require(_paymentContractAddress != address(0), "Governance: Invalid PaymentContract address");

        membershipContract = MembershipContract(_membershipContractAddress);
        incomeManagementContract = payable(_incomeManagementContractAddress); // Assign payable address directly
        paymentContract = PaymentContract(_paymentContractAddress);

        // proposalCounter is initialized to 0 by default
    }

    // --- Minimal functions required by the first test ---
    // owner() is inherited from Ownable
    // proposalCounter() getter is implicit

    // --- Placeholder functions for future tests/compilation ---
    // These will be properly implemented based on subsequent failing tests

    function createProposal(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas,
        string memory description
    ) public virtual returns (uint256 proposalId) {
        // TDD_ANCHOR: Test_Governance_CreateProposal_Fail_NotVotingMember
        require(membershipContract.isVotingMember(msg.sender), "Governance: Caller is not a voting member");

        // TDD_ANCHOR: Test_Governance_CreateProposal_Success
        proposalId = proposalCounter; // Get current counter value for the ID

        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + votingPeriod;

        // Create and store the proposal
        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.targets = targets;
        newProposal.values = values;
        newProposal.signatures = signatures;
        newProposal.calldatas = calldatas;
        newProposal.startTime = startTime;
        newProposal.endTime = endTime;
        newProposal.description = description;
        newProposal.executed = false;
        newProposal.canceled = false;

        // Emit the event with actual start/end times
        emit ProposalCreated(proposalId, msg.sender, targets, values, signatures, calldatas, startTime, endTime, description);

        proposalCounter++; // Increment counter *after* using it for the ID
        return proposalId;
    }

     function vote(uint256 proposalId, bool support) public virtual {
        // TDD_ANCHOR: Test_Governance_Vote_Fail_NotVotingMember
        require(membershipContract.isVotingMember(msg.sender), "Governance: Caller is not a voting member");

        Proposal storage proposal = proposals[proposalId];

        // Check if proposal exists (implicitly checked by accessing endTime, but explicit check is clearer)
        require(proposal.startTime > 0, "Governance: Proposal does not exist"); // startTime is 0 for non-existent proposals

        // TDD_ANCHOR: Test_Governance_Vote_Fail_ProposalNotActive
        require(block.timestamp >= proposal.startTime, "Governance: Proposal not started");
        require(block.timestamp <= proposal.endTime, "Governance: Proposal not active"); // Checks ended proposals

        // TDD_ANCHOR: Test_Governance_Vote_Fail_AlreadyVoted
        require(!proposal.hasVoted[msg.sender], "Governance: Voter already voted");

        // TDD_ANCHOR: Test_Governance_Vote_Success
        uint256 voteWeight = getVotes(msg.sender); // Get voter's weight (currently 1)
        require(voteWeight > 0, "Governance: Voter has no voting power"); // Sanity check

        // Update state
        proposal.hasVoted[msg.sender] = true;
        if (support) {
            proposal.forVotes += voteWeight;
        } else {
            proposal.againstVotes += voteWeight;
        }

        emit Voted(proposalId, msg.sender, support, voteWeight);
    }

    function executeProposal(uint256 proposalId) public payable virtual {
        Proposal storage proposal = proposals[proposalId];

        // TDD_ANCHOR: Test_Governance_ExecuteProposal_Fail_AlreadyExecuted
        require(!proposal.executed, "Governance: Proposal already executed");
        // Add check for canceled proposals if cancellation is implemented
        // require(!proposal.canceled, "Governance: Proposal canceled");

        // TDD_ANCHOR: Test_Governance_ExecuteProposal_Fail_Expired (Incorrect anchor name, should be something like Fail_VotingNotEnded)
        require(block.timestamp > proposal.endTime, "Governance: Voting period not ended");

        // TDD_ANCHOR: Test_Governance_ExecuteProposal_Fail_QuorumNotMet
        // Check Quorum (>50% participation required)
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        uint256 totalMembers = membershipContract.getTotalVotingMembers();
        require(totalMembers > 0, "Governance: No voting members exist"); // Prevent division by zero / nonsensical quorum
        require(totalVotes * 2 > totalMembers, "Governance: Quorum not reached"); // Simple >50% quorum

        // TDD_ANCHOR: Test_Governance_ExecuteProposal_Fail_NotEnoughVotes
        // Check Vote Threshold (simple majority of votes cast)
        require(proposal.forVotes > proposal.againstVotes, "Governance: Proposal did not pass");

        // TDD_ANCHOR: Test_Governance_ExecuteProposal_Success_Majority
        proposal.executed = true;

        // --- Execute Proposal Actions ---
        // TDD_ANCHOR: Test_Governance_ExecuteProposal_Fail_ExecutionFailed
        for (uint i = 0; i < proposal.targets.length; i++) {
            (bool success, bytes memory result) = proposal.targets[i].call{value: proposal.values[i]}(proposal.calldatas[i]);
            // If a call fails, revert the whole execution. Consider if partial execution is ever desired.
            require(success, "Governance: Proposal execution failed");
        }

        emit ProposalExecuted(proposalId);
    }

    // --- Placeholder for parameter update functions (called via proposals) ---
    // TDD_ANCHOR: Test_Governance_UpdateEntryFee
    // TDD_ANCHOR: Test_Governance_UpdateIncomeSplit

    // --- Placeholder for founder rights logic ---
    // TDD_ANCHOR: Test_Governance_FounderRights_VotingPower
    // TDD_ANCHOR: Test_Governance_FounderRights_Expiry
    function getVotes(address account) public view virtual returns (uint256) {
        // TDD_ANCHOR: Test_Governance_FounderRights_VotingPower
        // TDD_ANCHOR: Test_Governance_FounderRights_Expiry
        // TODO: Implement logic for special founder voting power and expiry if needed

        // Return 1 vote if they are a voting member, 0 otherwise
        if (membershipContract.isVotingMember(account)) {
            return 1; // Standard voting power
        } else {
            return 0;
        }
    }

    // --- Getter function required by the test ---
    // Returns core proposal details (excluding arrays/mappings to avoid stack issues)
    function getProposalCoreDetails(uint256 proposalId) public view returns (
        uint256 id,
        address proposer,
        uint256 startTime,
        uint256 endTime,
        string memory description,
        bool executed,
        bool canceled,
        uint256 forVotes,
        uint256 againstVotes
    ) {
        Proposal storage p = proposals[proposalId];
        // Ensure proposal exists before returning, otherwise return defaults
        if (p.startTime == 0) {
             return (0, address(0), 0, 0, "", false, false, 0, 0);
        }
        return (
            p.id,
            p.proposer,
            p.startTime,
            p.endTime,
            p.description,
            p.executed,
            p.canceled,
            p.forVotes,
            p.againstVotes
        );
    }

    // --- Specific Getters for Array/Mapping Data ---

    function getProposalTargets(uint256 proposalId) public view returns (address[] memory) {
        return proposals[proposalId].targets;
    }

    function getProposalValues(uint256 proposalId) public view returns (uint256[] memory) {
        return proposals[proposalId].values;
    }

    function getProposalSignatures(uint256 proposalId) public view returns (string[] memory) {
        return proposals[proposalId].signatures;
    }

    function getProposalCalldatas(uint256 proposalId) public view returns (bytes[] memory) {
        return proposals[proposalId].calldatas;
    }

    function hasVoted(uint256 proposalId, address voter) public view returns (bool) {
        return proposals[proposalId].hasVoted[voter];
    }
}
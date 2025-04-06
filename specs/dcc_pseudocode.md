# DCC Smart Contract Pseudocode Specification

This document provides pseudocode for the core smart contracts of the Decentralised Consulting Collective (DCC), based on the whitepaper and user stories.

---

## Module: `Constants.sol` (or equivalent)

```pseudocode
// TDD_ANCHOR: Test_Constants_InitialValues
// TDD_ANCHOR: Test_Constants_Immutability

CONSTANT MAX_FOUNDER_CONTRIBUTION = 500 ether; // Example value, adjust unit as needed
CONSTANT INITIAL_COMPANY_INCOME_PERCENTAGE = 20; // Example: 20%
CONSTANT INITIAL_VOTING_MEMBER_ENTRY_FEE = 1000 ether; // Example value
CONSTANT FOUNDER_SPECIAL_RIGHTS_DURATION = 365 days; // Example: 1 year

// Enum for Membership Types
ENUM MembershipType { None, Founding, Voting, NonVoting }

// Enum for Proposal Status
ENUM ProposalStatus { Pending, Active, Succeeded, Defeated, Executed, Expired }

// Struct for Proposals
STRUCT Proposal {
    id: uint;
    proposer: address;
    description: string;
    targetContract: address; // Contract to call if proposal passes
    callData: bytes; // Function signature and arguments
    creationTime: uint;
    votingDeadline: uint;
    forVotes: uint;
    againstVotes: uint;
    status: ProposalStatus;
    voters: mapping(address => bool); // Track who has voted
}

// Struct for Members
STRUCT Member {
    memberAddress: address;
    memberType: MembershipType;
    joinDate: uint;
    // Other relevant off-chain linked data might be referenced via ID
}
```

---

## Module: `MembershipContract.sol`

```pseudocode
// TDD_ANCHOR: Test_Membership_Initialization
// TDD_ANCHOR: Test_Membership_AddFounder
// TDD_ANCHOR: Test_Membership_AddVotingMember_Success
// TDD_ANCHOR: Test_Membership_AddVotingMember_Fail_InsufficientFee
// TDD_ANCHOR: Test_Membership_AddVotingMember_Fail_AlreadyMember
// TDD_ANCHOR: Test_Membership_AddNonVotingMember
// TDD_ANCHOR: Test_Membership_GetMemberType
// TDD_ANCHOR: Test_Membership_IsVotingMember
// TDD_ANCHOR: Test_Membership_OnlyGovernanceCanAddFounders
// TDD_ANCHOR: Test_Membership_OnlyAdminCanAddNonVoting

IMPORT Constants;
IMPORT Ownable; // Or similar access control

CONTRACT MembershipContract IS Ownable { // Ownable might be replaced by Governance control

    // --- State Variables ---
    governanceContractAddress: address;
    incomeManagementContractAddress: address;
    members: mapping(address => Member);
    memberCount: uint;
    votingMemberCount: uint;

    // --- Events ---
    EVENT MemberRegistered(memberAddress: address, memberType: MembershipType, joinDate: uint);
    EVENT VotingFeePaid(memberAddress: address, amount: uint);

    // --- Constructor ---
    // TDD_ANCHOR: Test_Membership_Constructor
    CONSTRUCTOR(initialGovernanceAddress: address, initialIncomeMgmtAddress: address) {
        SET governanceContractAddress = initialGovernanceAddress;
        SET incomeManagementContractAddress = initialIncomeMgmtAddress;
        // Set owner/admin if using Ownable
    }

    // --- Modifiers ---
    MODIFIER onlyGovernance() {
        REQUIRE(CALLER == governanceContractAddress, "Only Governance contract can call this");
        _;
    }

    MODIFIER onlyAdmin() { // Admin might be Directors initially, potentially Governance later
        REQUIRE(CALLER == OWNER() OR CALLER == governanceContractAddress, "Only Admin or Governance can call this"); // Example access control
        _;
    }

    // --- Functions ---

    // Called by Governance during initial setup
    // TDD_ANCHOR: Test_Membership_RegisterFounder_Success
    // TDD_ANCHOR: Test_Membership_RegisterFounder_Fail_NotGovernance
    FUNCTION registerFounder(founderAddress: address) EXTERNAL onlyGovernance {
        REQUIRE(members[founderAddress].memberType == MembershipType.None, "Address already registered");

        memberCount++;
        members[founderAddress] = Member({
            memberAddress: founderAddress,
            memberType: MembershipType.Founding,
            joinDate: CURRENT_TIMESTAMP
        });
        EMIT MemberRegistered(founderAddress, MembershipType.Founding, CURRENT_TIMESTAMP);
    }

    // Public function for potential members to join
    // TDD_ANCHOR: Test_Membership_JoinAsVotingMember_CorrectFee
    // TDD_ANCHOR: Test_Membership_JoinAsVotingMember_IncorrectFee
    FUNCTION joinAsVotingMember() EXTERNAL PAYABLE {
        REQUIRE(members[CALLER].memberType == MembershipType.None, "Address already registered");

        // Get current entry fee from Governance Contract
        currentEntryFee: uint = GovernanceContract(governanceContractAddress).getCurrentVotingMemberEntryFee();
        REQUIRE(MSG_VALUE == currentEntryFee, "Incorrect entry fee paid");

        // Register member
        memberCount++;
        votingMemberCount++;
        members[CALLER] = Member({
            memberAddress: CALLER,
            memberType: MembershipType.Voting,
            joinDate: CURRENT_TIMESTAMP
        });

        // Emit events
        EMIT VotingFeePaid(CALLER, MSG_VALUE);
        EMIT MemberRegistered(CALLER, MembershipType.Voting, CURRENT_TIMESTAMP);

        // Forward fee to Income Management Contract
        // TDD_ANCHOR: Test_Membership_JoinAsVotingMember_FeeForwarding
        (success: bool, ) = incomeManagementContractAddress.call{value: MSG_VALUE}("");
        REQUIRE(success, "Failed to forward entry fee");
    }

    // Called by Admin/Governance to add non-voting members
    // TDD_ANCHOR: Test_Membership_RegisterNonVotingMember_Success
    // TDD_ANCHOR: Test_Membership_RegisterNonVotingMember_Fail_NotAdmin
    FUNCTION registerNonVotingMember(memberAddress: address) EXTERNAL onlyAdmin {
         REQUIRE(members[memberAddress].memberType == MembershipType.None, "Address already registered");

        memberCount++;
        members[memberAddress] = Member({
            memberAddress: memberAddress,
            memberType: MembershipType.NonVoting,
            joinDate: CURRENT_TIMESTAMP
        });
        EMIT MemberRegistered(memberAddress, MembershipType.NonVoting, CURRENT_TIMESTAMP);
    }

    // --- View Functions ---

    // TDD_ANCHOR: Test_Membership_GetMemberInfo
    FUNCTION getMemberInfo(memberAddress: address) EXTERNAL VIEW RETURNS (Member) {
        RETURN members[memberAddress];
    }

    // TDD_ANCHOR: Test_Membership_IsVotingMember_True
    // TDD_ANCHOR: Test_Membership_IsVotingMember_False
    FUNCTION isVotingMember(memberAddress: address) EXTERNAL VIEW RETURNS (bool) {
        RETURN members[memberAddress].memberType == MembershipType.Voting OR members[memberAddress].memberType == MembershipType.Founding; // Founders also vote
    }

    FUNCTION getMemberType(memberAddress: address) EXTERNAL VIEW RETURNS (MembershipType) {
        RETURN members[memberAddress].memberType;
    }

    FUNCTION getTotalMemberCount() EXTERNAL VIEW RETURNS (uint) {
        RETURN memberCount;
    }

    FUNCTION getVotingMemberCount() EXTERNAL VIEW RETURNS (uint) {
        RETURN votingMemberCount; // Or calculate by iterating if needed, depends on gas vs storage cost
    }

    // Function to update contract addresses if needed (controlled by Governance)
    // TDD_ANCHOR: Test_Membership_UpdateGovernanceAddress
    FUNCTION setGovernanceContract(newAddress: address) EXTERNAL onlyGovernance {
        governanceContractAddress = newAddress;
    }
    // TDD_ANCHOR: Test_Membership_UpdateIncomeMgmtAddress
     FUNCTION setIncomeManagementContract(newAddress: address) EXTERNAL onlyGovernance {
        incomeManagementContractAddress = newAddress;
    }
}
```

---

## Module: `PaymentContract.sol`

```pseudocode
// TDD_ANCHOR: Test_Payment_Initialization
// TDD_ANCHOR: Test_Payment_SetRate_Success
// TDD_ANCHOR: Test_Payment_SetRate_Fail_NotAdminOrGovernance
// TDD_ANCHOR: Test_Payment_GetRate
// TDD_ANCHOR: Test_Payment_CalculateEarnings_Simple
// TDD_ANCHOR: Test_Payment_CalculateEarnings_ZeroRate
// TDD_ANCHOR: Test_Payment_CalculateEarnings_ZeroContribution

IMPORT Constants;
IMPORT Ownable; // Or Governance controlled

CONTRACT PaymentContract IS Ownable { // Or controlled by Governance

    // --- State Variables ---
    governanceContractAddress: address;
    consultantRates: mapping(address => uint); // Stores rate (e.g., daily rate in smallest unit)

    // --- Events ---
    EVENT RateSet(consultantAddress: address, rate: uint);

    // --- Constructor ---
    // TDD_ANCHOR: Test_Payment_Constructor
    CONSTRUCTOR(initialGovernanceAddress: address) {
        SET governanceContractAddress = initialGovernanceAddress;
        // Set owner/admin
    }

    // --- Modifiers ---
     MODIFIER onlyAdminOrGovernance() {
        REQUIRE(CALLER == OWNER() OR CALLER == governanceContractAddress, "Caller is not Admin or Governance");
        _;
    }

    // --- Functions ---

    // Called by Admin/Director initially, potentially Governance later
    // TDD_ANCHOR: Test_Payment_SetConsultantRate_Success
    // TDD_ANCHOR: Test_Payment_SetConsultantRate_Fail_Unauthorized
    FUNCTION setConsultantRate(consultantAddress: address, dailyRate: uint) EXTERNAL onlyAdminOrGovernance {
        consultantRates[consultantAddress] = dailyRate;
        EMIT RateSet(consultantAddress, dailyRate);
    }

    // --- View Functions ---

    // TDD_ANCHOR: Test_Payment_GetConsultantRate_Exists
    // TDD_ANCHOR: Test_Payment_GetConsultantRate_NotExists
    FUNCTION getConsultantRate(consultantAddress: address) EXTERNAL VIEW RETURNS (uint) {
        RETURN consultantRates[consultantAddress];
    }

    // Calculates earnings based on rate and contribution (e.g., days worked)
    // Contribution data might come from off-chain oracle or trusted input
    // TDD_ANCHOR: Test_Payment_CalculatePaymentAmount
    FUNCTION calculatePaymentAmount(consultantAddress: address, contributionUnits: uint) EXTERNAL VIEW RETURNS (uint) {
        rate: uint = consultantRates[consultantAddress];
        REQUIRE(rate > 0, "Consultant rate not set or is zero");
        RETURN rate * contributionUnits;
    }

     // Function to update Governance contract address if needed
    // TDD_ANCHOR: Test_Payment_UpdateGovernanceAddress
    FUNCTION setGovernanceContract(newAddress: address) EXTERNAL onlyAdminOrGovernance { // Or just Governance
        governanceContractAddress = newAddress;
    }
}

```

---

## Module: `IncomeManagementContract.sol`

```pseudocode
// TDD_ANCHOR: Test_Income_Initialization
// TDD_ANCHOR: Test_Income_ReceiveClientPayment_Success
// TDD_ANCHOR: Test_Income_ReceiveClientPayment_Fail_ZeroAmount
// TDD_ANCHOR: Test_Income_DistributeProjectPayment_Success
// TDD_ANCHOR: Test_Income_DistributeProjectPayment_Fail_InsufficientFunds
// TDD_ANCHOR: Test_Income_DistributeProjectPayment_Fail_Unauthorized
// TDD_ANCHOR: Test_Income_DistributeProjectPayment_CorrectSplit
// TDD_ANCHOR: Test_Income_DistributeCompanyProfits_Success
// TDD_ANCHOR: Test_Income_DistributeCompanyProfits_Fail_InsufficientFunds
// TDD_ANCHOR: Test_Income_DistributeCompanyProfits_Fail_Unauthorized
// TDD_ANCHOR: Test_Income_DistributeCompanyProfits_CorrectShares
// TDD_ANCHOR: Test_Income_ReceiveMembershipFee

IMPORT Constants;
IMPORT Ownable; // Or Governance controlled

CONTRACT IncomeManagementContract IS Ownable { // Or controlled by Governance

    // --- State Variables ---
    governanceContractAddress: address;
    paymentContractAddress: address;
    membershipContractAddress: address; // Needed to get voting member list for profit distribution

    companyIncomePercentage: uint; // e.g., 20 for 20%
    retainedCompanyIncome: uint; // Income held for company costs/profits

    // --- Events ---
    EVENT ClientPaymentReceived(clientAddress: address, amount: uint, timestamp: uint);
    EVENT ConsultantPaid(consultantAddress: address, amount: uint, projectIdentifier: string); // projectIdentifier might be off-chain link
    EVENT CompanyIncomeAllocated(amount: uint);
    EVENT ProfitDistributed(memberAddress: address, amount: uint);
    EVENT MembershipFeeReceived(memberAddress: address, amount: uint);

    // --- Constructor ---
    // TDD_ANCHOR: Test_Income_Constructor
    CONSTRUCTOR(initialGovernanceAddress: address, initialPaymentAddress: address, initialMembershipAddress: address) {
        SET governanceContractAddress = initialGovernanceAddress;
        SET paymentContractAddress = initialPaymentAddress;
        SET membershipContractAddress = initialMembershipAddress;
        SET companyIncomePercentage = Constants.INITIAL_COMPANY_INCOME_PERCENTAGE;
        // Set owner/admin
    }

    // --- Modifiers ---
    MODIFIER onlyGovernance() {
        REQUIRE(CALLER == governanceContractAddress, "Only Governance contract can call this");
        _;
    }

     MODIFIER onlyAdminOrGovernance() { // For actions like triggering project payments
        REQUIRE(CALLER == OWNER() OR CALLER == governanceContractAddress, "Caller is not Admin or Governance");
        _;
    }

    // --- Receive Function ---
    // Accepts payments from clients and membership fees
    // TDD_ANCHOR: Test_Income_ReceiveFunction_ClientPayment
    // TDD_ANCHOR: Test_Income_ReceiveFunction_MembershipFee
    RECEIVE() EXTERNAL PAYABLE {
        // Basic check: could add logic to verify sender if needed (e.g., registered clients)
        // Or differentiate based on sender (e.g., if MembershipContract address sends, it's a fee)
        IF (CALLER == membershipContractAddress) {
             retainedCompanyIncome += MSG_VALUE; // Membership fees go to company funds
             EMIT MembershipFeeReceived(CALLER, MSG_VALUE); // CALLER here is MembershipContract, might need more info
        } ELSE {
            // Assume client payment
            EMIT ClientPaymentReceived(CALLER, MSG_VALUE, CURRENT_TIMESTAMP);
            // Allocation happens when payment is distributed, not on receipt
        }
    }

    // --- Functions ---

    // Called by Admin/Governance to trigger payment distribution for a project
    // TDD_ANCHOR: Test_Income_ProcessProjectPayment_FullDistribution
    // TDD_ANCHOR: Test_Income_ProcessProjectPayment_PartialDistribution
    FUNCTION processProjectPayment(
        totalPaymentReceived: uint, // The amount received for this specific project/milestone
        consultants: address[],
        contributions: uint[], // Units of work per consultant (e.g., days)
        projectIdentifier: string
    ) EXTERNAL onlyAdminOrGovernance {
        REQUIRE(consultants.length == contributions.length, "Input array lengths mismatch");
        REQUIRE(totalPaymentReceived > 0, "Payment amount must be positive");
        REQUIRE(ADDRESS(this).balance >= totalPaymentReceived, "Insufficient contract balance for this payment"); // Basic check

        // 1. Calculate Company Cut
        companyCut: uint = (totalPaymentReceived * companyIncomePercentage) / 100;
        retainedCompanyIncome += companyCut;
        EMIT CompanyIncomeAllocated(companyCut);

        // 2. Calculate Total Consultant Payout
        totalConsultantPayout: uint = 0;
        paymentAmounts: uint[] = NEW uint[](consultants.length);
        paymentContract: PaymentContract = PaymentContract(paymentContractAddress);

        FOR i = 0 TO consultants.length - 1 {
            consultantAddress: address = consultants[i];
            contribution: uint = contributions[i];
            // TDD_ANCHOR: Test_Income_ProcessProjectPayment_GetRateFromPaymentContract
            amount: uint = paymentContract.calculatePaymentAmount(consultantAddress, contribution);
            paymentAmounts[i] = amount;
            totalConsultantPayout += amount;
        }

        // 3. Verify total payout doesn't exceed available funds (after company cut)
        availableForConsultants: uint = totalPaymentReceived - companyCut;
        REQUIRE(totalConsultantPayout <= availableForConsultants, "Calculated payout exceeds available funds");
        // Note: If totalConsultantPayout < availableForConsultants, the remainder stays in the contract balance
        // This remainder should ideally be allocated to retainedCompanyIncome as well.
        IF (totalConsultantPayout < availableForConsultants) {
             unallocatedAmount = availableForConsultants - totalConsultantPayout;
             retainedCompanyIncome += unallocatedAmount;
             EMIT CompanyIncomeAllocated(unallocatedAmount); // Log this extra allocation
        }


        // 4. Distribute Payments to Consultants
        FOR i = 0 TO consultants.length - 1 {
            IF (paymentAmounts[i] > 0) {
                // TDD_ANCHOR: Test_Income_ProcessProjectPayment_ConsultantTransferSuccess
                // TDD_ANCHOR: Test_Income_ProcessProjectPayment_ConsultantTransferFail
                (success: bool, ) = consultants[i].call{value: paymentAmounts[i]}("");
                REQUIRE(success, "Consultant payment transfer failed");
                EMIT ConsultantPaid(consultants[i], paymentAmounts[i], projectIdentifier);
            }
        }
    }

    // Called by Governance to trigger distribution of retained income to voting members
    // TDD_ANCHOR: Test_Income_DistributeProfits_EvenSplit
    // TDD_ANCHOR: Test_Income_DistributeProfits_ZeroMembers
    FUNCTION distributeCompanyProfits(amountToDistribute: uint, votingMembers: address[]) EXTERNAL onlyGovernance {
        REQUIRE(amountToDistribute > 0, "Distribution amount must be positive");
        REQUIRE(retainedCompanyIncome >= amountToDistribute, "Insufficient retained income");
        REQUIRE(votingMembers.length > 0, "No voting members provided for distribution");

        retainedCompanyIncome -= amountToDistribute;
        sharePerMember: uint = amountToDistribute / votingMembers.length; // Integer division, remainder stays
        remainder: uint = amountToDistribute % votingMembers.length;

        // Add remainder back to retained income
        IF (remainder > 0) {
            retainedCompanyIncome += remainder;
        }


        IF (sharePerMember > 0) {
            FOR i = 0 TO votingMembers.length - 1 {
                 // TDD_ANCHOR: Test_Income_DistributeProfits_MemberTransferSuccess
                 // TDD_ANCHOR: Test_Income_DistributeProfits_MemberTransferFail
                (success: bool, ) = votingMembers[i].call{value: sharePerMember}("");
                 // Consider handling failures - log, retry? For now, require success.
                REQUIRE(success, "Profit distribution transfer failed");
                EMIT ProfitDistributed(votingMembers[i], sharePerMember);
            }
        }
    }

    // Called by Governance to update the company income percentage
    // TDD_ANCHOR: Test_Income_UpdateCompanyIncomePercentage
    FUNCTION setCompanyIncomePercentage(newPercentage: uint) EXTERNAL onlyGovernance {
        REQUIRE(newPercentage <= 100, "Percentage cannot exceed 100");
        companyIncomePercentage = newPercentage;
    }

    // --- View Functions ---

    // TDD_ANCHOR: Test_Income_GetRetainedIncome
    FUNCTION getRetainedCompanyIncome() EXTERNAL VIEW RETURNS (uint) {
        RETURN retainedCompanyIncome;
    }

    // TDD_ANCHOR: Test_Income_GetCompanyIncomePercentage
    FUNCTION getCompanyIncomePercentage() EXTERNAL VIEW RETURNS (uint) {
        RETURN companyIncomePercentage;
    }

    // Function to update contract addresses if needed (controlled by Governance)
    // TDD_ANCHOR: Test_Income_UpdateGovernanceAddress
    FUNCTION setGovernanceContract(newAddress: address) EXTERNAL onlyGovernance {
        governanceContractAddress = newAddress;
    }
    // TDD_ANCHOR: Test_Income_UpdatePaymentAddress
    FUNCTION setPaymentContract(newAddress: address) EXTERNAL onlyGovernance {
        paymentContractAddress = newAddress;
    }
     // TDD_ANCHOR: Test_Income_UpdateMembershipAddress
    FUNCTION setMembershipContract(newAddress: address) EXTERNAL onlyGovernance {
        membershipContractAddress = newAddress;
    }
}
```

---

## Module: `GovernanceContract.sol`

```pseudocode
// TDD_ANCHOR: Test_Governance_Initialization
// TDD_ANCHOR: Test_Governance_CreateProposal_Success
// TDD_ANCHOR: Test_Governance_CreateProposal_Fail_NotVotingMember
// TDD_ANCHOR: Test_Governance_Vote_Success
// TDD_ANCHOR: Test_Governance_Vote_Fail_NotVotingMember
// TDD_ANCHOR: Test_Governance_Vote_Fail_AlreadyVoted
// TDD_ANCHOR: Test_Governance_Vote_Fail_ProposalNotActive
// TDD_ANCHOR: Test_Governance_ExecuteProposal_Success_Majority
// TDD_ANCHOR: Test_Governance_ExecuteProposal_Fail_NotEnoughVotes
// TDD_ANCHOR: Test_Governance_ExecuteProposal_Fail_Expired
// TDD_ANCHOR: Test_Governance_ExecuteProposal_Fail_AlreadyExecuted
// TDD_ANCHOR: Test_Governance_ExecuteProposal_Fail_ExecutionFailed
// TDD_ANCHOR: Test_Governance_UpdateEntryFee
// TDD_ANCHOR: Test_Governance_UpdateIncomeSplit
// TDD_ANCHOR: Test_Governance_FounderRights_VotingPower
// TDD_ANCHOR: Test_Governance_FounderRights_Expiry

IMPORT Constants;
IMPORT Ownable; // For initial setup/admin

CONTRACT GovernanceContract IS Ownable { // Owner for setup, then potentially self-governed

    // --- State Variables ---
    membershipContractAddress: address;
    incomeManagementContractAddress: address;
    paymentContractAddress: address;

    proposals: mapping(uint => Proposal);
    proposalCount: uint;
    votingPeriod: uint; // e.g., 7 days in seconds
    quorumPercentage: uint; // e.g., 50% of voting members needed to vote
    founderVotingMultiplier: uint; // How many votes a founder gets during special period
    founderRightsExpiryTime: uint;

    currentVotingMemberEntryFee: uint;

    // --- Events ---
    EVENT ProposalCreated(proposalId: uint, proposer: address, description: string, votingDeadline: uint);
    EVENT Voted(proposalId: uint, voter: address, support: bool); // true = for, false = against
    EVENT ProposalExecuted(proposalId: uint);
    EVENT ProposalStatusChange(proposalId: uint, newStatus: ProposalStatus);
    EVENT VotingMemberEntryFeeChanged(newFee: uint);
    EVENT CompanyIncomePercentageChanged(newPercentage: uint); // Via proposal execution

    // --- Constructor ---
    // TDD_ANCHOR: Test_Governance_Constructor
    CONSTRUCTOR(initialMembershipAddress: address, initialIncomeMgmtAddress: address, initialPaymentAddress: address, initialFounders: address[]) {
        SET membershipContractAddress = initialMembershipAddress;
        SET incomeManagementContractAddress = initialIncomeMgmtAddress;
        SET paymentContractAddress = initialPaymentAddress;
        SET votingPeriod = 7 days; // Example
        SET quorumPercentage = 50; // Example
        SET founderVotingMultiplier = 5; // Example: Founder vote counts as 5
        SET founderRightsExpiryTime = CURRENT_TIMESTAMP + Constants.FOUNDER_SPECIAL_RIGHTS_DURATION;
        SET currentVotingMemberEntryFee = Constants.INITIAL_VOTING_MEMBER_ENTRY_FEE;

        // Register initial founders via MembershipContract
        membershipContract: MembershipContract = MembershipContract(membershipContractAddress);
        FOR i = 0 TO initialFounders.length - 1 {
            // TDD_ANCHOR: Test_Governance_Constructor_RegisterFounders
            membershipContract.registerFounder(initialFounders[i]);
        }
        // Transfer ownership if needed, or keep owner for emergency admin
    }

    // --- Modifiers ---
    MODIFIER onlyVotingMember() {
        membershipContract: MembershipContract = MembershipContract(membershipContractAddress);
        REQUIRE(membershipContract.isVotingMember(CALLER), "Caller is not a voting member");
        _;
    }

    // --- Functions ---

    // TDD_ANCHOR: Test_Governance_Propose_FeeChange
    // TDD_ANCHOR: Test_Governance_Propose_IncomeSplitChange
    // TDD_ANCHOR: Test_Governance_Propose_GenericCall
    FUNCTION createProposal(description: string, targetContract: address, callData: bytes) EXTERNAL onlyVotingMember RETURNS (uint) {
        proposalCount++;
        proposalId: uint = proposalCount;
        deadline: uint = CURRENT_TIMESTAMP + votingPeriod;

        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: CALLER,
            description: description,
            targetContract: targetContract,
            callData: callData,
            creationTime: CURRENT_TIMESTAMP,
            votingDeadline: deadline,
            forVotes: 0,
            againstVotes: 0,
            status: ProposalStatus.Active,
            voters: mapping(address => bool)() // Initialize empty map
        });

        EMIT ProposalCreated(proposalId, CALLER, description, deadline);
        RETURN proposalId;
    }

    // TDD_ANCHOR: Test_Governance_Vote_For
    // TDD_ANCHOR: Test_Governance_Vote_Against
    // TDD_ANCHOR: Test_Governance_Vote_FounderMultiplier_Active
    // TDD_ANCHOR: Test_Governance_Vote_FounderMultiplier_Expired
    FUNCTION vote(proposalId: uint, support: bool) EXTERNAL onlyVotingMember {
        proposal: Proposal STORAGE = proposals[proposalId];
        REQUIRE(proposal.status == ProposalStatus.Active, "Proposal not active");
        REQUIRE(CURRENT_TIMESTAMP <= proposal.votingDeadline, "Voting period has ended");
        REQUIRE(!proposal.voters[CALLER], "Already voted");

        proposal.voters[CALLER] = true;
        voteWeight: uint = 1;

        // Check for founder special rights
        IF (CURRENT_TIMESTAMP < founderRightsExpiryTime) {
            membershipContract: MembershipContract = MembershipContract(membershipContractAddress);
            memberType: MembershipType = membershipContract.getMemberType(CALLER);
            IF (memberType == MembershipType.Founding) {
                voteWeight = founderVotingMultiplier;
            }
        }

        IF (support) {
            proposal.forVotes += voteWeight;
        } ELSE {
            proposal.againstVotes += voteWeight;
        }

        EMIT Voted(proposalId, CALLER, support);
    }

    // TDD_ANCHOR: Test_Governance_Execute_Success_FeeChange
    // TDD_ANCHOR: Test_Governance_Execute_Success_IncomeSplitChange
    // TDD_ANCHOR: Test_Governance_Execute_Fail_QuorumNotMet
    // TDD_ANCHOR: Test_Governance_Execute_Fail_VotesAgainst
    FUNCTION executeProposal(proposalId: uint) EXTERNAL { // Anyone can trigger execution check after deadline
        proposal: Proposal STORAGE = proposals[proposalId];
        REQUIRE(proposal.status == ProposalStatus.Active, "Proposal not active for execution");
        REQUIRE(CURRENT_TIMESTAMP > proposal.votingDeadline, "Voting period not yet ended");

        membershipContract: MembershipContract = MembershipContract(membershipContractAddress);
        totalVotingPower: uint = membershipContract.getVotingMemberCount(); // Simplistic; needs adjustment for founder multiplier if active
        // TODO: Recalculate totalVotingPower considering active founder multiplier period

        totalVotesCast: uint = proposal.forVotes + proposal.againstVotes;
        quorumThreshold: uint = (totalVotingPower * quorumPercentage) / 100;

        IF (totalVotesCast < quorumThreshold) {
            proposal.status = ProposalStatus.Defeated; // Or Expired? Defeated implies quorum failure
            EMIT ProposalStatusChange(proposalId, ProposalStatus.Defeated);
            RETURN;
        }

        IF (proposal.forVotes > proposal.againstVotes) {
            proposal.status = ProposalStatus.Succeeded;
            EMIT ProposalStatusChange(proposalId, ProposalStatus.Succeeded);

            // Execute the proposal's action
            // TDD_ANCHOR: Test_Governance_Execute_TargetCallSuccess
            // TDD_ANCHOR: Test_Governance_Execute_TargetCallFail
            (success: bool, ) = proposal.targetContract.call(proposal.callData);
            IF (success) {
                proposal.status = ProposalStatus.Executed;
                EMIT ProposalExecuted(proposalId);
                EMIT ProposalStatusChange(proposalId, ProposalStatus.Executed);
            } ELSE {
                // Execution failed - revert? Or just mark as failed execution?
                // Mark as Succeeded but Failed Execution? Needs careful state handling.
                // For now, assume revert or mark as Defeated post-success? Let's mark Defeated for simplicity.
                 proposal.status = ProposalStatus.Defeated; // Execution Failed
                 EMIT ProposalStatusChange(proposalId, ProposalStatus.Defeated);
                 // Consider logging the failure reason if possible
            }
        } ELSE {
            proposal.status = ProposalStatus.Defeated;
            EMIT ProposalStatusChange(proposalId, ProposalStatus.Defeated);
        }
    }

    // --- Governance Actions (Called via Proposals) ---

    // TDD_ANCHOR: Test_Governance_Action_SetEntryFee
    FUNCTION action_setVotingMemberEntryFee(newFee: uint) EXTERNAL {
        REQUIRE(CALLER == ADDRESS(this), "Can only be called by Governance proposal execution");
        currentVotingMemberEntryFee = newFee;
        EMIT VotingMemberEntryFeeChanged(newFee);
    }

    // TDD_ANCHOR: Test_Governance_Action_SetIncomePercentage
    FUNCTION action_setCompanyIncomePercentage(newPercentage: uint) EXTERNAL {
         REQUIRE(CALLER == ADDRESS(this), "Can only be called by Governance proposal execution");
         incomeMgmtContract: IncomeManagementContract = IncomeManagementContract(incomeManagementContractAddress);
         incomeMgmtContract.setCompanyIncomePercentage(newPercentage);
         // Event emitted by IncomeManagementContract
    }

     // TDD_ANCHOR: Test_Governance_Action_DistributeProfits
    FUNCTION action_distributeCompanyProfits(amountToDistribute: uint) EXTERNAL {
        REQUIRE(CALLER == ADDRESS(this), "Can only be called by Governance proposal execution");
        // Need to get list of current voting members from MembershipContract
        // This is complex and potentially gas-intensive on-chain.
        // Option 1: MembershipContract provides a view function (gas limit issues?)
        // Option 2: Off-chain service prepares the list and includes it in proposal callData (trust issue?)
        // Option 3: Iterate through known members (requires storing member list here or in Membership) - gas intensive

        // Assuming MembershipContract has a way to provide the list (simplification)
        membershipContract: MembershipContract = MembershipContract(membershipContractAddress);
        // votingMembers: address[] = membershipContract.getAllVotingMembers(); // Hypothetical function

        // Placeholder: Requires a mechanism to get votingMembers list
        votingMembers: address[] = NEW address[](0); // <<-- NEEDS IMPLEMENTATION DETAIL
        REQUIRE(votingMembers.length > 0, "Cannot distribute profits, failed to get member list");


        incomeMgmtContract: IncomeManagementContract = IncomeManagementContract(incomeManagementContractAddress);
        incomeMgmtContract.distributeCompanyProfits(amountToDistribute, votingMembers);
         // Event emitted by IncomeManagementContract
    }

    // TDD_ANCHOR: Test_Governance_Action_UpdateMembershipContractAddress
     FUNCTION action_setMembershipContract(newAddress: address) EXTERNAL {
         REQUIRE(CALLER == ADDRESS(this), "Can only be called by Governance proposal execution");
         membershipContractAddress = newAddress;
         // Potentially notify other contracts?
     }
     // Add similar actions for updating other contract addresses...

    // --- View Functions ---

    // TDD_ANCHOR: Test_Governance_GetProposal
    FUNCTION getProposal(proposalId: uint) EXTERNAL VIEW RETURNS (Proposal) {
        RETURN proposals[proposalId];
    }

    // TDD_ANCHOR: Test_Governance_GetCurrentEntryFee
    FUNCTION getCurrentVotingMemberEntryFee() EXTERNAL VIEW RETURNS (uint) {
        RETURN currentVotingMemberEntryFee;
    }

    // TDD_ANCHOR: Test_Governance_GetFounderRightsExpiry
    FUNCTION getFounderRightsExpiryTime() EXTERNAL VIEW RETURNS (uint) {
        RETURN founderRightsExpiryTime;
    }

}
```

---

This pseudocode provides a structural foundation. Implementation details, especially around off-chain data integration (like project contribution tracking) and gas optimization (like fetching large lists of members), will require further refinement during the coding phase. Security considerations (re-entrancy guards, access control) are crucial and should be implemented thoroughly.
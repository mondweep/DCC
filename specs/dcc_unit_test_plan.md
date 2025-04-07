# DCC Unit Test Plan - Phase 2

## Overview
This document outlines the next phase of unit tests required to achieve comprehensive coverage based on user stories (US) and identified gaps in existing tests (`contracts/test/*`). The focus is on ensuring core logic related to profit distribution, non-voting members, founder rights, complex income scenarios, execution failures, and quorum is thoroughly tested.

## GovernanceContract (`contracts/test/Governance.test.js`)

### 1. Founder Special Rights & Expiry (US 1.3)
   * **Purpose:** Verify the unique mechanics and time-limited nature of founder privileges within governance.
   * **Existing Coverage:** Basic `getVotes` check exists, but lacks distinction and expiry logic testing.
   * **New/Expanded Tests:**
     * **Test_Governance_FounderRights_DistinctVotingPower:**
       * _Goal:_ Confirm founders possess potentially elevated voting power during the initial defined period, distinct from regular voting members (if this mechanic is implemented).
       * _Setup:_ Deploy contract (founder automatically added), add 1-2 regular voting members via MembershipContract.
       * _Action:_ Call `getVotes(founderAddress)` and `getVotes(regularMemberAddress)` within the special rights duration.
       * _Assert:_ Founder's vote count matches the expected special value (e.g., > 1); regular member's count is the standard value (e.g., 1).
     * **Test_Governance_FounderRights_Expiry_VotingPower:**
       * _Goal:_ Ensure founder voting power reverts to the standard value after the special rights period expires.
       * _Setup:_ Deploy contract.
       * _Action:_ Advance blockchain time past the `FOUNDER_SPECIAL_RIGHTS_DURATION`. Call `getVotes(founderAddress)`.
       * _Assert:_ Founder's vote count matches the standard voting member value (e.g., 1).
     * **Test_Governance_FounderRights_SpecialProposalVeto (If Applicable):**
       * _Goal:_ Test any specific veto power founders might have over certain proposal types during the initial period (if implemented).
       * _Setup:_ Deploy contract, create a proposal potentially subject to founder veto. Have regular members vote to pass it. Ensure time is within the special rights duration.
       * _Action:_ Have the founder call a hypothetical `vetoProposal(proposalId)` function. Advance time past voting period, attempt `executeProposal`.
       * _Assert:_ Proposal execution fails or proposal state reflects 'Vetoed'.
     * **Test_Governance_FounderRights_Expiry_SpecialProposalVeto (If Applicable):**
       * _Goal:_ Verify founder veto power (if any) correctly expires.
       * _Setup:_ Deploy contract, create a proposal potentially subject to founder veto. Have regular members vote to pass it. Advance time *beyond* the special rights duration.
       * _Action:_ Have the founder attempt to call `vetoProposal(proposalId)`. Advance time past voting period, attempt `executeProposal`.
       * _Assert:_ Founder's veto attempt fails/reverts. Proposal executes successfully (assuming other conditions like quorum/majority are met).

### 2. Proposal Execution Failure due to Target Call Revert
   * **Purpose:** Ensure the governance system handles failures gracefully when a proposal's target action reverts.
   * **Existing Coverage:** Placeholder comment exists (`Test_Governance_ExecuteProposal_Fail_ExecutionFailed`).
   * **New/Expanded Tests:**
     * **Test_Governance_ExecuteProposal_Fail_TargetRevert:**
       * _Goal:_ Verify that if a proposal's target function call reverts during execution, the proposal is marked appropriately, and state changes are handled correctly.
       * _Setup:_
         * Deploy `GovernanceContract`.
         * Deploy a simple `MockTargetContract` with a function `revertAction()` designed to always revert (e.g., `require(false)`).
         * Create a proposal targeting `MockTargetContract.revertAction()`.
         * Ensure the proposal passes voting (quorum/majority met).
         * Advance time past the voting period.
       * _Action:_ Call `executeProposal(proposalId)`.
       * _Assert:_
         * The `executeProposal` transaction itself should *succeed* (not revert the whole transaction unless designed that way).
         * A specific `ProposalExecutionFailed` event should be emitted, including the `proposalId` and potentially a reason/error data.
         * The `ProposalExecuted` event should *not* be emitted.
         * The proposal's state should reflect failure (e.g., `executed` flag remains false, or a specific `failed` flag is set true). The proposal should not be executable again.

### 3. Explicit Quorum Logic Testing (Refinement)
   * **Purpose:** Thoroughly test the quorum calculation and enforcement under various conditions.
   * **Existing Coverage:** Basic quorum failure test exists (`Test_Governance_ExecuteProposal_Fail_QuorumNotMet`).
   * **New/Expanded Tests:**
     * **Test_Governance_Quorum_Definition:**
       * _Goal:_ Explicitly verify the quorum calculation against the total number of *current* voting members at the time the proposal *ends*.
       * _Setup:_ Deploy contract, add N members. Create proposal. *Before* voting ends, add/remove members (if possible) to change total voting members. Have votes cast such that quorum is met based on the *final* member count but not the initial one (or vice-versa).
       * _Action:_ Advance time, execute proposal.
       * _Assert:_ Execution succeeds/fails based *only* on the member count and votes at `proposal.endTime`.
     * **Test_Governance_Quorum_EdgeCase_Exact:**
       * _Goal:_ Confirm execution succeeds when the total votes cast (For + Against, or just For, depending on definition) exactly meet the quorum percentage threshold.
       * _Setup:_ Deploy contract, add members. Cast votes such that `totalVotes / totalMembers == quorumThreshold`.
       * _Action:_ Advance time, execute proposal.
       * _Assert:_ Proposal executes successfully.
     * **Test_Governance_Quorum_EdgeCase_JustBelow:**
       * _Goal:_ Confirm execution fails when total votes are one less than required for the quorum threshold.
       * _Setup:_ Deploy contract, add members. Cast votes such that `totalVotes / totalMembers < quorumThreshold` by the smallest possible margin.
       * _Action:_ Advance time, execute proposal.
       * _Assert:_ Proposal execution fails with "Governance: Quorum not reached".
     * **Test_Governance_Quorum_WithAbstain (If Applicable):**
       * _Goal:_ Clarify and test if 'Abstain' votes count towards meeting the quorum threshold (participation) even if they don't count towards passing/failing the proposal itself.
       * _Setup:_ Deploy contract, add members. Cast votes: some 'For', some 'Abstain', some 'Against'. Ensure 'For' votes alone are < majority, and (For + Against) votes alone are < quorum. Ensure (For + Against + Abstain) votes *do* meet quorum.
       * _Action:_ Advance time, execute proposal.
       * _Assert:_ Execution should fail due to lack of majority ('For' <= 'Against'), *not* due to quorum, confirming Abstain votes contributed to meeting quorum. (Alternatively, if Abstain doesn't count for quorum, assert failure is due to quorum).

## MembershipContract (`contracts/test/Membership.test.js`)

### 4. Adding/Managing Non-Voting Members (US 3.1, US 5.4)
   * **Purpose:** Test the lifecycle and access control for non-voting members (employees/contractors).
   * **Existing Coverage:** Explicitly noted as missing.
   * **New/Expanded Tests:**
     * **Test_Membership_AddNonVotingMember_Success:**
       * _Goal:_ Verify an authorized address (e.g., owner, director role) can successfully add a non-voting member.
       * _Setup:_ Deploy contract. Identify authorized address (e.g., `owner`).
       * _Action:_ Call `addNonVotingMember(newMemberAddress)` from the authorized address.
       * _Assert:_ `MemberAdded` event emitted with `memberType = NonVoting`. `isNonVotingMember(newMemberAddress)` returns true. `isVotingMember(newMemberAddress)` returns false. `getTotalMembers()` (if exists) increments. `getTotalVotingMembers()` remains unchanged.
     * **Test_Membership_AddNonVotingMember_Fail_NotAuthorized:**
       * _Goal:_ Ensure only authorized accounts can add non-voting members.
       * _Setup:_ Deploy contract. Identify an unauthorized address (`otherAccount`).
       * _Action:_ Call `addNonVotingMember(newMemberAddress)` from `otherAccount`.
       * _Assert:_ Transaction reverts (e.g., `OwnableUnauthorizedAccount`, specific role error like `CallerNotDirector`).
     * **Test_Membership_AddNonVotingMember_Fail_AlreadyVotingMember:**
       * _Goal:_ Prevent adding an existing voting member as a non-voting member.
       * _Setup:_ Deploy contract, add `memberAddress` as a voting member.
       * _Action:_ Attempt to call `addNonVotingMember(memberAddress)` from authorized account.
       * _Assert:_ Transaction reverts with "Membership: Address is already a voting member".
     * **Test_Membership_AddNonVotingMember_Fail_AlreadyNonVotingMember:**
       * _Goal:_ Prevent adding an existing non-voting member again.
       * _Setup:_ Deploy contract, add `memberAddress` as a non-voting member.
       * _Action:_ Attempt to call `addNonVotingMember(memberAddress)` again from authorized account.
       * _Assert:_ Transaction reverts with "Membership: Address is already a non-voting member".
     * **Test_Membership_GetMemberType:**
       * _Goal:_ Verify a function correctly identifies the type of a given address (None, Voting, NonVoting).
       * _Setup:_ Deploy contract. Add one voting member (`votingAddr`), one non-voting member (`nonVotingAddr`). Use founder (`founderAddr`) and an unknown address (`unknownAddr`).
       * _Action:_ Call `getMemberType()` for `founderAddr`, `votingAddr`, `nonVotingAddr`, `unknownAddr`.
       * _Assert:_ Returns the correct type identifier (e.g., enum 0, 1, 2) for each address.
     * **Test_Membership_RemoveNonVotingMember_Success (If Applicable):**
       * _Goal:_ Verify an authorized address can remove/deactivate a non-voting member (if offboarding logic is on-chain).
       * _Setup:_ Deploy contract, add `nonVotingAddr` as non-voting member.
       * _Action:_ Call `removeNonVotingMember(nonVotingAddr)` from authorized account.
       * _Assert:_ `MemberRemoved` event emitted (with type NonVoting). `isNonVotingMember(nonVotingAddr)` returns false. `getTotalMembers()` decrements.
     * **Test_Membership_RemoveNonVotingMember_Fail_NotAuthorized (If Applicable):**
       * _Goal:_ Ensure only authorized accounts can remove non-voting members.
       * _Setup:_ Deploy contract, add `nonVotingAddr`.
       * _Action:_ Call `removeNonVotingMember(nonVotingAddr)` from an unauthorized account.
       * _Assert:_ Transaction reverts.

## IncomeManagementContract (`contracts/test/IncomeManagement.test.js`)

### 5. Profit Distribution to Voting Members (US 2.3)
   * **Purpose:** Test the mechanism for distributing accumulated company profits to eligible voting members.
   * **Existing Coverage:** Explicitly noted as missing.
   * **New/Expanded Tests:**
     * **Test_Income_DistributeProfit_Success_SingleMember:**
       * _Goal:_ Verify profits are correctly calculated and distributed to a single voting member when triggered.
       * _Setup:_ Deploy `IncomeManagementContract`, `MembershipContract`. Link them. Add one voting member (`memberA`) via Membership. Send 10 ETH (representing profit) to `IncomeManagementContract`. Assume 0% company share for simplicity here, or factor it in.
       * _Action:_ Call `distributeProfitToMembers()` (likely owner-controlled or via governance proposal).
       * _Assert:_ `ProfitDistributed` event emitted (with total amount, number of members). `memberA`'s ETH balance increases by 10 ETH (or 10 ETH * (1 - companyShare%)). `IncomeManagementContract`'s balance decreases accordingly.
     * **Test_Income_DistributeProfit_Success_MultipleMembers_EqualSplit:**
       * _Goal:_ Ensure profits are split equally among all current voting members.
       * _Setup:_ Deploy and link contracts. Add `memberA`, `memberB`, `memberC` as voting members. Send 12 ETH profit to `IncomeManagementContract`.
       * _Action:_ Call `distributeProfitToMembers()`.
       * _Assert:_ `ProfitDistributed` event emitted. `memberA`, `memberB`, `memberC` each receive 4 ETH (adjust for company share). Contract balance decreases by 12 ETH. Test handling of remainders if division isn't perfect (e.g., 10 ETH / 3 members - does contract keep remainder, or is it handled?).
     * **Test_Income_DistributeProfit_OnlyVotingMembers:**
       * _Goal:_ Confirm that only *voting* members receive profit distributions, excluding non-voting members.
       * _Setup:_ Deploy/link contracts. Add `votingMember` and `nonVotingMember`. Send 10 ETH profit.
       * _Action:_ Call `distributeProfitToMembers()`.
       * _Assert:_ `votingMember` receives 10 ETH (adjusted for share). `nonVotingMember`'s balance remains unchanged.
     * **Test_Income_DistributeProfit_Fail_NotEnoughFunds:**
       * _Goal:_ Verify distribution fails or handles gracefully if the contract holds zero or negligible profit balance.
       * _Setup:_ Deploy/link contracts. Add members. Ensure `IncomeManagementContract` balance is 0.
       * _Action:_ Call `distributeProfitToMembers()`.
       * _Assert:_ Transaction reverts with "Insufficient funds" or completes without transferring funds or emitting `ProfitDistributed` event.
     * **Test_Income_DistributeProfit_Fail_NotAuthorized:**
       * _Goal:_ Ensure profit distribution can only be triggered by an authorized entity (owner/governance).
       * _Setup:_ Deploy/link contracts. Add members. Send profit.
       * _Action:_ Call `distributeProfitToMembers()` from a random `otherAccount`.
       * _Assert:_ Transaction reverts (e.g., `OwnableUnauthorizedAccount`, `CallerNotGovernance`).
     * **Test_Income_DistributeProfit_RespectsCompanyShare:**
       * _Goal:_ Verify distribution correctly calculates distributable profit *after* accounting for consultant payouts and the company's retained percentage from income sources.
       * _Setup:_ Deploy/link contracts (`Income`, `Membership`, `Payment`). Set company share (e.g., 20%). Add `votingMember`. Set rate for `consultantA`. Client pays 10 ETH. Trigger payout of 4 ETH to `consultantA` (implying 1 ETH company share from this). Contract now holds 5 ETH (1 ETH retained + 4 ETH unallocated profit).
       * _Action:_ Call `distributeProfitToMembers()`.
       * _Assert:_ `votingMember` receives 4 ETH (the unallocated profit). Contract balance is now 1 ETH (the retained share).

### 6. Complex Income Distribution Scenarios (Consultants)
   * **Purpose:** Test more intricate scenarios involving consultant payments.
   * **Existing Coverage:** Basic single consultant payout exists.
   * **New/Expanded Tests:**
     * **Test_Income_Distribute_MultipleConsultants_SinglePayment:**
       * _Goal:_ Verify correct individual payouts when multiple consultants are paid from the same incoming client payment.
       * _Setup:_ Deploy `IncomeManagement`, `Payment`. Set 20% company share. Set rate for `consultantA` (e.g., 1 ETH/unit), `consultantB` (e.g., 2 ETH/unit). Client sends 10 ETH.
       * _Action:_
         * Call `distributeIncomeForConsultant(consultantA, 3 units)`. Expected payout: 3 ETH. Company share: 0.75 ETH. Total needed: 3.75 ETH.
         * Call `distributeIncomeForConsultant(consultantB, 2 units)`. Expected payout: 4 ETH. Company share: 1 ETH. Total needed: 5 ETH.
       * _Assert:_
         * `consultantA` balance increases by 3 ETH.
         * `consultantB` balance increases by 4 ETH.
         * `IncomeManagementContract` balance is 10 - 3.75 - 5 = 1.25 ETH (0.75 + 1 ETH company share + 0.25 ETH remaining unallocated). Events emitted for each payout.
     * **Test_Income_Distribute_InsufficientFunds_ForConsultant:**
       * _Goal:_ Ensure payout reverts if the contract lacks sufficient funds *after* accounting for the company's required share for that specific payout.
       * _Setup:_ Deploy contracts. Set 20% company share. Set rate for `consultantA` (1 ETH/unit). Send only 1 ETH to the contract.
       * _Action:_ Call `distributeIncomeForConsultant(consultantA, 1 unit)`. (Requires 1 ETH payout + 0.25 ETH company share = 1.25 ETH total).
       * _Assert:_ Transaction reverts with "IncomeManagement: Insufficient funds for payout and company share".
     * **Test_Income_Distribute_ZeroWorkUnits:**
       * _Goal:_ Verify calling distribution with zero work units is handled correctly (no payout, no error).
       * _Setup:_ Deploy contracts. Set rate for `consultantA`. Send funds.
       * _Action:_ Call `distributeIncomeForConsultant(consultantA, 0 units)`.
       * _Assert:_ Transaction succeeds. No ETH transferred to `consultantA`. No `IncomeDistributed` event emitted (or specific zero-payout event). Contract balance unchanged.

## PaymentContract (`contracts/test/Payment.test.js`)

### (Indirectly related to Non-Voting Members)
   * **Purpose:** Ensure rates can be managed for non-voting members if their rates are stored/managed within this contract.
   * **Existing Coverage:** Covers setting/getting rates generally (assumed for consultants/voting members).
   * **New/Expanded Tests (Conditional on Implementation):**
     * **Test_Payment_SetRate_NonVotingMember_Success:**
       * _Goal:_ Verify owner/authorized role can set pay rates specifically for non-voting members (if using a distinct function or storage).
       * _Setup:_ Deploy `PaymentContract`, `MembershipContract`. Add `nonVotingAddr` via Membership.
       * _Action:_ Call `setNonVotingMemberRate(nonVotingAddr, rate)` (or use `setConsultantRate` if unified) from owner.
       * _Assert:_ Rate stored correctly. `RateSet` event emitted (potentially with member type). `getNonVotingMemberRate(nonVotingAddr)` (or `getConsultantRate`) returns the correct rate.
     * **Test_Payment_GetRate_DistinguishesMemberTypes (If Applicable):**
       * _Goal:_ If rates for voting vs. non-voting members are stored or accessed differently, verify getters return the correct values for the correct type.
       * _Setup:_ Deploy contracts. Add `votingMemberA` and `nonVotingMemberB`. Set distinct rates for both using appropriate functions.
       * _Action:_ Call `getConsultantRate(votingMemberA)`, `getConsultantRate(nonVotingMemberB)`, `getNonVotingMemberRate(votingMemberA)`, `getNonVotingMemberRate(nonVotingMemberB)`.
       * _Assert:_ Each getter returns the correct rate for the intended member type and 0 or reverts for the wrong type, based on contract design.
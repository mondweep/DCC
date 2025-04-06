const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs"); // Import anyValue

describe("GovernanceContract", function () {
  // Fixture to deploy the contract before each test group if needed
  async function deployGovernanceFixture() {
    // 1. Get signers
    const [deployer, member2, nonMember] = await ethers.getSigners();

    // 2. Deploy dependent contracts first
    const IncomeManagementContractFactory = await ethers.getContractFactory("IncomeManagementContract");
    const initialIncomePercentage = 2000; // 20%
    // Deployer is initial owner of IncomeManagementContract
    const incomeManagementContract = await IncomeManagementContractFactory.deploy(deployer.address, initialIncomePercentage);

    const MembershipContractFactory = await ethers.getContractFactory("MembershipContract");
    // Deployer is initial owner (founder) of MembershipContract
    const membershipContract = await MembershipContractFactory.deploy(deployer.address, await incomeManagementContract.getAddress());

    const PaymentContractFactory = await ethers.getContractFactory("PaymentContract");
    // Assuming PaymentContract might also need initial setup/owner
    const paymentContract = await PaymentContractFactory.deploy(/* constructor args, potentially deployer.address */);

    // 3. Deploy GovernanceContract
    const GovernanceContractFactory = await ethers.getContractFactory("GovernanceContract");
    // Deployer is initial owner of GovernanceContract
    const governanceContract = await GovernanceContractFactory.deploy(
      await membershipContract.getAddress(),
      await incomeManagementContract.getAddress(),
      await paymentContract.getAddress(),
      deployer.address
    );

    // NOTE: No members added or ownership transferred here.
    // Tests needing specific setup will do it themselves.

    return { governanceContract, membershipContract, incomeManagementContract, paymentContract, deployer, member2, nonMember };
  }

  describe("Deployment", function () {
    it("Should set the right initial state (TDD_ANCHOR: Test_Governance_Initialization)", async function () {
      // Load fixture and check initial state
      const { governanceContract, membershipContract, incomeManagementContract, paymentContract, deployer } = await loadFixture(deployGovernanceFixture); // Use deployer

      // Check if the contract addresses were stored correctly
      expect(await governanceContract.membershipContract()).to.equal(await membershipContract.getAddress());
      expect(await governanceContract.incomeManagementContract()).to.equal(await incomeManagementContract.getAddress());
      expect(await governanceContract.paymentContract()).to.equal(await paymentContract.getAddress());

      // Check if the deployer is set as the owner (assuming an Ownable pattern)
      expect(await governanceContract.owner()).to.equal(deployer.address); // Check deployer is owner

      // Check initial proposal counter
      expect(await governanceContract.proposalCounter()).to.equal(0);
    });
    });

  describe("Proposals", function () {
    // TDD_ANCHOR: Test_Governance_CreateProposal_Success
    it("Should allow voting members to create proposals", async function () {
      const { governanceContract, deployer } = await loadFixture(deployGovernanceFixture); // Use deployer
      // TODO: This test currently assumes the 'owner' is a voting member.
      // We'll need to implement membership logic and potentially adjust this setup later.

      const targets = [deployer.address]; // Example: Proposal targets the deployer's address
      const values = [0]; // Example: No ETH value sent
      const signatures = [""]; // Example: No specific function signature needed for a simple transfer target
      const calldatas = ["0x"]; // Example: Empty calldata
      const description = "Test Proposal 1";

      const tx = await governanceContract.connect(deployer).createProposal(targets, values, signatures, calldatas, description);
      const receipt = await tx.wait(); // Wait for the transaction to be mined

      // Find the event in the transaction receipt
      const event = receipt.logs.find(e => e.eventName === 'ProposalCreated');
      expect(event).to.not.be.undefined;
      const proposalId = event.args.proposalId; // Get the actual proposal ID from the event

      // Check event emission (more robustly getting ID first)
      await expect(tx)
        .to.emit(governanceContract, "ProposalCreated")
        .withArgs(proposalId, deployer.address, targets, values, signatures, calldatas, anyValue, anyValue, description);

      // Check if proposal counter increased
      expect(await governanceContract.proposalCounter()).to.equal(proposalId + 1n); // Use BigInt for comparison

      // --- NEW: Check if proposal details are stored correctly ---
      // Call the new core details getter
      const coreDetails = await governanceContract.getProposalCoreDetails(proposalId);

      // Destructure the returned tuple for core details
      const [
          storedId, storedProposer, storedStartTime, storedEndTime,
          storedDescription, storedExecuted, storedCanceled,
          storedForVotes, storedAgainstVotes
      ] = coreDetails;

      // Assert core details
      expect(storedId).to.equal(proposalId);
      expect(storedProposer).to.equal(deployer.address);
      expect(storedDescription).to.equal(description);
      expect(storedStartTime).to.be.a('bigint');
      expect(storedEndTime).to.be.a('bigint');
      expect(storedExecuted).to.equal(false);
      expect(storedCanceled).to.equal(false);
      expect(storedForVotes).to.equal(0n);
      expect(storedAgainstVotes).to.equal(0n);

      // Assert array details using specific getters
      const storedTargets = await governanceContract.getProposalTargets(proposalId);
      const storedValues = await governanceContract.getProposalValues(proposalId);
      expect(storedTargets).to.deep.equal(targets);
      expect(storedValues).to.deep.equal(values.map(v => BigInt(v)));
      // We can add checks for signatures/calldatas here if needed later
    });

    // TDD_ANCHOR: Test_Governance_CreateProposal_Fail_NotVotingMember
     it("Should prevent non-voting members from creating proposals", async function () {
       const { governanceContract, nonMember } = await loadFixture(deployGovernanceFixture); // Use nonMember
       // TODO: Ensure 'otherAccount' is NOT a voting member once membership is implemented
       // const targets = [otherAccount.address]; // Removed - leftover variable
       const values = [0];
       const signatures = [""];
       const calldatas = ["0x"];
       const description = "Test Proposal by Non-Member";

       // Use nonMember account for this test
       const proposalTargets = [nonMember.address]; // Target nonMember just for variety
       await expect(governanceContract.connect(nonMember).createProposal(proposalTargets, values, signatures, calldatas, description))
         .to.be.revertedWith("Governance: Caller is not a voting member"); // Placeholder error message - adjust later
    });
  });

   describe("Voting", function () {
    // TDD_ANCHOR: Test_Governance_Vote_Success
     it("Should allow voting members to vote on active proposals", async function () {
       const { governanceContract, deployer } = await loadFixture(deployGovernanceFixture); // Use deployer

       // 1. Create a proposal first
       const targets = [deployer.address];
       const values = [0];
       const signatures = [""];
       const calldatas = ["0x"];
       const description = "Test Proposal for Voting";
       const txCreate = await governanceContract.connect(deployer).createProposal(targets, values, signatures, calldatas, description);
       const receiptCreate = await txCreate.wait();
       const eventCreate = receiptCreate.logs.find(e => e.eventName === 'ProposalCreated');
       const proposalId = eventCreate.args.proposalId;

       // 2. Cast a vote (true for 'for', false for 'against')
       const voteSupport = true;
       const expectedWeight = 1n; // Assuming 1 vote per member for now

       // 3. Assert event emission
       await expect(governanceContract.connect(deployer).vote(proposalId, voteSupport))
         .to.emit(governanceContract, "Voted")
         .withArgs(proposalId, deployer.address, voteSupport, expectedWeight);

       // TODO: Add checks for updated vote counts in the proposal struct once implemented
    });

    // TDD_ANCHOR: Test_Governance_Vote_Fail_NotVotingMember
     it("Should prevent non-voting members from voting", async function () {
       const { governanceContract, deployer, nonMember } = await loadFixture(deployGovernanceFixture); // Use deployer, nonMember
       // 1. Create a proposal
       const txCreate = await governanceContract.connect(deployer).createProposal([], [0], [""], ["0x"], "Prop"); // deployer creates
       const receiptCreate = await txCreate.wait();
       const eventCreate = receiptCreate.logs.find(e => e.eventName === 'ProposalCreated');
       const proposalId = eventCreate.args.proposalId;

       // 2. Attempt vote from non-member
       await expect(governanceContract.connect(nonMember).vote(proposalId, true)) // nonMember attempts vote
         .to.be.revertedWith("Governance: Caller is not a voting member");
     });

    // TDD_ANCHOR: Test_Governance_Vote_Fail_ProposalNotActive
     it("Should prevent voting on inactive (ended) proposals", async function () {
       const { governanceContract, deployer } = await loadFixture(deployGovernanceFixture); // Use deployer
       // 1. Create a proposal
       const txCreate = await governanceContract.connect(deployer).createProposal([], [0], [""], ["0x"], "Prop");
       const receiptCreate = await txCreate.wait();
       const eventCreate = receiptCreate.logs.find(e => e.eventName === 'ProposalCreated');
       const proposalId = eventCreate.args.proposalId;
       // Use the new getter function name
       const proposalCoreDetails = await governanceContract.getProposalCoreDetails(proposalId);
       const proposalEndTime = proposalCoreDetails[3]; // endTime is at index 3

       // Need startTime as well for calculation, which is at index 2
       const proposalStartTime = proposalCoreDetails[2];
       await ethers.provider.send("evm_increaseTime", [Number(proposalEndTime - proposalStartTime + 1n)]); // Increase time by votingPeriod + 1 second
       await ethers.provider.send("evm_mine"); // Mine a block to apply the time change

       // 3. Attempt vote
       await expect(governanceContract.connect(deployer).vote(proposalId, true))
         .to.be.revertedWith("Governance: Proposal not active");
     });

     // TDD_ANCHOR: Test_Governance_Vote_Fail_AlreadyVoted
     it("Should prevent voting twice on the same proposal", async function () {
       const { governanceContract, deployer } = await loadFixture(deployGovernanceFixture); // Use deployer
       // 1. Create a proposal
       const txCreate = await governanceContract.connect(deployer).createProposal([], [0], [""], ["0x"], "Prop");
       const receiptCreate = await txCreate.wait();
       const eventCreate = receiptCreate.logs.find(e => e.eventName === 'ProposalCreated');
       const proposalId = eventCreate.args.proposalId;

       // 2. Vote once
       await governanceContract.connect(deployer).vote(proposalId, true);

       // 3. Attempt to vote again
       await expect(governanceContract.connect(deployer).vote(proposalId, false)) // Try voting differently
         .to.be.revertedWith("Governance: Voter already voted");
     });
   });

   describe("Execution", function () {
    // TDD_ANCHOR: Test_Governance_ExecuteProposal_Success_Majority
     it("Should execute proposals that reach majority and voting period ended", async function () {
       const { governanceContract, deployer } = await loadFixture(deployGovernanceFixture); // Use deployer

       // 1. Create a proposal
       const targets = []; // No target for simple execution test
       const values = [0];
       const signatures = [""];
       const calldatas = ["0x"];
       const description = "Test Proposal for Execution";
       const txCreate = await governanceContract.connect(deployer).createProposal(targets, values, signatures, calldatas, description);
       const receiptCreate = await txCreate.wait();
       const eventCreate = receiptCreate.logs.find(e => e.eventName === 'ProposalCreated');
       const proposalId = eventCreate.args.proposalId;

       // 2. Vote 'for' the proposal
       await governanceContract.connect(deployer).vote(proposalId, true);

       // 3. Advance time past the voting period end
       const coreDetails = await governanceContract.getProposalCoreDetails(proposalId);
       const proposalEndTime = coreDetails[3]; // endTime is at index 3
       const proposalStartTime = coreDetails[2]; // startTime is at index 2
       await ethers.provider.send("evm_increaseTime", [Number(proposalEndTime - proposalStartTime + 1n)]);
       await ethers.provider.send("evm_mine");

       // 4. Execute the proposal
       const txExec = await governanceContract.executeProposal(proposalId);

       // 5. Assert event emission
       await expect(txExec)
         .to.emit(governanceContract, "ProposalExecuted")
         .withArgs(proposalId);

       // 6. Assert proposal state changed
       const finalCoreDetails = await governanceContract.getProposalCoreDetails(proposalId);
       const executedFlag = finalCoreDetails[5]; // executed is at index 5
       expect(executedFlag).to.equal(true);
    });

    // TDD_ANCHOR: Test_Governance_ExecuteProposal_Fail_AlreadyExecuted
    it("Should prevent executing a proposal twice", async function () {
      const { governanceContract, deployer } = await loadFixture(deployGovernanceFixture); // Use deployer
      // 1. Create, vote, advance time, execute once
      const txCreate = await governanceContract.connect(deployer).createProposal([], [0], [""], ["0x"], "Exec Twice Test");
      const receiptCreate = await txCreate.wait();
      const eventCreate = receiptCreate.logs.find(e => e.eventName === 'ProposalCreated');
      const proposalId = eventCreate.args.proposalId;
      await governanceContract.connect(deployer).vote(proposalId, true);
      const coreDetails = await governanceContract.getProposalCoreDetails(proposalId);
      await ethers.provider.send("evm_increaseTime", [Number(coreDetails[3] - coreDetails[2] + 1n)]); // endTime - startTime + 1
      await ethers.provider.send("evm_mine");
      await governanceContract.connect(deployer).executeProposal(proposalId); // First execution (use connect just in case)

      // 2. Attempt to execute again
      await expect(governanceContract.executeProposal(proposalId))
        .to.be.revertedWith("Governance: Proposal already executed");
    });

    // TDD_ANCHOR: Test_Governance_ExecuteProposal_Fail_Expired (Covers executing too early)
    it("Should prevent executing a proposal before voting ends", async function () {
      const { governanceContract, deployer } = await loadFixture(deployGovernanceFixture); // Use deployer
      // 1. Create and vote
      const txCreate = await governanceContract.connect(deployer).createProposal([], [0], [""], ["0x"], "Exec Early Test");
      const receiptCreate = await txCreate.wait();
      const eventCreate = receiptCreate.logs.find(e => e.eventName === 'ProposalCreated');
      const proposalId = eventCreate.args.proposalId;
      await governanceContract.connect(deployer).vote(proposalId, true);

      // 2. Attempt to execute immediately (before time advance)
      await expect(governanceContract.connect(deployer).executeProposal(proposalId)) // Use connect just in case
        .to.be.revertedWith("Governance: Voting period not ended");
    });

    // TDD_ANCHOR: Test_Governance_ExecuteProposal_Fail_NotEnoughVotes
    it("Should prevent executing a proposal that did not pass (tie)", async function () {
      // Use deployer and member2 (already added in fixture)
      const { governanceContract, membershipContract, deployer, member2 } = await loadFixture(deployGovernanceFixture);
      // Setup: Add member2
      await membershipContract.connect(deployer).addVotingMember(member2.address);

      // 1. Create proposal
      const txCreate = await governanceContract.connect(deployer).createProposal([], [0], [""], ["0x"], "Exec Tie Test"); // deployer creates
      const receiptCreate = await txCreate.wait();
      const eventCreate = receiptCreate.logs.find(e => e.eventName === 'ProposalCreated');
      const proposalId = eventCreate.args.proposalId;

      // 2. Votes result in a tie (deployer=for, member2=against)
      await governanceContract.connect(deployer).vote(proposalId, true);
      await governanceContract.connect(member2).vote(proposalId, false); // member2 votes against

      // 3. Advance time
      const coreDetails = await governanceContract.getProposalCoreDetails(proposalId);
      await ethers.provider.send("evm_increaseTime", [Number(coreDetails[3] - coreDetails[2] + 1n)]);
      await ethers.provider.send("evm_mine");

      // 4. Attempt to execute (should fail)
      await expect(governanceContract.connect(deployer).executeProposal(proposalId)) // Use connect just in case
       .to.be.revertedWith("Governance: Proposal did not pass");
    });

    it("Should prevent executing a proposal that did not pass (against > for)", async function () {
      // Use deployer and member2 (already added in fixture)
      const { governanceContract, membershipContract, deployer, member2 } = await loadFixture(deployGovernanceFixture);
      // Setup: Add member2
      await membershipContract.connect(deployer).addVotingMember(member2.address);
       // [Line Removed - Duplicate loadFixture call]

       // 1. Create proposal
       const txCreate = await governanceContract.connect(deployer).createProposal([], [0], [""], ["0x"], "Exec Loss Test"); // deployer creates
       const receiptCreate = await txCreate.wait();
       const eventCreate = receiptCreate.logs.find(e => e.eventName === 'ProposalCreated');
       const proposalId = eventCreate.args.proposalId;

       // 2. Only member2 votes against
       await governanceContract.connect(member2).vote(proposalId, false); // member2 votes against

       // 3. Advance time
       const coreDetails = await governanceContract.getProposalCoreDetails(proposalId);
       await ethers.provider.send("evm_increaseTime", [Number(coreDetails[3] - coreDetails[2] + 1n)]);
       await ethers.provider.send("evm_mine");

       // 4. Attempt to execute (should fail)
       await expect(governanceContract.connect(deployer).executeProposal(proposalId)) // Use connect just in case
        .to.be.revertedWith("Governance: Quorum not reached"); // Expect quorum failure first
    });

    // TDD_ANCHOR: Test_Governance_ExecuteProposal_Fail_QuorumNotMet
    it("Should prevent executing a proposal if quorum is not met", async function () {
        const { governanceContract, membershipContract, deployer, member2, nonMember: member3 } = await loadFixture(deployGovernanceFixture);
        // Setup: Add member2 and member3
        await membershipContract.connect(deployer).addVotingMember(member2.address);
        await membershipContract.connect(deployer).addVotingMember(member3.address);
        expect(await membershipContract.getTotalVotingMembers()).to.equal(3); // deployer + member2 + member3

        // 1. Create proposal
        const txCreate = await governanceContract.connect(deployer).createProposal([], [0], [""], ["0x"], "Exec Quorum Test");
        const receiptCreate = await txCreate.wait();
        const eventCreate = receiptCreate.logs.find(e => e.eventName === 'ProposalCreated');
        const proposalId = eventCreate.args.proposalId;

        // 2. Only deployer votes 'for' (1 out of 3 members -> quorum not met if >50%)
        await governanceContract.connect(deployer).vote(proposalId, true);

        // 3. Advance time
        const coreDetails = await governanceContract.getProposalCoreDetails(proposalId);
        await ethers.provider.send("evm_increaseTime", [Number(coreDetails[3] - coreDetails[2] + 1n)]);
        await ethers.provider.send("evm_mine");

        // 4. Attempt to execute (should fail due to quorum)
        // This requires quorum logic in executeProposal
        await expect(governanceContract.connect(deployer).executeProposal(proposalId))
         .to.be.revertedWith("Governance: Quorum not reached"); // Adjust error message as needed
      });


    // TDD_ANCHOR: Test_Governance_ExecuteProposal_Fail_ExecutionFailed
     // Add more tests for execution failures (target call fails) later
   });

   describe("Parameter Updates (via Proposals)", function () {
    // TDD_ANCHOR: Test_Governance_UpdateEntryFee
     it("Should allow governance to update the voting member entry fee via proposal", async function () {
       const { governanceContract, membershipContract, deployer } = await loadFixture(deployGovernanceFixture);
       // Setup: Transfer ownership of MembershipContract to GovernanceContract
       await membershipContract.connect(deployer).transferOwnership(await governanceContract.getAddress());
       const newFee = ethers.parseEther("0.1"); // Example new fee (0.1 ETH)
       const initialFee = await membershipContract.getCurrentVotingMemberEntryFee();
       expect(initialFee).to.equal(0); // Verify initial fee is 0

       // 1. Encode the function call to setVotingMemberEntryFee(newFee)
       const membershipInterface = membershipContract.interface;
       const calldata = membershipInterface.encodeFunctionData("setVotingMemberEntryFee", [newFee]);

       // 2. Create the proposal targeting the MembershipContract
       const targets = [await membershipContract.getAddress()];
       const values = [0];
       const signatures = [""]; // Not needed when using calldata directly
       const description = "Proposal to update entry fee to 0.1 ETH";
       const txCreate = await governanceContract.connect(deployer).createProposal(targets, values, signatures, [calldata], description);
       const receiptCreate = await txCreate.wait();
       const eventCreate = receiptCreate.logs.find(e => e.eventName === 'ProposalCreated');
       const proposalId = eventCreate.args.proposalId;

       // 3. Vote for the proposal
       await governanceContract.connect(deployer).vote(proposalId, true);

       // 4. Advance time past voting period
       const coreDetails = await governanceContract.getProposalCoreDetails(proposalId);
       await ethers.provider.send("evm_increaseTime", [Number(coreDetails[3] - coreDetails[2] + 1n)]); // endTime - startTime + 1
       await ethers.provider.send("evm_mine");

       // 5. Execute the proposal
       // This will fail until executeProposal actually executes the calldata
       await governanceContract.connect(deployer).executeProposal(proposalId); // Use connect just in case

       // 6. Verify the fee was updated in MembershipContract
       expect(await membershipContract.getCurrentVotingMemberEntryFee()).to.equal(newFee);
    });

    // TDD_ANCHOR: Test_Governance_UpdateIncomeSplit
     it("Should allow governance to update the company income split via proposal", async function () {
       const { governanceContract, incomeManagementContract, deployer } = await loadFixture(deployGovernanceFixture);
       // Setup: Transfer ownership of IncomeManagementContract to GovernanceContract
       await incomeManagementContract.connect(deployer).transferOwnership(await governanceContract.getAddress());
       const newPercentage = 3000; // 30% in basis points
       const initialPercentage = await incomeManagementContract.getCompanyIncomePercentage();
       expect(initialPercentage).to.equal(2000); // Verify initial percentage (set in fixture)

       // 1. Encode the function call to setCompanyIncomePercentage(newPercentage)
       const incomeInterface = incomeManagementContract.interface;
       const calldata = incomeInterface.encodeFunctionData("setCompanyIncomePercentage", [newPercentage]);

       // 2. Create the proposal targeting the IncomeManagementContract
       const targets = [await incomeManagementContract.getAddress()];
       const values = [0];
       const signatures = [""]; // Not needed when using calldata directly
       const description = "Proposal to update income split to 30%";
       const txCreate = await governanceContract.connect(deployer).createProposal(targets, values, signatures, [calldata], description);
       const receiptCreate = await txCreate.wait();
       const eventCreate = receiptCreate.logs.find(e => e.eventName === 'ProposalCreated');
       const proposalId = eventCreate.args.proposalId;

       // 3. Vote for the proposal
       await governanceContract.connect(deployer).vote(proposalId, true);

       // 4. Advance time past voting period
       const coreDetails = await governanceContract.getProposalCoreDetails(proposalId);
       await ethers.provider.send("evm_increaseTime", [Number(coreDetails[3] - coreDetails[2] + 1n)]); // endTime - startTime + 1
       await ethers.provider.send("evm_mine");

       // 5. Execute the proposal
       await governanceContract.connect(deployer).executeProposal(proposalId); // Use connect just in case

       // 6. Verify the percentage was updated in IncomeManagementContract
       expect(await incomeManagementContract.getCompanyIncomePercentage()).to.equal(newPercentage);
    });
   });

    describe("Founder Rights", function () {
    // TDD_ANCHOR: Test_Governance_FounderRights_VotingPower
     it("Should grant founders the correct voting power initially", async function () {
       // Founder (deployer) is automatically a voting member in the fixture
       const { governanceContract, deployer } = await loadFixture(deployGovernanceFixture);
       const expectedInitialVotes = 1n; // Assuming founders start with 1 vote like others for now

       // getVotes function needs implementation
       expect(await governanceContract.getVotes(deployer.address)).to.equal(expectedInitialVotes);
    });

    // TDD_ANCHOR: Test_Governance_FounderRights_Expiry
     it("Should return normal voting power after special rights duration (if implemented)", async function () {
       // This test assumes special rights might exist and expire.
       // Currently, founder rights aren't distinct, so this test might pass trivially
       // until distinct rights and expiry logic are added to the contract.
       const { governanceContract, deployer } = await loadFixture(deployGovernanceFixture);
       const founderSpecialRightsDuration = 365 * 24 * 60 * 60; // Duration in seconds
       const expectedNormalVotes = 1n;

       // Advance time past the duration (This requires FOUNDER_SPECIAL_RIGHTS_DURATION in contract)
       // await ethers.provider.send("evm_increaseTime", [founderSpecialRightsDuration + 1]);
       // await ethers.provider.send("evm_mine");

       // getVotes function needs implementation that considers expiry
       expect(await governanceContract.getVotes(deployer.address)).to.equal(expectedNormalVotes);
    });
   });

});
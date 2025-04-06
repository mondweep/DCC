const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("MembershipContract", function () {
  // Fixture to deploy the contract
  async function deployMembershipFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, newMember, otherAccount, prospectiveMember, feeRecipient] = await ethers.getSigners(); // Added prospectiveMember, feeRecipient (mock IncomeMgmt)

    const MembershipContractFactory = await ethers.getContractFactory("MembershipContract");
    // Deploy with owner as the initial founder and mock fee recipient address
    const membershipContract = await MembershipContractFactory.deploy(owner.address, feeRecipient.address); // Pass mock IncomeMgmt address

    return { membershipContract, owner, newMember, otherAccount, prospectiveMember, feeRecipient }; // Added prospectiveMember, feeRecipient
  }

  describe("Deployment", function () {
    it("Should set the deployer as the initial founder and voting member", async function () {
      const { membershipContract, owner } = await loadFixture(deployMembershipFixture);
      expect(await membershipContract.founder()).to.equal(owner.address);
      expect(await membershipContract.isVotingMember(owner.address)).to.equal(true);
    });

    it("Should set the initial entry fee to 0", async function () {
        const { membershipContract } = await loadFixture(deployMembershipFixture);
        expect(await membershipContract.getCurrentVotingMemberEntryFee()).to.equal(0);
    });
  });

  describe("Adding Members", function () {
    // TDD_ANCHOR: Test_Membership_AddVotingMember_Success
    it("Should allow the owner to add a new voting member (with fee=0)", async function () {
      const { membershipContract, owner, newMember } = await loadFixture(deployMembershipFixture);

      // Pre-check: newMember should not be a voting member initially
      expect(await membershipContract.isVotingMember(newMember.address)).to.equal(false);

      // Action: Owner adds newMember
      // This function doesn't exist yet, so this call will fail the test
      await expect(membershipContract.connect(owner).addVotingMember(newMember.address))
        .to.emit(membershipContract, "MemberAdded") // Assuming a MemberAdded event
        .withArgs(newMember.address, /* memberType */ 1); // Assuming type 1 for Voting Member

      // Post-check: newMember should now be a voting member
      expect(await membershipContract.isVotingMember(newMember.address)).to.equal(true);
    });

    // TDD_ANCHOR: Test_Membership_Join_Success_Fee0
    it("Should allow a prospective member to join (with fee=0)", async function () {
      const { membershipContract, prospectiveMember } = await loadFixture(deployMembershipFixture);
      const currentFee = await membershipContract.getCurrentVotingMemberEntryFee();
      expect(currentFee).to.equal(0); // Ensure fee is 0 for this test

      // Pre-check
      expect(await membershipContract.isVotingMember(prospectiveMember.address)).to.equal(false);

      // Action: prospectiveMember calls join() - This function doesn't exist yet
      await expect(membershipContract.connect(prospectiveMember).join())
        .to.emit(membershipContract, "MemberAdded")
        .withArgs(prospectiveMember.address, /* memberType */ 1); // Type 1 for Voting Member

      // Post-check
      expect(await membershipContract.isVotingMember(prospectiveMember.address)).to.equal(true);
    });

    it("Should prevent owner adding an existing voting member via addVotingMember", async function () {
        const { membershipContract, owner, newMember } = await loadFixture(deployMembershipFixture);
        // Add member once
        await membershipContract.connect(owner).addVotingMember(newMember.address);
        expect(await membershipContract.isVotingMember(newMember.address)).to.equal(true);

        // Attempt to add again
        await expect(membershipContract.connect(owner).addVotingMember(newMember.address))
            .to.be.revertedWith("Membership: Address is already a member"); // Adjust error message as needed
    });

    it("Should prevent an existing member from joining again via join", async function () {
        const { membershipContract, owner } = await loadFixture(deployMembershipFixture);
        // Owner is already a member (founder)
        expect(await membershipContract.isVotingMember(owner.address)).to.equal(true);

        // Attempt to join again
        await expect(membershipContract.connect(owner).join())
            .to.be.revertedWith("Membership: Address is already a member"); // Adjust error message as needed
    });

    // TDD_ANCHOR: Test_Membership_Join_Fail_IncorrectFee
    it("Should revert join if incorrect fee is sent", async function () {
        const { membershipContract, owner, prospectiveMember } = await loadFixture(deployMembershipFixture);
        const fee = ethers.parseEther("0.1");
        const incorrectFee = ethers.parseEther("0.05");
        // Set a non-zero fee first
        await membershipContract.connect(owner).setVotingMemberEntryFee(fee);
        expect(await membershipContract.getCurrentVotingMemberEntryFee()).to.equal(fee);

        // Attempt join with incorrect fee
        await expect(membershipContract.connect(prospectiveMember).join({ value: incorrectFee }))
            .to.be.revertedWith("Membership: Incorrect entry fee sent");
    });

    // TDD_ANCHOR: Test_Membership_Join_Success_CorrectFee
    it("Should allow join if correct fee is sent", async function () {
        const { membershipContract, owner, prospectiveMember, feeRecipient } = await loadFixture(deployMembershipFixture);
        const fee = ethers.parseEther("0.1");
        // Set a non-zero fee first
        await membershipContract.connect(owner).setVotingMemberEntryFee(fee);

        // Check fee recipient balance before
        const balanceBefore = await ethers.provider.getBalance(feeRecipient.address);

        // Action: Join with correct fee
        await expect(membershipContract.connect(prospectiveMember).join({ value: fee }))
            .to.emit(membershipContract, "MemberAdded")
            .withArgs(prospectiveMember.address, 1);

        // Post-check: Member added
        expect(await membershipContract.isVotingMember(prospectiveMember.address)).to.equal(true);

        // Post-check: Fee transferred to recipient
        const balanceAfter = await ethers.provider.getBalance(feeRecipient.address);
        expect(balanceAfter).to.equal(balanceBefore + fee);
    });


    // Add more tests later for:
    // - Preventing non-owner from adding members (for addVotingMember)
    // - Adding non-voting members/employees (if applicable)
  });

  describe("Fee Management", function () {
     it("Should allow the owner to set the voting member entry fee", async function () {
        const { membershipContract, owner } = await loadFixture(deployMembershipFixture);
        const newFee = ethers.parseEther("0.05");

        await expect(membershipContract.connect(owner).setVotingMemberEntryFee(newFee))
            .to.emit(membershipContract, "VotingMemberEntryFeeSet")
            .withArgs(0, newFee); // oldFee = 0, newFee

        expect(await membershipContract.getCurrentVotingMemberEntryFee()).to.equal(newFee);
     });

     it("Should prevent non-owners from setting the voting member entry fee", async function () {
        const { membershipContract, otherAccount } = await loadFixture(deployMembershipFixture);
        const newFee = ethers.parseEther("0.05");

        await expect(membershipContract.connect(otherAccount).setVotingMemberEntryFee(newFee))
            .to.be.revertedWithCustomError(membershipContract, "OwnableUnauthorizedAccount")
            .withArgs(otherAccount.address);
     });
  });

});
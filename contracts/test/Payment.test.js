const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("PaymentContract", function () {
  // Fixture to deploy the contract
  async function deployPaymentFixture() {
    const [owner, consultant, otherAccount] = await ethers.getSigners();

    const PaymentContractFactory = await ethers.getContractFactory("PaymentContract");
    // Assuming owner is deployer/initial admin
    const paymentContract = await PaymentContractFactory.deploy(owner.address);

    return { paymentContract, owner, consultant, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the correct initial owner", async function () {
      const { paymentContract, owner } = await loadFixture(deployPaymentFixture);
      expect(await paymentContract.owner()).to.equal(owner.address);
    });
  });

  describe("Consultant Rate Management (US 5.3)", function () {
    // TDD_ANCHOR: Test_Payment_SetRate_Success
    it("Should allow the owner to set a consultant's rate", async function () {
      const { paymentContract, owner, consultant } = await loadFixture(deployPaymentFixture);
      const rate = ethers.parseUnits("800", 18); // Example rate (e.g., 800 units per day/period)

      // Function and event don't exist yet
      await expect(paymentContract.connect(owner).setConsultantRate(consultant.address, rate))
        .to.emit(paymentContract, "ConsultantRateSet")
        .withArgs(consultant.address, rate);

      // Getter doesn't exist yet
      expect(await paymentContract.getConsultantRate(consultant.address)).to.equal(rate);
    });

    // TDD_ANCHOR: Test_Payment_SetRate_Fail_NotOwner
    it("Should prevent non-owners from setting a consultant's rate", async function () {
      const { paymentContract, consultant, otherAccount } = await loadFixture(deployPaymentFixture);
      const rate = ethers.parseUnits("800", 18);

      // Function doesn't exist yet
      await expect(paymentContract.connect(otherAccount).setConsultantRate(consultant.address, rate))
        .to.be.revertedWithCustomError(paymentContract, "OwnableUnauthorizedAccount")
        .withArgs(otherAccount.address);
    });

    // TDD_ANCHOR: Test_Payment_GetRate_NotFound
     it("Should return 0 for a consultant whose rate has not been set", async function () {
      const { paymentContract, consultant } = await loadFixture(deployPaymentFixture);
      // Getter doesn't exist yet
      expect(await paymentContract.getConsultantRate(consultant.address)).to.equal(0);
    });
  });

  // Add tests later for:
  // - Payout calculation logic
  // - Interaction with IncomeManagementContract

});
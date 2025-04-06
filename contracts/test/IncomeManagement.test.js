const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("IncomeManagementContract", function () {
  // Fixture to deploy IncomeManagementContract and dependencies (PaymentContract)
  async function deployIncomeManagementFixture() {
    const [owner, client, consultant] = await ethers.getSigners();
    const initialPercentage = 2000; // 20%

    // Deploy PaymentContract first (needed by IncomeManagement potentially, or just for setup)
    const PaymentContractFactory = await ethers.getContractFactory("PaymentContract");
    const paymentContract = await PaymentContractFactory.deploy(owner.address);

    // Deploy IncomeManagementContract, passing PaymentContract address
    const IncomeManagementContractFactory = await ethers.getContractFactory("IncomeManagementContract");
    const incomeManagementContract = await IncomeManagementContractFactory.deploy(
        owner.address,
        initialPercentage,
        await paymentContract.getAddress() // Pass PaymentContract address
    );

    return { incomeManagementContract, paymentContract, owner, client, consultant };
  }

  describe("Deployment", function () {
    it("Should set the correct initial owner and percentage", async function () {
      const { incomeManagementContract, owner } = await loadFixture(deployIncomeManagementFixture);
      const initialPercentage = 2000;
      expect(await incomeManagementContract.owner()).to.equal(owner.address);
      expect(await incomeManagementContract.getCompanyIncomePercentage()).to.equal(initialPercentage);
    });
  });

  describe("Receiving Payments (US 4.2)", function () {
    // TDD_ANCHOR: Test_Income_ReceivePayment_Success
    it("Should accept ETH payments via receive() and increase balance", async function () {
      const { incomeManagementContract, client } = await loadFixture(deployIncomeManagementFixture);
      const paymentAmount = ethers.parseEther("1.0");
      const contractAddress = await incomeManagementContract.getAddress();

      const balanceBefore = await ethers.provider.getBalance(contractAddress);

      // Action: Client sends ETH directly to the contract
      const tx = await client.sendTransaction({
        to: contractAddress,
        value: paymentAmount,
      });
      await tx.wait(); // Wait for transaction to be mined

      const balanceAfter = await ethers.provider.getBalance(contractAddress);

      // Post-check: Balance increased
      expect(balanceAfter).to.equal(balanceBefore + paymentAmount);

      // Check for event emission
      await expect(tx)
        .to.emit(incomeManagementContract, "PaymentReceived") // Event doesn't exist yet
        .withArgs(client.address, paymentAmount);
    });
  });

  describe("Income Distribution", function () {
    // TDD_ANCHOR: Test_Income_Distribute_ConsultantPayout
    it("Should calculate and transfer correct share to consultant via distributeIncomeForConsultant", async function () {
        const { incomeManagementContract, paymentContract, owner, client, consultant } = await loadFixture(deployIncomeManagementFixture);
        const contractAddress = await incomeManagementContract.getAddress();
        const companyPercentage = await incomeManagementContract.getCompanyIncomePercentage(); // 2000 (20%)
        const consultantRate = ethers.parseUnits("0.8", 18); // Rate = 0.8 ETH / unit
        const workUnits = 10n; // Assume 10 units of work
        const expectedConsultantPayout = consultantRate * workUnits; // Expected Payout = 8 ETH

        // Calculate implied total payment needed based on payout and company share
        const impliedTotalPayment = (expectedConsultantPayout * 10000n) / (10000n - companyPercentage); // 8 ETH * 10000 / 8000 = 10 ETH
        const expectedCompanyShare = impliedTotalPayment - expectedConsultantPayout; // 10 ETH - 8 ETH = 2 ETH

        // Ensure client payment covers the total needed
        const clientPayment = impliedTotalPayment; // Client pays exactly what's needed

        // 1. Set consultant rate in PaymentContract
        await paymentContract.connect(owner).setConsultantRate(consultant.address, consultantRate);

        // 2. Client makes payment to IncomeManagementContract
        await client.sendTransaction({ to: contractAddress, value: clientPayment });

        // 3. Trigger distribution for the specific consultant work
        const balanceBefore = await ethers.provider.getBalance(consultant.address);
        // Call the new function with consultant and workUnits
        await incomeManagementContract.connect(owner).distributeIncomeForConsultant(consultant.address, workUnits);

        // 4. Check consultant balance
        const balanceAfter = await ethers.provider.getBalance(consultant.address);
        expect(balanceAfter).to.equal(balanceBefore + expectedConsultantPayout);

        // 5. Check contract balance (should retain only company share if only one consultant)
        const finalContractBalance = await ethers.provider.getBalance(contractAddress);
        expect(finalContractBalance).to.equal(expectedCompanyShare);
    });


    // Add tests later for:
    // - Handling multiple consultants per payment
    // - Profit distribution to members
  });

});
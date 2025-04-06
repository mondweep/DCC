const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Deploying contracts with the account:", deployerAddress);

  // Deploy PaymentContract
  const PaymentContract = await hre.ethers.getContractFactory("PaymentContract");
  const paymentContract = await PaymentContract.deploy(deployerAddress);
  await paymentContract.waitForDeployment();
  const paymentContractAddress = await paymentContract.getAddress();
  console.log("PaymentContract deployed to:", paymentContractAddress);

  // Deploy IncomeManagementContract
  const initialPercentage = 2000; // Example: 20% represented as 2000 (basis points)
  const IncomeManagementContract = await hre.ethers.getContractFactory("IncomeManagementContract");
  const incomeManagementContract = await IncomeManagementContract.deploy(deployerAddress, initialPercentage, paymentContractAddress);
  await incomeManagementContract.waitForDeployment();
  const incomeManagementContractAddress = await incomeManagementContract.getAddress();
  console.log("IncomeManagementContract deployed to:", incomeManagementContractAddress);

  // Deploy MembershipContract
  const MembershipContract = await hre.ethers.getContractFactory("MembershipContract");
  const membershipContract = await MembershipContract.deploy(deployerAddress, incomeManagementContractAddress);
  await membershipContract.waitForDeployment();
  const membershipContractAddress = await membershipContract.getAddress();
  console.log("MembershipContract deployed to:", membershipContractAddress);

  // Deploy GovernanceContract
  const GovernanceContract = await hre.ethers.getContractFactory("GovernanceContract");
  const governanceContract = await GovernanceContract.deploy(
    membershipContractAddress,
    incomeManagementContractAddress,
    paymentContractAddress,
    deployerAddress // Initial owner of GovernanceContract
  );
  await governanceContract.waitForDeployment();
  const governanceContractAddress = await governanceContract.getAddress();
  console.log("GovernanceContract deployed to:", governanceContractAddress);

  // Transfer ownership of MembershipContract to GovernanceContract
  console.log("Transferring MembershipContract ownership to GovernanceContract...");
  const tx1 = await membershipContract.transferOwnership(governanceContractAddress);
  await tx1.wait();
  console.log("MembershipContract ownership transferred.");

  // Transfer ownership of IncomeManagementContract to GovernanceContract
  console.log("Transferring IncomeManagementContract ownership to GovernanceContract...");
  const tx2 = await incomeManagementContract.transferOwnership(governanceContractAddress);
  await tx2.wait();
  console.log("IncomeManagementContract ownership transferred.");

  console.log("\n--- Deployment Summary ---");
  console.log("Deployer:", deployerAddress);
  console.log("PaymentContract:", paymentContractAddress);
  console.log("IncomeManagementContract:", incomeManagementContractAddress);
  console.log("MembershipContract:", membershipContractAddress);
  console.log("GovernanceContract:", governanceContractAddress);
  console.log("--------------------------\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
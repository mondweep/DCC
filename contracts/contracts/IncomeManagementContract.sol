// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PaymentContract.sol"; // Import PaymentContract

// Inherit Ownable for access control on setter function
contract IncomeManagementContract is Ownable {

    // --- Constants ---
    uint256 public constant MAX_BASIS_POINTS = 10000; // For percentage calculations (e.g., 20% = 2000)

    // --- State Variables ---
    // Percentage of income allocated to the company, represented in basis points (e.g., 2000 = 20%)
    uint256 public companyIncomePercentage;
    PaymentContract public paymentContract; // Store PaymentContract address

    // --- Events ---
    event CompanyIncomePercentageSet(uint256 oldPercentage, uint256 newPercentage);
    event PaymentReceived(address indexed from, uint256 amount);

    // --- Constructor ---
    constructor(
        address initialOwner,
        uint256 _initialCompanyIncomePercentage,
        address _paymentContractAddress
    ) Ownable(initialOwner) {
        require(_initialCompanyIncomePercentage <= MAX_BASIS_POINTS, "IncomeMgmt: Initial percentage exceeds max");
        require(_paymentContractAddress != address(0), "IncomeMgmt: Invalid PaymentContract address");
        companyIncomePercentage = _initialCompanyIncomePercentage;
        paymentContract = PaymentContract(_paymentContractAddress); // Store PaymentContract
    }

    // --- Percentage Management (Governance Controlled) ---

    /**
     * @notice Gets the current company income allocation percentage (in basis points).
     */
    function getCompanyIncomePercentage() public view returns (uint256) {
        return companyIncomePercentage;
    }

    /**
     * @notice Sets the company income allocation percentage (in basis points).
     * @dev Can only be called by the current owner (initially the deployer, later the Governance contract).
     * @param _newPercentage The new percentage in basis points (e.g., 2500 for 25%).
     */
    function setCompanyIncomePercentage(uint256 _newPercentage) public onlyOwner {
        require(_newPercentage <= MAX_BASIS_POINTS, "IncomeMgmt: New percentage exceeds max");
        uint256 oldPercentage = companyIncomePercentage;
        companyIncomePercentage = _newPercentage;
        emit CompanyIncomePercentageSet(oldPercentage, _newPercentage);
    }

    // --- Placeholder functions for core logic (to be implemented via TDD) ---

    /**
     * @notice Receives payments from clients.
     */
    receive() external payable {
        // Emit event for received payment
        emit PaymentReceived(msg.sender, msg.value);
        // TODO: Add further logic (recording, triggering distribution) later
    }

    /**
     * @notice Distributes income for a specific consultant's work from the contract balance.
     * @dev Assumes the payment for this work is already in the contract. Calculates payout, retains company share, pays consultant.
     * @param consultant The address of the consultant to pay.
     * @param workUnits Units of work completed by the consultant.
     */
    function distributeIncomeForConsultant(address consultant, uint256 workUnits) public payable onlyOwner { // Made payable for flexibility, restrict access
        require(consultant != address(0), "IncomeMgmt: Invalid consultant address");
        require(workUnits > 0, "IncomeMgmt: Work units must be positive");

        // 1. Calculate consultant payout using PaymentContract
        uint256 consultantPayout = paymentContract.calculatePayout(consultant, workUnits);
        require(consultantPayout > 0, "IncomeMgmt: Calculated payout is zero");

        // 2. Infer total payment needed (payout / consultant percentage)
        // consultantPayout = totalPayment * (1 - companyPercentage/10000)
        // totalPayment = consultantPayout * 10000 / (10000 - companyPercentage)
        require(MAX_BASIS_POINTS > companyIncomePercentage, "IncomeMgmt: Company percentage cannot be 100%"); // Avoid division by zero
        uint256 impliedTotalPayment = (consultantPayout * MAX_BASIS_POINTS) / (MAX_BASIS_POINTS - companyIncomePercentage);

        // 3. Calculate company share based on implied total payment
        uint256 companyShare = (impliedTotalPayment * companyIncomePercentage) / MAX_BASIS_POINTS;

        // 4. Verify sufficient balance exists in the contract to cover both shares
        require(address(this).balance >= (consultantPayout + companyShare), "IncomeMgmt: Insufficient balance for distribution");

        // 5. Transfer payout to consultant
        (bool success, ) = consultant.call{value: consultantPayout}("");
        require(success, "IncomeMgmt: Consultant payment failed");

        // 6. Company share is implicitly retained in the contract balance.
        // TODO: Add event for distribution
    }

}
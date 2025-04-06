// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

// Inherit Ownable for access control
contract PaymentContract is Ownable {

    // --- State Variables ---
    // Mapping from consultant address to their rate (e.g., per day, per hour - units defined off-chain)
    mapping(address => uint256) private _consultantRates;

    // --- Events ---
    event ConsultantRateSet(address indexed consultant, uint256 rate);

    // --- Constructor ---
    constructor(address initialOwner) Ownable(initialOwner) {
        // The deployer (likely Director or Governance contract later) becomes the initial owner
    }

    // --- Rate Management (Owner Controlled) ---

    // NatSpec removed for debugging parser error
    function setConsultantRate(address consultant, uint256 rate) public onlyOwner {
        require(consultant != address(0), "Payment: Cannot set rate for zero address");
        _consultantRates[consultant] = rate;
        emit ConsultantRateSet(consultant, rate);
    }

    // NatSpec removed for debugging parser error
    function getConsultantRate(address consultant) public view returns (uint256) {
        return _consultantRates[consultant];
    }

    // --- Payout Logic (To be implemented via TDD) ---

    // NatSpec removed for debugging parser error
    function calculatePayout(address consultant, uint256 workUnits) public view returns (uint256) {
        uint256 rate = getConsultantRate(consultant);
        // Basic calculation, can be expanded (e.g., handling different rate types)
        return rate * workUnits;
    }

}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol"; // Import Ownable for access control

// Inherit Ownable for access control on setter function
contract MembershipContract is Ownable {

    // --- State Variables ---
    uint256 public votingMemberEntryFee = 0 ether; // Initial fee (0 as per feedback for testing)

    // Mapping to track voting members (minimal implementation for TDD)
    mapping(address => bool) private _isVotingMember;

    // Store the founder (assuming the deployer is the first founder/voting member for now)
    address public founder;
    // Address where collected entry fees should be sent
    address payable public incomeManagementContractAddress;
    // Counter for total voting members
    uint256 public totalVotingMembers;

    // --- Events ---
    event VotingMemberEntryFeeSet(uint256 oldFee, uint256 newFee);
    event MemberAdded(address indexed memberAddress, uint256 memberType); // 1: Voting, 2: Non-Voting (example)

    // --- Constructor ---
    constructor(address _initialFounder, address payable _incomeManagementContractAddress) Ownable(_initialFounder) { // Pass initial owner to Ownable
        require(_initialFounder != address(0), "Membership: Invalid initial founder address");
        require(_incomeManagementContractAddress != address(0), "Membership: Invalid IncomeManagementContract address");
        founder = _initialFounder;
        incomeManagementContractAddress = _incomeManagementContractAddress; // Store the address
        _isVotingMember[_initialFounder] = true; // Set the founder as a voting member
        totalVotingMembers = 1; // Start with the founder
    }

    // --- Membership Checks ---
    function isVotingMember(address _account) public view virtual returns (bool) {
        // Read from the mapping
        return _isVotingMember[_account];
    }

    // --- Fee Management (Governance Controlled) ---

    /**
     * @notice Gets the current entry fee for new voting members.
     */
    function getCurrentVotingMemberEntryFee() public view returns (uint256) {
        return votingMemberEntryFee;
    }

    /**
     * @notice Sets the entry fee for new voting members.
     * @dev Can only be called by the current owner (initially the founder, later potentially the Governance contract).
     * @param _newFee The new entry fee in wei.
     */
    function setVotingMemberEntryFee(uint256 _newFee) public onlyOwner { // Restricted to owner
        uint256 oldFee = votingMemberEntryFee;
        votingMemberEntryFee = _newFee;
        emit VotingMemberEntryFeeSet(oldFee, _newFee);
    }

    // --- Member Management (Owner Controlled for now) ---

    /**
     * @notice Adds a new voting member.
     * @dev Currently restricted to owner and assumes fee is 0.
     * @param _newMember The address of the new voting member.
     */
    function addVotingMember(address _newMember) public onlyOwner {
        require(!_isVotingMember[_newMember], "Membership: Address is already a member");
        // TODO: Add check/handling for entry fee when > 0
        require(_newMember != address(0), "Membership: Cannot add zero address");

        _isVotingMember[_newMember] = true;
        totalVotingMembers++; // Increment count
        emit MemberAdded(_newMember, 1); // Type 1 for Voting Member
    }

    /**
     * @notice Allows an address to join as a voting member by paying the entry fee.
     * @dev Currently only works if the entry fee is 0.
     */
    function join() public payable { // Mark payable for future fee handling
        require(!_isVotingMember[msg.sender], "Membership: Address is already a member");
        // Check correct fee is sent
        require(msg.value == votingMemberEntryFee, "Membership: Incorrect entry fee sent");
        // Transfer fee if it's greater than 0
        if (msg.value > 0) {
            // Use call to send value, check success
            (bool sent, ) = incomeManagementContractAddress.call{value: msg.value}("");
            require(sent, "Membership: Fee transfer failed");
        }

        _isVotingMember[msg.sender] = true;
        totalVotingMembers++; // Increment count
        emit MemberAdded(msg.sender, 1); // Type 1 for Voting Member
    }

    // --- View Functions ---

    /**
     * @notice Gets the total number of voting members.
     */
    function getTotalVotingMembers() public view returns (uint256) {
        return totalVotingMembers;
    }

    // Add other functions required by Governance or other contracts later
    // e.g., removeVotingMember, addNonVotingMember etc. driven by future tests
}
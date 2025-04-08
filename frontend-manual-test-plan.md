# Frontend Manual Test Plan

## App Component

### Test Case 1: Rendering of Main Layout
**Steps:**
1. Open the application in a web browser.
**Expected Result:**
1. The main layout of the application is rendered correctly, including all expected sections and elements.

### Test Case 2: Navigation Between Sections
**Steps:**
1. Click on each navigation link or button.
**Expected Result:**
1. The application navigates to the correct section for each link or button.

## CreateProposal Component

### Test Case 1: Rendering of the Component
**Steps:**
1. Navigate to the Create Proposal section.
**Expected Result:**
1. The CreateProposal component is rendered correctly, including all input fields and buttons.

### Test Case 2: Input Validation - Empty Proposal Text
**Steps:**
1. Navigate to the Create Proposal section.
2. Leave the proposal text field empty.
3. Click the "Submit" button.
**Expected Result:**
1. An error message is displayed, indicating that the proposal text cannot be empty.

### Test Case 3: Submitting a Valid Proposal
**Steps:**
1. Navigate to the Create Proposal section.
2. Enter valid text in the proposal text field.
3. Click the "Submit" button.
**Expected Result:**
1. The proposal is submitted successfully.
2. A success message is displayed.
3. The proposal is added to the ProposalList component.

### Test Case 4: Error Handling - Smart Contract Call Failure
**Steps:**
1. Navigate to the Create Proposal section.
2. Enter valid text in the proposal text field.
3. Simulate a smart contract call failure (e.g., by rejecting the transaction in MetaMask).
4. Click the "Submit" button.
**Expected Result:**
1. An error message is displayed, indicating that the smart contract call failed.

## ProposalList Component

### Test Case 1: Rendering of the Component
**Steps:**
1. Navigate to the Proposal List section.
**Expected Result:**
1. The ProposalList component is rendered correctly.

### Test Case 2: Displaying a List of Proposals
**Steps:**
1. Navigate to the Proposal List section.
**Expected Result:**
1. A list of proposals is displayed, with each proposal showing relevant details (e.g., proposal text, proposer address).

### Test Case 3: Displaying Proposal Details
**Steps:**
1. Click on a proposal in the list.
**Expected Result:**
1. The details of the selected proposal are displayed.

### Test Case 4: Handling Empty Proposal List
**Steps:**
1. Ensure that there are no proposals in the list (e.g., by clearing the mock data).
2. Navigate to the Proposal List section.
**Expected Result:**
1. A message is displayed, indicating that there are no proposals in the list.

## Web3Context

### Test Case 1: Connecting to a Wallet (MetaMask)
**Steps:**
1. Open the application in a web browser with MetaMask installed.
2. Click the "Connect Wallet" button.
**Expected Result:**
1. MetaMask prompts the user to connect their wallet.
2. After connecting, the user's account address is displayed.

### Test Case 2: Disconnecting from a Wallet
**Steps:**
1. Connect to a wallet (MetaMask).
2. Click the "Disconnect Wallet" button.
**Expected Result:**
1. The application disconnects from the wallet.
2. The user's account address is no longer displayed.

### Test Case 3: Displaying the User's Account Address
**Steps:**
1. Connect to a wallet (MetaMask).
**Expected Result:**
1. The user's account address is displayed.

### Test Case 4: Checking Membership Status
**Steps:**
1. Connect to a wallet (MetaMask).
**Expected Result:**
1. The application displays the user's membership status (e.g., "Member" or "Not a Member").

### Test Case 5: Handling Network Changes
**Steps:**
1. Connect to a wallet (MetaMask).
2. Change the network in MetaMask (e.g., from Mainnet to Goerli).
**Expected Result:**
1. The application detects the network change.
2. The application displays the correct network name.
# Decentralised Consulting Collective (DCC)

## Overview

The Decentralised Consulting Collective (DCC) is a consultancy model designed to empower experienced professionals seeking flexible work opportunities. It leverages smart contract technology for decentralised governance, fair pay, transparent income management, and democratic decision-making within the framework of a registered company in England and Wales. The goal is to create a collaborative, equitable, and efficient platform for consultants and clients.

## Current Status (as of April 7, 2025)

The project is currently under active development. 43 unit tests are passing, covering the core functionalities of the smart contracts.

**Completed and Tested Functionality:**

*   **Smart Contracts (`contracts/`)**:
    *   Core contracts (`GovernanceContract`, `MembershipContract`, `IncomeManagementContract`, `PaymentContract`) have been implemented using Test-Driven Development (TDD). TDD covers core features including proposal creation/voting/execution, membership joining/management, consultant rate setting, and basic payment reception/distribution logic.
*   Passing tests demonstrating current functionality can be found in `contracts/test/`.
*   **Frontend (`frontend/`)**:
    *   A frontend application has been built using React, Vite, TypeScript, and Tailwind CSS.
    *   Features include MetaMask wallet connection, a `Web3Context` for managing blockchain interactions, and basic components like `ProposalList`, `CreateProposal`, and a 'Join Collective' button stub.
    *   A local Proof-of-Authority (PoA) testnet infrastructure is defined using Docker and Geth.
    *   Includes `Dockerfile`, `genesis.json`, and `entrypoint.sh` for building and running the testnet nodes. See `design/dcc_testnet_setup.md` for details.
*   **Supporting Documents**:
    *   Initial requirements, specifications, and design documents are available in the `requirements/`, `specs/`, and `design/` directories respectively.

**Remaining Work:**

The following tasks remain to be completed, as detailed in the unit test plan (`specs/dcc_unit_test_plan.md`):

*   Implement and test founder special rights and expiry logic.
*   Implement and test proposal execution failure handling.
*   Refine and expand quorum logic testing.
*   Add/Manage Non-Voting Members

## Known Issues: Local Geth Testnet

**IMPORTANT:** We are currently experiencing persistent difficulties getting the local Geth sealer node (configured via Docker in `testnet/`) to reliably seal blocks. Various configurations (Geth v1.10.25/v1.10.26, different flags, manual miner start attempts) have been tried without consistent success within the Docker environment.

**Impact:** This issue currently **prevents the deployment of smart contracts** to the local testnet and blocks full end-to-end testing of the application.

**Next Steps:** Resolving this Geth configuration issue or potentially switching to an alternative local blockchain environment (e.g., Ganache) is a high-priority next step required for further development and testing.

## Setup & Running Instructions

### 1. Smart Contracts

*   **Install Dependencies:**
    ```bash
    cd contracts
    npm install
    ```
*   **Run Tests:**
    ```bash
    npx hardhat test
    ```

### 2. Local Testnet

*   **Prerequisites:** Docker installed.
*   **Detailed Setup:** Refer to `design/dcc_testnet_setup.md` for comprehensive instructions.
*   **Summary:**
    1.  Create `testnet/password.txt` (for the sealer account).
    2.  Create `testnet/sealer_key.txt` (private key for the sealer account - **DO NOT COMMIT THIS**).
    3.  Build the Docker image: `docker build -t dcc-testnet ./testnet`
    4.  Run the bootnode container.
    5.  Run the sealer node container.
    6.  **Deploy contracts to the local testnet:**
        ```bash
        cd contracts
        npx hardhat run scripts/deploy.js --network localGeth
        ```
        *(Ensure `hardhat.config.js` has the `localGeth` network configured correctly)*
        **Note:** This step is currently **blocked** due to the Geth sealer node issues mentioned in the "Known Issues" section above.

### 3. Frontend

*   **Install Dependencies:**
    ```bash
    cd frontend
    npm install
    ```
*   **Configure Environment:**
    1.  Create a `.env` file in the `frontend/` directory (`frontend/.env`).
    2.  Add the deployed contract addresses (once deployment is possible) and network details to this file, prefixed with `VITE_`:
        ```dotenv
        VITE_GOVERNANCE_CONTRACT_ADDRESS=0x...
        VITE_MEMBERSHIP_CONTRACT_ADDRESS=0x...
        VITE_INCOME_MANAGEMENT_CONTRACT_ADDRESS=0x...
        VITE_PAYMENT_CONTRACT_ADDRESS=0x...
        VITE_NETWORK_CHAIN_ID=YOUR_CHAIN_ID # e.g., 1337 for default Hardhat, or your Geth chain ID
        ```
        *(Replace `0x...` with the actual addresses output during deployment and `YOUR_CHAIN_ID` with the correct chain ID for your local network)*
*   **Run Development Server:**
    ```bash
    npm run dev
    ```
    The application should be accessible at `http://localhost:5173` (or the port specified by Vite). You can interact with the basic UI, but contract interactions will fail until deployment is successful.

### 4. MetaMask Configuration

*   Add a new network configuration in MetaMask:
    *   **Network Name:** Local Geth (or similar)
    *   **New RPC URL:** `http://localhost:8545` (or the RPC port exposed by your Geth node)
    *   **Chain ID:** The Chain ID used in your `testnet/genesis.json` and configured in `frontend/.env`.
    *   **Currency Symbol:** ETH (optional)
*   Import the sealer account into MetaMask using the private key from `testnet/sealer_key.txt` to interact with deployed contracts (once deployed).

## Next Steps

*   **Resolve local testnet issues:** Investigate and fix the Geth sealer node problem within Docker or switch to an alternative like Ganache to enable contract deployment and testing. **(High Priority)**
*   Complete the TDD implementation for any remaining smart contract features outlined in the specifications.
*   Build out the frontend user interface and logic for interacting with the smart contracts (proposals, voting, membership management, payment flows, etc.) once deployment is possible.
*   Develop a backend API if required for off-chain data management or more complex operations.
*   Refine deployment scripts for the chosen testnet/mainnet environment.
*   Expand documentation, including user guides and API references.

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

## Setup & Running Instructions (Docker)

### 1. Setup & Running Instructions (Docker)

*   **Prerequisites:** Docker and Docker Compose installed.
*   **Steps:**
    1.  Create a `.env` file in the `frontend/` directory (`frontend/.env`).
    2.  Add the deployed contract addresses (once deployment is possible) and network details to this file, prefixed with `REACT_APP_`:
        ```dotenv
        REACT_APP_GOVERNANCE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
        REACT_APP_MEMBERSHIP_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
        REACT_APP_INCOME_MANAGEMENT_CONTRACT_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
        REACT_APP_PAYMENT_CONTRACT_ADDRESS=0xCf7Ed3AccA5a467e9e704C7036889412616053B
        REACT_APP_WEB3_PROVIDER_URL=http://localhost:8545
        ```
        *(These are the default addresses when deploying to a local hardhat chain. If you deploy to a different chain, you will need to update these values accordingly.)*
    3.  Run `docker-compose up --build` in the root directory of the project.
    4.  The frontend application should be accessible at `http://localhost:3000`.
    5.  The contracts will be running on a local hardhat chain accessible at `http://localhost:8545`.
### 2. Manual Frontend Setup (Alternative to Docker)

*   **Install Dependencies:**
    ```bash
    cd frontend
    npm install
### 3. MetaMask Configuration

*   Add a new network configuration in MetaMask:
    *   **Network Name:** Local Hardhat (or similar)
    *   **New RPC URL:** `http://localhost:8545` (or the RPC port exposed by your Hardhat node)
    *   **Chain ID:** 31337 (or the Chain ID used in your Hardhat configuration).
    *   **Currency Symbol:** ETH (optional)
*   Import the default Hardhat account into MetaMask to interact with deployed contracts.

## Next Steps

*   **Resolve local testnet issues:** Investigate and fix the Geth sealer node problem within Docker or switch to an alternative like Ganache to enable contract deployment and testing. **(High Priority)**
*   Complete the TDD implementation for any remaining smart contract features outlined in the specifications.
*   Build out the frontend user interface and logic for interacting with the smart contracts (proposals, voting, membership management, payment flows, etc.) once deployment is possible.
*   Develop a backend API if required for off-chain data management or more complex operations.
*   Refine deployment scripts for the chosen testnet/mainnet environment.
*   Expand documentation, including user guides and API references.

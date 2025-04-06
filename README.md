# Decentralised Consulting Collective (DCC)

## Overview

The Decentralised Consulting Collective (DCC) is a consultancy model designed to empower experienced professionals seeking flexible work opportunities. It leverages smart contract technology for decentralised governance, fair pay, transparent income management, and democratic decision-making within the framework of a registered company in England and Wales. The goal is to create a collaborative, equitable, and efficient platform for consultants and clients.

## Current Status

The project is currently under active development. Here's a summary of the progress:

*   **Smart Contracts (`contracts/`)**:
    *   Core contracts (`GovernanceContract`, `MembershipContract`, `IncomeManagementContract`, `PaymentContract`) have been partially implemented using Test-Driven Development (TDD).
    *   Key features covered include proposal creation, voting mechanisms, execution state tracking, basic membership joining, consultant rate setting, and initial payment reception logic.
    *   Passing tests demonstrating current functionality can be found in `contracts/test/`.
*   **Frontend (`frontend/`)**:
    *   A basic frontend application has been scaffolded using React, Vite, TypeScript, and Tailwind CSS.
    *   Includes basic wallet connection (MetaMask) functionality and foundational component structures.
*   **Testnet (`testnet/`)**:
    *   A local Proof-of-Authority (PoA) testnet infrastructure is defined using Docker and Geth.
    *   Setup scripts and configuration files are available for building and running the testnet nodes. See `design/dcc_testnet_setup.md` for details.
*   **Supporting Documents**:
    *   Initial requirements, specifications, and design documents are available in the `requirements/`, `specs/`, and `design/` directories respectively.

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
    6.  Deploy contracts to the local testnet:
        ```bash
        cd contracts
        npx hardhat run scripts/deploy.js --network localGeth
        ```
        *(Ensure `hardhat.config.js` has the `localGeth` network configured correctly)*

### 3. Frontend

*   **Install Dependencies:**
    ```bash
    cd frontend
    npm install
    ```
*   **Configure Environment:**
    1.  Create a `.env` file in the `frontend/` directory (`frontend/.env`).
    2.  Add the deployed contract addresses to this file, prefixed with `VITE_`:
        ```dotenv
        VITE_GOVERNANCE_CONTRACT_ADDRESS=0x...
        VITE_MEMBERSHIP_CONTRACT_ADDRESS=0x...
        VITE_INCOME_MANAGEMENT_CONTRACT_ADDRESS=0x...
        VITE_PAYMENT_CONTRACT_ADDRESS=0x...
        VITE_NETWORK_CHAIN_ID=YOUR_CHAIN_ID # e.g., 1337 for default Hardhat, or your Geth chain ID
        ```
        *(Replace `0x...` with the actual addresses output during deployment and `YOUR_CHAIN_ID` with the correct chain ID for your local Geth network)*
*   **Run Development Server:**
    ```bash
    npm run dev
    ```
    The application should be accessible at `http://localhost:5173` (or the port specified by Vite).

### 4. MetaMask Configuration

*   Add a new network configuration in MetaMask:
    *   **Network Name:** Local Geth (or similar)
    *   **New RPC URL:** `http://localhost:8545` (or the RPC port exposed by your Geth node)
    *   **Chain ID:** The Chain ID used in your `testnet/genesis.json` and configured in `frontend/.env`.
    *   **Currency Symbol:** ETH (optional)
*   Import the sealer account into MetaMask using the private key from `testnet/sealer_key.txt` to interact with deployed contracts.

## Next Steps

*   Complete the TDD implementation for all smart contract features outlined in the specifications.
*   Build out the frontend user interface and logic for interacting with the smart contracts (proposals, voting, membership management, etc.).
*   Develop a backend API if required for off-chain data management or more complex operations.
*   Refine testnet setup and deployment scripts.
*   Expand documentation.
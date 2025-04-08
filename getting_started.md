# Getting Started

To download and run the code from this GitHub repository, follow these steps:

1.  **Install Git:** If you don't have Git installed, download and install it from [https://git-scm.com/downloads](https://git-scm.com/downloads).
2.  **Clone the repository:** Open a terminal or command prompt and navigate to the directory where you want to store the project. Then, run the following command, replacing `<repository_url>` with the actual URL of the GitHub repository:

```bash
git clone <repository_url>
```

3.  **Navigate to the project directory:** `cd DCC` (or whatever the repository folder name is)
4.  **Install dependencies for the smart contracts:**

```bash
cd contracts
npm install
cd ..
```

5.  **Install dependencies for the frontend:**

```bash
cd frontend
npm install
cd ..
```

6.  **Set up environment variables:**
    *   Create a `.env` file in the `frontend/` directory (`frontend/.env`).
    *   Add the deployed contract addresses (once deployment is possible) and network details to this file, prefixed with `VITE_`:

```dotenv
VITE_GOVERNANCE_CONTRACT_ADDRESS=0x...
VITE_MEMBERSHIP_CONTRACT_ADDRESS=0x...
VITE_INCOME_MANAGEMENT_CONTRACT_ADDRESS=0x...
VITE_PAYMENT_CONTRACT_ADDRESS=0x...
VITE_NETWORK_CHAIN_ID=YOUR_CHAIN_ID # e.g., 1337 for default Hardhat, or your Geth chain ID
```

*(Replace `0x...` with the actual addresses output during deployment and `YOUR_CHAIN_ID` with the correct chain ID for your local network)*

7.  **Start the local testnet (optional):**
    *   Install Docker.
    *   Follow the instructions in `design/dcc_testnet_setup.md` to set up and run the local Geth testnet.
8.  **Deploy the smart contracts (optional):**
    *   If you are using the local testnet, deploy the smart contracts to the network:

```bash
cd contracts
npx hardhat run scripts/deploy.js --network localGeth
cd ..
```

9.  **Configure MetaMask:**
    *   **Add a new network:**
        *   **Network Name:** Localhost 8545 (or similar)
        *   **New RPC URL:** `http://127.0.0.1:8545/`
        *   **Chain ID:** `31337` (or the chain ID you configured in Hardhat)
        *   **Currency Symbol:** ETH
    *   **Import an account:**
        *   In Hardhat, the default account's private key is `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`.
        *   In MetaMask, click the account icon, then "Import Account".
        *   Select "Private Key" and paste the private key.
10. **Start the frontend development server:**

```bash
cd frontend
npm run dev
cd ..
```

The application should be accessible at `http://localhost:5173` (or the port specified by Vite).
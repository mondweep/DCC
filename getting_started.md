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

7.  **Set up the application locally using Docker (recommended):**
    *   Install Docker and Docker Compose.
    *   Create a `.env` file in the `frontend/` directory (`frontend/.env`) with the following content:

```dotenv
REACT_APP_GOVERNANCE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
REACT_APP_MEMBERSHIP_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
REACT_APP_INCOME_MANAGEMENT_CONTRACT_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
REACT_APP_PAYMENT_CONTRACT_ADDRESS=0xCf7Ed3AccA5a467e9e704C7036889412616053B
REACT_APP_WEB3_PROVIDER_URL=http://localhost:8545
```
    *   *(These are the default addresses when deploying to a local hardhat chain. If you deploy to a different chain, you will need to update these values accordingly.)*
    *   Run `docker-compose up --build` in the root directory of the project.
    *   The frontend application should be accessible at `http://localhost:3000`.
    *   The contracts will be running on a local hardhat chain accessible at `http://localhost:8545`.

8.  **Configure MetaMask:**
    *   **Add a new network:**
        *   **Network Name:** Local Hardhat (or similar)
        *   **New RPC URL:** `http://127.0.0.1:8545/`
        *   **Chain ID:** `31337` (or the chain ID used in your Hardhat configuration).
        *   **Currency Symbol:** ETH
    *   **Import an account:**
        *   In Hardhat, the default account's private key is `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`.
        *   In MetaMask, click the account icon, then "Import Account".
        *   Select "Private Key" and paste the private key.

9.  **Manual Frontend Setup (Alternative to Docker):**
    *   If you are not using Docker, you can set up the frontend manually:
        *   Install dependencies:

10. **Start the frontend development server (Manual Setup):**

        ```bash
        cd frontend
        npm run dev
        cd ..
        ```

        The application should be accessible at `http://localhost:5173` (or the port specified by Vite).

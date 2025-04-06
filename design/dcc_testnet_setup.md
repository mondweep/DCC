# DCC Shared Test Network Setup Design

## 1. Overview

This document outlines the design for a shared blockchain test network for the Decentralised Consulting Collective (DCC) project. This setup allows initial users (founders, testers) to participate in the network by running a node on their own laptops using a provided Docker image, facilitating validation of the DCC concept on a distributed network. This replaces the purely local Hardhat development network for shared testing phases.

## 2. Goals

*   Provide a stable, shared blockchain environment for DCC testing.
*   Enable non-technical users to easily run a node and participate.
*   Use Ethereum-compatible technology for alignment with planned smart contracts.
*   Maintain a controlled environment suitable for testing (e.g., predictable block times, controlled validator set).

## 3. Technology Choices

*   **Blockchain Client:** Go Ethereum (Geth) - Mature, widely used, supports Clique PoA.
*   **Consensus Algorithm:** Clique (Proof-of-Authority - PoA) - Suitable for a permissioned testnet where validators (sealers) are known and trusted. Avoids PoW resource intensity and provides faster, more predictable block times than PoS setups for a small test group.
*   **Containerization:** Docker

## 4. Network Configuration

*   **Network Name:** DCC Testnet
*   **Network ID:** A unique chain ID (e.g., `61740` - chosen randomly, avoid collisions with common testnets).
*   **Consensus:** Clique PoA.
    *   **Initial Sealers:** A predefined set of Ethereum addresses will be designated as initial sealers (validators). These could be controlled by the core development team initially. New sealers can be added/removed via voting later if integrated with the Governance contract.
    *   **Block Period:** ~15 seconds (configurable in Clique).
*   **Genesis Block (`genesis.json`):**
    *   Defines the Network ID (`chainId`).
    *   Configures the Clique consensus engine (`clique` section), specifying the block period and initial sealer addresses in the `extraData` field.
    *   Can pre-allocate Ether to specific addresses for testing purposes (e.g., founder wallets, contract deployment address).
    ```json
    // Example genesis.json structure
    {
      "config": {
        "chainId": 61740,
        "homesteadBlock": 0,
        "eip150Block": 0,
        "eip155Block": 0,
        "eip158Block": 0,
        "byzantiumBlock": 0,
        "constantinopleBlock": 0,
        "petersburgBlock": 0,
        "istanbulBlock": 0,
        "berlinBlock": 0, // Enable latest features if needed
        "clique": {
          "period": 15, // Block period in seconds
          "epoch": 30000 // Default checkpoint interval
        }
      },
      "difficulty": "1",
      "gasLimit": "8000000", // Adjust as needed
      "extraData": "0x...", // Encodes initial sealer addresses for Clique
      "alloc": {
        "0xAddressOfDeployer": { "balance": "1000000000000000000000" }, // Pre-fund deployer
        "0xAddressOfFounder1": { "balance": "100000000000000000000" }  // Pre-fund founder
        // ... other pre-funded accounts
      }
    }
    ```
*   **Bootnodes:** At least one stable node (run by the core team) will act as a bootnode. Its `enode` address will be provided to participants to help them discover peers.

## 5. Docker Image Specification

*   **Base Image:** Official `ethereum/client-go` image.
*   **Contents:**
    *   Geth client binary.
    *   The `genesis.json` file.
    *   An entrypoint script (`entrypoint.sh`).
*   **Dockerfile Concept:**
    ```dockerfile
    FROM ethereum/client-go:stable

    WORKDIR /root

    # Copy genesis file and entrypoint script
    COPY genesis.json .
    COPY entrypoint.sh .

    # Geth data directory volume
    VOLUME ["/.ethereum"]
    # Expose necessary ports
    EXPOSE 8545 # HTTP RPC
    EXPOSE 8546 # WebSocket RPC
    EXPOSE 30303 # P2P TCP
    EXPOSE 30303/udp # P2P UDP

    ENTRYPOINT ["/bin/sh", "entrypoint.sh"]
    ```
*   **Entrypoint Script (`entrypoint.sh`):**
    *   Checks if the data directory (`/.ethereum/geth`) is already initialized.
    *   If not initialized: Runs `geth init --datadir /.ethereum genesis.json`.
    *   Starts Geth using parameters defined via environment variables or command-line args passed to `docker run`. Key flags:
        *   `--datadir /.ethereum`
        *   `--networkid 61740`
        *   `--bootnodes <enode_address_of_bootnode>`
        *   `--syncmode full` (or `light` if appropriate, though full/snap is better for participation)
        *   `--http --http.addr 0.0.0.0 --http.port 8545 --http.api eth,net,web3,clique` (Enable RPC)
        *   `--ws --ws.addr 0.0.0.0 --ws.port 8546 --ws.api eth,net,web3,clique` (Enable WebSocket)
        *   `--allow-insecure-unlock` (If needed for testing accounts via RPC, use with caution)
        *   `--unlock <address_to_unlock>` (Optional, if a node needs to seal)
        *   `--password <path_to_password_file>` (Optional, if unlocking sealer account)
        *   `--mine` (If the node is a sealer)
        *   `--miner.etherbase <sealer_address>` (If the node is a sealer)
*   **Build & Distribution:** The Docker image will be built and pushed to a container registry (e.g., Docker Hub, GitHub Container Registry) for easy distribution.

## 6. User Connection Procedure

1.  **Install Docker:** Users need Docker Desktop installed on their laptops.
2.  **Pull Image:** `docker pull <registry>/dcc-testnet-node:latest`
3.  **Run Container:**
    ```bash
    docker run -d --name dcc-node \
      -p 8545:8545 \
      -p 8546:8546 \
      -p 30303:30303 \
      -p 30303:30303/udp \
      -v dcc-node-data:/.ethereum \
      <registry>/dcc-testnet-node:latest \
      --bootnodes <enode_address_of_bootnode>
      # Add --mine, --unlock, --password, --miner.etherbase if user is a designated sealer
    ```
    *   `-d`: Run detached.
    *   `--name`: Assign a name.
    *   `-p`: Map ports for RPC and P2P.
    *   `-v`: Mount a named volume (`dcc-node-data`) to persist blockchain data.
    *   Pass necessary Geth flags after the image name (overriding/appending to entrypoint defaults if needed).
4.  **Check Logs:** `docker logs dcc-node -f` to monitor sync progress and status.

## 7. DApp Interaction (Frontend)

1.  **MetaMask Configuration:** Users need to add the DCC Testnet as a custom network in MetaMask:
    *   **Network Name:** DCC Testnet
    *   **New RPC URL:** `http://127.0.0.1:8545` (assuming the Docker container's port 8545 is mapped to the host)
    *   **Chain ID:** `61740`
    *   **Currency Symbol (Optional):** `DCCETH` (or similar)
2.  **Frontend Connection:** The React frontend (running separately, perhaps also via Docker or locally) will connect to the network selected in MetaMask. When a user selects "DCC Testnet" in MetaMask, `ethers.js` (or similar library) will automatically use `http://127.0.0.1:8545` (or the configured RPC URL) to interact with the user's local node running in Docker.

## 8. Estimated Resource Requirements (Per Node)

These are rough estimates and depend on network activity:

*   **CPU:** 1-2 cores recommended.
*   **RAM:** 2-4 GB minimum, 4-8 GB recommended for smoother operation.
*   **Disk Space:** Starts small but grows with blockchain history. Allocate at least 20-50 GB initially for a testnet, potentially more over time. Using a Docker volume is crucial for persistence.
*   **Network:** Stable internet connection required for P2P communication and syncing.

## 9. Security/Operational Notes

*   **Sealer Keys:** Management of sealer keys is critical for PoA network security.
*   **Bootnode Stability:** The bootnode(s) must be reliably available.
*   **Genesis File:** The genesis file must be identical for all participants.
*   **Docker Networking:** Ensure no host firewall rules block the necessary ports (30303, 8545, 8546).

This setup provides a practical way for users to participate in a shared DCC test network using their own hardware via Docker, moving beyond the limitations of a purely local development environment like Hardhat for collaborative testing.
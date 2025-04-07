# Use the stable Geth image
# Use a specific pre-merge Geth version known to work well with Clique
FROM ethereum/client-go:v1.10.25

# Set working directory
WORKDIR /root

# Copy genesis file and entrypoint script into the image
COPY genesis.json .
COPY entrypoint.sh .

# Make entrypoint script executable
RUN chmod +x entrypoint.sh

# Geth data directory volume - ensures blockchain data persists outside the container
VOLUME ["/.ethereum"]

# Expose necessary ports
# 8545: HTTP RPC endpoint for DApp/wallet interaction
# 8546: WebSocket RPC endpoint (optional, but useful)
# 30303: Geth P2P discovery (TCP and UDP)
EXPOSE 8545
EXPOSE 8546
EXPOSE 30303
EXPOSE 30303/udp

# Set the entrypoint script to run when the container starts
ENTRYPOINT ["/bin/sh", "entrypoint.sh"]
#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Define variables (can be overridden by environment variables)
DATADIR=${DATADIR:-"/.ethereum"}
NETWORK_ID=${NETWORK_ID:-"61740"}
HTTP_PORT=${HTTP_PORT:-"8545"}
WS_PORT=${WS_PORT:-"8546"}
# BOOTNODES env var should be set when running the container, e.g., -e BOOTNODES="enode://..."

# Initialize data directory and import key if needed
if [ ! -d "$DATADIR/geth" ]; then
  echo "Data directory not found. Initializing and importing key..."
  # Import sealer key first (creates keystore directory)
  KEY_FILE="/root/sealer_key.txt"
  PASSWORD_FILE="/root/password.txt"
  if [ -n "$SEALER_ADDRESS" ] && [ -f "$KEY_FILE" ] && [ -f "$PASSWORD_FILE" ]; then
      echo "Importing sealer key..."
      # Use --lightkdf for older Geth compatibility if needed, but try without first
      geth account import --datadir "$DATADIR" --password "$PASSWORD_FILE" "$KEY_FILE" || echo "Key import failed or key already exists."
      echo "Sealer key import attempted."
  elif [ -n "$SEALER_ADDRESS" ]; then
       echo "Warning: Sealer key file or password file not found, cannot import key."
  fi

  # Initialize genesis state
  echo "Initializing genesis state..."
  geth --datadir "$DATADIR" init genesis.json
else
  echo "Geth data directory already initialized."
  # Optional: Check if key exists on subsequent starts and import if missing?
  # For simplicity, we assume key exists if datadir exists from previous run.
fi

# Construct Geth command arguments
GETH_ARGS="--datadir $DATADIR \
--networkid $NETWORK_ID \
--syncmode full \
--http \
--http.addr 0.0.0.0 \
--http.port $HTTP_PORT \
--http.api eth,net,web3,clique,miner \
--http.corsdomain '*' \
--http.vhosts '*' \
--ws \
--ws.addr 0.0.0.0 \
--ws.port $WS_PORT \
--ws.api eth,net,web3,clique,miner \
--ws.origins '*' \
--allow-insecure-unlock \
--discovery.port 30303 \
--verbosity ${VERBOSITY:-3}" # Default verbosity 3

# Add bootnodes if provided
if [ -n "$BOOTNODES" ]; then
  GETH_ARGS="$GETH_ARGS --bootnodes $BOOTNODES"
fi

# Add mining options if node is a sealer (requires unlock)
# These should be set via environment variables when running the container for a sealer node
if [ -n "$SEALER_ADDRESS" ]; then
  echo "Configuring as sealer node for address: $SEALER_ADDRESS"
  # Assume password file is mounted at /root/password.txt if needed
  PASSWORD_FILE="/root/password.txt"
  if [ -f "$PASSWORD_FILE" ]; then
    # Revert to simpler flags for older Geth, but remove --mine initially
    GETH_ARGS="$GETH_ARGS --unlock $SEALER_ADDRESS --password $PASSWORD_FILE"
    # --miner.etherbase is deprecated, sealing rewards go to unlocked account by default
  else
    echo "Warning: SEALER_ADDRESS is set, but password file ($PASSWORD_FILE) not found. Node will not seal."
  fi
fi

# Start Geth
echo "Starting Geth with args: $GETH_ARGS"
exec geth $GETH_ARGS
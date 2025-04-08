FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Install hardhat globally
RUN npm install -g hardhat

# Expose port 8545 for Ganache
EXPOSE 8545

# Start Ganache in the background and keep the container running
CMD npx hardhat node --hostname 0.0.0.0
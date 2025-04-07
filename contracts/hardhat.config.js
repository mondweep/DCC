require('hardhat-coverage');
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    localGeth: {
      url: "http://127.0.0.1:8545",
      chainId: 61740,
      accounts: [`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`]
    },
    ganache: {
      url: "http://127.0.0.1:7545",
      chainId: 1337,
      accounts: [`0xaa653ac8024b416f5a6e0406111edafc031e0c09fa154fdd50ef976f27f91cb5`]
    }
  }
};

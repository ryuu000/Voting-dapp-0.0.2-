require("@nomicfoundation/hardhat-ethers");
require('dotenv').config();

module.exports = {
  solidity: "0.8.4",
  networks: {
    hardhat: {},
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};

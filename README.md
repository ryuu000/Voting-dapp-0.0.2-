# Voting-dapp-0.0.2-

An instance of a voting decentralized application (dApp).

## Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Running the Application](#running-the-application)
- [Usage](#usage)
- [Folder Structure](#folder-structure)
- [Contributing](#contributing)
- [License](#license)

## Introduction
Voting-dapp-0.0.2- is a decentralized application designed to enable users to vote for wellness professionals in a transparent and secure manner using blockchain technology.

## Features
- Add and fetch profiles of wellness professionals.
- Cast upvotes or downvotes for wellness professionals.
- Record votes on the blockchain.
- Distribute rewards to wellness professionals based on votes.

## Prerequisites
Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 14.x or higher)
- [npm](https://www.npmjs.com/)
- [Hardhat](https://hardhat.org/)
- [MetaMask](https://metamask.io/) browser extension
- Local blockchain setup (e.g., [Ganache](https://www.trufflesuite.com/ganache))

## Installation
Follow these steps to set up the project locally:

1. Clone the repository:
    ```sh
    git clone https://github.com/ryuu000/Voting-dapp-0.0.2-.git
    cd Voting-dapp-0.0.2-
    ```

2. Install dependencies for the backend:
    ```sh
    cd backend
    npm install
    ```

3. Install dependencies for the frontend:
    ```sh
    cd ../frontend
    npm install
    ```

## Smart Contract Deployment
1. Update the Hardhat configuration file (`backend/hardhat.config.js`) with your Infura project ID and private key:
    ```javascript
    module.exports = {
      solidity: "0.8.4",
      networks: {
        hardhat: {},
        ropsten: {
          url: "https://ropsten.infura.io/v3/YOUR_INFURA_PROJECT_ID",
          accounts: [`0x${YOUR_PRIVATE_KEY}`]
        }
      }
    };
    ```

2. Compile the smart contracts:
    ```sh
    cd backend
    npx hardhat compile
    ```

3. Deploy the contracts:
    ```sh
    npx hardhat run scripts/deploy.js --network ropsten
    ```
    Note: Replace `ropsten` with the desired network.

## Running the Application
1. Start the backend server:
    ```sh
    cd backend
    node server.js
    ```

2. Serve the frontend files:
    ```sh
    cd frontend
    npm start
    ```
    This will start a local server and open the application in your default web browser.

## Usage
1. Open the application in your browser.
2. Connect your MetaMask wallet.
3. Fetch profiles of wellness professionals.
4. Cast your votes (upvote or downvote) for the professionals.
5. View the recorded votes on the blockchain.

## Folder Structure
```plaintext
backend/
├── contracts/              # Solidity smart contracts
├── db/                     # Database initialization scripts
├── migrations/             # Deployment scripts
├── node_modules/           # Node.js modules
├── scripts/                # Additional scripts
├── server.js               # Backend server
├── hardhat.config.js       # Hardhat configuration
├── package-lock.json       # Package lock file
├── package.json            # Package file
frontend/
├── css/                    # CSS stylesheets
├── js/                     # JavaScript files
├── images/                 # Image assets
├── dapp.html               # Main HTML file

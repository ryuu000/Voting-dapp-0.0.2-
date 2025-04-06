# Voting dApp

A decentralized application for voting on wellness professionals.

## Features

- Connect with MetaMask wallet
- View wellness professional profiles
- Cast upvotes and downvotes
- Persistent storage of votes
- Rate limiting to prevent abuse
- Support for multiple Ethereum testnets (Sepolia, Goerli, Mumbai)

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/voting-dapp.git
cd voting-dapp
```

2. Install dependencies:
```bash
cd backend
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
# Edit .env with your settings
```

4. Start the backend server:
```bash
npm run dev
```

5. In a new terminal, serve the frontend:
```bash
cd frontend
python -m http.server 8000
```

6. Open your browser to `http://localhost:8000/dapp.html`

## Ethereum Testnet Support

This dApp supports multiple Ethereum testnets:

- **Sepolia**: The recommended testnet for Ethereum development
- **Goerli**: Another popular Ethereum testnet
- **Mumbai**: Polygon's testnet

### Testnet Configuration

1. Set up your environment variables in `.env`:
```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_project_id
GOERLI_RPC_URL=https://goerli.infura.io/v3/your_infura_project_id
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
DEFAULT_NETWORK=sepolia
```

2. Get testnet ETH:
   - Sepolia: [Sepolia Faucet](https://sepoliafaucet.com/)
   - Goerli: [Goerli Faucet](https://goerlifaucet.com/)
   - Mumbai: [Mumbai Faucet](https://faucet.polygon.technology/)

3. Connect your MetaMask wallet to the desired testnet:
   - The dApp will automatically prompt you to switch networks if needed
   - You can manually switch networks in MetaMask

## Vercel Deployment

### Prerequisites

- [Vercel account](https://vercel.com/signup)
- [Vercel CLI](https://vercel.com/docs/cli) (optional)

### Deployment Steps

1. **Prepare your project**:
   - Make sure your code is pushed to a GitHub repository
   - Ensure you have the `vercel.json` file in your project root

2. **Deploy using Vercel Dashboard**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure the project:
     - Framework Preset: Other
     - Build Command: `npm install`
     - Output Directory: `.`
   - Add environment variables from your `.env` file
   - Click "Deploy"

3. **Deploy using Vercel CLI** (alternative):
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### Environment Variables

Set these environment variables in your Vercel project settings:

- `NODE_ENV`: Set to `production`
- `INFURA_PROJECT_ID`: Your Infura project ID
- `PRIVATE_KEY`: Your private key for blockchain transactions
- `CONTRACT_ADDRESS`: Your deployed smart contract address
- `SEPOLIA_RPC_URL`: Your Sepolia RPC URL
- `GOERLI_RPC_URL`: Your Goerli RPC URL
- `MUMBAI_RPC_URL`: Your Mumbai RPC URL
- `DEFAULT_NETWORK`: Default network to use (sepolia, goerli, or mumbai)

## Testing

1. Populate test data:
```bash
cd backend
node test-data.js
```

2. Start the server:
```bash
npm run dev
```

3. Open the application in your browser and test:
   - MetaMask connection
   - Network switching
   - Viewing profiles
   - Casting votes
   - Error handling

## Project Structure

```
/
├── backend/              # Backend server code
│   ├── server.js         # Express server
│   ├── test-data.js      # Test data population script
│   └── package.json      # Backend dependencies
├── frontend/             # Frontend code
│   ├── dapp.html         # Main HTML file
│   ├── css/              # CSS stylesheets
│   └── js/               # JavaScript files
├── vercel.json           # Vercel configuration
└── README.md             # This file
```

## License

MIT

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

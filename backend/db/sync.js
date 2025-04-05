const { Pool } = require('pg');
const { ethers } = require('ethers');
const WellnessProfiles = require('../artifacts/contracts/wellnesscont.sol/WellnessProfiles.json');

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Contract configuration
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  WellnessProfiles.abi,
  provider
);

// Event handlers
async function handleProfileFetched(profileAddress, profile) {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO profiles (
        address, name, bio, profilePicture, isWellnessProfessional,
        upvotes, downvotes, reputation, totalStake
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (address) DO UPDATE SET
        name = $2,
        bio = $3,
        profilePicture = $4,
        isWellnessProfessional = $5,
        upvotes = $6,
        downvotes = $7,
        reputation = $8,
        totalStake = $9`,
      [
        profileAddress,
        profile.name,
        profile.bio,
        profile.profilePicture,
        profile.isWellnessProfessional,
        profile.upvotes.toNumber(),
        profile.downvotes.toNumber(),
        profile.reputation.toNumber(),
        profile.totalStake.toString()
      ]
    );
  } finally {
    client.release();
  }
}

async function handleVoteAdded(voter, wellnessProfessional, vote) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert vote
    await client.query(
      `INSERT INTO votes (
        voter, wellnessProfessionalHash, timestamp, voteType, stakeAmount
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (voter, wellnessProfessionalHash) DO UPDATE SET
        timestamp = $3,
        voteType = $4,
        stakeAmount = $5`,
      [
        voter,
        vote.wellnessProfessionalHash,
        new Date(vote.timestamp * 1000),
        vote.voteType,
        vote.stakeAmount.toString()
      ]
    );

    // Update profile vote counts
    await client.query(
      `UPDATE profiles 
       SET upvotes = upvotes + $1,
           downvotes = downvotes + $2
       WHERE address = $3`,
      [
        vote.voteType === 'UP' ? 1 : 0,
        vote.voteType === 'DOWN' ? 1 : 0,
        voter
      ]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function handleStakeDelegated(from, to, amount) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update delegated stakes
    await client.query(
      `INSERT INTO delegated_stakes (delegator, delegate, amount)
       VALUES ($1, $2, $3)
       ON CONFLICT (delegator, delegate) DO UPDATE SET
         amount = $3`,
      [from, to, amount.toString()]
    );

    // Update total stakes
    await client.query(
      `UPDATE profiles 
       SET totalStake = totalStake - $1
       WHERE address = $2`,
      [amount.toString(), from]
    );

    await client.query(
      `UPDATE profiles 
       SET totalStake = totalStake + $1
       WHERE address = $2`,
      [amount.toString(), to]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Event listeners
contract.on('ProfileFetched', handleProfileFetched);
contract.on('VoteAdded', handleVoteAdded);
contract.on('StakeDelegated', handleStakeDelegated);

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down...');
  await pool.end();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown); 
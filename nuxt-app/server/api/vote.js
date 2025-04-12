import { defineEventHandler, readBody, createError } from 'h3';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

// Database setup
const getDbPath = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production, use /tmp for Vercel
    return '/tmp/database.sqlite';
  }
  // In development, use local file
  return path.join(process.cwd(), 'database.sqlite');
};

const initDb = async () => {
  const dbPath = getDbPath();
  return await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
};

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    // Validate input
    if (!body.address || !body.voter || !body.voteType) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields: address, voter, and voteType are required'
      });
    }

    // Validate vote type
    if (![1, 2].includes(body.voteType)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid vote type. Must be 1 (upvote) or 2 (downvote)'
      });
    }

    // Validate Ethereum addresses
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(body.address) || !ethAddressRegex.test(body.voter)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Ethereum address format'
      });
    }

    const db = await initDb();

    // Check if profile exists
    const profile = await db.get('SELECT * FROM profiles WHERE address = ?', [body.address]);
    if (!profile) {
      throw createError({
        statusCode: 404,
        message: 'Profile not found'
      });
    }

    // Check if user has already voted
    const existingVote = await db.get(
      'SELECT * FROM votes WHERE profile_address = ? AND voter_address = ?',
      [body.address, body.voter]
    );

    if (existingVote) {
      // Update existing vote
      await db.run(
        'UPDATE votes SET vote_type = ? WHERE profile_address = ? AND voter_address = ?',
        [body.voteType, body.address, body.voter]
      );
    } else {
      // Insert new vote
      await db.run(
        'INSERT INTO votes (profile_address, voter_address, vote_type) VALUES (?, ?, ?)',
        [body.address, body.voter, body.voteType]
      );
    }

    // Get updated vote counts
    const voteCounts = await db.get(`
      SELECT 
        COUNT(CASE WHEN vote_type = 1 THEN 1 END) as upvotes,
        COUNT(CASE WHEN vote_type = 2 THEN 1 END) as downvotes
      FROM votes 
      WHERE profile_address = ?
    `, [body.address]);

    return {
      success: true,
      message: 'Vote recorded successfully',
      voteCounts
    };
  } catch (error) {
    console.error('Error recording vote:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to record vote'
    });
  }
}); 
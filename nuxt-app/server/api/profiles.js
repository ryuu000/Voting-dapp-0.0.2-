import { defineEventHandler } from 'h3';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';

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
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      address TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      bio TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_address TEXT NOT NULL,
      voter_address TEXT NOT NULL,
      vote_type INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (profile_address) REFERENCES profiles(address),
      UNIQUE(profile_address, voter_address)
    );
  `);

  // Check if we need to populate test data
  const count = await db.get('SELECT COUNT(*) as count FROM profiles');
  if (count.count === 0) {
    // Insert test profiles
    const testProfiles = [
      {
        address: '0x1234567890123456789012345678901234567890',
        name: 'Dr. Sarah Johnson',
        bio: 'Mindfulness meditation expert with 15 years of experience'
      },
      {
        address: '0x0987654321098765432109876543210987654321',
        name: 'Michael Chen',
        bio: 'Yoga instructor specializing in stress reduction techniques'
      },
      {
        address: '0xabcdef0123456789abcdef0123456789abcdef01',
        name: 'Lisa Rodriguez',
        bio: 'Certified life coach focusing on work-life balance'
      }
    ];

    for (const profile of testProfiles) {
      await db.run(
        'INSERT INTO profiles (address, name, bio) VALUES (?, ?, ?)',
        [profile.address, profile.name, profile.bio]
      );
    }
  }

  return db;
};

export default defineEventHandler(async (event) => {
  try {
    const db = await initDb();
    
    // Get all profiles with their vote counts
    const profiles = await db.all(`
      SELECT 
        p.*,
        COUNT(CASE WHEN v.vote_type = 1 THEN 1 END) as upvotes,
        COUNT(CASE WHEN v.vote_type = 2 THEN 1 END) as downvotes
      FROM profiles p
      LEFT JOIN votes v ON p.address = v.profile_address
      GROUP BY p.address
      ORDER BY upvotes DESC, downvotes ASC
    `);

    return profiles;
  } catch (error) {
    console.error('Error fetching profiles:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch profiles'
    });
  }
}); 
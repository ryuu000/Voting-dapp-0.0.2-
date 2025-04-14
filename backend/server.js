const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Create a new Express app
const app = express();
const port = 5000;  // Changed to port 5000
const host = '0.0.0.0';  // Always bind to all interfaces

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Enable CORS and rate limiting
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());
app.use(limiter);

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Database setup
let db;
try {
  // For Vercel deployment, use a file in /tmp which is writable
  const dbPath = process.env.NODE_ENV === 'production' 
    ? '/tmp/database.sqlite' 
    : './database.sqlite';
    
  // Ensure the directory exists
  if (process.env.NODE_ENV === 'production') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error connecting to database:', err);
      return;
    }
    console.log('Connected to SQLite database');
    
    // Initialize database tables
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS profiles (
          address TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          bio TEXT,
          profilePicture TEXT,
          isWellnessProfessional BOOLEAN DEFAULT 0
        )
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS votes (
          voter TEXT,
          wellnessProfessional TEXT,
          voteType INTEGER CHECK(voteType IN (1, 2)),
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (voter, wellnessProfessional),
          FOREIGN KEY (wellnessProfessional) REFERENCES profiles(address)
        )
      `);
      
      // Check if we need to populate with test data
      db.get("SELECT COUNT(*) as count FROM profiles", [], (err, row) => {
        if (err) {
          console.error('Error checking profiles:', err);
          return;
        }
        if (row.count === 0) {
          console.log('No profiles found, populating with test data...');
          populateTestData();
        }
      });
    });
  });
} catch (error) {
  console.error('Database initialization error:', error);
}

// Function to populate test data
function populateTestData() {
  const testProfiles = [
    {
      address: '0x1234567890123456789012345678901234567890',
      name: 'Dr. Jane Smith',
      bio: 'Certified wellness professional with 10 years of experience',
      profilePicture: 'https://example.com/profile1.jpg',
      isWellnessProfessional: 1
    },
    {
      address: '0x0987654321098765432109876543210987654321',
      name: 'John Wellness',
      bio: 'Mindfulness coach and meditation expert',
      profilePicture: 'https://example.com/profile2.jpg',
      isWellnessProfessional: 1
    },
    {
      address: '0xabcdef0123456789abcdef0123456789abcdef01',
      name: 'Sarah Health',
      bio: 'Yoga instructor and wellness consultant',
      profilePicture: 'https://example.com/profile3.jpg',
      isWellnessProfessional: 1
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO profiles (address, name, bio, profilePicture, isWellnessProfessional)
    VALUES (?, ?, ?, ?, ?)
  `);

  testProfiles.forEach(profile => {
    stmt.run(
      profile.address,
      profile.name,
      profile.bio,
      profile.profilePicture,
      profile.isWellnessProfessional
    );
  });

  stmt.finalize();
  console.log('Test profiles inserted successfully');
}

// Input validation middleware
const validateVoteInput = (req, res, next) => {
  const { address, voteType, voter } = req.body;
  
  if (!address || !voteType || !voter) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (!/^0x[a-fA-F0-9]{40}$/.test(address) || !/^0x[a-fA-F0-9]{40}$/.test(voter)) {
    return res.status(400).json({ error: 'Invalid Ethereum address format' });
  }
  
  if (![1, 2].includes(Number(voteType))) {
    return res.status(400).json({ error: 'Invalid vote type' });
  }
  
  next();
};

// Profile endpoint
app.get('/api/profiles', (req, res) => {
  console.log('GET /api/profiles - Request received');
  if (!db) {
    console.error('Database not initialized');
    return res.status(500).json({ error: 'Database not initialized' });
  }
  
  db.all("SELECT * FROM profiles", [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    console.log(`Returning ${rows.length} profiles`);
    res.json(rows);
  });
});

// Vote endpoint with validation
app.post('/api/vote', validateVoteInput, (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Database not initialized' });
  }
  
  const { address, voteType, voter } = req.body;
  const timestamp = new Date().toISOString();

  db.get("SELECT * FROM profiles WHERE address = ?", [address], (err, profile) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    db.run(`
      INSERT INTO votes (voter, wellnessProfessional, voteType, timestamp) 
      VALUES (?, ?, ?, ?)
      ON CONFLICT(voter, wellnessProfessional) 
      DO UPDATE SET voteType = ?, timestamp = ?
    `, [voter, address, voteType, timestamp, voteType, timestamp], function(err) {
      if (err) {
        console.error('Vote recording error:', err);
        return res.status(500).json({ error: 'Failed to record vote' });
      }
      res.json({ 
        message: 'Vote recorded successfully',
        data: { address, voteType, voter, timestamp }
      });
    });
  });
});

// Network configuration endpoint
app.get('/api/networks', (req, res) => {
  // Return supported networks configuration
  const networks = {
    sepolia: {
      name: 'Sepolia',
      chainId: '0xaa36a7',
      rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/',
      explorer: 'https://sepolia.etherscan.io'
    },
    goerli: {
      name: 'Goerli',
      chainId: '0x5',
      rpcUrl: process.env.GOERLI_RPC_URL || 'https://goerli.infura.io/v3/',
      explorer: 'https://goerli.etherscan.io'
    },
    mumbai: {
      name: 'Mumbai',
      chainId: '0x13881',
      rpcUrl: process.env.MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
      explorer: 'https://mumbai.polygonscan.com'
    }
  };
  
  res.json(networks);
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend')));
  
  // Serve index.html for all routes not handled by API
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dapp.html'));
  });
}

// Start the server with error handling
const server = app.listen(port, host, (err) => {
  if (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
  console.log(`Server is running on http://${host}:${port}`);
  console.log('CORS is enabled for all origins');
  
  // Test database connection
  if (db) {
    db.get("SELECT COUNT(*) as count FROM profiles", [], (err, row) => {
      if (err) {
        console.error('Database error:', err);
      } else {
        console.log(`Database connected, found ${row.count} profiles`);
      }
    });
  }
});

// For Vercel serverless functions
module.exports = app;

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const app = express();
const port = 3000;

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Enable CORS and rate limiting
app.use(cors());
app.use(express.json());
app.use(limiter);

// Database connection error handling
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
});

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
});

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
    db.all("SELECT * FROM profiles", [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(rows);
    });
});

// Vote endpoint with validation
app.post('/api/vote', validateVoteInput, (req, res) => {
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Closing database connection...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
            process.exit(1);
        }
        console.log('Database connection closed');
        process.exit(0);
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

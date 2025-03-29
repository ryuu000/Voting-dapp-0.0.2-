const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run(`
        CREATE TABLE profiles (
            address TEXT PRIMARY KEY,
            name TEXT,
            bio TEXT,
            profilePicture TEXT,
            isWellnessProfessional BOOLEAN
        )
    `);
    db.run(`
        CREATE TABLE votes (
            voter TEXT,
            wellnessProfessional TEXT,
            voteType TEXT,
            timestamp TIMESTAMP,
            PRIMARY KEY (voter, wellnessProfessional)
        )
    `);
});

// Profile endpoint
app.get('/api/profiles', (req, res) => {
    db.all("SELECT * FROM profiles", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Vote endpoint
app.post('/api/vote', (req, res) => {
    const { address, voteType } = req.body;
    const timestamp = new Date().toISOString();

    db.get("SELECT * FROM profiles WHERE address = ?", [address], (err, profile) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!profile) {
            res.status(404).json({ message: 'Profile not found' });
            return;
        }

        db.run(`
            INSERT INTO votes (voter, wellnessProfessional, voteType, timestamp) 
            VALUES (?, ?, ?, ?)
            ON CONFLICT(voter, wellnessProfessional) 
            DO UPDATE SET voteType = ?, timestamp = ?
        `, [req.body.voter, address, voteType, timestamp, voteType, timestamp], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Vote recorded', address, voteType });
        });
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

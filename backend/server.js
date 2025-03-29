const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// Profile endpoint
app.get('/api/profiles', (req, res) => {
    // Fetch profiles from the database and send them as a response
    res.json([
        { name: 'Dr. John Doe', address: '0x123...' },
        { name: 'Jane Smith', address: '0x456...' }
    ]);
});

// Vote endpoint
app.post('/api/vote', (req, res) => {
    const { address, voteType } = req.body;
    // Logic to handle voting (e.g., updating database or smart contract)
    res.json({ message: 'Vote recorded', address, voteType });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

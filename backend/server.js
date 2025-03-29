const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// Example route
app.get('/api/profiles', (req, res) => {
    // Fetch profiles from the database and send them as a response
    res.json([
        { name: 'Dr. John Doe', address: '0x123...' },
        { name: 'Jane Smith', address: '0x456...' }
    ]);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

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

db.serialize(() => {
    // Clear existing data
    db.run('DELETE FROM votes');
    db.run('DELETE FROM profiles');

    // Insert test profiles
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

    // Insert some test votes
    const voteStmt = db.prepare(`
        INSERT INTO votes (voter, wellnessProfessional, voteType, timestamp)
        VALUES (?, ?, ?, ?)
    `);

    // Add some test votes
    const testVotes = [
        {
            voter: '0x1111111111111111111111111111111111111111',
            wellnessProfessional: testProfiles[0].address,
            voteType: 1
        },
        {
            voter: '0x2222222222222222222222222222222222222222',
            wellnessProfessional: testProfiles[1].address,
            voteType: 2
        }
    ];

    testVotes.forEach(vote => {
        voteStmt.run(
            vote.voter,
            vote.wellnessProfessional,
            vote.voteType,
            new Date().toISOString()
        );
    });

    voteStmt.finalize();

    console.log('Test data inserted successfully');
});

// Close the database connection
db.close((err) => {
    if (err) {
        console.error('Error closing database:', err);
        process.exit(1);
    }
    console.log('Database connection closed');
}); 
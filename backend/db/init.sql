-- Create enum for vote types
CREATE TYPE vote_type AS ENUM ('UP', 'DOWN');

-- Create profiles table with all contract fields
CREATE TABLE profiles (
    address TEXT PRIMARY KEY,
    name TEXT NOT NULL CHECK (length(name) <= 50),
    bio TEXT CHECK (length(bio) <= 500),
    profilePicture TEXT,
    isWellnessProfessional BOOLEAN NOT NULL DEFAULT false,
    upvotes INTEGER NOT NULL DEFAULT 0,
    downvotes INTEGER NOT NULL DEFAULT 0,
    reputation INTEGER NOT NULL DEFAULT 0 CHECK (reputation >= 0 AND reputation <= 100),
    totalStake NUMERIC(78,0) NOT NULL DEFAULT 0, -- For uint256 compatibility
    lastRewardClaim TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create votes table with all contract fields
CREATE TABLE votes (
    voter TEXT NOT NULL,
    wellnessProfessionalHash TEXT NOT NULL, -- Store as hex string
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    voteType vote_type NOT NULL,
    stakeAmount NUMERIC(78,0) NOT NULL, -- For uint256 compatibility
    PRIMARY KEY (voter, wellnessProfessionalHash),
    FOREIGN KEY (voter) REFERENCES profiles(address) ON DELETE CASCADE,
    CONSTRAINT valid_stake CHECK (stakeAmount >= 0.1) -- MIN_STAKE from contract
);

-- Create delegated stakes table
CREATE TABLE delegated_stakes (
    delegator TEXT NOT NULL,
    delegate TEXT NOT NULL,
    amount NUMERIC(78,0) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (delegator, delegate),
    FOREIGN KEY (delegator) REFERENCES profiles(address) ON DELETE CASCADE,
    FOREIGN KEY (delegate) REFERENCES profiles(address) ON DELETE CASCADE,
    CONSTRAINT valid_delegation CHECK (amount > 0)
);

-- Create index for faster vote queries
CREATE INDEX idx_votes_professional ON votes(wellnessProfessionalHash);
CREATE INDEX idx_votes_timestamp ON votes(timestamp);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for professional statistics
CREATE VIEW professional_stats AS
SELECT 
    p.address,
    p.name,
    p.reputation,
    p.upvotes,
    p.downvotes,
    p.totalStake,
    COUNT(DISTINCT v.voter) as total_voters,
    SUM(CASE WHEN v.voteType = 'UP' THEN 1 ELSE 0 END) as total_upvotes,
    SUM(CASE WHEN v.voteType = 'DOWN' THEN 1 ELSE 0 END) as total_downvotes
FROM profiles p
LEFT JOIN votes v ON p.address = v.wellnessProfessionalHash
WHERE p.isWellnessProfessional = true
GROUP BY p.address, p.name, p.reputation, p.upvotes, p.downvotes, p.totalStake;

-- Create view for voter statistics
CREATE VIEW voter_stats AS
SELECT 
    p.address,
    p.name,
    p.totalStake,
    COUNT(DISTINCT v.wellnessProfessionalHash) as total_votes_cast,
    SUM(CASE WHEN v.voteType = 'UP' THEN 1 ELSE 0 END) as total_upvotes_cast,
    SUM(CASE WHEN v.voteType = 'DOWN' THEN 1 ELSE 0 END) as total_downvotes_cast,
    SUM(v.stakeAmount) as total_stake_used
FROM profiles p
LEFT JOIN votes v ON p.address = v.voter
GROUP BY p.address, p.name, p.totalStake;

-- Create view for delegation statistics
CREATE VIEW delegation_stats AS
SELECT 
    p.address as delegate,
    p.name as delegate_name,
    COUNT(DISTINCT ds.delegator) as total_delegators,
    SUM(ds.amount) as total_delegated_stake,
    MAX(ds.timestamp) as last_delegation
FROM profiles p
JOIN delegated_stakes ds ON p.address = ds.delegate
GROUP BY p.address, p.name;

-- Create view for recent activity
CREATE VIEW recent_activity AS
SELECT 
    'vote' as activity_type,
    v.timestamp,
    p1.name as voter_name,
    p2.name as professional_name,
    v.voteType,
    v.stakeAmount
FROM votes v
JOIN profiles p1 ON v.voter = p1.address
JOIN profiles p2 ON v.wellnessProfessionalHash = p2.address
UNION ALL
SELECT 
    'delegation' as activity_type,
    ds.timestamp,
    p1.name as delegator_name,
    p2.name as delegate_name,
    NULL as vote_type,
    ds.amount as stake_amount
FROM delegated_stakes ds
JOIN profiles p1 ON ds.delegator = p1.address
JOIN profiles p2 ON ds.delegate = p2.address
ORDER BY timestamp DESC;

-- Create view for reputation leaderboard
CREATE VIEW reputation_leaderboard AS
SELECT 
    p.address,
    p.name,
    p.reputation,
    p.upvotes,
    p.downvotes,
    p.totalStake,
    RANK() OVER (ORDER BY p.reputation DESC, p.upvotes DESC) as rank
FROM profiles p
WHERE p.isWellnessProfessional = true
ORDER BY p.reputation DESC, p.upvotes DESC;

-- Create view for stake leaderboard
CREATE VIEW stake_leaderboard AS
SELECT 
    p.address,
    p.name,
    p.totalStake,
    p.reputation,
    RANK() OVER (ORDER BY p.totalStake DESC) as rank
FROM profiles p
ORDER BY p.totalStake DESC;

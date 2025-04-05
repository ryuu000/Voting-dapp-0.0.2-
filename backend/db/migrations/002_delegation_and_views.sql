-- Migration: 002_delegation_and_views
-- Description: Add delegation features and views
-- Created: 2024-04-04

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

-- Create professional statistics view
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

-- Create voter statistics view
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

-- Create delegation statistics view
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

-- Create recent activity view
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

-- Create reputation leaderboard view
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

-- Create stake leaderboard view
CREATE VIEW stake_leaderboard AS
SELECT 
    p.address,
    p.name,
    p.totalStake,
    p.reputation,
    RANK() OVER (ORDER BY p.totalStake DESC) as rank
FROM profiles p
ORDER BY p.totalStake DESC; 
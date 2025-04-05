-- Migration: 001_initial_schema
-- Description: Initial database schema setup
-- Created: 2024-04-04

-- Create enum for vote types
CREATE TYPE vote_type AS ENUM ('UP', 'DOWN');

-- Create profiles table
CREATE TABLE profiles (
    address TEXT PRIMARY KEY,
    name TEXT NOT NULL CHECK (length(name) <= 50),
    bio TEXT CHECK (length(bio) <= 500),
    profilePicture TEXT,
    isWellnessProfessional BOOLEAN NOT NULL DEFAULT false,
    upvotes INTEGER NOT NULL DEFAULT 0,
    downvotes INTEGER NOT NULL DEFAULT 0,
    reputation INTEGER NOT NULL DEFAULT 0 CHECK (reputation >= 0 AND reputation <= 100),
    totalStake NUMERIC(78,0) NOT NULL DEFAULT 0,
    lastRewardClaim TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create votes table
CREATE TABLE votes (
    voter TEXT NOT NULL,
    wellnessProfessionalHash TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    voteType vote_type NOT NULL,
    stakeAmount NUMERIC(78,0) NOT NULL,
    PRIMARY KEY (voter, wellnessProfessionalHash),
    FOREIGN KEY (voter) REFERENCES profiles(address) ON DELETE CASCADE,
    CONSTRAINT valid_stake CHECK (stakeAmount >= 0.1)
);

-- Create indexes
CREATE INDEX idx_votes_professional ON votes(wellnessProfessionalHash);
CREATE INDEX idx_votes_timestamp ON votes(timestamp);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at trigger
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 
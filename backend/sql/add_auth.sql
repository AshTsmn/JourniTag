-- Migration: Add authentication and friends features
-- Run with: sqlite3 sql/greetings.db < sql/add_auth.sql

-- Add username and password columns to Users table
ALTER TABLE Users ADD COLUMN username TEXT;
ALTER TABLE Users ADD COLUMN password TEXT;

-- Add shared_with_user_id to SharedTrips table
ALTER TABLE SharedTrips ADD COLUMN shared_with_user_id INTEGER;

-- Create Friendships table
CREATE TABLE IF NOT EXISTS Friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES Users(id) ON DELETE CASCADE,
    UNIQUE(user_id, friend_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_friendships_user ON Friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON Friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_shared_trips_user ON SharedTrips(shared_with_user_id);
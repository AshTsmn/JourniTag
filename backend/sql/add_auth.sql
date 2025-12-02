-- Migration: Add authentication and friends features (SAFE - won't error on duplicates)
-- Run with: sqlite3 sql/greetings.db < sql/add_auth.sql

-- Note: If these columns already exist, SQLite will skip them
-- We'll check manually and only add what's needed

-- Create Friendships table (IF NOT EXISTS prevents errors)
CREATE TABLE IF NOT EXISTS Friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES Users(id) ON DELETE CASCADE,
    UNIQUE(user_id, friend_id)
);

-- Create indexes for better performance (IF NOT EXISTS prevents errors)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON Users(username);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON Friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON Friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_shared_trips_user ON SharedTrips(shared_with_user_id);
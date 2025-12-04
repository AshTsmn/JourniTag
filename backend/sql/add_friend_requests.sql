-- Migration: Add friend requests table for pending friendships
-- Run with: sqlite3 sql/greetings.db < sql/add_friend_requests.sql

CREATE TABLE IF NOT EXISTS FriendRequests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user_id INTEGER NOT NULL,
    to_user_id INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (from_user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES Users(id) ON DELETE CASCADE,
    UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_from ON FriendRequests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON FriendRequests(to_user_id);





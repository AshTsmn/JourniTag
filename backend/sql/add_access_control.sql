-- Migration: Add access control for shared trips
-- Run with: sqlite3 backend/sql/greetings.db < backend/sql/add_access_control.sql

-- Add access_level column to SharedTrips table (default to 'read')
ALTER TABLE SharedTrips ADD COLUMN access_level TEXT DEFAULT 'read' CHECK(access_level IN ('read', 'edit'));

-- Update existing rows to have 'read' access
UPDATE SharedTrips SET access_level = 'read' WHERE access_level IS NULL;

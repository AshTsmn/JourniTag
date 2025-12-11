"""Initialize database schema."""
import sqlite3
import os

def init_database():
    """Initialize the database with schema if it doesn't exist."""
    # Get database path from config or use default
    db_path = os.environ.get('DATABASE_PATH', './sql/JourniTag.db')
    
    # In production (Docker), use /app/backend/sql
    if os.path.exists('/app/backend'):
        db_path = '/app/backend/sql/JourniTag.db'
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    # Check if database already has tables
    connection = sqlite3.connect(db_path)
    cursor = connection.cursor()
    
    # Check if Users table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='Users'")
    if cursor.fetchone():
        print(f"✅ Database already initialized at {db_path}")
        connection.close()
        return
    
    print(f"📝 Initializing new database at {db_path}")
    
    # Create all tables
    cursor.executescript("""
        CREATE TABLE Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(100) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(100),
            profile_photo_url TEXT,
            created_at INTEGER DEFAULT (strftime('%s','now'))
        );

        CREATE TABLE Trips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title VARCHAR(255) NOT NULL,
            city VARCHAR(100),
            country VARCHAR(100),
            start_date INTEGER,
            end_date INTEGER,
            created_at INTEGER DEFAULT (strftime('%s','now')),
            FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
        );

        CREATE TABLE Locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trip_id INTEGER NOT NULL,
            x REAL,
            y REAL,
            name VARCHAR(255),
            address TEXT,
            rating INTEGER,
            cost_level TEXT,
            notes TEXT,
            time_needed INTEGER,
            best_time_to_visit VARCHAR(100),
            created_at INTEGER DEFAULT (strftime('%s','now')),
            FOREIGN KEY (trip_id) REFERENCES Trips(id) ON DELETE CASCADE
        );

        CREATE TABLE Tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) UNIQUE NOT NULL
        );

        CREATE TABLE LocationTags (
            location_id INTEGER NOT NULL,
            tag_id INTEGER NOT NULL,
            PRIMARY KEY (location_id, tag_id),
            FOREIGN KEY (location_id) REFERENCES Locations(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES Tags(id) ON DELETE CASCADE
        );

        CREATE TABLE Photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            x REAL,
            y REAL,
            file_url TEXT NOT NULL,
            original_filename VARCHAR(255),
            taken_at INTEGER,
            is_cover_photo BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (location_id) REFERENCES Locations(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
        );

        CREATE TABLE SharedTrips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trip_id INTEGER NOT NULL,
            shared_by_user_id INTEGER NOT NULL,
            shared_with_user_id INTEGER,
            shared_with_email VARCHAR(255) NOT NULL,
            share_token TEXT,
            created_at INTEGER DEFAULT (strftime('%s','now')),
            expires_at INTEGER,
            access_level TEXT DEFAULT 'view',
            FOREIGN KEY (trip_id) REFERENCES Trips(id) ON DELETE CASCADE,
            FOREIGN KEY (shared_by_user_id) REFERENCES Users(id) ON DELETE CASCADE,
            FOREIGN KEY (shared_with_user_id) REFERENCES Users(id) ON DELETE SET NULL
        );

        CREATE TABLE Friendships (
            user_id INTEGER NOT NULL,
            friend_id INTEGER NOT NULL,
            created_at INTEGER DEFAULT (strftime('%s','now')),
            PRIMARY KEY (user_id, friend_id),
            FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
            FOREIGN KEY (friend_id) REFERENCES Users(id) ON DELETE CASCADE
        );

        CREATE TABLE FriendRequests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_user_id INTEGER NOT NULL,
            to_user_id INTEGER NOT NULL,
            created_at INTEGER DEFAULT (strftime('%s','now')),
            FOREIGN KEY (from_user_id) REFERENCES Users(id) ON DELETE CASCADE,
            FOREIGN KEY (to_user_id) REFERENCES Users(id) ON DELETE CASCADE
        );
    """)
    
    connection.commit()
    connection.close()
    print("✅ Database initialized successfully!")

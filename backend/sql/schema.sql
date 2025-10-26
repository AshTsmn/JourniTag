CREATE TABLE Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
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
    shared_with_email VARCHAR(255) NOT NULL,
    share_token TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now')),
    expires_at INTEGER,
    FOREIGN KEY (trip_id) REFERENCES Trips(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_by_user_id) REFERENCES Users(id) ON DELETE CASCADE
);
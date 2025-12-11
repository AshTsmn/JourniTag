"""Database API."""

import sqlite3
import flask

def init_app(app):
    """Initialize database connection for Flask app."""
    print("🔧 Initializing database...")
    try:
        # Initialize database schema if needed
        from app.init_db import init_database
        init_database()
        print("✅ Database initialization complete")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        import traceback
        traceback.print_exc()
    
    app.teardown_appcontext(close_db)


def dict_factory(ptr, row):
    """Convert database row objects to a dictionary keyed on column name."""
    return {col[0]: row[idx] for idx, col in enumerate(ptr.description)}


def get_db():
    """Open a new database connection."""
    if 'sqlite_db' not in flask.g:
        db_filename = flask.current_app.config['DATABASE_FILENAME']
        flask.g.sqlite_db = sqlite3.connect(str(db_filename))
        flask.g.sqlite_db.row_factory = dict_factory

    return flask.g.sqlite_db


def close_db(error):
    """Close the database at the end of a request."""
    sqlite_db = flask.g.pop('sqlite_db', None)
    if sqlite_db is not None:
        sqlite_db.commit()
        sqlite_db.close()
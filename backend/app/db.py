"""Database API."""

import sqlite3
import flask


def dict_factory(ptr, row):
    """Convert database row objects to a dictionary keyed on column name.

    ptr: sqlite3.Cursor
    row: tuple
    """
    return {col[0]: row[idx] for idx, col in enumerate(ptr.description)}


def get_db():
    """Open a new database connection.

    Flask docs:
    https://flask.palletsprojects.com/en/1.0.x/appcontext/#storing-data
    """
    if 'sqlite_db' not in flask.g:
        db_filename = flask.current_app.config['DATABASE_FILENAME']
        flask.g.sqlite_db = sqlite3.connect(str(db_filename))
        flask.g.sqlite_db.row_factory = dict_factory

    return flask.g.sqlite_db


def close_db(error):
    """Close the database at the end of a request.

    error: Exception or None

    Flask docs:
    https://flask.palletsprojects.com/en/1.0.x/appcontext/#storing-data
    """
    sqlite_db = flask.g.pop('sqlite_db', None)
    if sqlite_db is not None:
        sqlite_db.commit()
        sqlite_db.close()


def init_app(app):
    """Attach the database teardown function to the Flask app."""
    app.teardown_appcontext(close_db)
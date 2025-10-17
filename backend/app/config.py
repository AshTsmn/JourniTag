"""Application configuration."""

import pathlib
import flask

app = flask.Flask(__name__)

# Root of the application
APPLICATION_ROOT = '/'

# Database file path
APP_ROOT = pathlib.Path(__file__).resolve().parent.parent
DATABASE_FILENAME = APP_ROOT / 'sql' / 'greetings.db'
"""Application configuration."""
import pathlib
import flask

app = flask.Flask(__name__)

# Root of the application
APPLICATION_ROOT = '/'

# Database file path
APP_ROOT = pathlib.Path(__file__).resolve().parent.parent
DATABASE_FILENAME = APP_ROOT / 'sql' / 'greetings.db'

# Photo upload configuration
UPLOAD_FOLDER = APP_ROOT / 'uploads' / 'photos'
MAX_CONTENT_LENGTH = 32 * 1024 * 1024  # 32MB max file size
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'heic', 'heif', 'gif'}

# Secret key for sessions
SECRET_KEY = 'dev-secret-key-change-this-in-production'
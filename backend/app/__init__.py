"""Flask App initializer."""
import flask
from flask_cors import CORS

# Flask Instance
app = flask.Flask(__name__)

# Session configuration (required for login/logout)
app.secret_key = 'journitag-secret-key-2024'
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_HTTPONLY'] = True

# CORS - must specify exact origin when using credentials (can't use wildcard *)
CORS(app, supports_credentials=True, origins=['http://localhost:5173'])

app.config.from_object('app.config')

from werkzeug.middleware.shared_data import SharedDataMiddleware
import os
app.wsgi_app = SharedDataMiddleware(app.wsgi_app, {
    '/uploads': os.path.join(app.root_path, '..', 'uploads')
})

from app import db
db.init_app(app)

from app import routes
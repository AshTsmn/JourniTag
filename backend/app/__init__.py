"""Flask App initializer."""
import flask
from flask_cors import CORS

# Flask Instance
app = flask.Flask(__name__)
CORS(app)

app.config.from_object('app.config')

from werkzeug.middleware.shared_data import SharedDataMiddleware
import os
app.wsgi_app = SharedDataMiddleware(app.wsgi_app, {
    '/uploads': os.path.join(app.root_path, '..', 'uploads')
})





from app import db
db.init_app(app)

from app import routes
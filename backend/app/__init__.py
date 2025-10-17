"""Flask App initializer."""
import flask

# Flask Instance
app = flask.Flask(__name__)

app.config.from_object('app.config')

from app import db
db.init_app(app)

from app import routes
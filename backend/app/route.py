"""REST API for localization."""
import re
import flask
import uuid 
import hashlib
from app import app
from app.db import get_db


@app.route('/')
def get_index():
    connection = get_db()
    cur = connection.execute(...)
    context = cur.fetchall()

    return flask.render_template("index.html", **context)
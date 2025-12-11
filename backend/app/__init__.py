"""Flask App initializer."""
import os
import flask
from flask_cors import CORS

# Determine if we're in production - check multiple env vars
IS_PRODUCTION = (
    os.environ.get('RAILWAY_ENVIRONMENT') is not None or
    os.environ.get('PORT') is not None or
    os.path.exists('/app/frontend/dist')  # If this path exists, we're in Docker
)

# Path to frontend build
if IS_PRODUCTION:
    static_folder = '/app/frontend/dist'
    print(f"🚀 PRODUCTION MODE - serving frontend from: {static_folder}")
else:
    static_folder = '../../frontend/dist'
    print(f"🔧 DEV MODE - serving frontend from: {static_folder}")

# Verify static folder exists
if os.path.exists(static_folder):
    print(f"✅ Frontend found at: {static_folder}")
    print(f"   Files: {os.listdir(static_folder)}")
else:
    print(f"❌ WARNING: Frontend not found at: {static_folder}")

# Flask Instance - serve React build from frontend/dist
app = flask.Flask(
    __name__,
    static_folder=static_folder,
    static_url_path=''
)

# Session configuration
app.secret_key = os.environ.get('SECRET_KEY', 'journitag-secret-key-2024')
app.config['SESSION_COOKIE_SAMESITE'] = 'None' if IS_PRODUCTION else 'Lax'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SECURE'] = True  # Always True for production HTTPS

# CORS configuration
if IS_PRODUCTION:
    # In production, same domain - be more permissive
    CORS(app, 
         supports_credentials=True, 
         origins=['*'],
         allow_headers=['Content-Type', 'Authorization'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
else:
    # In development
    CORS(app, supports_credentials=True, origins=['http://localhost:5173'])

app.config.from_object('app.config')

# Serve uploaded photos
from werkzeug.middleware.shared_data import SharedDataMiddleware
uploads_path = os.path.join(app.root_path, '..', 'uploads')
app.wsgi_app = SharedDataMiddleware(app.wsgi_app, {
    '/uploads': uploads_path
})

# Initialize database
from app import db
db.init_app(app)

# Import routes
from app import routes

# Serve React frontend for all non-API routes
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Serve React app for all routes except /api/*."""
    if path.startswith('api/'):
        return flask.abort(404)
    
    # Check if static folder exists
    if not os.path.exists(app.static_folder):
        return flask.jsonify({
            'error': 'Frontend not built',
            'message': 'Run: cd frontend && npm run build',
            'static_folder': app.static_folder
        }), 500
    
    # If requesting a specific static file (CSS, JS, images)
    if path:
        static_file_path = os.path.join(app.static_folder, path)
        if os.path.exists(static_file_path) and os.path.isfile(static_file_path):
            return flask.send_from_directory(app.static_folder, path)
    
    # Otherwise serve index.html (for React Router)
    return flask.send_from_directory(app.static_folder, 'index.html')
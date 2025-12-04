"""REST API for localization."""
import re
import flask
import uuid
import hashlib
from datetime import datetime
from app import app
from app.db import get_db
from app.photo_service import photo_service

def get_current_user():
    """Get current user from session."""
    if 'user_id' not in flask.session:
        return None
    connection = get_db()
    cursor = connection.execute(
        "SELECT id, username, email, name, profile_photo_url FROM Users WHERE id = ?",
        (flask.session['user_id'],)
    )
    user = cursor.fetchone()
    return dict(user) if user else None

def check_trip_access(trip_id, user_id, require_edit=False):
    """Check if user has access to a trip.

    Args:
        trip_id: ID of the trip
        user_id: ID of the user
        require_edit: If True, check for edit access. If False, read access is sufficient.

    Returns:
        dict with 'has_access' (bool), 'is_owner' (bool), 'access_level' (str or None)
    """
    connection = get_db()

    # Check if user owns the trip
    cursor = connection.execute(
        "SELECT * FROM Trips WHERE id = ? AND user_id = ?",
        (trip_id, user_id)
    )
    if cursor.fetchone():
        return {'has_access': True, 'is_owner': True, 'access_level': 'owner'}

    # Check if trip is shared with user
    cursor = connection.execute(
        "SELECT access_level FROM SharedTrips WHERE trip_id = ? AND shared_with_user_id = ?",
        (trip_id, user_id)
    )
    shared = cursor.fetchone()

    if shared:
        access_level = shared['access_level']
        if require_edit and access_level != 'edit':
            return {'has_access': False, 'is_owner': False, 'access_level': access_level}
        return {'has_access': True, 'is_owner': False, 'access_level': access_level}

    return {'has_access': False, 'is_owner': False, 'access_level': None}

@app.route('/')
def get_index():
    """Simple health endpoint for the backend root."""
    return flask.jsonify({"status": "ok"})
# unused route
# @app.route('/')
# def get_index():
#     connection = get_db()
#     cur = connection.execute(...)
#     context = cur.fetchall()

#     return flask.render_template("index.html", **context)

@app.route('/api/photos/batch-upload', methods=['POST'])
def batch_upload_photos():
    """Batch upload photos to a specific location."""
    current_user = get_current_user()
    if not current_user:
        return flask.jsonify({'success': False, 'error': 'Not logged in'}), 401

    # Get form data
    location_id = flask.request.form.get('location_id', type=int)
    user_id = current_user['id']  # <-- GET FROM SESSION

    if not location_id:
        return flask.jsonify({
            'success': False,
            'error': 'location_id is required'
        }), 400
    # Get uploaded files
    files = flask.request.files.getlist('files')

    if not files:
        return flask.jsonify({
            'success': False,
            'error': 'No files uploaded'
        }), 400

    connection = get_db()

    # Verify location exists
    cursor = connection.execute("SELECT * FROM Locations WHERE id = ?", (location_id,))
    location = cursor.fetchone()

    if not location:
        return flask.jsonify({
            'success': False,
            'error': 'Location not found'
        }), 404

    # Check if user has edit access to the trip
    access = check_trip_access(location['trip_id'], user_id, require_edit=True)
    if not access['has_access']:
        return flask.jsonify({
            'success': False,
            'error': 'You do not have permission to upload photos to this location. This trip is read-only.'
        }), 403

    try:
        created_photos = []

        for file in files:
            try:
                original_filename = file.filename
                print(f"\nProcessing: {original_filename}")

                # Save file temporarily to extract EXIF
                temp_path = f"/tmp/{original_filename}"
                file.save(temp_path)

                # Extract EXIF data
                exif_data = photo_service.extract_exif_data(temp_path)

                # Get GPS coordinates
                gps_coords = None
                if 'GPSInfo' in exif_data:
                    gps_coords = photo_service.convert_gps_to_decimal(exif_data['GPSInfo'])

                # Use location coordinates if photo doesn't have GPS
                if not gps_coords:
                    print(f"No GPS data in photo, using location coordinates")
                    latitude = location['y']
                    longitude = location['x']
                else:
                    latitude, longitude = gps_coords
                    print(f"📍 GPS: {latitude:.6f}, {longitude:.6f}")

                # Save photo file permanently (reopen from temp)
                with open(temp_path, 'rb') as f:
                    from werkzeug.datastructures import FileStorage
                    file_storage = FileStorage(f, filename=original_filename)
                    file_url, saved_ext = photo_service.save_photo_file(file_storage, original_filename)

                print(f"💾 Saved to: {file_url}")

                # Extract timestamp
                taken_at = photo_service.extract_datetime(exif_data)
                if not taken_at:
                    taken_at = int(datetime.now().timestamp())

                # Create Photo record
                cursor = connection.execute(
                    """
                    INSERT INTO Photos
                    (location_id, user_id, x, y, file_url, original_filename, taken_at, is_cover_photo)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (location_id, user_id, longitude, latitude, file_url,
                     original_filename, taken_at, False)
                )

                photo_id = cursor.lastrowid

                # Fetch created photo
                cursor = connection.execute(
                    "SELECT * FROM Photos WHERE id = ?",
                    (photo_id,)
                )
                photo = cursor.fetchone()
                created_photos.append(photo)

                # Clean up temp file
                import os
                os.remove(temp_path)

                print(f"✅ Successfully uploaded {original_filename}")

            except Exception as e:
                print(f"❌ Error processing {file.filename}: {e}")
                continue

        # Set first photo as cover if no cover exists for that location
        if created_photos:
            cursor = connection.execute(
                "SELECT * FROM Photos WHERE location_id = ? AND is_cover_photo = 1",
                (location_id,)
            )
            existing_cover = cursor.fetchone()

            if not existing_cover:
                connection.execute(
                    "UPDATE Photos SET is_cover_photo = 1 WHERE id = ?",
                    (created_photos[0]['id'],)
                )
                created_photos[0]['is_cover_photo'] = True
                print(f"⭐ Set {created_photos[0]['original_filename']} as cover photo")

        connection.commit()

        print(f"\n{'='*60}")
        print(f"✅ Successfully uploaded: {len(created_photos)} photos to location {location_id}")
        print(f"{'='*60}\n")

        return flask.jsonify({
            'success': True,
            'photos_uploaded': len(created_photos),
            'photos': created_photos,
            'message': f'Successfully uploaded {len(created_photos)} photos'
        })

    except Exception as e:
        print(f"Error during upload: {e}")
        import traceback
        traceback.print_exc()
        return flask.jsonify({
            'success': False,
            'error': f'Error uploading photos: {str(e)}'
        }), 500

@app.route('/api/photos/location/<int:location_id>', methods=['GET'])
def get_photos_by_location(location_id):
    """Get all photos for a location."""
    connection = get_db()
    cursor = connection.execute(
        "SELECT * FROM Photos WHERE location_id = ?",
        (location_id,)
    )
    photos = cursor.fetchall()

    return flask.jsonify({'success': True, 'photos': photos})


@app.route('/api/photos/<int:photo_id>/set-cover', methods=['PATCH', 'POST'])
def set_cover_photo(photo_id):
    """Set a photo as cover."""
    user_id = flask.request.form.get('user_id', type=int)

    if not user_id:
        return flask.jsonify({'success': False, 'error': 'user_id required'}), 400

    connection = get_db()
    cursor = connection.execute("SELECT * FROM Photos WHERE id = ?", (photo_id,))
    photo = cursor.fetchone()

    if not photo:
        return flask.jsonify({'success': False, 'error': 'Photo not found'}), 404

    if photo['user_id'] != user_id:
        return flask.jsonify({'success': False, 'error': 'Not authorized'}), 403

    # Remove old cover
    connection.execute(
        "UPDATE Photos SET is_cover_photo = 0 WHERE location_id = ?",
        (photo['location_id'],)
    )

    # Set new cover
    connection.execute(
        "UPDATE Photos SET is_cover_photo = 1 WHERE id = ?",
        (photo_id,)
    )

    connection.commit()

    return flask.jsonify({'success': True, 'message': 'Cover photo updated'})

@app.route('/api/photos', methods=['GET'])
def get_all_photos():
    """Get all photos for the logged-in user with location info."""
    current_user = get_current_user()
    if not current_user:
        return flask.jsonify({'success': False, 'error': 'Not logged in'}), 401

    user_id = current_user['id']


    connection = get_db()
    cursor = connection.execute(
        """
        SELECT p.*, l.name as location_name, l.trip_id
        FROM Photos p
        LEFT JOIN Locations l ON p.location_id = l.id
        WHERE p.user_id = ?
        ORDER BY p.taken_at DESC
        """,
        (user_id,)
    )
    photos = cursor.fetchall()

    return flask.jsonify({'success': True, 'photos': photos})


@app.route('/api/photos/<int:photo_id>', methods=['DELETE'])
def delete_photo(photo_id):
    """Delete a photo."""
    user_id = flask.request.form.get('user_id', type=int)

    if not user_id:
        return flask.jsonify({'success': False, 'error': 'user_id required'}), 400

    connection = get_db()

    # Get photo
    cursor = connection.execute("SELECT * FROM Photos WHERE id = ?", (photo_id,))
    photo = cursor.fetchone()

    if not photo:
        return flask.jsonify({'success': False, 'error': 'Photo not found'}), 404

    # Verify user owns this photo
    if photo['user_id'] != user_id:
        return flask.jsonify({'success': False, 'error': 'Not authorized'}), 403

    # Delete file from storage
    import os
    file_path = f".{photo['file_url']}"  # Convert URL to file path
    if os.path.exists(file_path):
        os.remove(file_path)

    # Delete from database
    connection.execute("DELETE FROM Photos WHERE id = ?", (photo_id,))
    connection.commit()

    return flask.jsonify({'success': True, 'message': 'Photo deleted'})


@app.route('/api/photos/extract-exif', methods=['POST'])
def extract_exif():
    """
    Extract EXIF data from photos without uploading them yet.
    This is called from the frontend FileSelectStep to get GPS coordinates.
    """
    files = flask.request.files.getlist('files')

    if not files:
        return flask.jsonify({'success': False, 'error': 'No files provided'}), 400

    results = []

    from PIL import Image
    try:
        # Enable HEIC/HEIF support if available
        from pillow_heif import register_heif_opener
        register_heif_opener()
    except ImportError:
        # HEIC preview will simply not be available if pillow-heif is missing
        pass

    import io
    import base64
    import os

    for file in files:
        try:
            # Save temporarily so PhotoService can work with a file path
            temp_path = f"/tmp/{file.filename}"
            file.save(temp_path)

            # Extract EXIF (including GPS) from the original file
            exif_data = photo_service.extract_exif_data(temp_path)

            # Get GPS coordinates
            gps_coords = None
            if 'GPSInfo' in exif_data:
                gps_coords = photo_service.convert_gps_to_decimal(exif_data['GPSInfo'])

            # Get timestamp
            taken_at = photo_service.extract_datetime(exif_data)

            # Generate a lightweight JPEG preview for the frontend
            preview_data_url = None
            try:
                img = Image.open(temp_path)
                img.thumbnail((800, 800))
                buf = io.BytesIO()
                img.save(buf, format='JPEG', quality=85)
                buf.seek(0)
                b64 = base64.b64encode(buf.read()).decode('ascii')
                preview_data_url = f"data:image/jpeg;base64,{b64}"
            except Exception as preview_err:
                print(f"Error generating preview for {file.filename}: {preview_err}")
                preview_data_url = None

            results.append({
                'filename': file.filename,
                'has_gps': gps_coords is not None,
                'coordinates': {
                    'latitude': gps_coords[0] if gps_coords else None,
                    'longitude': gps_coords[1] if gps_coords else None,
                } if gps_coords else None,
                'taken_at': taken_at,
                'preview_data_url': preview_data_url,
            })

            # Clean up
            os.remove(temp_path)

        except Exception as e:
            print(f"Error extracting EXIF from {file.filename}: {e}")
            results.append({
                'filename': file.filename,
                'has_gps': False,
                'error': str(e),
                'preview_data_url': None,
            })

    return flask.jsonify({'success': True, 'photos': results})



# ============================================================================
# TRIP ENDPOINTS
# ============================================================================

@app.route('/api/trips', methods=['GET'])
def get_all_trips():
    """Get all trips for the logged-in user..."""
    current_user = get_current_user()
    if not current_user:
        return flask.jsonify({'success': False, 'error': 'Not logged in'}), 401

    user_id = current_user['id']

    connection = get_db()
    cursor = connection.execute(
        "SELECT * FROM Trips WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,)
    )
    trips = cursor.fetchall()

    # For each trip, get cover photo, rating, and photo count
    trips_with_photos = []
    for trip in trips:
        trip_dict = dict(trip)

        # Get a cover photo for this trip (first cover photo from any location)
        cursor = connection.execute(
            """
            SELECT p.* FROM Photos p
            JOIN Locations l ON p.location_id = l.id
            WHERE l.trip_id = ? AND p.is_cover_photo = 1
            LIMIT 1
            """,
            (trip['id'],)
        )
        cover_photo = cursor.fetchone()

        # If no cover photo, just get any photo from this trip
        if not cover_photo:
            cursor = connection.execute(
                """
                SELECT p.* FROM Photos p
                JOIN Locations l ON p.location_id = l.id
                WHERE l.trip_id = ?
                ORDER BY p.taken_at DESC
                LIMIT 1
                """,
                (trip['id'],)
            )
            cover_photo = cursor.fetchone()

        trip_dict['cover_photo'] = dict(cover_photo) if cover_photo else None

        # Calculate average rating from locations
        cursor = connection.execute(
            """
            SELECT AVG(rating) as avg_rating
            FROM Locations
            WHERE trip_id = ? AND rating > 0
            """,
            (trip['id'],)
        )
        rating_result = cursor.fetchone()
        trip_dict['rating'] = rating_result['avg_rating'] if rating_result['avg_rating'] else None

        # Get photo count for this trip
        cursor = connection.execute(
            """
            SELECT COUNT(*) as photo_count
            FROM Photos p
            JOIN Locations l ON p.location_id = l.id
            WHERE l.trip_id = ?
            """,
            (trip['id'],)
        )
        count_result = cursor.fetchone()
        trip_dict['photo_count'] = count_result['photo_count'] if count_result else 0

        trips_with_photos.append(trip_dict)

    return flask.jsonify({'success': True, 'trips': trips_with_photos})



@app.route('/api/trips/<int:trip_id>', methods=['GET'])
def get_trip_by_id(trip_id):
    """Get a single trip with its locations and photos."""
    connection = get_db()

    cursor = connection.execute("SELECT * FROM Trips WHERE id = ?", (trip_id,))
    trip = cursor.fetchone()

    if not trip:
        return flask.jsonify({'success': False, 'error': 'Trip not found'}), 404

    cursor = connection.execute("SELECT * FROM Locations WHERE trip_id = ?", (trip_id,))
    locations_raw = cursor.fetchall()

    # Add tags to each location
    locations = []
    for location in locations_raw:
        location_dict = dict(location)

        # Get tags for this location
        cursor = connection.execute(
            """
            SELECT t.name FROM Tags t
            JOIN LocationTags lt ON t.id = lt.tag_id
            WHERE lt.location_id = ?
            """,
            (location['id'],)
        )
        tags = [row['name'] for row in cursor.fetchall()]
        location_dict['tags'] = tags

        # Get photos for this location
        cursor = connection.execute("SELECT * FROM Photos WHERE location_id = ?", (location['id'],))
        photos = cursor.fetchall()
        location_dict['photos'] = photos

        locations.append(location_dict)

    # Get all photos for the trip
    all_photos = []
    for location in locations:
        all_photos.extend(location['photos'])

    # Get cover photo for trip
    cursor = connection.execute(
        """
        SELECT p.* FROM Photos p
        JOIN Locations l ON p.location_id = l.id
        WHERE l.trip_id = ? AND p.is_cover_photo = 1
        LIMIT 1
        """,
        (trip_id,)
    )
    cover_photo = cursor.fetchone()

    trip_dict = dict(trip)
    trip_dict['cover_photo'] = dict(cover_photo) if cover_photo else None

    return flask.jsonify({
        'success': True,
        'trip': trip_dict,
        'locations': locations,
        'photos': all_photos
    })


@app.route('/api/trips', methods=['POST'])
def create_trip():
    """Create a new trip."""
    current_user = get_current_user()
    if not current_user:
        return flask.jsonify({'success': False, 'error': 'Not logged in'}), 401

    data = flask.request.get_json()
    user_id = current_user['id']
    title = data.get('title')
    city = data.get('city')
    country = data.get('country')
    start_date = data.get('start_date')
    end_date = data.get('end_date')

    if not title:
        return flask.jsonify({'success': False, 'error': 'Title is required'}), 400

    connection = get_db()
    created_at = int(datetime.now().timestamp())

    cursor = connection.execute(
        """
        INSERT INTO Trips (user_id, title, city, country, start_date, end_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (user_id, title, city, country, start_date, end_date, created_at)
    )

    trip_id = cursor.lastrowid
    connection.commit()

    cursor = connection.execute("SELECT * FROM Trips WHERE id = ?", (trip_id,))
    trip = cursor.fetchone()

    print(f"✅ Created trip: {title} (ID: {trip_id})")

    return flask.jsonify({'success': True, 'trip': trip})


# ============================================================================
# LOCATION ENDPOINTS
# ============================================================================

@app.route('/api/locations/<int:location_id>', methods=['GET'])
def get_location_by_id(location_id):
    """Get a single location with its photos and tags."""
    connection = get_db()

    cursor = connection.execute("SELECT * FROM Locations WHERE id = ?", (location_id,))
    location = cursor.fetchone()

    if not location:
        return flask.jsonify({'success': False, 'error': 'Location not found'}), 404

    location_dict = dict(location)

    # Get tags for this location
    cursor = connection.execute(
        """
        SELECT t.name FROM Tags t
        JOIN LocationTags lt ON t.id = lt.tag_id
        WHERE lt.location_id = ?
        """,
        (location_id,)
    )
    tags = [row['name'] for row in cursor.fetchall()]
    location_dict['tags'] = tags

    # Get photos for this location
    cursor = connection.execute("SELECT * FROM Photos WHERE location_id = ?", (location_id,))
    photos = cursor.fetchall()

    return flask.jsonify({
        'success': True,
        'location': location_dict,
        'photos': photos
    })


@app.route('/api/locations', methods=['POST'])
def create_location():
    """Create a new location or find existing nearby location with geocoded address."""
    data = flask.request.get_json()

    trip_id = data.get('trip_id')
    name = data.get('name')
    address = data.get('address', '')
    x = data.get('x', 0.0)  # longitude
    y = data.get('y', 0.0)  # latitude
    rating = data.get('rating', 0)
    notes = data.get('notes', '')
    tags = data.get('tags', [])
    cost_level = data.get('cost_level', 'Free')
    time_needed = data.get('time_needed', 0)
    best_time_to_visit = data.get('best_time_to_visit', '')

    if not trip_id:
        return flask.jsonify({'success': False, 'error': 'trip_id is required'}), 400

    connection = get_db()

    # If we have valid GPS coordinates, check if a location already exists nearby
    if x != 0.0 and y != 0.0:
        # Search for locations within ~50 meters (roughly 0.0005 degrees)
        threshold = 0.0005

        cursor = connection.execute(
            """
            SELECT * FROM Locations
            WHERE trip_id = ?
            AND x BETWEEN ? AND ?
            AND y BETWEEN ? AND ?
            LIMIT 1
            """,
            (trip_id,
             x - threshold, x + threshold,
             y - threshold, y + threshold)
        )
        existing_location = cursor.fetchone()

        if existing_location:
            print(f"✅ Found existing location nearby: {existing_location['name']} (ID: {existing_location['id']})")
            return flask.jsonify({
                'success': True,
                'location': dict(existing_location),
                'message': 'Using existing nearby location'
            })

        # No nearby location found - geocode and create new one
        print(f"🌍 No nearby location found. Geocoding at ({y:.6f}, {x:.6f})")
        from app.geocoding import geocoding_service
        location_info = geocoding_service.reverse_geocode(y, x)

        if location_info:
            # Use geocoded name if no name was provided
            geocoded_name = location_info['name']
            geocoded_address = location_info['address']

            # ALWAYS use geocoded address (it's more detailed)
            name = geocoded_name
            address = geocoded_address

            print(f"✅ Geocoded: {name} at {address}")
        else:
            print(f"⚠️ Geocoding failed, using fallback")
            if not name:
                name = f"Location at ({y:.4f}, {x:.4f})"
            if not address:
                address = "Address not available"

    # If no name provided and no coordinates, require name
    if not name:
        return flask.jsonify({'success': False, 'error': 'name or coordinates required'}), 400

    # Create new location
    created_at = int(datetime.now().timestamp())

    cursor = connection.execute(
        """
        INSERT INTO Locations
        (trip_id, x, y, name, address, rating, cost_level, notes, time_needed, best_time_to_visit, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (trip_id, x, y, name, address, rating, cost_level, notes, time_needed, best_time_to_visit, created_at)
    )

    location_id = cursor.lastrowid
    # Persist tags if provided
    if tags:
        if not isinstance(tags, list):
            # Allow comma-separated string fallback
            tags_list = [t.strip() for t in str(tags).split(',') if t.strip()]
        else:
            tags_list = tags

        for tag_name in tags_list:
            # Get or create tag
            cursor = connection.execute("SELECT id FROM Tags WHERE name = ?", (tag_name,))
            tag = cursor.fetchone()

            if tag:
                tag_id = tag['id']
            else:
                cursor = connection.execute("INSERT INTO Tags (name) VALUES (?)", (tag_name,))
                tag_id = cursor.lastrowid

            # Link tag to location
            connection.execute(
                "INSERT INTO LocationTags (location_id, tag_id) VALUES (?, ?)",
                (location_id, tag_id)
            )

    connection.commit()

    cursor = connection.execute("SELECT * FROM Locations WHERE id = ?", (location_id,))
    location = cursor.fetchone()

    print(f"✅ Created NEW location: {name} (ID: {location_id}) at {address}")

    return flask.jsonify({'success': True, 'location': location})
@app.route('/api/locations/<int:location_id>', methods=['PUT'])
def update_location(location_id):
    """Update a location."""
    current_user = get_current_user()
    if not current_user:
        return flask.jsonify({'success': False, 'error': 'Not logged in'}), 401

    data = flask.request.get_json()

    connection = get_db()

    cursor = connection.execute("SELECT * FROM Locations WHERE id = ?", (location_id,))
    location = cursor.fetchone()

    if not location:
        return flask.jsonify({'success': False, 'error': 'Location not found'}), 404

    # Check if user has edit access to the trip
    access = check_trip_access(location['trip_id'], current_user['id'], require_edit=True)
    if not access['has_access']:
        return flask.jsonify({
            'success': False,
            'error': 'You do not have permission to edit this location. This trip is read-only.'
        }), 403

    # Update fields
    name = data.get('name', location['name'])
    address = data.get('address', location['address'])
    x = data.get('x', location['x'])
    y = data.get('y', location['y'])
    rating = data.get('rating', location['rating'])
    notes = data.get('notes', location['notes'])
    cost_level = data.get('cost_level', location['cost_level'])
    time_needed = data.get('time_needed', location['time_needed'])
    best_time_to_visit = data.get('best_time_to_visit', location['best_time_to_visit'])
    tags = data.get('tags', [])

    # Update location fields
    connection.execute(
        """
        UPDATE Locations
        SET name = ?, address = ?, x = ?, y = ?, rating = ?, notes = ?,
            cost_level = ?, time_needed = ?, best_time_to_visit = ?
        WHERE id = ?
        """,
        (name, address, x, y, rating, notes, cost_level, time_needed, best_time_to_visit, location_id)
    )

    # Update tags
    if tags is not None:
        # Remove old tags
        connection.execute("DELETE FROM LocationTags WHERE location_id = ?", (location_id,))

        # Add new tags
        for tag_name in tags:
            # Get or create tag
            cursor = connection.execute("SELECT id FROM Tags WHERE name = ?", (tag_name,))
            tag = cursor.fetchone()

            if tag:
                tag_id = tag['id']
            else:
                # Create new tag
                cursor = connection.execute("INSERT INTO Tags (name) VALUES (?)", (tag_name,))
                tag_id = cursor.lastrowid

            # Link tag to location
            connection.execute(
                "INSERT INTO LocationTags (location_id, tag_id) VALUES (?, ?)",
                (location_id, tag_id)
            )

    connection.commit()

    # Fetch updated location with tags
    cursor = connection.execute("SELECT * FROM Locations WHERE id = ?", (location_id,))
    updated_location = dict(cursor.fetchone())

    # Get tags
    cursor = connection.execute(
        """
        SELECT t.name FROM Tags t
        JOIN LocationTags lt ON t.id = lt.tag_id
        WHERE lt.location_id = ?
        """,
        (location_id,)
    )
    updated_location['tags'] = [row['name'] for row in cursor.fetchall()]

    print(f"✅ Updated location: {name} (ID: {location_id})")

    return flask.jsonify({'success': True, 'location': updated_location})

@app.route('/api/geocode', methods=['POST'])
def geocode_coordinates():
    """Geocode coordinates to get location name and address."""
    data = flask.request.get_json()

    latitude = data.get('latitude')
    longitude = data.get('longitude')

    if latitude is None or longitude is None:
        return flask.jsonify({'success': False, 'error': 'latitude and longitude required'}), 400

    from app.geocoding import geocoding_service

    print(f"🌍 Geocoding: ({latitude:.6f}, {longitude:.6f})")
    location_info = geocoding_service.reverse_geocode(latitude, longitude)

    if location_info:
        print(f"✅ Found: {location_info['name']} at {location_info['address']}")
        return flask.jsonify({
            'success': True,
            'name': location_info['name'],
            'address': location_info['address'],
            'city': location_info['city'],
            'state': location_info['state'],
            'country': location_info['country'],
        })
    else:
        return flask.jsonify({
            'success': False,
            'error': 'Could not geocode coordinates'
        }), 404
    
# ============================================================================
# AUTH ROUTES
# ============================================================================

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """Create account (plain text password)."""
    data = flask.request.get_json()
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    name = data.get('name', '').strip() or username
    
    if not username or not email or not password:
        return flask.jsonify({'success': False, 'error': 'Missing fields'}), 400
    
    if len(username) < 3:
        return flask.jsonify({'success': False, 'error': 'Username must be at least 3 characters'}), 400
    
    if len(password) < 4:
        return flask.jsonify({'success': False, 'error': 'Password must be at least 4 characters'}), 400
    
    connection = get_db()
    
    # Check if username or email already exists
    cursor = connection.execute(
        "SELECT id FROM Users WHERE username = ? OR email = ?",
        (username, email)
    )
    if cursor.fetchone():
        return flask.jsonify({'success': False, 'error': 'Username or email already taken'}), 400
    
    # Create user with plain text password
    created_at = int(datetime.now().timestamp())
    cursor = connection.execute(
        "INSERT INTO Users (username, email, password, name, created_at) VALUES (?, ?, ?, ?, ?)",
        (username, email, password, name, created_at)
    )
    user_id = cursor.lastrowid
    connection.commit()
    
    # Store user ID in session
    flask.session.clear()
    flask.session['user_id'] = user_id
    flask.session['username'] = username
    
    user = {
        'id': user_id,
        'username': username,
        'email': email,
        'name': name
    }
    
    return flask.jsonify({'success': True, 'user': user})


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login with username/email and password."""
    data = flask.request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    if not username or not password:
        return flask.jsonify({'success': False, 'error': 'Username and password required'}), 400
    
    connection = get_db()
    cursor = connection.execute(
        "SELECT * FROM Users WHERE (username = ? OR email = ?) AND password = ?",
        (username, username, password)
    )
    user = cursor.fetchone()
    
    if not user:
        return flask.jsonify({'success': False, 'error': 'Invalid username or password'}), 401
    
    # Store in session
    flask.session.clear()
    flask.session['user_id'] = user['id']
    flask.session['username'] = user['username']
    
    return flask.jsonify({
        'success': True, 
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'name': user['name']
        }
    })


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout - clear session."""
    flask.session.clear()
    return flask.jsonify({'success': True, 'message': 'Logged out successfully'})


@app.route('/api/auth/me', methods=['GET'])
def get_current_user_info():
    """Get currently logged in user."""
    user = get_current_user()
    if not user:
        return flask.jsonify({'success': False, 'error': 'Not logged in'}), 401
    return flask.jsonify({'success': True, 'user': user})


@app.route('/api/auth/check', methods=['GET'])
def check_auth():
    """Check if user is authenticated (for page refresh)."""
    user = get_current_user()
    if user:
        return flask.jsonify({'authenticated': True, 'user': user})
    return flask.jsonify({'authenticated': False})


# ============================================================================
# FRIENDS ROUTES - Bidirectional friendships
# ============================================================================

@app.route('/api/friends/search', methods=['GET'])
def search_users():
    """Search for users to add as friends."""
    current_user = get_current_user()
    if not current_user:
        return flask.jsonify({'success': False, 'error': 'Not logged in'}), 401
    
    query = flask.request.args.get('query', '').strip()
    
    if len(query) < 2:
        return flask.jsonify({'success': False, 'error': 'Search query too short'}), 400
    
    connection = get_db()
    cursor = connection.execute(
        """
        SELECT id, username, email, name, profile_photo_url
        FROM Users
        WHERE (username LIKE ? OR email LIKE ? OR name LIKE ?) AND id != ?
        LIMIT 10
        """,
        (f'%{query}%', f'%{query}%', f'%{query}%', current_user['id'])
    )
    users = cursor.fetchall()
    
    return flask.jsonify({'success': True, 'users': [dict(u) for u in users]})


@app.route('/api/friends/add', methods=['POST'])
def add_friend():
    """Add friend - creates bidirectional friendship."""
    current_user = get_current_user()
    if not current_user:
        return flask.jsonify({'success': False, 'error': 'Not logged in'}), 401
    
    data = flask.request.get_json()
    friend_id = data.get('friend_id')
    
    if not friend_id:
        return flask.jsonify({'success': False, 'error': 'friend_id required'}), 400
    
    if current_user['id'] == friend_id:
        return flask.jsonify({'success': False, 'error': 'Cannot add yourself'}), 400
    
    connection = get_db()
    
    # Check if already friends (either direction)
    cursor = connection.execute(
        """SELECT * FROM Friendships 
           WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)""",
        (current_user['id'], friend_id, friend_id, current_user['id'])
    )
    if cursor.fetchone():
        return flask.jsonify({'success': False, 'error': 'Already friends'}), 400
    
    # Add friendship BOTH directions so both users see each other
    created_at = int(datetime.now().timestamp())
    connection.execute(
        "INSERT INTO Friendships (user_id, friend_id, created_at) VALUES (?, ?, ?)",
        (current_user['id'], friend_id, created_at)
    )
    connection.execute(
        "INSERT INTO Friendships (user_id, friend_id, created_at) VALUES (?, ?, ?)",
        (friend_id, current_user['id'], created_at)
    )
    connection.commit()
    
    return flask.jsonify({'success': True, 'message': 'Friend added'})


@app.route('/api/friends', methods=['GET'])
def get_friends():
    """Get list of friends (requires login)."""
    current_user = get_current_user()
    if not current_user:
        return flask.jsonify({'success': False, 'error': 'Not logged in'}), 401
    
    connection = get_db()
    cursor = connection.execute(
        """
        SELECT u.id, u.username, u.email, u.name, u.profile_photo_url
        FROM Users u
        JOIN Friendships f ON f.friend_id = u.id
        WHERE f.user_id = ?
        ORDER BY u.username
        """,
        (current_user['id'],)
    )
    friends = cursor.fetchall()
    
    return flask.jsonify({'success': True, 'friends': [dict(f) for f in friends]})


@app.route('/api/friends/<int:friend_id>', methods=['DELETE'])
def remove_friend(friend_id):
    """Remove a friend - removes both directions."""
    current_user = get_current_user()
    if not current_user:
        return flask.jsonify({'success': False, 'error': 'Not logged in'}), 401
    
    connection = get_db()
    # Delete both directions
    connection.execute(
        "DELETE FROM Friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
        (current_user['id'], friend_id, friend_id, current_user['id'])
    )
    connection.commit()
    
    return flask.jsonify({'success': True, 'message': 'Friend removed'})


# ============================================================================
# SHARING
# ============================================================================

@app.route('/api/trips/<int:trip_id>/share', methods=['POST'])
def share_trip(trip_id):
    """Share trip with friend (view-only)."""
    current_user = get_current_user()
    if not current_user:
        return flask.jsonify({'success': False, 'error': 'Not logged in'}), 401
    
    data = flask.request.get_json()
    friend_id = data.get('friend_id')
    
    if not friend_id:
        return flask.jsonify({'success': False, 'error': 'friend_id required'}), 400
    
    connection = get_db()
    
    # Verify trip ownership
    cursor = connection.execute(
        "SELECT * FROM Trips WHERE id = ? AND user_id = ?",
        (trip_id, current_user['id'])
    )
    trip = cursor.fetchone()
    
    if not trip:
        return flask.jsonify({'success': False, 'error': 'Trip not found'}), 404
    
    # Get friend's email
    cursor = connection.execute("SELECT email FROM Users WHERE id = ?", (friend_id,))
    friend = cursor.fetchone()
    
    if not friend:
        return flask.jsonify({'success': False, 'error': 'Friend not found'}), 404
    
    # Check if already shared
    cursor = connection.execute(
        "SELECT * FROM SharedTrips WHERE trip_id = ? AND shared_with_user_id = ?",
        (trip_id, friend_id)
    )
    if cursor.fetchone():
        return flask.jsonify({'success': True, 'message': 'Already shared'})
    
    # Share trip with read-only access by default
    created_at = int(datetime.now().timestamp())
    connection.execute(
        """
        INSERT INTO SharedTrips
        (trip_id, shared_by_user_id, shared_with_user_id, shared_with_email, created_at, access_level)
        VALUES (?, ?, ?, ?, ?, 'read')
        """,
        (trip_id, current_user['id'], friend_id, friend['email'], created_at)
    )
    connection.commit()

    return flask.jsonify({'success': True, 'message': 'Trip shared with read-only access'})


@app.route('/api/trips/<int:trip_id>/unshare', methods=['POST'])
def unshare_trip(trip_id):
    """Unshare trip with a user."""
    current_user = get_current_user()
    if not current_user:
        return flask.jsonify({'success': False, 'error': 'Not logged in'}), 401

    data = flask.request.get_json()
    friend_id = data.get('friend_id')

    if not friend_id:
        return flask.jsonify({'success': False, 'error': 'friend_id required'}), 400

    connection = get_db()

    # Verify trip ownership
    cursor = connection.execute(
        "SELECT * FROM Trips WHERE id = ? AND user_id = ?",
        (trip_id, current_user['id'])
    )
    if not cursor.fetchone():
        return flask.jsonify({'success': False, 'error': 'Not authorized'}), 403

    # Delete share
    connection.execute(
        "DELETE FROM SharedTrips WHERE trip_id = ? AND shared_with_user_id = ?",
        (trip_id, friend_id)
    )
    connection.commit()

    return flask.jsonify({'success': True, 'message': 'Trip unshared'})


@app.route('/api/trips/<int:trip_id>/shared-with', methods=['GET'])
def get_trip_shares(trip_id):
    """Get list of users trip is shared with."""
    current_user = get_current_user()
    if not current_user:
        return flask.jsonify({'success': False, 'error': 'Not logged in'}), 401

    connection = get_db()

    # Verify ownership
    cursor = connection.execute(
        "SELECT * FROM Trips WHERE id = ? AND user_id = ?",
        (trip_id, current_user['id'])
    )
    if not cursor.fetchone():
        return flask.jsonify({'success': False, 'error': 'Not authorized'}), 403

    # Get shared users
    cursor = connection.execute(
        """
        SELECT u.id, u.username, u.email, u.name
        FROM Users u
        JOIN SharedTrips st ON st.shared_with_user_id = u.id
        WHERE st.trip_id = ?
        """,
        (trip_id,)
    )
    shared_with = cursor.fetchall()

    return flask.jsonify({'success': True, 'shared_with': shared_with})


@app.route('/api/trips/shared-with-me', methods=['GET'])
def get_shared_trips():
    """Get trips shared with me."""
    current_user = get_current_user()
    if not current_user:
        return flask.jsonify({'success': False, 'error': 'Not logged in'}), 401
    
    connection = get_db()
    cursor = connection.execute(
        """
        SELECT t.*, u.username as owner_username, u.name as owner_name
        FROM SharedTrips st
        JOIN Trips t ON st.trip_id = t.id
        JOIN Users u ON t.user_id = u.id
        WHERE st.shared_with_user_id = ?
        ORDER BY st.created_at DESC
        """,
        (current_user['id'],)
    )
    shared_trips = cursor.fetchall()
    
    return flask.jsonify({'success': True, 'trips': shared_trips})


@app.route('/api/trips/all', methods=['GET'])
def get_all_my_trips():
    """Get all trips (owned + shared with me)."""
    current_user = get_current_user()
    if not current_user:
        return flask.jsonify({'success': False, 'error': 'Not logged in'}), 401
    
    connection = get_db()
    
    # Get owned trips
    cursor = connection.execute(
        "SELECT *, 'owner' as access_type, 'owner' as access_level FROM Trips WHERE user_id = ? ORDER BY created_at DESC",
        (current_user['id'],)
    )
    owned_trips = cursor.fetchall()
    
    # Get shared trips with access level
    cursor = connection.execute(
        """
        SELECT t.*, 'shared' as access_type, st.access_level, u.username as owner_username, u.name as owner_name
        FROM SharedTrips st
        JOIN Trips t ON st.trip_id = t.id
        JOIN Users u ON t.user_id = u.id
        WHERE st.shared_with_user_id = ?
        ORDER BY st.created_at DESC
        """,
        (current_user['id'],)
    )
    shared_trips = cursor.fetchall()
    
    # Combine and add metadata
    all_trips = []
    
    for trip in owned_trips:
        trip_dict = dict(trip)
        
        # Get cover photo
        cursor = connection.execute(
            """
            SELECT p.* FROM Photos p
            JOIN Locations l ON p.location_id = l.id
            WHERE l.trip_id = ? AND p.is_cover_photo = 1
            LIMIT 1
            """,
            (trip['id'],)
        )
        cover = cursor.fetchone()
        trip_dict['cover_photo'] = dict(cover) if cover else None
        
        all_trips.append(trip_dict)
    
    for trip in shared_trips:
        trip_dict = dict(trip)
        
        # Get cover photo
        cursor = connection.execute(
            """
            SELECT p.* FROM Photos p
            JOIN Locations l ON p.location_id = l.id
            WHERE l.trip_id = ? AND p.is_cover_photo = 1
            LIMIT 1
            """,
            (trip['id'],)
        )
        cover = cursor.fetchone()
        trip_dict['cover_photo'] = dict(cover) if cover else None
        
        all_trips.append(trip_dict)
    
    return flask.jsonify({'success': True, 'trips': all_trips})

"""REST API for localization."""
import re
import flask
import uuid 
import hashlib
from datetime import datetime
from app import app
from app.db import get_db
from app.photo_service import photo_service


@app.route('/')
def get_index():
    connection = get_db()
    cur = connection.execute(...)
    context = cur.fetchall()

    return flask.render_template("index.html", **context)

@app.route('/api/photos/batch-upload', methods=['POST'])
def batch_upload_photos():
    """
    Batch upload photos to a specific location.
    
    Expects:
    - location_id: ID of the location to attach photos to
    - user_id: ID of the user uploading
    - files: Multiple photo files
    """
    # Get form data
    location_id = flask.request.form.get('location_id', type=int)
    user_id = flask.request.form.get('user_id', type=int)
    
    if not location_id or not user_id:
        return flask.jsonify({
            'success': False, 
            'error': 'location_id and user_id are required'
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
    
    # Get trip to verify user authorization
    cursor = connection.execute("SELECT * FROM Trips WHERE id = ?", (location['trip_id'],))
    trip = cursor.fetchone()
    
    if not trip or trip['user_id'] != user_id:
        return flask.jsonify({
            'success': False, 
            'error': 'Not authorized to upload to this location'
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
    """Get all photos for a user with location info."""
    user_id = flask.request.args.get('user_id', type=int, default=1)

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
    
    for file in files:
        try:
            # Save temporarily
            temp_path = f"/tmp/{file.filename}"
            file.save(temp_path)
            
            # Extract EXIF
            exif_data = photo_service.extract_exif_data(temp_path)
            
            # Get GPS coordinates
            gps_coords = None
            if 'GPSInfo' in exif_data:
                gps_coords = photo_service.convert_gps_to_decimal(exif_data['GPSInfo'])
            
            # Get timestamp
            taken_at = photo_service.extract_datetime(exif_data)
            
            results.append({
                'filename': file.filename,
                'has_gps': gps_coords is not None,
                'coordinates': {
                    'latitude': gps_coords[0] if gps_coords else None,
                    'longitude': gps_coords[1] if gps_coords else None,
                } if gps_coords else None,
                'taken_at': taken_at,
            })
            
            # Clean up
            import os
            os.remove(temp_path)
            
        except Exception as e:
            print(f"Error extracting EXIF from {file.filename}: {e}")
            results.append({
                'filename': file.filename,
                'has_gps': False,
                'error': str(e),
            })
    
    return flask.jsonify({'success': True, 'photos': results})


@app.route('/api/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    """Handle CORS preflight requests."""
    response = flask.make_response('', 200)
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS')
    return response


@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS')
    return response



# ============================================================================
# TRIP ENDPOINTS
# ============================================================================

@app.route('/api/trips', methods=['GET'])
def get_all_trips():
    """Get all trips for a user with their cover photos, ratings, and photo counts."""
    user_id = flask.request.args.get('user_id', type=int, default=1)

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
    data = flask.request.get_json()
    
    user_id = data.get('user_id', 1)
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
    """Create a new location."""
    data = flask.request.get_json()
    
    trip_id = data.get('trip_id')
    name = data.get('name')
    address = data.get('address', '')
    x = data.get('x', 0.0)  # longitude
    y = data.get('y', 0.0)  # latitude
    rating = data.get('rating', 0)
    notes = data.get('notes', '')
    tags = data.get('tags', '')
    time_needed = data.get('time_needed', 0)
    best_time_to_visit = data.get('best_time_to_visit', '')
    
    if not trip_id or not name:
        return flask.jsonify({'success': False, 'error': 'trip_id and name are required'}), 400
    
    connection = get_db()
    created_at = int(datetime.now().timestamp())
    
    cursor = connection.execute(
        """
        INSERT INTO Locations 
        (trip_id, x, y, name, address, rating, notes, time_needed, best_time_to_visit, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (trip_id, x, y, name, address, rating, notes, time_needed, best_time_to_visit, created_at)
    )
    
    # TO IMPLEMENT: ADDING TAGS 
    
    location_id = cursor.lastrowid
    connection.commit()
    
    cursor = connection.execute("SELECT * FROM Locations WHERE id = ?", (location_id,))
    location = cursor.fetchone()
    
    print(f"✅ Created location: {name} (ID: {location_id}) for trip {trip_id}")
    
    return flask.jsonify({'success': True, 'location': location})


@app.route('/api/locations/<int:location_id>', methods=['PUT'])
def update_location(location_id):
    """Update a location."""
    data = flask.request.get_json()
    
    connection = get_db()
    
    cursor = connection.execute("SELECT * FROM Locations WHERE id = ?", (location_id,))
    location = cursor.fetchone()
    
    if not location:
        return flask.jsonify({'success': False, 'error': 'Location not found'}), 404
    
    # Update fields
    name = data.get('name', location['name'])
    address = data.get('address', location['address'])
    x = data.get('x', location['x'])
    y = data.get('y', location['y'])
    rating = data.get('rating', location['rating'])
    notes = data.get('notes', location['notes'])
    time_needed = data.get('time_needed', location['time_needed'])
    best_time_to_visit = data.get('best_time_to_visit', location['best_time_to_visit'])
    
    connection.execute(
        """
        UPDATE Locations 
        SET name = ?, address = ?, x = ?, y = ?, rating = ?, notes = ?,
            time_needed = ?, best_time_to_visit = ?
        WHERE id = ?
        """,
        (name, address, x, y, rating, notes, time_needed, best_time_to_visit, location_id)
    )
    connection.commit()
    
    cursor = connection.execute("SELECT * FROM Locations WHERE id = ?", (location_id,))
    updated_location = cursor.fetchone()
    
    print(f"✅ Updated location: {name} (ID: {location_id})")
    
    return flask.jsonify({'success': True, 'location': updated_location})
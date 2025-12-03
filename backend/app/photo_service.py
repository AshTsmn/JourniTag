"""Photo upload service for handling batch uploads with EXIF extraction."""
import os
from datetime import datetime
from typing import List, Optional, Tuple
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import hashlib
from pathlib import Path
from app.geocoding import geocoding_service

class PhotoService:
    def __init__(self, upload_dir: str = "uploads/photos"):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    def extract_exif_data(self, image_path: str) -> dict:
        """Extract EXIF metadata from an image (supports HEIC, JPEG, PNG)."""
        try:
            # Try to register HEIC opener if available
            try:
                from pillow_heif import register_heif_opener
                register_heif_opener()
            except ImportError:
                # HEIC support not available, but that's okay for JPEG/PNG
                pass
            
            image = Image.open(image_path)
            
            # HEIC files use getexif() method instead of _getexif()
            exif_data = None
            if hasattr(image, 'getexif'):
                exif_data = image.getexif()
            elif hasattr(image, '_getexif'):
                exif_data = image._getexif()
            
            if not exif_data:
                print(f"No EXIF data found in {image_path}")
                return {}
            
            metadata = {}
            
            # Extract basic EXIF data
            for tag_id, value in exif_data.items():
                tag = TAGS.get(tag_id, tag_id)
                metadata[tag] = value
            
            # Extract GPS data - handle IFD pointer
            # For HEIC files, GPSInfo is often an IFD pointer (integer)
            # We need to use get_ifd() to follow the pointer
            gps_ifd = None
            if hasattr(exif_data, 'get_ifd'):
                try:
                    # Try to get GPS IFD (tag 34853 is GPSInfo)
                    gps_ifd = exif_data.get_ifd(0x8825)  # 0x8825 = 34853 = GPS IFD tag
                except (KeyError, ValueError):
                    pass
            
            if gps_ifd:
                # We got the GPS IFD, now decode it
                gps_info = {}
                for key, value in gps_ifd.items():
                    decode = GPSTAGS.get(key, key)
                    gps_info[decode] = value
                metadata['GPSInfo'] = gps_info
            elif 'GPSInfo' in metadata:
                # Fallback for older format
                gps_data = metadata['GPSInfo']
                
                # Handle different GPS data formats
                if isinstance(gps_data, dict):
                    # Already a dict, just decode the keys
                    gps_info = {}
                    for key, value in gps_data.items():
                        decode = GPSTAGS.get(key, key)
                        gps_info[decode] = value
                    metadata['GPSInfo'] = gps_info
                elif hasattr(gps_data, 'items'):
                    # Has items() method, treat like dict
                    gps_info = {}
                    for key, value in gps_data.items():
                        decode = GPSTAGS.get(key, key)
                        gps_info[decode] = value
                    metadata['GPSInfo'] = gps_info
                else:
                    # It's an IFD pointer but we couldn't follow it
                    print(f"Warning: GPSInfo is IFD pointer but couldn't retrieve GPS data")
                    del metadata['GPSInfo']
            
            return metadata
        except Exception as e:
            print(f"Error extracting EXIF data from {image_path}: {e}")
            import traceback
            traceback.print_exc()
            return {}
    
    def convert_gps_to_decimal(self, gps_info: dict) -> Optional[Tuple[float, float]]:
        """Convert GPS coordinates from EXIF format to decimal degrees."""
        try:
            # Get latitude
            lat = gps_info.get('GPSLatitude')
            lat_ref = gps_info.get('GPSLatitudeRef')
            
            # Get longitude
            lon = gps_info.get('GPSLongitude')
            lon_ref = gps_info.get('GPSLongitudeRef')
            
            if not all([lat, lat_ref, lon, lon_ref]):
                return None
            
            # Convert to decimal degrees
            def to_decimal(coord):
                degrees = float(coord[0])
                minutes = float(coord[1])
                seconds = float(coord[2])
                return degrees + (minutes / 60.0) + (seconds / 3600.0)
            
            latitude = to_decimal(lat)
            if lat_ref == 'S':
                latitude = -latitude
            
            longitude = to_decimal(lon)
            if lon_ref == 'W':
                longitude = -longitude
            
            return (latitude, longitude)
        except Exception as e:
            print(f"Error converting GPS coordinates: {e}")
            return None
    
    def extract_datetime(self, exif_data: dict) -> Optional[int]:
        """Extract timestamp from EXIF data."""
        try:
            # Try different datetime fields
            datetime_fields = ['DateTimeOriginal', 'DateTime', 'DateTimeDigitized']
            
            for field in datetime_fields:
                if field in exif_data:
                    dt_str = exif_data[field]
                    # Format: "2024:01:15 14:30:00"
                    dt = datetime.strptime(dt_str, "%Y:%m:%d %H:%M:%S")
                    return int(dt.timestamp())
            
            return None
        except Exception as e:
            print(f"Error extracting datetime: {e}")
            return None
    
    def save_photo_file(self, file, original_filename: str, convert_heic: bool = True) -> Tuple[str, str]:
        """
        Save photo file locally and return the file URL and saved extension.
        
        Args:
            file: FileStorage object
            original_filename: Original filename
            convert_heic: If True, convert HEIC to JPG for web compatibility
            
        Returns:
            Tuple of (file_url, saved_extension)
        """
        # Generate unique filename
        timestamp = int(datetime.now().timestamp())
        file.seek(0)
        file_hash = hashlib.md5(file.read()).hexdigest()[:8]
        file.seek(0)  # Reset file pointer after reading
        
        original_ext = Path(original_filename).suffix.lower()
        
        # Determine if we need to convert HEIC
        if original_ext in ['.heic', '.heif'] and convert_heic:
            # Convert HEIC to JPG for web compatibility
            try:
                from pillow_heif import register_heif_opener
                register_heif_opener()
                
                # Save temp HEIC file
                temp_heic = f"/tmp/{timestamp}_{file_hash}{original_ext}"
                file.save(temp_heic)
                
                # Open and convert to JPG
                img = Image.open(temp_heic)
                
                # Preserve EXIF data during conversion
                exif_data = img.info.get('exif')
                
                new_filename = f"{timestamp}_{file_hash}.jpg"
                file_path = self.upload_dir / new_filename
                
                # Save as JPEG with EXIF
                if exif_data:
                    img.save(str(file_path), 'JPEG', quality=95, exif=exif_data)
                else:
                    img.save(str(file_path), 'JPEG', quality=95)
                
                # Clean up temp file
                os.remove(temp_heic)
                
                saved_ext = '.jpg'
                print(f"Converted HEIC to JPG: {original_filename} -> {new_filename}")
                
            except ImportError:
                # pillow-heif not installed, save as-is
                print(f"Warning: pillow-heif not installed. HEIC file saved as-is but may not display in browsers.")
                new_filename = f"{timestamp}_{file_hash}{original_ext}"
                file_path = self.upload_dir / new_filename
                file.save(str(file_path))
                saved_ext = original_ext
                
        else:
            # Save regular image formats as-is
            file_ext = original_ext if original_ext else '.jpg'
            new_filename = f"{timestamp}_{file_hash}{file_ext}"
            file_path = self.upload_dir / new_filename
            file.save(str(file_path))
            saved_ext = file_ext
        
        # Return relative path as URL
        return f"/uploads/photos/{new_filename}", saved_ext
    
 
    def find_or_create_location(
        self, 
        connection,
        trip_id: int, 
        latitude: float, 
        longitude: float,
        address: Optional[str] = None
    ) -> dict:
        """Find existing location nearby or create a new one with geocoded name/address."""
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
            longitude - threshold, longitude + threshold,
            latitude - threshold, latitude + threshold)
        )
        existing_location = cursor.fetchone()
        
        if existing_location:
            print(f"✅ Found existing location: {existing_location['name']}")
            return existing_location
        
        # No existing location found - create a new one with geocoded info
        print(f"🆕 Creating new location for ({latitude:.6f}, {longitude:.6f})")
        
        # Get location info from Nominatim
        location_info = geocoding_service.reverse_geocode(latitude, longitude)
        
        if location_info:
            name = location_info['name']
            geocoded_address = location_info['address']
            print(f"📍 Geocoded: {name} - {geocoded_address}")
        else:
            # Fallback if geocoding fails
            name = f"Location at ({latitude:.4f}, {longitude:.4f})"
            geocoded_address = address or "Address not available"
            print(f"⚠️ Geocoding failed, using fallback name")
        
        # Create new location
        created_at = int(datetime.now().timestamp())
        cursor = connection.execute(
            """
            INSERT INTO Locations 
            (trip_id, x, y, name, address, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (trip_id, longitude, latitude, name, geocoded_address, created_at)
        )
        
        location_id = cursor.lastrowid
        
        # Fetch the created location
        cursor = connection.execute(
            "SELECT * FROM Locations WHERE id = ?", 
            (location_id,)
        )
        new_location = cursor.fetchone()
        
        print(f"✅ Created location: {name} (ID: {location_id})")
        return new_location


    def batch_upload_photos(
        self,
        connection,
        files: List,  # List of FileStorage objects from Flask
        trip_id: int,
        user_id: int
    ) -> List[dict]:
        """
        Batch upload photos with EXIF extraction and auto-location creation.
        
        Args:
            connection: SQLite database connection
            files: List of FileStorage objects from Flask request
            trip_id: ID of the trip these photos belong to
            user_id: ID of the user uploading the photos
            
        Returns:
            List of created photo dictionaries
        """
        created_photos = []
        skipped_photos = []
        
        for file in files:
            try:
                original_filename = file.filename
                print(f"\nProcessing: {original_filename}")
                
                # Save file temporarily to extract EXIF
                temp_path = f"/tmp/{original_filename}"
                file.seek(0)
                file.save(temp_path)
                
                # Extract EXIF data
                exif_data = self.extract_exif_data(temp_path)
                
                # Get GPS coordinates
                gps_coords = None
                if 'GPSInfo' in exif_data:
                    gps_coords = self.convert_gps_to_decimal(exif_data['GPSInfo'])
                
                if not gps_coords:
                    print(f"⚠️  No GPS data found for {original_filename}, skipping...")
                    skipped_photos.append(original_filename)
                    os.remove(temp_path)
                    continue
                
                latitude, longitude = gps_coords
                print(f"📍 GPS: {latitude:.6f}, {longitude:.6f}")
                
                # Find or create location
                location = self.find_or_create_location(
                    connection, trip_id, latitude, longitude
                )
                
                # Save photo file permanently (reopen from temp)
                with open(temp_path, 'rb') as f:
                    from werkzeug.datastructures import FileStorage
                    file_storage = FileStorage(f, filename=original_filename)
                    file_url, saved_ext = self.save_photo_file(file_storage, original_filename)
                
                print(f"💾 Saved to: {file_url}")
                
                # Extract timestamp
                taken_at = self.extract_datetime(exif_data)
                if not taken_at:
                    taken_at = int(datetime.now().timestamp())
                
                # Create Photo record
                cursor = connection.execute(
                    """
                    INSERT INTO Photos 
                    (location_id, user_id, x, y, file_url, original_filename, taken_at, is_cover_photo)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (location['id'], user_id, longitude, latitude, file_url, 
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
                os.remove(temp_path)
                
                print(f"✅ Successfully uploaded {original_filename}")
                
            except Exception as e:
                print(f"❌ Error processing {file.filename}: {e}")
                skipped_photos.append(file.filename)
                continue
        
        # Set first photo as cover if no cover exists for that location
        if created_photos:
            location_id = created_photos[0]['location_id']
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
        
        # Print summary
        print(f"\n{'='*60}")
        print(f"✅ Successfully uploaded: {len(created_photos)} photos")
        if skipped_photos:
            print(f"⚠️  Skipped (no GPS): {len(skipped_photos)} photos")
            for filename in skipped_photos:
                print(f"   - {filename}")
        print(f"{'='*60}\n")
        
        return created_photos


# Singleton instance
photo_service = PhotoService()
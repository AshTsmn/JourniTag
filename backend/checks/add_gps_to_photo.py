#!/usr/bin/env python3
"""
Add GPS EXIF data to a photo.
Usage: python add_gps_to_photo.py input.jpg output.jpg --lat 35.6762 --lon 139.6503
"""

import sys
import argparse
from PIL import Image
import piexif
from datetime import datetime

def decimal_to_dms(decimal):
    """Convert decimal degrees to degrees, minutes, seconds format."""
    is_positive = decimal >= 0
    decimal = abs(decimal)
    
    degrees = int(decimal)
    minutes_decimal = (decimal - degrees) * 60
    minutes = int(minutes_decimal)
    seconds = (minutes_decimal - minutes) * 60
    
    return ((degrees, 1), (minutes, 1), (int(seconds * 100), 100))

def add_gps_to_photo(input_path, output_path, latitude, longitude, 
                     make="Apple", model="iPhone 13 Pro", 
                     altitude=None, timestamp=None):
    """Add GPS EXIF data to a photo."""
    
    print(f"\n{'='*60}")
    print(f"Adding GPS data to: {input_path}")
    print(f"{'='*60}\n")
    
    try:
        # Open the image
        img = Image.open(input_path)
        print(f"✓ Opened image: {img.size}")
        
        # Try to get existing EXIF data
        try:
            exif_dict = piexif.load(img.info.get('exif', b''))
            print("✓ Loaded existing EXIF data")
        except:
            exif_dict = {"0th": {}, "Exif": {}, "GPS": {}, "1st": {}, "thumbnail": None}
            print("✓ Creating new EXIF data")
        
        # Convert latitude and longitude to DMS format
        lat_dms = decimal_to_dms(latitude)
        lon_dms = decimal_to_dms(longitude)
        
        # Determine N/S and E/W
        lat_ref = 'N' if latitude >= 0 else 'S'
        lon_ref = 'E' if longitude >= 0 else 'W'
        
        # Build GPS IFD
        gps_ifd = {
            piexif.GPSIFD.GPSVersionID: (2, 0, 0, 0),
            piexif.GPSIFD.GPSLatitudeRef: lat_ref.encode(),
            piexif.GPSIFD.GPSLatitude: lat_dms,
            piexif.GPSIFD.GPSLongitudeRef: lon_ref.encode(),
            piexif.GPSIFD.GPSLongitude: lon_dms,
        }
        
        # Add altitude if provided
        if altitude is not None:
            gps_ifd[piexif.GPSIFD.GPSAltitudeRef] = 0  # Above sea level
            gps_ifd[piexif.GPSIFD.GPSAltitude] = (int(altitude * 100), 100)
        
        # Add timestamp if provided
        if timestamp:
            gps_ifd[piexif.GPSIFD.GPSDateStamp] = timestamp.strftime("%Y:%m:%d").encode()
            gps_ifd[piexif.GPSIFD.GPSTimeStamp] = (
                (timestamp.hour, 1),
                (timestamp.minute, 1),
                (timestamp.second, 1)
            )
        
        exif_dict["GPS"] = gps_ifd
        
        # Add camera info to 0th IFD
        if make:
            exif_dict["0th"][piexif.ImageIFD.Make] = make.encode()
        if model:
            exif_dict["0th"][piexif.ImageIFD.Model] = model.encode()
        
        # Add software/datetime
        exif_dict["0th"][piexif.ImageIFD.Software] = "18.6.2".encode()
        current_time = datetime.now().strftime("%Y:%m:%d %H:%M:%S")
        exif_dict["0th"][piexif.ImageIFD.DateTime] = current_time.encode()
        exif_dict["Exif"][piexif.ExifIFD.DateTimeOriginal] = current_time.encode()
        
        # Convert to bytes
        exif_bytes = piexif.dump(exif_dict)
        
        # Save image with new EXIF data
        img.save(output_path, exif=exif_bytes, quality=95)
        
        print(f"\n✅ SUCCESS!")
        print(f"\nGPS data added:")
        print(f"  Latitude:  {latitude}° ({lat_ref})")
        print(f"  Longitude: {longitude}° ({lon_ref})")
        if altitude:
            print(f"  Altitude:  {altitude}m")
        print(f"  Make:      {make}")
        print(f"  Model:     {model}")
        print(f"\n✓ Saved to: {output_path}")
        print(f"\nVerify with: python check_photo_gps.py {output_path}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

# Common locations for quick reference
LOCATIONS = {
    'shinjuku': (35.6938, 139.7034),
    'shibuya': (35.6595, 139.7004),
    'tokyo_tower': (35.6586, 139.7454),
    'gyoen': (35.6852, 139.7100),  # Shinjuku Gyoen
    'ann_arbor': (42.2808, -83.890),
    'new_york': (40.7128, -74.0060),
    'san_francisco': (37.7749, -122.4194),
}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Add GPS EXIF data to a photo')
    parser.add_argument('input', help='Input photo path')
    parser.add_argument('output', help='Output photo path')
    parser.add_argument('--lat', type=float, help='Latitude (decimal degrees)')
    parser.add_argument('--lon', type=float, help='Longitude (decimal degrees)')
    parser.add_argument('--location', choices=LOCATIONS.keys(), 
                       help='Use preset location')
    parser.add_argument('--altitude', type=float, help='Altitude in meters')
    parser.add_argument('--make', default='Apple', help='Camera make')
    parser.add_argument('--model', default='iPhone 13 Pro', help='Camera model')
    
    args = parser.parse_args()
    
    # Determine coordinates
    if args.location:
        latitude, longitude = LOCATIONS[args.location]
        print(f"Using preset location: {args.location}")
    elif args.lat is not None and args.lon is not None:
        latitude, longitude = args.lat, args.lon
    else:
        print("Error: Provide either --lat and --lon, or --location")
        print("\nAvailable preset locations:")
        for name, (lat, lon) in LOCATIONS.items():
            print(f"  {name}: {lat}, {lon}")
        sys.exit(1)
    
    add_gps_to_photo(
        args.input,
        args.output,
        latitude,
        longitude,
        make=args.make,
        model=args.model,
        altitude=args.altitude,
        timestamp=datetime.now()
    )
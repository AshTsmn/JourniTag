#!/usr/bin/env python3
"""
Check if a photo has GPS metadata.
Usage: python check_photo_gps.py /path/to/photo.jpg
"""

import sys
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS

def check_photo(image_path):
    """Check if photo has GPS data."""
    print(f"\n{'='*60}")
    print(f"Checking: {image_path}")
    print(f"{'='*60}\n")
    
    try:
        # Try to load HEIC support
        try:
            from pillow_heif import register_heif_opener
            register_heif_opener()
            print("✓ HEIC suppo loaded")
        except ImportError:
            print("⚠ HEIC support not available (install pillow-heif)")
        
        # Open image
        image = Image.open(image_path)
        print(f"✓ Image opened successfully")
        print(f"  Format: {image.format}")
        print(f"  Size: {image.size}")
        print(f"  Mode: {image.mode}")
        
        # Get EXIF data
        exif_data = None
        if hasattr(image, 'getexif'):
            exif_data = image.getexif()
        elif hasattr(image, '_getexif'):
            exif_data = image._getexif()
        
        if not exif_data:
            print("\n❌ No EXIF data found in this photo")
            print("\nPossible reasons:")
            print("  - Photo was edited/converted and metadata was stripped")
            print("  - Photo was shared via app that removes metadata")
            print("  - Photo is a screenshot (no EXIF)")
            print("  - Location services were disabled when photo was taken")
            return
        
        print(f"\n✓ EXIF data found ({len(exif_data)} fields)")
        
        # Check for GPS data
        has_gps = False
        gps_info = None
        
        for tag_id, value in exif_data.items():
            tag_name = TAGS.get(tag_id, tag_id)
            if tag_name == 'GPSInfo':
                has_gps = True
                gps_info = value
                break
        
        if has_gps and gps_info:
            print("\n✅ GPS DATA FOUND!")
            print("\nGPS Info:")
            
            # Decode GPS tags
            if isinstance(gps_info, dict):
                for key, value in gps_info.items():
                    gps_tag = GPSTAGS.get(key, key)
                    print(f"  {gps_tag}: {value}")
            elif hasattr(gps_info, 'items'):
                for key, value in gps_info.items():
                    gps_tag = GPSTAGS.get(key, key)
                    print(f"  {gps_tag}: {value}")
            else:
                print(f"  Raw GPS data type: {type(gps_info)}")
                print(f"  Value: {gps_info}")
            
            print("\n✅ This photo should work with the upload system!")
        else:
            print("\n❌ NO GPS DATA FOUND")
            print("\nThis photo was likely:")
            print("  - Taken with Location Services disabled")
            print("  - AirDropped with 'Without Location' option")
            print("  - Shared through an app that strips metadata")
            print("  - Edited in a way that removed GPS data")
            
            print("\nTo fix:")
            print("  1. On iPhone: Settings > Privacy > Location Services > Camera > 'While Using'")
            print("  2. When AirDropping: Make sure to include location data")
            print("  3. Use original photos, not edited/shared versions")
        
        # Show some other EXIF fields
        print("\nOther EXIF data found:")
        interesting_tags = ['DateTimeOriginal', 'DateTime', 'Make', 'Model', 'Software']
        for tag_id, value in exif_data.items():
            tag_name = TAGS.get(tag_id, tag_id)
            if tag_name in interesting_tags:
                print(f"  {tag_name}: {value}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python check_photo_gps.py /path/to/photo.jpg")
        sys.exit(1)
    
    check_photo(sys.argv[1])
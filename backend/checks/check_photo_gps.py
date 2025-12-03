#!/usr/bin/env python3
"""
Check if a photo has GPS metadata.
Works with JPEG, JPG, HEIC, PNG, and handles GPS IFD pointers.
Usage: python check_photo_gps.py /path/to/photo.jpg
"""

import sys
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS

def dms_to_decimal(dms, ref):
    """Convert DMS (degrees, minutes, seconds) to decimal degrees."""
    degrees, minutes, seconds = dms
    decimal = float(degrees) + float(minutes)/60 + float(seconds)/3600
    if ref in ['S', 'W']:
        decimal = -decimal
    return decimal

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
            print("✓ HEIC support loaded")
        except ImportError:
            print("⚠ HEIC support not available (install: pip install pillow-heif)")
        
        # Open image
        image = Image.open(image_path)
        print(f"✓ Image opened successfully")
        print(f"  Format: {image.format}")
        print(f"  Size: {image.size}")
        print(f"  Mode: {image.mode}")
        
        # Get EXIF data - try both methods
        exif_data = None
        if hasattr(image, 'getexif'):
            exif_data = image.getexif()
            print(f"  Using: getexif() method")
        elif hasattr(image, '_getexif'):
            exif_data = image._getexif()
            print(f"  Using: _getexif() method")
        
        if not exif_data or len(exif_data) == 0:
            print("\n❌ NO EXIF DATA FOUND")
            print("\nThis photo has NO metadata. Possible reasons:")
            print("  ❌ Photo was edited/converted and metadata was stripped")
            print("  ❌ Photo was shared via Messages/WhatsApp that removes metadata")
            print("  ❌ Photo is a screenshot (screenshots never have EXIF)")
            print("  ❌ Photo was AirDropped with 'Without Location' option")
            print("  ❌ Photo was downloaded from web/social media")
            
            print("\n💡 HOW TO GET PHOTOS WITH GPS DATA:")
            print("  ✅ Use Photos app > Select > AirDrop with 'All Photos Data'")
            print("  ✅ Use iCloud Photo Library and download originals")
            print("  ✅ Use Image Capture or copy directly from iPhone")
            print("  ✅ Email photos to yourself (usually preserves EXIF)")
            return
        
        print(f"\n✓ EXIF data found ({len(exif_data)} fields)")
        
        # Check for GPS data - handle both direct GPS and IFD pointer
        has_gps = False
        gps_data = None
        
        # First, check if GPS is directly in EXIF
        for tag_id, value in exif_data.items():
            tag_name = TAGS.get(tag_id, tag_id)
            if tag_name == 'GPSInfo':
                # Check if it's an IFD pointer (integer) or actual GPS data
                if isinstance(value, int):
                    print(f"\n📍 GPS IFD pointer found: {value}")
                    try:
                        # Follow the IFD pointer to get actual GPS data
                        gps_data = exif_data.get_ifd(value)
                        has_gps = True
                        print(f"✓ Followed IFD pointer, got GPS data")
                    except Exception as e:
                        print(f"❌ Error following IFD pointer: {e}")
                else:
                    gps_data = value
                    has_gps = True
                break
        
        # Also check tag 0x8825 (GPS IFD tag number)
        if not has_gps and 0x8825 in exif_data:
            try:
                gps_data = exif_data.get_ifd(0x8825)
                has_gps = True
                print(f"\n✓ Got GPS data via tag 0x8825")
            except Exception as e:
                print(f"\n⚠ Tag 0x8825 exists but couldn't read: {e}")
        
        if has_gps and gps_data:
            print("\n✅ ✅ ✅ GPS DATA FOUND! ✅ ✅ ✅")
            print("\nRaw GPS Info:")
            
            # Decode GPS tags
            gps_dict = {}
            if hasattr(gps_data, 'items'):
                for key, value in gps_data.items():
                    gps_tag = GPSTAGS.get(key, f"Unknown_{key}")
                    gps_dict[gps_tag] = value
                    print(f"  {gps_tag}: {value}")
            
            # Try to extract and convert coordinates
            if 'GPSLatitude' in gps_dict and 'GPSLongitude' in gps_dict:
                try:
                    lat = dms_to_decimal(gps_dict['GPSLatitude'], gps_dict.get('GPSLatitudeRef', 'N'))
                    lon = dms_to_decimal(gps_dict['GPSLongitude'], gps_dict.get('GPSLongitudeRef', 'E'))
                    
                    print(f"\n🌍 COORDINATES:")
                    print(f"  Latitude:  {lat:.6f}")
                    print(f"  Longitude: {lon:.6f}")
                    print(f"\n  Google Maps: https://www.google.com/maps?q={lat},{lon}")
                    print(f"  Apple Maps:  https://maps.apple.com/?q={lat},{lon}")
                except Exception as e:
                    print(f"\n⚠ Could not convert coordinates: {e}")
            
            print("\n✅ ✅ ✅ THIS PHOTO WILL WORK WITH YOUR UPLOAD SYSTEM! ✅ ✅ ✅")
            
        else:
            print("\n" + "="*60)
            print("❌ NO GPS DATA FOUND IN THIS PHOTO")
            print("="*60)
            print("\nThis photo HAS metadata but NO location data.")
            print("\nMost common reasons:")
            print("  ❌ Location Services were OFF when photo was taken")
            print("  ❌ Photo was AirDropped with 'Without Location' selected")
            print("  ❌ Camera app didn't have location permission")
            print("  ❌ Photo was edited in an app that stripped GPS")
            
            print("\n💡 TO FIX FOR FUTURE PHOTOS:")
            print("  1. iPhone Settings > Privacy > Location Services > ON")
            print("  2. iPhone Settings > Privacy > Location Services > Camera > 'While Using'")
            print("  3. When AirDropping: Tap 'Options' > Include 'All Photos Data'")
            print("  4. Use original photos, not edited versions")
            
            print("\n💡 FOR THIS SPECIFIC PHOTO:")
            print("  - Find the ORIGINAL version (check iCloud, other devices)")
            print("  - If photo is from Messages/email, ask sender to resend via AirDrop")
            print("  - If photo is from iPhone, connect via cable and use Image Capture")
        
        # Show some other EXIF fields
        print("\n" + "="*60)
        print("OTHER METADATA FOUND:")
        print("="*60)
        interesting_tags = ['DateTimeOriginal', 'DateTime', 'Make', 'Model', 'Software', 'LensModel']
        found_any = False
        for tag_id, value in exif_data.items():
            tag_name = TAGS.get(tag_id, None)
            if tag_name in interesting_tags:
                print(f"  {tag_name}: {value}")
                found_any = True
        
        if not found_any:
            print("  (No camera/date information found)")
        
    except FileNotFoundError:
        print(f"\n❌ Error: File not found: {image_path}")
        print("\nMake sure the file path is correct.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("\n" + "="*60)
        print("GPS METADATA CHECKER")
        print("="*60)
        print("\nUsage:")
        print("  python check_photo_gps.py /path/to/photo.jpg")
        print("\nSupported formats:")
        print("  - JPEG (.jpg, .jpeg)")
        print("  - HEIC (.heic, .heif)")
        print("  - PNG (.png)")
        print("\nExamples:")
        print("  python check_photo_gps.py IMG_1234.HEIC")
        print("  python check_photo_gps.py ~/Downloads/photo.jpg")
        print("  python check_photo_gps.py '/path/with spaces/photo.jpg'")
        print()
        sys.exit(1)
    
    check_photo(sys.argv[1])
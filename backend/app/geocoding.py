"""Geocoding service using Nominatim (OpenStreetMap) API."""
import requests
import time
from typing import Optional, Dict


class GeocodingService:
    """Service for reverse geocoding using Nominatim API."""
    
    def __init__(self):
        self.base_url = "https://nominatim.openstreetmap.org/reverse"
        # Nominatim requires a User-Agent header
        self.headers = {
            'User-Agent': 'JourniTag/1.0 (Photo location tagging app)'
        }
        # Rate limiting: Nominatim allows max 1 request per second
        self.last_request_time = 0
        self.min_request_interval = 1.0  # seconds
    
    def _rate_limit(self):
        """Ensure we don't exceed Nominatim's rate limit (1 req/sec)."""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.min_request_interval:
            sleep_time = self.min_request_interval - time_since_last
            print(f"Rate limiting: sleeping for {sleep_time:.2f}s")
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
    def reverse_geocode(self, latitude: float, longitude: float) -> Optional[Dict]:
        """
        Get location information from coordinates using Nominatim.
        
        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            
        Returns:
            Dictionary with location info or None if request fails
            
        Example return:
        {
            'name': 'Lummus Park',
            'address': '1130 Ocean Drive, Miami Beach, FL 33139',
            'city': 'Miami Beach',
            'state': 'Florida',
            'country': 'United States',
            'full_address': {
                'road': 'Ocean Drive',
                'house_number': '1130',
                'neighbourhood': 'South Beach',
                'city': 'Miami Beach',
                'county': 'Miami-Dade County',
                'state': 'Florida',
                'postcode': '33139',
                'country': 'United States',
                'country_code': 'us'
            }
        }
        """
        try:
            # Rate limit to comply with Nominatim usage policy
            self._rate_limit()
            
            params = {
                'lat': latitude,
                'lon': longitude,
                'format': 'json',
                'addressdetails': 1,
                'zoom': 18,  # High zoom for precise location (building level)
            }
            
            print(f"🌍 Reverse geocoding: ({latitude:.6f}, {longitude:.6f})")
            
            response = requests.get(
                self.base_url,
                params=params,
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"Nominatim API error: {response.status_code}")
                return None
            
            data = response.json()
            
            if not data or 'error' in data:
                print(f"No location found for coordinates: ({latitude}, {longitude})")
                return None
            
            # Extract useful information
            address = data.get('address', {})
            
            # Try to get a meaningful name (POI, building, or neighbourhood)
            name = (
                data.get('name') or 
                address.get('tourism') or
                address.get('amenity') or
                address.get('building') or
                address.get('neighbourhood') or
                address.get('suburb') or
                address.get('city') or
                address.get('town') or
                'Unknown Location'
            )
            
            # Build a readable address
            address_parts = []
            if address.get('house_number'):
                address_parts.append(address['house_number'])
            if address.get('road'):
                address_parts.append(address['road'])
            
            # Add city
            city = (
                address.get('city') or 
                address.get('town') or 
                address.get('village') or
                address.get('municipality')
            )
            if city:
                address_parts.append(city)
            
            # Add state/province
            state = address.get('state')
            if state:
                address_parts.append(state)
            
            # Add postal code
            postcode = address.get('postcode')
            if postcode:
                address_parts.append(postcode)
            
            formatted_address = ', '.join(filter(None, address_parts))
            
            result = {
                'name': name,
                'address': formatted_address,
                'city': city,
                'state': state,
                'country': address.get('country'),
                'country_code': address.get('country_code'),
                'postcode': postcode,
                'full_address': address,
                'display_name': data.get('display_name'),
            }
            
            print(f"📍 Found: {name} at {formatted_address}")
            return result
            
        except requests.exceptions.Timeout:
            print("Nominatim API timeout")
            return None
        except Exception as e:
            print(f"Error in reverse geocoding: {e}")
            return None


# Singleton instance
geocoding_service = GeocodingService()
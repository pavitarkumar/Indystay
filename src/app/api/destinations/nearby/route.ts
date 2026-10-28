import { NextRequest, NextResponse } from 'next/server';

interface IndianCityCoord {
  city: string;
  state: string;
  lat: number;
  lng: number;
}

const INDIAN_CITIES_COORDS: IndianCityCoord[] = [
  { city: 'Amritsar', state: 'Punjab', lat: 31.634, lng: 74.8723 },
  { city: 'Ambala', state: 'Haryana', lat: 30.3782, lng: 76.7767 },
  { city: 'Chandigarh', state: 'Punjab & Haryana', lat: 30.7333, lng: 76.7794 },
  { city: 'Delhi', state: 'Delhi NCR', lat: 28.6139, lng: 77.209 },
  { city: 'Gurugram', state: 'Haryana', lat: 28.4595, lng: 77.0266 },
  { city: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.391 },
  { city: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081 },
  { city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { city: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lng: 73.7125 },
  { city: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lng: 73.0243 },
  { city: 'Goa', state: 'Goa', lat: 15.2993, lng: 74.124 },
  { city: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777 },
  { city: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { city: 'Hyderabad', state: 'Telangana', lat: 17.385, lng: 78.4867 },
  { city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { city: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734 },
  { city: 'Manali', state: 'Himachal Pradesh', lat: 32.2432, lng: 77.1892 },
  { city: 'Rishikesh', state: 'Uttarakhand', lat: 30.0869, lng: 78.2676 },
  { city: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739 },
  { city: 'Ayodhya', state: 'Uttar Pradesh', lat: 26.7922, lng: 82.1998 },
  { city: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
  { city: 'Munnar', state: 'Kerala', lat: 10.0889, lng: 77.0595 },
  { city: 'Ludhiana', state: 'Punjab', lat: 30.901, lng: 75.8573 },
  { city: 'Jalandhar', state: 'Punjab', lat: 31.326, lng: 75.5762 },
];

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { success: false, error: 'Latitude and Longitude are required' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { success: false, error: 'Invalid numeric coordinates' },
        { status: 400 }
      );
    }

    // 1. Attempt online reverse geocoding via OpenStreetMap Nominatim
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'IndiStay-Hospitality-Platform/1.0',
            'Accept-Language': 'en',
          },
          next: { revalidate: 3600 },
        }
      );

      if (geoRes.ok) {
        const geoData = await geoRes.json();
        const addr = geoData.address || {};
        const detectedCity =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.city_district ||
          addr.suburb ||
          addr.county ||
          addr.state_district;
        const detectedState = addr.state || '';

        if (detectedCity) {
          const displayName = detectedState
            ? `${detectedCity}, ${detectedState}, India`
            : `${detectedCity}, India`;

          return NextResponse.json({
            success: true,
            city: detectedCity,
            state: detectedState,
            displayName,
            source: 'reverse_geocoding',
          });
        }
      }
    } catch (reverseErr) {
      console.warn('[Nearby API] Reverse geocoding network notice:', reverseErr);
    }

    // 2. Fallback: Fast Nearest Indian City calculation
    let closestCity = INDIAN_CITIES_COORDS[0];
    let minDistance = Infinity;

    for (const c of INDIAN_CITIES_COORDS) {
      const d = haversineDistance(lat, lng, c.lat, c.lng);
      if (d < minDistance) {
        minDistance = d;
        closestCity = c;
      }
    }

    const displayName = `${closestCity.city}, ${closestCity.state}, India`;
    return NextResponse.json({
      success: true,
      city: closestCity.city,
      state: closestCity.state,
      displayName,
      distanceKm: Math.round(minDistance),
      source: 'nearest_coordinate_match',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to detect location',
      },
      { status: 500 }
    );
  }
}

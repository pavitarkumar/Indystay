import { Router, Request, Response } from 'express';
import { Hotel } from '../../src/models/Hotel';
import { connectBackendDatabase } from '../db';
import { memoryCache } from '../cache';

export const destinationsRouter = Router();

interface DestinationItem {
  id: string;
  title: string;
  subtitle: string;
  displayName: string;
  city: string;
  state: string;
  type: 'city' | 'landmark' | 'locality' | 'hotel';
}

const PRESET_INDIAN_DESTINATIONS: DestinationItem[] = [
  { id: 'amritsar-city', title: 'Amritsar', subtitle: 'Punjab, India', displayName: 'Amritsar, Punjab, India', city: 'Amritsar', state: 'Punjab', type: 'city' },
  { id: 'golden-temple-amritsar', title: 'Golden Temple, Amritsar', subtitle: 'Punjab', displayName: 'Golden Temple, Amritsar, Punjab', city: 'Amritsar', state: 'Punjab', type: 'landmark' },
  { id: 'ambala-city', title: 'Ambala', subtitle: 'Haryana, India', displayName: 'Ambala, Haryana, India', city: 'Ambala', state: 'Haryana', type: 'city' },
  { id: 'ambala-cantt', title: 'Ambala Cantt, Ambala', subtitle: 'Haryana', displayName: 'Ambala Cantt, Ambala, Haryana', city: 'Ambala', state: 'Haryana', type: 'locality' },
  { id: 'ameerpet-hyderabad', title: 'Ameerpet, Hyderabad', subtitle: 'Telangana', displayName: 'Ameerpet, Hyderabad, Telangana', city: 'Hyderabad', state: 'Telangana', type: 'locality' },
  { id: 'delhi-ncr', title: 'Delhi NCR', subtitle: 'National Capital Region', displayName: 'Delhi NCR, India', city: 'Delhi', state: 'Delhi', type: 'city' },
  { id: 'connaught-place-delhi', title: 'Connaught Place, Delhi', subtitle: 'Central Delhi', displayName: 'Connaught Place, New Delhi', city: 'Delhi', state: 'Delhi', type: 'locality' },
  { id: 'chandigarh-city', title: 'Chandigarh', subtitle: 'Punjab & Haryana', displayName: 'Chandigarh, India', city: 'Chandigarh', state: 'Chandigarh', type: 'city' },
  { id: 'goa-all', title: 'Goa', subtitle: 'Beaches & Heritage', displayName: 'Goa, India', city: 'Goa', state: 'Goa', type: 'city' },
  { id: 'calangute-goa', title: 'Calangute, North Goa', subtitle: 'Beachfront Hub', displayName: 'Calangute, North Goa', city: 'Goa', state: 'Goa', type: 'locality' },
  { id: 'jaipur-pink-city', title: 'Jaipur', subtitle: 'Rajasthan', displayName: 'Jaipur, Rajasthan, India', city: 'Jaipur', state: 'Rajasthan', type: 'city' },
  { id: 'udaipur-city-of-lakes', title: 'Udaipur', subtitle: 'Rajasthan', displayName: 'Udaipur, Rajasthan, India', city: 'Udaipur', state: 'Rajasthan', type: 'city' },
  { id: 'mumbai-city', title: 'Mumbai', subtitle: 'Maharashtra', displayName: 'Mumbai, Maharashtra, India', city: 'Mumbai', state: 'Maharashtra', type: 'city' },
  { id: 'bengaluru-city', title: 'Bengaluru (Bangalore)', subtitle: 'Karnataka', displayName: 'Bengaluru, Karnataka, India', city: 'Bengaluru', state: 'Karnataka', type: 'city' },
  { id: 'hyderabad-city', title: 'Hyderabad', subtitle: 'Telangana', displayName: 'Hyderabad, Telangana, India', city: 'Hyderabad', state: 'Telangana', type: 'city' },
  { id: 'shimla-hills', title: 'Shimla', subtitle: 'Himachal Pradesh', displayName: 'Shimla, Himachal Pradesh, India', city: 'Shimla', state: 'Himachal Pradesh', type: 'city' },
  { id: 'manali-valley', title: 'Manali', subtitle: 'Himachal Pradesh', displayName: 'Manali, Himachal Pradesh, India', city: 'Manali', state: 'Himachal Pradesh', type: 'city' },
  { id: 'rishikesh-yoga', title: 'Rishikesh', subtitle: 'Uttarakhand', displayName: 'Rishikesh, Uttarakhand, India', city: 'Rishikesh', state: 'Uttarakhand', type: 'city' },
  { id: 'varanasi-ghats', title: 'Varanasi', subtitle: 'Uttar Pradesh', displayName: 'Varanasi, Uttar Pradesh, India', city: 'Varanasi', state: 'Uttar Pradesh', type: 'city' },
  { id: 'ayodhya-ram-mandir', title: 'Ayodhya', subtitle: 'Uttar Pradesh', displayName: 'Ayodhya, Uttar Pradesh, India', city: 'Ayodhya', state: 'Uttar Pradesh', type: 'city' },
  { id: 'kochi-fort', title: 'Kochi (Cochin)', subtitle: 'Kerala', displayName: 'Kochi, Kerala, India', city: 'Kochi', state: 'Kerala', type: 'city' },
];

const INDIAN_CITIES_COORDS = [
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

// GET /api/destinations
destinationsRouter.get('/', async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const cacheKey = `destinations:${q}`;

  const cached = memoryCache.get<DestinationItem[]>(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json({ success: true, count: cached.length, data: cached });
  }

  try {
    await connectBackendDatabase();

    const matches: DestinationItem[] = [];
    const seenTitles = new Set<string>();

    const filterPreset = (item: DestinationItem) => {
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q)
      );
    };

    for (const item of PRESET_INDIAN_DESTINATIONS) {
      if (filterPreset(item) && !seenTitles.has(item.title.toLowerCase())) {
        matches.push(item);
        seenTitles.add(item.title.toLowerCase());
      }
    }

    // Query active verified hotels in database
    const hotelFilter: Record<string, unknown> = {
      verificationStatus: 'APPROVED',
      listingStatus: 'PUBLISHED',
    };

    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      hotelFilter.$or = [
        { city: { $regex: regex } },
        { locality: { $regex: regex } },
        { name: { $regex: regex } },
      ];
    }

    const dbHotels = await Hotel.find(hotelFilter)
      .select('name city state locality')
      .limit(20)
      .lean();

    for (const h of dbHotels) {
      const cityKey = (h.city || '').toLowerCase();
      if (cityKey && !seenTitles.has(cityKey)) {
        matches.push({
          id: `city-${cityKey}`,
          title: h.city,
          subtitle: `${h.state || 'India'}, India`,
          displayName: `${h.city}, ${h.state || 'India'}, India`,
          city: h.city,
          state: h.state || 'India',
          type: 'city',
        });
        seenTitles.add(cityKey);
      }

      const hotelTitle = h.name;
      if (!seenTitles.has(hotelTitle.toLowerCase())) {
        matches.push({
          id: `hotel-${(h._id as any).toString()}`,
          title: hotelTitle,
          subtitle: `${h.locality ? h.locality + ', ' : ''}${h.city}`,
          displayName: `${hotelTitle}, ${h.city}`,
          city: h.city,
          state: h.state || 'India',
          type: 'hotel',
        });
        seenTitles.add(hotelTitle.toLowerCase());
      }
    }

    const result = matches.slice(0, 15);
    memoryCache.set(cacheKey, result, 60); // 60s cache
    res.setHeader('X-Cache', 'MISS');
    return res.json({ success: true, count: result.length, data: result });
  } catch (error) {
    console.error('Express Destinations search error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve destinations' });
  }
});

// GET /api/destinations/nearby
destinationsRouter.get('/nearby', async (req: Request, res: Response) => {
  const latStr = String(req.query.lat || '');
  const lngStr = String(req.query.lng || '');

  if (!latStr || !lngStr) {
    return res.status(400).json({ success: false, error: 'lat and lng coordinates are required' });
  }

  const userLat = parseFloat(latStr);
  const userLng = parseFloat(lngStr);

  if (isNaN(userLat) || isNaN(userLng)) {
    return res.status(400).json({ success: false, error: 'Invalid latitude or longitude numbers' });
  }

  const cacheKey = `nearby:${userLat.toFixed(2)}:${userLng.toFixed(2)}`;
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  try {
    const distances = INDIAN_CITIES_COORDS.map((item) => ({
      ...item,
      distanceKm: Math.round(haversineDistance(userLat, userLng, item.lat, item.lng)),
    }));

    distances.sort((a, b) => a.distanceKm - b.distanceKm);
    const closest = distances[0];
    const nearbyList = distances.slice(0, 4);

    const payload = {
      success: true,
      closest: {
        city: closest.city,
        state: closest.state,
        distanceKm: closest.distanceKm,
        displayName: `${closest.city}, ${closest.state}, India`,
      },
      nearby: nearbyList.map((c) => ({
        id: `nearby-${c.city.toLowerCase()}`,
        title: c.city,
        subtitle: `${c.state} • ${c.distanceKm} km away`,
        displayName: `${c.city}, ${c.state}, India`,
        city: c.city,
        state: c.state,
        type: 'city',
        distanceKm: c.distanceKm,
      })),
    };

    memoryCache.set(cacheKey, payload, 300); // 5 min cache
    res.setHeader('X-Cache', 'MISS');
    return res.json(payload);
  } catch (error) {
    console.error('Nearby error:', error);
    return res.status(500).json({ success: false, error: 'Failed to calculate nearby destinations' });
  }
});

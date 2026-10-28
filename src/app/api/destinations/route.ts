import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { Hotel } from '@/models/Hotel';

interface DestinationItem {
  id: string;
  title: string;
  subtitle: string;
  displayName: string;
  city: string;
  state: string;
  type: 'city' | 'landmark' | 'locality' | 'hotel';
}

// Comprehensive catalog of curated Indian destinations, landmarks, and major cities
const PRESET_INDIAN_DESTINATIONS: DestinationItem[] = [
  {
    id: 'amritsar-city',
    title: 'Amritsar',
    subtitle: 'Punjab, India',
    displayName: 'Amritsar, Punjab, India',
    city: 'Amritsar',
    state: 'Punjab',
    type: 'city',
  },
  {
    id: 'golden-temple-amritsar',
    title: 'Golden Temple, Amritsar',
    subtitle: 'Punjab',
    displayName: 'Golden Temple, Amritsar, Punjab',
    city: 'Amritsar',
    state: 'Punjab',
    type: 'landmark',
  },
  {
    id: 'ambala-city',
    title: 'Ambala',
    subtitle: 'Haryana, India',
    displayName: 'Ambala, Haryana, India',
    city: 'Ambala',
    state: 'Haryana',
    type: 'city',
  },
  {
    id: 'ameerpet-hyderabad',
    title: 'Ameerpet, Hyderabad',
    subtitle: 'Telangana',
    displayName: 'Ameerpet, Hyderabad, Telangana',
    city: 'Hyderabad',
    state: 'Telangana',
    type: 'locality',
  },
  {
    id: 'ambala-cantt',
    title: 'Ambala Cantt, Ambala',
    subtitle: 'Haryana',
    displayName: 'Ambala Cantt, Ambala, Haryana',
    city: 'Ambala',
    state: 'Haryana',
    type: 'locality',
  },
  {
    id: 'ahmedabad-city',
    title: 'Ahmedabad',
    subtitle: 'Gujarat, India',
    displayName: 'Ahmedabad, Gujarat, India',
    city: 'Ahmedabad',
    state: 'Gujarat',
    type: 'city',
  },
  {
    id: 'agra-city',
    title: 'Agra',
    subtitle: 'Uttar Pradesh, India',
    displayName: 'Agra, Uttar Pradesh, India',
    city: 'Agra',
    state: 'Uttar Pradesh',
    type: 'city',
  },
  {
    id: 'taj-mahal-agra',
    title: 'Taj Mahal, Agra',
    subtitle: 'Uttar Pradesh',
    displayName: 'Taj Mahal, Agra, Uttar Pradesh',
    city: 'Agra',
    state: 'Uttar Pradesh',
    type: 'landmark',
  },
  {
    id: 'goa-state',
    title: 'Goa',
    subtitle: 'Beaches & Heritage, India',
    displayName: 'Goa, India',
    city: 'Goa',
    state: 'Goa',
    type: 'city',
  },
  {
    id: 'jaipur-city',
    title: 'Jaipur',
    subtitle: 'Rajasthan, India',
    displayName: 'Jaipur, Rajasthan, India',
    city: 'Jaipur',
    state: 'Rajasthan',
    type: 'city',
  },
  {
    id: 'udaipur-city',
    title: 'Udaipur',
    subtitle: 'City of Lakes, Rajasthan',
    displayName: 'Udaipur, Rajasthan, India',
    city: 'Udaipur',
    state: 'Rajasthan',
    type: 'city',
  },
  {
    id: 'mumbai-city',
    title: 'Mumbai',
    subtitle: 'Maharashtra, India',
    displayName: 'Mumbai, Maharashtra, India',
    city: 'Mumbai',
    state: 'Maharashtra',
    type: 'city',
  },
  {
    id: 'manali-city',
    title: 'Manali',
    subtitle: 'Himachal Pradesh, India',
    displayName: 'Manali, Himachal Pradesh, India',
    city: 'Manali',
    state: 'Himachal Pradesh',
    type: 'city',
  },
  {
    id: 'shimla-city',
    title: 'Shimla',
    subtitle: 'Himachal Pradesh, India',
    displayName: 'Shimla, Himachal Pradesh, India',
    city: 'Shimla',
    state: 'Himachal Pradesh',
    type: 'city',
  },
  {
    id: 'delhi-city',
    title: 'Delhi NCR',
    subtitle: 'National Capital Region, India',
    displayName: 'Delhi NCR, India',
    city: 'Delhi',
    state: 'Delhi',
    type: 'city',
  },
  {
    id: 'bengaluru-city',
    title: 'Bengaluru',
    subtitle: 'Karnataka, India',
    displayName: 'Bengaluru, Karnataka, India',
    city: 'Bengaluru',
    state: 'Karnataka',
    type: 'city',
  },
  {
    id: 'varanasi-city',
    title: 'Varanasi',
    subtitle: 'Uttar Pradesh, India',
    displayName: 'Varanasi, Uttar Pradesh, India',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    type: 'city',
  },
  {
    id: 'rishikesh-city',
    title: 'Rishikesh',
    subtitle: 'Uttarakhand, India',
    displayName: 'Rishikesh, Uttarakhand, India',
    city: 'Rishikesh',
    state: 'Uttarakhand',
    type: 'city',
  },
  {
    id: 'hyderabad-city',
    title: 'Hyderabad',
    subtitle: 'Telangana, India',
    displayName: 'Hyderabad, Telangana, India',
    city: 'Hyderabad',
    state: 'Telangana',
    type: 'city',
  },
  {
    id: 'pune-city',
    title: 'Pune',
    subtitle: 'Maharashtra, India',
    displayName: 'Pune, Maharashtra, India',
    city: 'Pune',
    state: 'Maharashtra',
    type: 'city',
  },
  {
    id: 'chandigarh-city',
    title: 'Chandigarh',
    subtitle: 'Punjab & Haryana, India',
    displayName: 'Chandigarh, India',
    city: 'Chandigarh',
    state: 'Chandigarh',
    type: 'city',
  },
  {
    id: 'ayodhya-city',
    title: 'Ayodhya',
    subtitle: 'Uttar Pradesh, India',
    displayName: 'Ayodhya, Uttar Pradesh, India',
    city: 'Ayodhya',
    state: 'Uttar Pradesh',
    type: 'city',
  },
  {
    id: 'kochi-city',
    title: 'Kochi',
    subtitle: 'Kerala, India',
    displayName: 'Kochi, Kerala, India',
    city: 'Kochi',
    state: 'Kerala',
    type: 'city',
  },
  {
    id: 'munnar-city',
    title: 'Munnar',
    subtitle: 'Kerala, India',
    displayName: 'Munnar, Kerala, India',
    city: 'Munnar',
    state: 'Kerala',
    type: 'city',
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();

    const itemsMap = new Map<string, DestinationItem>();

    // 1. Add preset items first
    for (const item of PRESET_INDIAN_DESTINATIONS) {
      itemsMap.set(item.displayName.toLowerCase(), item);
    }

    // 2. Query live database to dynamically discover newly added cities, localities & hotels
    try {
      await connectToDatabase();
      const hotels = await Hotel.find({
        verificationStatus: 'APPROVED',
      })
        .select('name city state locality address')
        .lean();

      for (const h of hotels) {
        if (h.city) {
          const cityKey = `${h.city}, ${h.state || 'India'}`.toLowerCase();
          if (!itemsMap.has(cityKey)) {
            itemsMap.set(cityKey, {
              id: `db-city-${h._id}`,
              title: h.city,
              subtitle: `${h.state || 'India'}`,
              displayName: `${h.city}, ${h.state || 'India'}`,
              city: h.city,
              state: h.state || '',
              type: 'city',
            });
          }
        }

        if (h.locality && h.city) {
          const locKey = `${h.locality}, ${h.city}`.toLowerCase();
          if (!itemsMap.has(locKey)) {
            itemsMap.set(locKey, {
              id: `db-loc-${h._id}`,
              title: `${h.locality}, ${h.city}`,
              subtitle: h.state || 'India',
              displayName: `${h.locality}, ${h.city}, ${h.state || 'India'}`,
              city: h.city,
              state: h.state || '',
              type: 'locality',
            });
          }
        }

        if (h.name && h.city) {
          const hotelKey = `${h.name}, ${h.city}`.toLowerCase();
          if (!itemsMap.has(hotelKey)) {
            itemsMap.set(hotelKey, {
              id: `db-hotel-${h._id}`,
              title: h.name,
              subtitle: `${h.city}, ${h.state || ''}`,
              displayName: `${h.name}, ${h.city}, ${h.state || ''}`,
              city: h.city,
              state: h.state || '',
              type: 'hotel',
            });
          }
        }
      }
    } catch (dbErr) {
      // If DB is offline, continue gracefully with presets
      console.warn('[Destinations API] DB lookup notice:', dbErr);
    }

    const allDestinations = Array.from(itemsMap.values());

    if (!q) {
      // Return top destinations when no query provided
      return NextResponse.json({
        success: true,
        data: allDestinations.slice(0, 15),
      });
    }

    // Filter matching items
    const filtered = allDestinations.filter((d) => {
      const searchTarget = `${d.title} ${d.subtitle} ${d.displayName} ${d.city} ${d.state}`.toLowerCase();
      return searchTarget.includes(q);
    });

    // Sort to prioritize exact/prefix matches
    filtered.sort((a, b) => {
      const aStarts = a.title.toLowerCase().startsWith(q) || a.city.toLowerCase().startsWith(q);
      const bStarts = b.title.toLowerCase().startsWith(q) || b.city.toLowerCase().startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });

    return NextResponse.json({
      success: true,
      data: filtered.slice(0, 12),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search destinations',
      },
      { status: 500 }
    );
  }
}

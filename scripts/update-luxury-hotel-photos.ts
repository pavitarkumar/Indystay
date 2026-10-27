import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface HotelPhotoSet {
  slug: string;
  coverImage: {
    url: string;
    alt: string;
  };
  images: Array<{
    url: string;
    caption: string;
    isPrimary?: boolean;
  }>;
}

const LUXURY_HOTEL_PHOTOS: HotelPhotoSet[] = [
  // 1. Goa - Azure Sands Beach Resort & Spa
  {
    slug: 'azure-sands-beach-resort-goa',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1400&q=80',
      alt: 'Azure Sands Beach Resort - Oceanfront Pool & Palm Cabanas',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
        caption: 'Beachfront Sunset Deck & Infinity Pool Lounge',
      },
      {
        url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        caption: 'Palm Garden Villa Balcony with Private Daybed',
      },
      {
        url: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
        caption: 'Open Air Lagoon Cabanas with Coastal Breeze',
      },
      {
        url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80',
        caption: 'Spa & Wellness Sanctuary Hydrotherapy Pool',
      },
      {
        url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
        caption: 'Oceanview Master Suite with Private Verandah',
      },
      {
        url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        caption: 'Evening Twilight Illuminated Resort Grounds',
      },
    ],
  },

  // 2. Jaipur - The Grand Heritage Palace & Haveli
  {
    slug: 'grand-heritage-palace-jaipur',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1400&q=80',
      alt: 'The Grand Heritage Palace - Pink Sandstone Rajputana Arches',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        caption: 'Royal Rajputana Diwan & Handcrafted Crystal Chandeliers',
      },
      {
        url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
        caption: 'Maharaja Royal Suite with Carved Jharokha Window',
      },
      {
        url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
        caption: 'Sandstone Courtyard with Candlelit Step Fountain',
      },
      {
        url: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=1200&q=80',
        caption: 'Marble Hammam Bath with Traditional Brass Mirrors',
      },
      {
        url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        caption: 'Palace Rooftop Dining under the Desert Stars',
      },
      {
        url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
        caption: 'Illuminated Heritage Facade at Twilight',
      },
    ],
  },

  // 3. Mumbai - The Marina Executive Suites & Club
  {
    slug: 'marina-executive-suites-mumbai',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80',
      alt: 'The Marina Executive Suites - Skyline Bay & Rooftop Infinity Pool',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
        caption: 'Executive Harbor View Suite with Floor-to-Ceiling Glass',
      },
      {
        url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
        caption: 'Presidential Bedchamber in Warm Wood & Amber Tones',
      },
      {
        url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
        caption: 'Sky Lounge & Cocktail Bar overlooking Arabian Sea',
      },
      {
        url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80',
        caption: 'Italian Marble Bath with Skyline Panoramic Windows',
      },
      {
        url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
        caption: 'Polished Dual Vanity & Rainforest Glass Shower',
      },
      {
        url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
        caption: 'Rooftop Infinity Deck overlooking Coastal Horizon',
      },
    ],
  },

  // 4. Manali - The Pine Crest Mountain Retreat & Chalets
  {
    slug: 'pine-crest-mountain-retreat-manali',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=80',
      alt: 'The Pine Crest - Alpine Cedar Chalet in Mountain Forest',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
        caption: 'Cedar Wood Heated Suite with Panoramic Pine View',
      },
      {
        url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
        caption: 'Snow-capped Valley Overlook Deck & Stone Fireplace',
      },
      {
        url: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80',
        caption: 'Wood-Paneled Parlor & Himalayan Herb Tea Nook',
      },
      {
        url: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
        caption: 'Open Panoramic Balcony with Crisp Alpine Mountain Breeze',
      },
      {
        url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=80',
        caption: 'Natural River Slate Ensuite Bathroom & Rain Shower',
      },
      {
        url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80',
        caption: 'Heated Hydrotherapy Jacuzzi facing Mountain Pines',
      },
    ],
  },

  // 5. Delhi - The Imperial Heritage Palace & Suites
  {
    slug: 'the-imperial-heritage-palace-new-delhi',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80',
      alt: 'The Imperial Heritage Palace - Lutyens Colonnaded Grand Architecture',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
        caption: 'Victorian Palm Court High Tea Salon',
      },
      {
        url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
        caption: 'Imperial Suite in Burmese Teak & Hand-Polished Brass',
      },
      {
        url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
        caption: 'Historic Library Lounge with Silk Carpets',
      },
      {
        url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
        caption: 'Italian Marble Bath with Clawfoot Soaking Tub',
      },
      {
        url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
        caption: 'Lush Heritage Garden Courtyard with Fountains',
      },
      {
        url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
        caption: 'Grand Ballroom with Austrian Crystal Chandeliers',
      },
    ],
  },

  // 6. Udaipur - Lake Pichola Royal Palace & Island Resort
  {
    slug: 'lake-pichola-royal-palace-udaipur',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1400&q=80',
      alt: 'Lake Pichola Royal Palace - White Marble Island Palace',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        caption: 'Private Lakefront Jharokha Balcony facing Aravalli Hills',
      },
      {
        url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
        caption: 'Mewari Royal Chamber with Hand-Painted Wall Frescoes',
      },
      {
        url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        caption: 'Sunset Pool Deck overlooking Glistening Lake Waters',
      },
      {
        url: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=1200&q=80',
        caption: 'Carved Marble Archways & Regal Chandelier Hall',
      },
      {
        url: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
        caption: 'Lakeside Candlelit Dining Terrace under Stars',
      },
      {
        url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        caption: 'Illuminated Palace Courtyard at Twilight with Traditional Sitar',
      },
    ],
  },

  // 7. Bengaluru - The Silicon Grand Luxury Hotel & Spa
  {
    slug: 'the-silicon-grand-luxury-hotel-bengaluru',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80',
      alt: 'The Silicon Grand - Futuristic Glass Tower & Rooftop Garden',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
        caption: 'Designer High-Rise Suite with Smart Automation',
      },
      {
        url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
        caption: 'Modern Atrium Lounge & Executive Boardroom Suites',
      },
      {
        url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80',
        caption: 'Imported Marble Bath with Rain Shower and Smart Mirror',
      },
      {
        url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        caption: 'Infinity Swimming Pool surrounded by Palm Canopies',
      },
      {
        url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
        caption: 'Fine Dining World Cuisine Chef Table',
      },
      {
        url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80',
        caption: 'Revitalizing Luxury Spa & Aromatherapy Suites',
      },
    ],
  },

  // 8. Varanasi - Ganga Ghat Heritage Haveli & Spiritual Retreat
  {
    slug: 'ganga-ghat-heritage-haveli-varanasi',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80',
      alt: 'Ganga Ghat Heritage Haveli - Ancient Stone Courtyard on Riverfront',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
        caption: 'Riverview Heritage Suite with Golden Dawn Light',
      },
      {
        url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
        caption: 'Central Haveli Courtyard with Traditional Brass Lamps',
      },
      {
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        caption: 'Classical Indian Music & Yoga Terrace',
      },
      {
        url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
        caption: 'Chiseled Stone & Copper En-Suite Bath',
      },
      {
        url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
        caption: 'Rooftop River Ghat Aarti Viewing Deck',
      },
      {
        url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
        caption: 'Illuminated Stone Facade at Riverfront Twilight',
      },
    ],
  },

  // 9. Kochi - Fort Kochi Colonial Waterside Heritage Stay
  {
    slug: 'fort-kochi-colonial-waterside-stay',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=80',
      alt: 'Fort Kochi Colonial - Portuguese Verandah on Arabian Sea',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
        caption: 'Harbor Edge Swimming Pool overlooking Shipping Bay',
      },
      {
        url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
        caption: 'Solid Teak Bed with Handcrafted Linen Drapes',
      },
      {
        url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
        caption: 'Spices Courtyard with Outdoor Verandah Bistro',
      },
      {
        url: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
        caption: 'Chinese Fishing Nets Sunset Verandah Seating',
      },
      {
        url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=80',
        caption: 'Open-Air Tropical Bath with Tropical Ferns & Rain Shower',
      },
      {
        url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        caption: 'Lush Coconut Palm Garden Walkway',
      },
    ],
  },

  // 10. Agra - Taj View Royal Palace & Spa
  {
    slug: 'taj-view-royal-palace-agra',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80',
      alt: 'Taj View Royal Palace - Symmetrical Mughal Palace Architecture',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
        caption: 'Royal Mughal Suite with Direct Taj Mahal Silhouette View',
      },
      {
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        caption: 'Intricate White Marble Jali & Fountains',
      },
      {
        url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        caption: 'Reflective Pool with Marble Colonnade Promenade',
      },
      {
        url: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=1200&q=80',
        caption: 'Pietra Dura Inlaid Marble Ensuite Bathroom',
      },
      {
        url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        caption: 'Rooftop Grand Dining with Sunset Sky Glow',
      },
      {
        url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
        caption: 'Illuminated Palace Fountains at Twilight',
      },
    ],
  },

  // 11. Hyderabad - Nizam's Royal Heritage Suites & Club
  {
    slug: 'nizams-royal-heritage-suites-hyderabad',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
      alt: 'Nizam Heritage - Majestic Belgian Crystal Chandelier Darbar',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
        caption: 'Nizam Royal Suite with Velvet Diwan & Gold Filigree',
      },
      {
        url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
        caption: 'Handcrafted Sheesham Bed & Ambient Mood Lighting',
      },
      {
        url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
        caption: 'Colonnaded Marble Verandah overlooking Fountain Lawns',
      },
      {
        url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
        caption: 'Italian Carrera Marble Bath with Antique Mirrors',
      },
      {
        url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        caption: 'Historic Dining Hall for Authentic Hyderabadi Feasts',
      },
      {
        url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
        caption: 'Illuminated Palace Portico at Night',
      },
    ],
  },

  // 12. Kolkata - The Grand Victoria Colonial Hotel & Club
  {
    slug: 'the-grand-victoria-colonial-hotel-kolkata',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80',
      alt: 'The Grand Victoria - Grand White British-Era Colonnade',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
        caption: 'Colonial Palm Court & Afternoon High Tea Salon',
      },
      {
        url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
        caption: 'Calcutta Governor Suite in Teak & Silk Upholstery',
      },
      {
        url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
        caption: 'Vintage Gentlemen Club Library & Billiards Room',
      },
      {
        url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
        caption: 'English Victorian Bathroom with Brass Rain Head',
      },
      {
        url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
        caption: 'Heritage Ballroom with Parquet Wood Flooring',
      },
      {
        url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
        caption: 'Tranquil Verandah Courtyard under Banyan Canopies',
      },
    ],
  },

  // 13. Chennai - Coromandel Coastal Sands Luxury Resort
  {
    slug: 'coromandel-coastal-sands-resort-chennai',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1400&q=80',
      alt: 'Coromandel Coastal Sands - Palm Fringed Bay Beach Resort',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
        caption: 'Bay of Bengal Horizon Deck & Sunken Sun Loungers',
      },
      {
        url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        caption: 'Private Beachfront Villa with Tropical Garden',
      },
      {
        url: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
        caption: 'Seaside Pavilion with Gentle Ocean Breeze',
      },
      {
        url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80',
        caption: 'Ayurvedic Sea Salt Scrub & Massage Cabana',
      },
      {
        url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
        caption: 'Contemporary Coastal Suite with Balcony View',
      },
      {
        url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        caption: 'Evening Twilight Pool with Illuminated Palm Trees',
      },
    ],
  },

  // 14. Rishikesh - Himalayan Ganga Yoga Retreat & Wellness Spa
  {
    slug: 'himalayan-ganga-yoga-retreat-rishikesh',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=80',
      alt: 'Himalayan Ganga Yoga Retreat - Mountain Riverfront Sanctuary',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
        caption: 'Open Ganga Deck for Morning Sunrise Pranayama & Yoga',
      },
      {
        url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
        caption: 'Teak Eco-Luxury Chalet nestled in Foothills',
      },
      {
        url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80',
        caption: 'Ayurvedic Panchakarma Spa & Himalayan Stone Tub',
      },
      {
        url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        caption: 'Fresh Springwater Infinity Pool with Forest Views',
      },
      {
        url: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80',
        caption: 'Herbal Tea Corner with Mountain Pine Vista',
      },
      {
        url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
        caption: 'Evening Ganga Aarti Pavilion with Brass Bells',
      },
    ],
  },

  // 15. Amritsar - Golden Temple Heritage Inn & Suites
  {
    slug: 'golden-temple-heritage-inn-amritsar',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1400&q=80',
      alt: 'Golden Temple Heritage Inn - Traditional Jharokha Sandstone Haveli',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
        caption: 'Royal Punjabi Suite with Handcrafted Wood Work',
      },
      {
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        caption: 'Courtyard with Water Fountain & Brass Lanterns',
      },
      {
        url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
        caption: 'Warm Velvet King Suite with Ambient Reading Lights',
      },
      {
        url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
        caption: 'Marble Inlay Ensuite Bathroom with Luxury Amenities',
      },
      {
        url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
        caption: 'Rooftop Terrace Dining listening to Gurbani Chants',
      },
      {
        url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        caption: 'Heritage Gateway Illuminated at Golden Hour',
      },
    ],
  },

  // 16. Munnar - Misty Tea Hills Estate Resort & Chalets
  {
    slug: 'misty-tea-hills-estate-resort-munnar',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=80',
      alt: 'Misty Tea Hills - Emerald Western Ghats Tea Plantations & Chalets',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
        caption: 'Tea Plantation Infinity Deck enveloped in Mountain Mist',
      },
      {
        url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
        caption: 'Natural Wood Hillside Chalet Suite with Private Balcony',
      },
      {
        url: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80',
        caption: 'Tea Tasting Parlor with Roaring Stone Fireplace',
      },
      {
        url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80',
        caption: 'Soaking Tub with Unobstructed Views of Tea Slopes',
      },
      {
        url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        caption: 'Mountain Heated Plunge Pool facing Cardamom Hills',
      },
      {
        url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
        caption: 'Sunset Crimson Sky over Munnar Valley Ridges',
      },
    ],
  },

  // 17. Ooty - Nilgiri Blue Mountain Colonial Manor
  {
    slug: 'nilgiri-blue-mountain-colonial-manor-ooty',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80',
      alt: 'Nilgiri Blue Mountain Manor - English Gabled Country House',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
        caption: 'Sloping Gabled Master Suite with Cozy Fireplace',
      },
      {
        url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
        caption: 'Bay Window High Tea Sitting Room facing Pine Forest',
      },
      {
        url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
        caption: 'Victorian Freestanding Tub with Cedar Wood Wainscoting',
      },
      {
        url: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
        caption: 'Stone Garden Verandah facing Rolling Nilgiri Downs',
      },
      {
        url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
        caption: 'Glass Conservatory Dining Hall with Rose Gardens',
      },
      {
        url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
        caption: 'Twilight Evening Bonfire on Manor Lawns',
      },
    ],
  },

  // 18. Shimla - The Mall Road Heritage Villa & Mountain View
  {
    slug: 'the-mall-road-heritage-villa-shimla',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=80',
      alt: 'The Mall Road Heritage Villa - British Colonial Deodar Ridge',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
        caption: 'Victorian Ridgeview Suite with Cast-Iron Heater',
      },
      {
        url: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80',
        caption: 'Deodar Pine Forest Sunroom & Reading Armchair',
      },
      {
        url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
        caption: 'Snow Peak Panoramic Verandah Balcony',
      },
      {
        url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=80',
        caption: 'Granite En-Suite Bath with Mountain Pine Windows',
      },
      {
        url: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
        caption: 'Promenade View overlooking Historic Christ Church Ridge',
      },
      {
        url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80',
        caption: 'Alpine Cedar Sauna with Snow Vista',
      },
    ],
  },

  // 19. Darjeeling - Kanchenjunga Alpine Tea Estate Retreat
  {
    slug: 'kanchenjunga-alpine-tea-estate-darjeeling',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80',
      alt: 'Kanchenjunga Alpine Retreat - Planter Bungalow facing Himalayan Range',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
        caption: 'Kanchenjunga Master Suite with Tibetan Tapestries',
      },
      {
        url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
        caption: 'Solid Burma Teak Bed with Backlit Ambient Glow',
      },
      {
        url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
        caption: 'Planter Fireplace Drawing Room with Darjeeling First Flush',
      },
      {
        url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        caption: 'Verandah Balcony facing Golden Snow Peak Sunrises',
      },
      {
        url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
        caption: 'Antique Brass Bathtub looking out over Mountain Mist',
      },
      {
        url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
        caption: 'Historic Estate Lawn under Himalayan Blue Skies',
      },
    ],
  },

  // 20. Jodhpur - Mehrangarh Desert Oasis Haveli & Spa
  {
    slug: 'mehrangarh-desert-oasis-haveli-jodhpur',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1400&q=80',
      alt: 'Mehrangarh Desert Oasis - Golden Sandstone Haveli facing Fort',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        caption: 'Marwar Royal Diwan with Silk Cushions & Silver Hookahs',
      },
      {
        url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
        caption: 'Fort-Facing Chamber with Hand-Carved Jodhpur Jali',
      },
      {
        url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
        caption: 'Stepwell Oasis Courtyard Pool with Brass Lanterns',
      },
      {
        url: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=1200&q=80',
        caption: 'Desert Sandstone Hammam Bath with Copper Vessels',
      },
      {
        url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        caption: 'Rooftop Dining with Panoramic View of Mehrangarh Fort',
      },
      {
        url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        caption: 'Twilight Blue City Glow from the Haveli Terrace',
      },
    ],
  },

  // 21. Pondicherry - French Quarter Colonial Promenade Villa
  {
    slug: 'french-quarter-colonial-villa-pondicherry',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=80',
      alt: 'French Quarter Colonial Villa - White Town Ochre Balconies',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
        caption: 'Beach Promenade Verandah with Fresh Sea Breeze',
      },
      {
        url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
        caption: 'High-Ceilinged French Colonial Chamber & Four-Poster Bed',
      },
      {
        url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
        caption: 'Bougainvillea-Draped Cobblestone Courtyard & Bistro',
      },
      {
        url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
        caption: 'Handmade Encaustic Patterned Tile Bathroom',
      },
      {
        url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        caption: 'Courtyard Plunge Pool surrounded by Frangipani Trees',
      },
      {
        url: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
        caption: 'Sunset Roof Deck facing the Coromandel Sea',
      },
    ],
  },

  // 22. Alleppey - Kerala Backwaters Floating Villa & Palms Resort
  {
    slug: 'kerala-backwaters-floating-villa-alleppey',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1400&q=80',
      alt: 'Kerala Backwaters Palms - Serene Lagoon Waterways & Infinity Pool',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        caption: 'Private Waterfront Verandah with Floating Daybed',
      },
      {
        url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
        caption: 'Teak Kettuvallam Suite with Panoramic Waterway Views',
      },
      {
        url: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
        caption: 'Natural Lotus Lagoon Deck with Swaying Coconut Palms',
      },
      {
        url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80',
        caption: 'Ayurvedic Herbal Treatment Sanctuary on Lagoon',
      },
      {
        url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=80',
        caption: 'Open-Air Tropical Rain Shower amidst Bamboo Groves',
      },
      {
        url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        caption: 'Sunset Canoe Jetty lit with Traditional Oil Torches',
      },
    ],
  },

  // 23. Mussoorie - Queen of Hills Mist Valley Manor & Chalets
  {
    slug: 'queen-of-hills-mist-valley-mussoorie',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=80',
      alt: 'Queen of Hills Mist Valley - Cliffside Mountain Manor & Deodars',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
        caption: 'Valley Horizon Chalet Suite with Timber Flooring',
      },
      {
        url: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80',
        caption: 'Glass Conservatory Lounge facing Twinkling Doon Valley',
      },
      {
        url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
        caption: 'Sunset Viewing Terrace with Floating Clouds',
      },
      {
        url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80',
        caption: 'Heated Cliffside Cedar Jacuzzi facing Himalayan Ridges',
      },
      {
        url: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
        caption: 'Starlit Evening Campfire Lawn on Mountain Edge',
      },
      {
        url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        caption: 'Chalet Illumination with Winterline Horizon Lights',
      },
    ],
  },

  // 24. Pune - Koregaon Park Contemporary Boutique Hotel
  {
    slug: 'koregaon-park-contemporary-boutique-pune',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80',
      alt: 'Koregaon Park Boutique - Modern Architectural Oasis & Lush Trees',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
        caption: 'Art Deco Designer Suite with Custom Oak Millwork',
      },
      {
        url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
        caption: 'Botanical Treehouse Lounge & Artisan Cocktail Terrace',
      },
      {
        url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80',
        caption: 'Italian Terrazzo Walk-In Shower with Rain Feature',
      },
      {
        url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        caption: 'Rooftop Sunken Pool & Minimalist Zen Garden',
      },
      {
        url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
        caption: 'Curated Studio Living Room with Contemporary Art',
      },
      {
        url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80',
        caption: 'Swedish Sauna & Cold Plunge Wellness Sanctuary',
      },
    ],
  },

  // 25. Ahmedabad - Sabarmati Waterfront Heritage & Business Hotel
  {
    slug: 'sabarmati-waterfront-heritage-hotel-ahmedabad',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80',
      alt: 'Sabarmati Waterfront - Stepwell-Inspired Sandstone River Hotel',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        caption: 'Geometric Jali Lattice Grand Atrium with Water Bodies',
      },
      {
        url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
        caption: 'Riverfront Executive King Suite with City Horizon',
      },
      {
        url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
        caption: 'Gujarati Heritage Brass & Textile Art Lounge',
      },
      {
        url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
        caption: 'Polished Makrana Marble Bath with Soaking Tub',
      },
      {
        url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
        caption: 'River Promenade Sunset Terrace Dining',
      },
      {
        url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        caption: 'Architectural Riverfront Illumination at Night',
      },
    ],
  },

  // 26. Lucknow - Awadh Royal Nawabi Palace & Residency
  {
    slug: 'awadh-royal-nawabi-palace-lucknow',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
      alt: 'Awadh Royal Nawabi Palace - Lakhnawi Arched Court & Marble Lawns',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
        caption: 'Royal Awadh Suite with Chikankari Drapes & Silk Pillows',
      },
      {
        url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
        caption: 'Maharaja Canopy Bed with Ambient Brass Sconces',
      },
      {
        url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
        caption: 'Nawabi Courtyard with Glistening Marble Fountains',
      },
      {
        url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
        caption: 'Royal Marble Hammam Bath with Scented Attar Soaks',
      },
      {
        url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        caption: 'Dastarkhwan Fine Dining Hall for Authentic Awadhi Kebabs',
      },
      {
        url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
        caption: 'Palace Turrets lit under Evening Starlit Sky',
      },
    ],
  },
];

async function updateAllHotelPhotos() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not found in env');

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database connection failed');

  const hotelsCollection = db.collection('hotels');
  console.log(`Starting luxury photo update for ${LUXURY_HOTEL_PHOTOS.length} hotels...`);

  let updatedCount = 0;

  for (const set of LUXURY_HOTEL_PHOTOS) {
    const formattedImages = set.images.map((img) => ({
      url: img.url,
      caption: img.caption,
      isPrimary: false,
    }));

    const result = await hotelsCollection.updateOne(
      { slug: set.slug },
      {
        $set: {
          coverImage: {
            url: set.coverImage.url,
            alt: set.coverImage.alt,
          },
          images: formattedImages,
        },
      }
    );

    if (result.matchedCount > 0) {
      updatedCount++;
      console.log(`✓ Updated [${set.slug}]: 1 cover + ${formattedImages.length} luxury photos`);
    } else {
      console.warn(`! Hotel not found for slug: ${set.slug}`);
    }
  }

  console.log(`\n🎉 Successfully updated ${updatedCount} hotels with high-resolution luxury photos!`);
  await mongoose.disconnect();
  process.exit(0);
}

updateAllHotelPhotos().catch((err) => {
  console.error('Update failed:', err);
  process.exit(1);
});

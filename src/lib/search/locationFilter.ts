/**
 * Intelligent location search filter & ranking helper for IndiStay.
 * Handles single cities, composite titles ("Amritsar, Punjab, India"),
 * landmarks ("Golden Temple, Amritsar"), regions ("Delhi NCR", "South Goa"),
 * and freeform multi-word search queries.
 */

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const NOISE_WORDS = new Set([
  'india', 'hotel', 'hotels', 'resort', 'resorts', 'stay', 'stays', 
  'the', 'in', 'near', 'at', 'and', 'of', 'city', 'state', 'district'
]);

export const KNOWN_INDIAN_CITIES = [
  'amritsar', 'ambala', 'goa', 'jaipur', 'udaipur', 'mumbai', 'delhi', 
  'manali', 'shimla', 'chandigarh', 'rishikesh', 'varanasi', 'hyderabad',
  'bengaluru', 'bangalore', 'chennai', 'kolkata', 'pune', 'ahmedabad', 
  'lucknow', 'agra', 'kochi', 'munnar', 'ooty', 'darjeeling', 'jodhpur', 
  'pondicherry', 'alleppey', 'mussoorie', 'ayodhya', 'gurugram', 'gurgaon',
  'noida', 'haridwar', 'ludhiana', 'jalandhar', 'patna', 'bhopal', 'indore', 'srinagar'
];

export interface LocationSearchResult {
  filter: Record<string, unknown>;
  primaryDisplayCity: string;
  identifiedCity: string | null;
  terms: string[];
}

export function buildLocationSearchFilter(cityQuery?: string): LocationSearchResult {
  if (!cityQuery || typeof cityQuery !== 'string') {
    return { filter: {}, primaryDisplayCity: '', identifiedCity: null, terms: [] };
  }

  const raw = cityQuery.trim();
  if (!raw) {
    return { filter: {}, primaryDisplayCity: '', identifiedCity: null, terms: [] };
  }

  const rawLower = raw.toLowerCase();

  // 1. Identify if a known city is contained in query
  let identifiedCity: string | null = null;
  for (const kc of KNOWN_INDIAN_CITIES) {
    const regex = new RegExp(`\\b${escapeRegex(kc)}\\b`, 'i');
    if (regex.test(rawLower)) {
      identifiedCity = kc;
      break;
    }
  }

  // 2. Extract clean comma segments
  const segments = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !NOISE_WORDS.has(s.toLowerCase()));

  // 3. Extract word tokens
  const words = raw
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !NOISE_WORDS.has(w));

  // Determine user-friendly title name
  const primaryDisplayCity = identifiedCity
    ? identifiedCity.charAt(0).toUpperCase() + identifiedCity.slice(1)
    : segments[0] || raw;

  // If a known city was found (e.g. "Amritsar", "Delhi", "Goa", "Jaipur", "Ambala"):
  // Target hotels in that city strictly so all hotels of that city are returned!
  if (identifiedCity) {
    const cityRegex = new RegExp(`^${escapeRegex(identifiedCity)}$`, 'i');
    return {
      filter: { city: { $regex: cityRegex } },
      identifiedCity,
      primaryDisplayCity,
      terms: [identifiedCity, ...segments, ...words],
    };
  }

  // Fallback for states (e.g. "Rajasthan", "Kerala", "Punjab") or general keywords:
  const candidateTerms = Array.from(new Set([raw, ...segments, ...words])).filter(Boolean);
  const orClauses: Record<string, unknown>[] = [];

  for (const term of candidateTerms) {
    const regex = new RegExp(escapeRegex(term), 'i');
    orClauses.push(
      { city: { $regex: regex } },
      { locality: { $regex: regex } },
      { state: { $regex: regex } },
      { name: { $regex: regex } },
      { address: { $regex: regex } }
    );
  }

  return {
    filter: orClauses.length > 0 ? { $or: orClauses } : {},
    identifiedCity: null,
    primaryDisplayCity,
    terms: candidateTerms,
  };
}

/**
 * Ranks search results so exact city & locality matches appear first.
 */
export function rankHotelsBySearchRelevance<
  T extends { city?: string; locality?: string; name?: string; state?: string }
>(hotels: T[], cityQuery?: string): T[] {
  if (!cityQuery || hotels.length <= 1) return hotels;

  const rawLower = cityQuery.trim().toLowerCase();

  return [...hotels].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    const cityA = (a.city || '').toLowerCase();
    const cityB = (b.city || '').toLowerCase();
    const locA = (a.locality || '').toLowerCase();
    const locB = (b.locality || '').toLowerCase();
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();

    // Exact city match
    if (rawLower.includes(cityA) && cityA) scoreA += 100;
    if (rawLower.includes(cityB) && cityB) scoreB += 100;

    // Locality match
    if (rawLower.includes(locA) && locA) scoreA += 50;
    if (rawLower.includes(locB) && locB) scoreB += 50;

    // Hotel name match
    if (rawLower.includes(nameA) && nameA) scoreA += 40;
    if (rawLower.includes(nameB) && nameB) scoreB += 40;

    return scoreB - scoreA;
  });
}

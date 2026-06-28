/* ============================================================
   ESTATEAI — SAMPLE DATA
   ============================================================ */

const CITIES = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Pune', 'Chennai', 'Delhi NCR', 'Kolkata', 'Ahmedabad'];

const LOCALITIES = {
  'Hyderabad': ['Gachibowli', 'Madhapur', 'Kondapur', 'Banjara Hills'],
  'Bengaluru': ['Whitefield', 'Indiranagar', 'Koramangala', 'Electronic City'],
  'Mumbai': ['Andheri', 'Powai', 'Bandra', 'Thane'],
  'Pune': ['Hinjewadi', 'Kothrud', 'Viman Nagar', 'Baner'],
  'Chennai': ['OMR', 'Velachery', 'Anna Nagar', 'T. Nagar'],
  'Delhi NCR': ['Gurugram', 'Noida', 'Dwarka', 'Rohini'],
  'Kolkata': ['Salt Lake', 'New Town', 'Ballygunge', 'Howrah'],
  'Ahmedabad': ['Satellite', 'Bopal', 'Vastrapur', 'Maninagar'],
};

const PROPERTY_TYPES = ['Apartment', 'Independent House', 'Villa', 'Studio', 'Penthouse'];
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Needs Renovation'];

// Seeded pseudo-random generator for stable "realistic" numbers across reloads
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateSampleHistory(count) {
  const rand = seededRandom(42);
  const records = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const city = CITIES[Math.floor(rand() * CITIES.length)];
    const localities = LOCALITIES[city];
    const locality = localities[Math.floor(rand() * localities.length)];
    const area = Math.round(700 + rand() * 2800);
    const bedrooms = 1 + Math.floor(rand() * 5);
    const bathrooms = Math.max(1, bedrooms - Math.floor(rand() * 2));
    const age = Math.floor(rand() * 30);
    const price = Math.round((area * (3200 + rand() * 6500)) / 100000) / 10; // in lakhs

    records.push({
      id: 'PR' + (1000 + i),
      city, locality,
      propertyType: PROPERTY_TYPES[Math.floor(rand() * PROPERTY_TYPES.length)],
      area, bedrooms, bathrooms, age,
      price: price,
      confidence: Math.round(70 + rand() * 28),
      daysAgo: Math.floor(rand() * 60),
      timestamp: now - Math.floor(rand() * 60) * 86400000,
    });
  }
  return records.sort((a, b) => b.timestamp - a.timestamp);
}

const SAMPLE_HISTORY = generateSampleHistory(24);

const MARKET_TRENDS = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  avgPrice: [52, 53.5, 54, 56, 58, 57.5, 59, 61, 63, 64.5, 66, 68],
};

const POPULAR_LOCATIONS = [
  { name: 'Gachibowli, Hyderabad', growth: 14.2, avgPrice: 78 },
  { name: 'Whitefield, Bengaluru', growth: 11.8, avgPrice: 92 },
  { name: 'Hinjewadi, Pune', growth: 16.5, avgPrice: 65 },
  { name: 'OMR, Chennai', growth: 9.4, avgPrice: 58 },
  { name: 'Gurugram, Delhi NCR', growth: 12.1, avgPrice: 110 },
  { name: 'New Town, Kolkata', growth: 13.7, avgPrice: 49 },
];

const SAMPLE_PROPERTY_FORM = {
  bedrooms: 3, bathrooms: 2, area: 1450, floors: 2, age: 5, garage: 1,
  crimeRate: 4, propertyTax: 280, distance: 4.5, highwayAccess: 7,
  areaIncome: 12, schoolsRating: 4, hospitalsRating: 4, transportRating: 4,
  condition: 'Good', propertyType: 'Apartment', city: 'Hyderabad', locality: 'Gachibowli', zip: '500032',
};

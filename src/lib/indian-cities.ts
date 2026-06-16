// Top 100 Indian cities for location autocomplete (no API needed).
export const INDIAN_CITIES: string[] = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata",
  "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane",
  "Bhopal", "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra",
  "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan", "Vasai", "Varanasi",
  "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai", "Allahabad",
  "Ranchi", "Howrah", "Coimbatore", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur",
  "Madurai", "Raipur", "Kota", "Guwahati", "Chandigarh", "Solapur", "Hubli",
  "Mysuru", "Tiruchirappalli", "Bareilly", "Aligarh", "Tiruppur", "Gurgaon",
  "Moradabad", "Jalandhar", "Bhubaneswar", "Salem", "Warangal", "Mira-Bhayandar",
  "Thiruvananthapuram", "Bhiwandi", "Saharanpur", "Guntur", "Amravati", "Bikaner",
  "Noida", "Jamshedpur", "Bhilai", "Cuttack", "Firozabad", "Kochi", "Nellore",
  "Bhavnagar", "Dehradun", "Durgapur", "Asansol", "Rourkela", "Nanded", "Kolhapur",
  "Ajmer", "Akola", "Gulbarga", "Jamnagar", "Ujjain", "Loni", "Siliguri", "Jhansi",
  "Ulhasnagar", "Jammu", "Sangli", "Mangaluru", "Erode", "Belgaum", "Ambattur",
  "Tirunelveli", "Malegaon", "Gaya", "Udaipur", "Tirupati", "Karimnagar",
];

export function searchCities(query: string, limit = 8): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return INDIAN_CITIES.slice(0, limit);
  const starts: string[] = [];
  const contains: string[] = [];
  for (const c of INDIAN_CITIES) {
    const lc = c.toLowerCase();
    if (lc.startsWith(q)) starts.push(c);
    else if (lc.includes(q)) contains.push(c);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}

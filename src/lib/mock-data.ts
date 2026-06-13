// Mock data for LocalConnect MVP

export type Category = {
  slug: string;
  name: string;
  emoji: string;
  tint: string; // tailwind bg-* color class
};

export const categories: Category[] = [
  { slug: "ac-repair", name: "AC Repair", emoji: "❄️", tint: "bg-blue-100" },
  { slug: "electrician", name: "Electrician", emoji: "⚡", tint: "bg-yellow-100" },
  { slug: "plumber", name: "Plumber", emoji: "🔧", tint: "bg-indigo-100" },
  { slug: "mechanic", name: "Mechanic", emoji: "⚙️", tint: "bg-orange-100" },
  { slug: "carpenter", name: "Carpenter", emoji: "🪑", tint: "bg-amber-100" },
  { slug: "painter", name: "Painter", emoji: "🎨", tint: "bg-pink-100" },
  { slug: "mobile-repair", name: "Mobile Repair", emoji: "📱", tint: "bg-purple-100" },
  { slug: "cleaning", name: "Cleaning", emoji: "🧹", tint: "bg-emerald-100" },
  { slug: "ro-service", name: "RO Service", emoji: "💧", tint: "bg-cyan-100" },
  { slug: "appliance", name: "Appliance", emoji: "🔌", tint: "bg-rose-100" },
  { slug: "car-repair", name: "Car Repair", emoji: "🚗", tint: "bg-red-100" },
  { slug: "bike-repair", name: "Bike Repair", emoji: "🏍️", tint: "bg-violet-100" },
];

export type Worker = {
  id: string;
  name: string;
  category: string; // slug
  trade: string;
  distanceKm: number;
  rating: number;
  reviews: number;
  startingPrice: number;
  experience: number;
  area: string;
  premium: boolean;
  verified: boolean;
  approvalStatus: "approved" | "pending" | "rejected";
  available?: boolean; // defaults to true when omitted
  bio: string;
  initials: string;
  tint: string;
};

export const workers: Worker[] = [
  {
    id: "w1",
    name: "Amit Kumar",
    category: "ac-repair",
    trade: "AC Repair Specialist",
    distanceKm: 0.6,
    rating: 4.9,
    reviews: 152,
    startingPrice: 249,
    experience: 10,
    area: "Civil Lines",
    premium: true,
    verified: true,
    approvalStatus: "approved",
    bio: "Specialized in split AC installation, gas refill and full servicing. Same-day visits available.",
    initials: "AK",
    tint: "bg-blue-200",
  },
  {
    id: "w2",
    name: "Prakash Verma",
    category: "carpenter",
    trade: "Carpenter & Woodworks",
    distanceKm: 1.2,
    rating: 4.7,
    reviews: 89,
    startingPrice: 199,
    experience: 8,
    area: "Sadar Bazaar",
    premium: true,
    verified: true,
    approvalStatus: "approved",
    bio: "Furniture repair, modular kitchens, almirah and door work.",
    initials: "PV",
    tint: "bg-amber-200",
  },
  {
    id: "w3",
    name: "Rajesh Yadav",
    category: "bike-repair",
    trade: "Two-Wheeler Mechanic",
    distanceKm: 0.8,
    rating: 4.8,
    reviews: 64,
    startingPrice: 150,
    experience: 6,
    area: "Station Road",
    premium: false,
    verified: true,
    approvalStatus: "approved",
    bio: "Bike servicing at your doorstep. Engine work, puncture, oil change.",
    initials: "RY",
    tint: "bg-violet-200",
  },
  {
    id: "w4",
    name: "Sunita Devi",
    category: "cleaning",
    trade: "Home Deep Cleaning",
    distanceKm: 1.4,
    rating: 4.9,
    reviews: 211,
    startingPrice: 399,
    experience: 5,
    area: "Model Town",
    premium: true,
    verified: true,
    approvalStatus: "approved",
    bio: "Deep cleaning, bathroom and kitchen sanitization. Team of 2.",
    initials: "SD",
    tint: "bg-emerald-200",
  },
  {
    id: "w5",
    name: "Mohan Singh",
    category: "electrician",
    trade: "Licensed Electrician",
    distanceKm: 2.1,
    rating: 4.6,
    reviews: 41,
    startingPrice: 149,
    experience: 12,
    area: "Gandhi Nagar",
    premium: false,
    verified: true,
    approvalStatus: "approved",
    bio: "Wiring, switchboards, fan repair, MCB issues — quick fixes.",
    initials: "MS",
    tint: "bg-yellow-200",
  },
  {
    id: "w6",
    name: "Imran Khan",
    category: "mobile-repair",
    trade: "Mobile Display & Battery",
    distanceKm: 1.5,
    rating: 4.5,
    reviews: 73,
    startingPrice: 99,
    experience: 4,
    area: "Main Market",
    premium: false,
    verified: false,
    approvalStatus: "pending",
    bio: "Display replacement, battery, charging port for all brands.",
    initials: "IK",
    tint: "bg-purple-200",
  },
  {
    id: "w7",
    name: "Suresh Plumber",
    category: "plumber",
    trade: "Expert Plumber",
    distanceKm: 0.9,
    rating: 4.7,
    reviews: 118,
    startingPrice: 199,
    experience: 9,
    area: "New Colony",
    premium: false,
    verified: true,
    approvalStatus: "approved",
    bio: "Pipe leakage, tap installation, bathroom fittings.",
    initials: "SP",
    tint: "bg-indigo-200",
  },
];

export type BookingStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled";

export type Booking = {
  id: string;
  workerId: string;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  description: string;
  date: string;
  time: string;
  status: BookingStatus;
  amount: number;
};

export const bookings: Booking[] = [
  {
    id: "b1",
    workerId: "w5",
    customerName: "Rahul Sharma",
    customerMobile: "+91 98765 43210",
    customerAddress: "House 12, Civil Lines, Jabalpur",
    description: "Ceiling fan making noise, need quick fix.",
    date: "2026-06-10",
    time: "10:30 AM",
    status: "completed",
    amount: 250,
  },
  {
    id: "b2",
    workerId: "w1",
    customerName: "Rahul Sharma",
    customerMobile: "+91 98765 43210",
    customerAddress: "House 12, Civil Lines, Jabalpur",
    description: "Split AC not cooling, gas refill needed.",
    date: "2026-06-12",
    time: "4:00 PM",
    status: "accepted",
    amount: 499,
  },
  {
    id: "b3",
    workerId: "w4",
    customerName: "Neha Gupta",
    customerMobile: "+91 91234 56789",
    customerAddress: "Flat 3B, Model Town",
    description: "Full home deep cleaning, 2 BHK.",
    date: "2026-06-15",
    time: "9:00 AM",
    status: "pending",
    amount: 1299,
  },
  {
    id: "b4",
    workerId: "w2",
    customerName: "Vikas Jain",
    customerMobile: "+91 99887 76655",
    customerAddress: "Shop 4, Sadar Bazaar",
    description: "Almirah door needs repair.",
    date: "2026-06-11",
    time: "11:00 AM",
    status: "in_progress",
    amount: 350,
  },
];

export type Review = {
  id: string;
  workerId: string;
  customerName: string;
  rating: number;
  text: string;
  date: string;
};

export const reviews: Review[] = [
  {
    id: "r1",
    workerId: "w1",
    customerName: "Rahul S.",
    rating: 5,
    text: "Same-day visit, very polite and fixed the AC quickly. Recommended!",
    date: "2 days ago",
  },
  {
    id: "r2",
    workerId: "w1",
    customerName: "Priya K.",
    rating: 5,
    text: "Honest pricing and professional work.",
    date: "1 week ago",
  },
  {
    id: "r3",
    workerId: "w2",
    customerName: "Vikas J.",
    rating: 4,
    text: "Good carpentry work, slightly delayed but quality was great.",
    date: "3 days ago",
  },
];

export type Message = {
  id: string;
  fromMe: boolean;
  text: string;
  time: string;
};

export const chatThreads = [
  {
    workerId: "w1",
    lastMessage: "I'll be there by 4 PM today.",
    time: "10:42 AM",
    unread: 2,
    messages: [
      { id: "m1", fromMe: true, text: "Hi, AC is not cooling.", time: "10:30 AM" },
      { id: "m2", fromMe: false, text: "Hello sir, I can come today evening.", time: "10:35 AM" },
      { id: "m3", fromMe: true, text: "Yes please, 4 PM works?", time: "10:40 AM" },
      { id: "m4", fromMe: false, text: "I'll be there by 4 PM today.", time: "10:42 AM" },
    ] as Message[],
  },
  {
    workerId: "w2",
    lastMessage: "Done, please check.",
    time: "Yesterday",
    unread: 0,
    messages: [
      { id: "m1", fromMe: false, text: "Repair work completed.", time: "Yesterday" },
      { id: "m2", fromMe: false, text: "Done, please check.", time: "Yesterday" },
    ] as Message[],
  },
];

export const currentUser = {
  name: "Rahul Sharma",
  mobile: "+91 98765 43210",
  location: "Civil Lines, Jabalpur",
};

export const currentMember = {
  id: "w1",
  name: "Amit Kumar",
  mobile: "+91 98700 11122",
  category: "AC Repair",
  area: "Civil Lines, Jabalpur",
  plan: "Premium" as "Basic" | "Premium",
  planStatus: "Active",
  daysRemaining: 22,
  monthlyBookings: 28,
  monthlyEarnings: 14250,
  pendingRequests: 3,
};

export function workerById(id: string) {
  return workers.find((w) => w.id === id);
}
export function categoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug);
}
export function workersByCategory(slug: string) {
  return workers.filter((w) => w.category === slug && w.approvalStatus === "approved" && w.available !== false);
}
export function categorySlugFromService(service: string | null | undefined) {
  if (!service) return undefined;
  const s = service.toLowerCase();
  return categories.find((c) => s.includes(c.name.toLowerCase()) || s.includes(c.slug.replace("-", " ")))?.slug;
}

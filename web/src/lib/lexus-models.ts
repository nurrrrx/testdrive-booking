// Lexus car models data for the frontend
export interface LexusModel {
  id: string;
  slug: string;
  name: string;
  year: number;
  tagline: string;
  category: 'SUV' | 'SEDAN' | 'HYBRID' | 'PERFORMANCE';
  startingPrice: number;
  monthlyPrice?: number;
  heroImage: string;
  imagePosition?: string; // CSS object-position value for better image framing
  galleryImages: string[];
  specs: {
    engine: string;
    power: string;
    acceleration: string;
    fuelEfficiency?: string;
    range?: string;
  };
  features: string[];
  colors: { name: string; hex: string }[];
  description: string;
}

export const lexusModels: LexusModel[] = [
  {
    id: 'lx-700h-2026',
    slug: 'lx700h',
    name: 'LX 700h',
    year: 2026,
    tagline: 'The Ultimate Luxury SUV',
    category: 'SUV',
    startingPrice: 590000,
    monthlyPrice: 6833,
    heroImage: '/lx700-hero.jpeg',
    imagePosition: 'center center',
    galleryImages: [
      '/lx700-hero.jpeg',
      '/lx600-hero.jpeg',
    ],
    specs: {
      engine: '3.5L V6 Twin-Turbo Hybrid',
      power: '480 HP Combined',
      acceleration: '0-100 km/h in 5.4s',
      fuelEfficiency: '8.9 L/100km',
    },
    features: [
      'Mark Levinson Premium Audio',
      'Lexus Safety System+ 3.0',
      'Multi-Terrain Select',
      'Adaptive Variable Suspension',
      'Head-Up Display',
      'Semi-Aniline Leather Interior',
    ],
    colors: [
      { name: 'Sonic Titanium', hex: '#8B8B8B' },
      { name: 'Sonic Quartz', hex: '#F5F5F5' },
      { name: 'Black Onyx', hex: '#1A1A1A' },
      { name: 'Nori Green Pearl', hex: '#3D4D3D' },
    ],
    description: 'The flagship Lexus SUV combines uncompromising luxury with legendary off-road capability. The LX 700h features a powerful twin-turbo hybrid powertrain and the most advanced technology Lexus has ever offered.',
  },
  {
    id: 'lx-600-2025',
    slug: 'lx600',
    name: 'LX 600',
    year: 2025,
    tagline: 'Commanding Presence',
    category: 'SUV',
    startingPrice: 485000,
    monthlyPrice: 5616,
    heroImage: '/lx600-hero.jpeg',
    imagePosition: 'center 40%', // Move image up to show more of the car
    galleryImages: [
      '/lx600-hero.jpeg',
      '/lx700-hero.jpeg',
    ],
    specs: {
      engine: '3.5L V6 Twin-Turbo',
      power: '409 HP',
      acceleration: '0-100 km/h in 6.9s',
      fuelEfficiency: '12.7 L/100km',
    },
    features: [
      'Mark Levinson Premium Audio',
      'Lexus Safety System+ 2.5',
      'Multi-Terrain Select',
      'Crawl Control',
      '12.3" Touchscreen Display',
      'Premium Leather Interior',
    ],
    colors: [
      { name: 'Sonic Titanium', hex: '#8B8B8B' },
      { name: 'Sonic Quartz', hex: '#F5F5F5' },
      { name: 'Black Onyx', hex: '#1A1A1A' },
      { name: 'Deep Blue Mica', hex: '#1C3A5F' },
    ],
    description: 'The LX 600 delivers exceptional power and presence with its twin-turbo V6 engine. Experience unmatched capability both on and off the road with legendary Lexus reliability.',
  },
  {
    id: 'rx-350-2025',
    slug: 'rx350',
    name: 'RX 350',
    year: 2025,
    tagline: 'Elevated Luxury',
    category: 'HYBRID',
    startingPrice: 295000,
    monthlyPrice: 3416,
    heroImage: '/rx350-hero.jpeg',
    imagePosition: 'center center',
    galleryImages: [
      '/rx350-hero.jpeg',
      '/lx600-hero.jpeg',
    ],
    specs: {
      engine: '2.4L 4-Cylinder Turbo',
      power: '275 HP',
      acceleration: '0-100 km/h in 7.5s',
      fuelEfficiency: '9.4 L/100km',
    },
    features: [
      'Lexus Interface Multimedia',
      'Digital Key',
      'Panoramic Glass Roof',
      'Wireless Charging',
      'Hands-Free Power Back Door',
      'Lexus Safety System+ 3.0',
    ],
    colors: [
      { name: 'Sonic Chrome', hex: '#C0C0C0' },
      { name: 'Matador Red Mica', hex: '#8B0000' },
      { name: 'Caviar', hex: '#2A2A2A' },
      { name: 'Cloudburst Gray', hex: '#5F5F5F' },
    ],
    description: 'The all-new RX elevates the luxury crossover segment with its bold design, innovative technology, and refined powertrain. Experience comfort and capability in perfect harmony.',
  },
  {
    id: 'rc-f-2025',
    slug: 'rcf',
    name: 'RC F',
    year: 2025,
    tagline: 'Pure Performance',
    category: 'PERFORMANCE',
    startingPrice: 425000,
    monthlyPrice: 4921,
    heroImage: '/rcf-hero.jpeg',
    imagePosition: 'center 60%', // Move image down to center the car better
    galleryImages: [
      '/rcf-hero.jpeg',
      '/lx700-hero.jpeg',
    ],
    specs: {
      engine: '5.0L V8',
      power: '472 HP',
      acceleration: '0-100 km/h in 4.5s',
      fuelEfficiency: '11.2 L/100km',
    },
    features: [
      'Track-Tuned Suspension',
      'Carbon Fiber Components',
      'Torque Vectoring Differential',
      'Launch Control',
      'Performance Brembo Brakes',
      'Alcantara Sport Seats',
    ],
    colors: [
      { name: 'Flare Yellow', hex: '#FFD700' },
      { name: 'Infrared', hex: '#FF3333' },
      { name: 'Ultra White', hex: '#FFFFFF' },
      { name: 'Obsidian', hex: '#0A0A0A' },
    ],
    description: 'The RC F is the ultimate expression of Lexus performance. With a naturally aspirated 5.0L V8 engine and precision handling, it delivers pure driving exhilaration on every journey.',
  },
];

export const getModelBySlug = (slug: string): LexusModel | undefined => {
  return lexusModels.find((model) => model.slug === slug);
};

export const getModelById = (id: string): LexusModel | undefined => {
  return lexusModels.find((model) => model.id === id);
};

export const getModelsByCategory = (category: LexusModel['category']): LexusModel[] => {
  return lexusModels.filter((model) => model.category === category);
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

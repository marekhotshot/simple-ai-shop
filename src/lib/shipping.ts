// Shipping calculation based on country and product size

export type ShippingZone = 
  | 'SK'      // Slovakia
  | 'EU'      // European Union (except SK)
  | 'ROW';    // Rest of World

export function getShippingZone(country: string): ShippingZone {
  const countryUpper = country.toUpperCase().trim();
  
  if (countryUpper === 'SK' || countryUpper === 'SLOVAKIA' || countryUpper === 'SLOVENSKO') {
    return 'SK';
  }
  
  // EU countries (excluding SK)
  const euCountries = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SI', 'ES', 'SE'
  ];
  
  if (euCountries.includes(countryUpper)) {
    return 'EU';
  }
  
  return 'ROW';
}

export type ProductSize = 'small' | 'medium' | 'large';

// Estimate product size from dimensions string (e.g., "30x30 cm")
export function estimateProductSize(sizeStr: string | null): ProductSize {
  if (!sizeStr) return 'medium'; // Default to medium if no size
  
  // Extract numbers from size string (e.g., "30x30 cm" -> [30, 30])
  const numbers = sizeStr.match(/\d+/g);
  if (!numbers || numbers.length === 0) return 'medium';
  
  // Get the largest dimension
  const maxDimension = Math.max(...numbers.map(n => parseInt(n, 10)));
  
  // Classify by max dimension (in cm)
  if (maxDimension < 20) return 'small';
  if (maxDimension <= 40) return 'medium';
  return 'large';
}

// Shipping prices in EUR cents
const SHIPPING_PRICES: Record<ShippingZone, Record<ProductSize, number>> = {
  SK: {
    small: 500,   // €5.00
    medium: 700,  // €7.00
    large: 1000,  // €10.00
  },
  EU: {
    small: 1200,  // €12.00
    medium: 1800, // €18.00
    large: 2500,  // €25.00
  },
  ROW: {
    small: 2000,  // €20.00
    medium: 3500, // €35.00
    large: 5000,  // €50.00
  },
};

export function calculateShipping(country: string, productSize: string | null): number {
  const zone = getShippingZone(country);
  const size = estimateProductSize(productSize);
  return SHIPPING_PRICES[zone][size];
}

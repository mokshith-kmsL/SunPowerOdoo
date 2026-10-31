// Warranty duration rules for each product category.
// These numbers are the number of YEARS the warranty lasts.
// Solar panels get 20 years, inverters and batteries get 2 years, etc.
export const WARRANTY_YEARS = {
  SOLAR_PANEL:        20,
  INVERTER:            2,
  BATTERY:             2,
  MOUNTING_STRUCTURE:  1,
  CHARGE_CONTROLLER:   2,
  METER:               1,
  CABLE:               0,   // No warranty tracked for cables
  CONNECTOR:           0,   // No warranty tracked for connectors
  OTHER:               1,
};

// Given a start date (delivery date) and a product category,
// calculate when the warranty expires.
// Returns null if the category has 0 years (e.g. cables).
export function calculateExpiryDate(startDate, category) {
  const years = WARRANTY_YEARS[category] ?? 1;

  if (years === 0) {
    return null; // No warranty for this category
  }

  const expiry = new Date(startDate);
  expiry.setFullYear(expiry.getFullYear() + years);
  return expiry;
}

// Check if a warranty is still active by comparing expiry date to today
export function isWarrantyActive(expiryDate) {
  return new Date(expiryDate) >= new Date();
}

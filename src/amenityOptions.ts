// Shared source of truth for amenity item pricing menus.
// Used by both the client (src/App.tsx) to render selectable items and by the
// server (server.ts) to independently recompute booking totals so prices can
// never be tampered with by trusting client-submitted values.
export type AmenityOptionItem = { name: string; price: number };
export type AmenityOptionCategory = { category: string; items: AmenityOptionItem[] };

export const AMENITY_OPTIONS: Record<string, AmenityOptionCategory[]> = {
  "Infinity Pool": [
    {
      category: "Entrance Fee",
      items: [
        { name: "Adult", price: 90 },
        { name: "Child (5yrs old & below)", price: 60 }
      ]
    },
    {
      category: "Cottages",
      items: [
        { name: "Large Tent (Max 20 pax)", price: 2500 },
        { name: "Gray Tent (Max 15 pax)", price: 2000 },
        { name: "Umbrella (Max 8 pax)", price: 500 },
        { name: "Umbrella (Near the pool)", price: 600 }
      ]
    }
  ],
  "Fine Dining": [
    {
      category: "Corkages",
      items: [
        { name: "Letchon", price: 400 },
        { name: "Letchon Belly", price: 300 }
      ]
    },
    {
      category: "Kape Rosario",
      items: [
        { name: "Espresso", price: 80 },
        { name: "Americano", price: 95 },
        { name: "Latte", price: 75 },
        { name: "Vietnamese Coffee", price: 125 },
        { name: "Spanish Latte", price: 135 },
        { name: "Caramel", price: 140 },
        { name: "Matcha", price: 140 },
        { name: "Hazelnut Latte", price: 140 },
        { name: "Vanilla", price: 140 }
      ]
    },
    {
      category: "Non-Coffee",
      items: [
        { name: "Chocolate", price: 145 },
        { name: "Matcha Latte", price: 150 },
        { name: "Blueberry Fizz", price: 125 },
        { name: "Strawberry Fizz", price: 125 },
        { name: "Green Apple", price: 125 }
      ]
    },
    {
      category: "Pizza Menu",
      items: [
        { name: "Hawaiian Pizza", price: 599 },
        { name: "Veggie Pesto Pizza", price: 599 },
        { name: "BBQ Chicken Pizza", price: 599 },
        { name: "Cheese and Bacon Pizza", price: 599 },
        { name: "Garlic Shrimp Pizza", price: 599 }
      ]
    }
  ],
  "Pavilion": [
    {
      category: "Packages",
      items: [
        { name: "Venue Rental Only", price: 11000 },
        { name: "Venue + Catering", price: 11000 }
      ]
    }
  ],
  "Colored Tent/Team Building": [
    {
      category: "Packages",
      items: [
        { name: "Venue Rental Only", price: 6000 },
        { name: "Venue + Catering", price: 11000 }
      ]
    }
  ]
};

// Computes the trusted total for an amenity booking from a { itemName: qty } selection map.
// Entrance Fee items are excluded from the price, matching existing site pricing rules
// (entrance is billed separately/onsite, not part of the online deposit).
// Unknown item names are ignored rather than trusted, so a tampered request can only ever
// lower a total by omitting items, never inflate it by inventing fake ones.
export function calculateAmenityItemsTotal(amenityName: string, selections: Record<string, number> | undefined | null): number | null {
  const options = AMENITY_OPTIONS[amenityName];
  if (!options || !selections) return null;
  let total = 0;
  let matchedAny = false;
  for (const [itemName, qtyRaw] of Object.entries(selections)) {
    const qty = Number(qtyRaw);
    if (!qty || qty <= 0) continue;
    for (const cat of options) {
      const item = cat.items.find(i => i.name === itemName);
      if (item) {
        // Recognize the item (so an entrance-fee-only selection legitimately totals
        // 0 instead of falling back to amenity.price below), but only Entrance Fee
        // items are excluded from the actual charge.
        matchedAny = true;
        if (cat.category !== 'Entrance Fee') {
          total += item.price * qty;
        }
      }
    }
  }
  return matchedAny ? total : null;
}

// Whether the booking includes a "Cottages" item (Infinity Pool tents/umbrellas), which
// are billed in full upfront rather than the usual 50% deposit. Based on the trusted
// selections map rather than substring-matching the free-text notes field, since a guest's
// own "Additional Details" text (e.g. mentioning "tent" for an unrelated reason) could
// otherwise trip a naive text search.
export function isCottageSelection(amenityName: string, selections: Record<string, number> | undefined | null): boolean {
  const cottageCategory = AMENITY_OPTIONS[amenityName]?.find(c => c.category === 'Cottages');
  if (!cottageCategory || !selections) return false;
  return Object.entries(selections).some(([itemName, qty]) => Number(qty) > 0 && cottageCategory.items.some(i => i.name === itemName));
}

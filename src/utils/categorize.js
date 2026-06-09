const CATEGORY_RULES = [
  { name: 'Abaya', patterns: [/^Abaya/i] },
  { name: 'Kurti', patterns: [/Kurti/i] },
  { name: 'Gown', patterns: [/Gown/i] },
  { name: 'Kaftan', patterns: [/Kaftan/i] },
  { name: 'Cover Up', patterns: [/Cover/i] },
  { name: 'Hijab', patterns: [/Hijab|Orti|Niqab|Chador/i] },
  { name: 'Set / Combo', patterns: [/Set|Combo|Package/i] },
  { name: 'Panjabi', patterns: [/Panjabi|Punjabi/i] },
  { name: 'Tops', patterns: [/Tops?$/i] },
  { name: 'Bottoms', patterns: [/Bottom|Skirt|Pants|Trousers|Palazzo/i] },
  { name: 'Cardigan', patterns: [/Cardigan|Kimono/i] },
];

export function categorizeProduct(productName) {
  if (!productName) return 'Other';

  for (const rule of CATEGORY_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(productName)) {
        return rule.name;
      }
    }
  }

  return 'Other';
}

export function categorizeProducts(products) {
  return products.map(p => ({
    ...p,
    category: p.category || categorizeProduct(p.name)
  }));
}

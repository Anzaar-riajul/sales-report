const MONTH_MAP = {
  'january': '01', 'february': '02', 'march': '03', 'april': '04',
  'may': '05', 'june': '06', 'july': '07', 'august': '08',
  'september': '09', 'october': '10', 'november': '11', 'december': '12',
  'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
  'jun': '06', 'jul': '07', 'aug': '08', 'sep': '09',
  'oct': '10', 'nov': '11', 'dec': '12'
};

export function parseDate(rawText) {
  const dateRegex = /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*,?\s*(\d{4})/i;
  const match = rawText.match(dateRegex);
  if (!match) return { date: null, dateString: null, dayOfWeek: null };

  const day = match[1].padStart(2, '0');
  const monthStr = match[2].toLowerCase();
  const month = MONTH_MAP[monthStr];
  const year = match[3];
  const dateString = `${year}-${month}-${day}`;

  const dayRegex = /\((Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\)/i;
  const dayMatch = rawText.match(dayRegex);
  const dayOfWeek = dayMatch ? dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1).toLowerCase() : null;

  const dateObj = dateString ? new Date(dateString + 'T00:00:00') : null;

  return { date: dateObj, dateString, dayOfWeek };
}

function parseCommaNumber(str) {
  if (!str) return 0;
  const cleaned = str.replace(/,/g, '').trim();
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

function extractNumber(pattern, text) {
  const regex = new RegExp(pattern, 'i');
  const match = text.match(regex);
  if (!match) return 0;
  return parseInt(match[1].replace(/,/g, ''), 10) || 0;
}

export function parseProductLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const cleaned = trimmed.replace(/^[\d]+[.)]\s*/, '').replace(/^[-•·]\s*/, '').trim();
  if (!cleaned) return null;

  if (/^(Regular|Customize|Total|Bismillah|Anzaar|Online|Order)/i.test(cleaned)) return null;
  if (/^Order|Product|Advance|Value/i.test(cleaned) && /\d/.test(cleaned)) return null;

  let name, quantity;

  const dashMatch = cleaned.match(/^(.+?)\s*[-–—]\s*(\d+)\s*$/);
  if (dashMatch) {
    name = dashMatch[1].trim();
    quantity = parseInt(dashMatch[2], 10);
    return { name, quantity };
  }

  const colonMatch = cleaned.match(/^(.+?):\s*(\d+)\s*$/);
  if (colonMatch) {
    name = colonMatch[1].trim();
    quantity = parseInt(colonMatch[2], 10);
    return { name, quantity };
  }

  const spaceMatch = cleaned.match(/^(.+?)\s+(\d+)\s*$/);
  if (spaceMatch) {
    name = spaceMatch[1].trim();
    quantity = parseInt(spaceMatch[2], 10);
    if (quantity < 200) return { name, quantity };
  }

  return null;
}

export function parseReport(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      date: null, dateString: null, dayOfWeek: null,
      regularOrder: 0, regularProduct: 0,
      customizeOrder: 0, customizeProduct: 0,
      totalOrder: 0, totalProduct: 0,
      totalAdvance: 0, totalOrderValue: 0,
      outstandingAmount: 0, advanceRate: 0, avgOrderValue: 0,
      products: [], rawText: rawText || ''
    };
  }

  const { date, dateString, dayOfWeek } = parseDate(rawText);

  const regularOrder = extractNumber(/(?:Regular\s*Order)[:\s]*(\d[\d,]*)/, rawText);
  const regularProduct = extractNumber(/(?:Regular\s*Product)[:\s]*(\d[\d,]*)/, rawText);
  const customizeOrder = extractNumber(/(?:Customize\s*order|Customize\s*Order)[:\s]*(\d[\d,]*)/, rawText);
  const customizeProduct = extractNumber(/(?:Customize\s*Product|Customize\s*product)[:\s]*(\d[\d,]*)/, rawText);

  const totalOrder = extractNumber(/(?:Total\s*Order)[:\s]*(\d[\d,]*)/, rawText);
  const totalProduct = extractNumber(/(?:Total\s*Product)[:\s]*(\d[\d,]*)/, rawText);

  const advanceMatch = rawText.match(/(?:Total\s*Advance)[:\s]*([\d,]+)/i);
  const totalAdvance = advanceMatch ? parseCommaNumber(advanceMatch[1]) : 0;

  const valueMatch = rawText.match(/(?:Total\s*Order\s*Value)[:\s]*([\d,]+)/i);
  const totalOrderValue = valueMatch ? parseCommaNumber(valueMatch[1]) : 0;

  const outstandingAmount = totalOrderValue - totalAdvance;
  const advanceRate = totalOrderValue > 0 ? Math.round((totalAdvance / totalOrderValue) * 100) : 0;
  const avgOrderValue = totalOrder > 0 ? Math.round(totalOrderValue / totalOrder) : 0;

  const lines = rawText.split('\n');
  const products = [];
  let inProductList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^=+/.test(trimmed)) {
      inProductList = true;
      continue;
    }

    if (!inProductList && /^\d+[.)]\s*/.test(trimmed) && /[A-Za-z]/.test(trimmed)) {
      inProductList = true;
    }

    if (inProductList) {
      const product = parseProductLine(trimmed);
      if (product) {
        const existing = products.find(p => p.name.toLowerCase() === product.name.toLowerCase());
        if (existing) {
          existing.quantity += product.quantity;
        } else {
          products.push(product);
        }
      }
    }
  }

  return {
    date, dateString, dayOfWeek,
    regularOrder, regularProduct,
    customizeOrder, customizeProduct,
    totalOrder, totalProduct,
    totalAdvance, totalOrderValue,
    outstandingAmount, advanceRate, avgOrderValue,
    products, rawText
  };
}

export function batchParsePaste(bulkText) {
  if (!bulkText || typeof bulkText !== 'string') return [];

  const datePattern = /(?:✿+\s*)?(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December),?\s+(\d{4})(?:\s*✿+)?/gi;
  const splits = [];
  let lastIndex = 0;
  let lastMatch = null;

  let match;
  while ((match = datePattern.exec(bulkText)) !== null) {
    if (lastMatch) {
      const block = bulkText.slice(lastIndex, match.index).trim();
      if (block) {
        const day = lastMatch[1].padStart(2, '0');
        const monthStr = lastMatch[2].toLowerCase();
        const year = lastMatch[3];
        const dateStr = `${year}-${MONTH_MAP[monthStr] || '01'}-${day}`;
        splits.push({ rawText: block, dateString: dateStr });
      }
    }
    lastIndex = match.index;
    lastMatch = match;
  }

  if (lastMatch) {
    const block = bulkText.slice(lastIndex).trim();
    if (block) {
      const day = lastMatch[1].padStart(2, '0');
      const monthStr = lastMatch[2].toLowerCase();
      const year = lastMatch[3];
      const dateStr = `${year}-${MONTH_MAP[monthStr] || '01'}-${day}`;
      splits.push({ rawText: block, dateString: dateStr });
    }
  }

  const results = [];
  for (const { rawText } of splits) {
    const parsed = parseReport(rawText);
    if (parsed.dateString) {
      results.push(parsed);
    }
  }

  return results;
}

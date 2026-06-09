const EXPECTED_HEADERS = ['dateString', 'regularOrder', 'customizeOrder', 'totalProduct', 'totalAdvance', 'totalOrderValue', 'products'];

export function generateCSVTemplate() {
  const headers = EXPECTED_HEADERS.join(',');
  const sampleRow = [
    '08 June 2026',
    '45',
    '23',
    '82',
    '45000',
    '125000',
    '"Abaya Classic x5, Kaftan Royal x3, Hijab Silk x2"',
  ].join(',');
  const sampleRow2 = [
    '09 June 2026',
    '38',
    '15',
    '60',
    '30000',
    '95000',
    '"Kurti Embroidered x4, Gown Maxi x2, Panjabi White x3"',
  ].join(',');
  return `${headers}\n${sampleRow}\n${sampleRow2}\n`;
}

function parseProducts(productStr) {
  if (!productStr || !productStr.trim()) return [];
  const items = productStr.split(',').map(s => s.trim()).filter(Boolean);
  return items.map(item => {
    const match = item.match(/^(.+?)\s+x?(\d+)$/i);
    if (match) {
      return { name: match[1].trim(), quantity: parseInt(match[2], 10) || 1 };
    }
    return { name: item, quantity: 1 };
  });
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCSV(csvText) {
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

  const headers = parseCSVLine(lines[0]);
  const missingHeaders = EXPECTED_HEADERS.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
  }

  const reports = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      const row = {};
      headers.forEach((h, idx) => { row[h.trim()] = values[idx] || ''; });

      const dateString = row.dateString?.trim();
      if (!dateString) { errors.push(`Row ${i + 1}: missing dateString`); continue; }

      const regularOrder = parseInt(row.regularOrder, 10) || 0;
      const customizeOrder = parseInt(row.customizeOrder, 10) || 0;
      const totalOrder = regularOrder + customizeOrder;
      const totalProduct = parseInt(row.totalProduct, 10) || 0;
      const totalAdvance = parseFloat(row.totalAdvance) || 0;
      const totalOrderValue = parseFloat(row.totalOrderValue) || 0;

      const products = parseProducts(row.products);

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const parsedDate = new Date(dateString.replace(/(\d{1,2})\s+(\w+),?\s+(\d{4})/, '$1 $2 $3'));
      const dayOfWeek = dayNames[parsedDate.getDay()] || '';

      reports.push({
        dateString,
        dayOfWeek,
        regularOrder,
        customizeOrder,
        totalOrder,
        regularProduct: 0,
        customizeProduct: 0,
        totalProduct,
        totalAdvance,
        totalOrderValue,
        outstandingAmount: totalOrderValue - totalAdvance,
        advanceRate: totalOrderValue > 0 ? Math.round((totalAdvance / totalOrderValue) * 100) : 0,
        avgOrderValue: totalOrder > 0 ? Math.round(totalOrderValue / totalOrder) : 0,
        products,
        rawText: `CSV Import: ${dateString}`,
      });
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e.message}`);
    }
  }

  return { reports, errors };
}

export function downloadCSVTemplate() {
  const csv = generateCSVTemplate();
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'anzaar-report-template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
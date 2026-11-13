import {
  AIMenuExtractionOutput,
  AIExtractedCategory,
  AIExtractedItem,
} from '@/validations/ai';

const COMMON_CATEGORY_KEYWORDS = [
  'starter',
  'starters',
  'appetizer',
  'appetizers',
  'main',
  'mains',
  'main course',
  'bread',
  'breads',
  'roti',
  'naan',
  'rice',
  'biryani',
  'beverage',
  'beverages',
  'drink',
  'drinks',
  'dessert',
  'desserts',
  'shake',
  'shakes',
  'soup',
  'soups',
  'salad',
  'salads',
  'pizza',
  'pizzas',
  'burger',
  'burgers',
  'sandwich',
  'sandwiches',
  'chinese',
  'continental',
  'tandoor',
  'tandoori',
  'curry',
  'curries',
  'thali',
  'combos',
  'snack',
  'snacks',
  'coffee',
  'tea',
  'chai',
  'cooler',
  'coolers',
  'pasta',
  'mocktail',
  'mocktails',
  'breakfast',
  'south indian',
  'north indian',
  'side',
  'sides',
];

const VEG_KEYWORDS = [
  'veg',
  'vegetarian',
  'paneer',
  'dal',
  'aloo',
  'gobi',
  'mushroom',
  'soya',
  'corn',
  'palak',
  'chana',
  'tofu',
];

const NON_VEG_KEYWORDS = [
  'non-veg',
  'non veg',
  'nonveg',
  'chicken',
  'mutton',
  'fish',
  'prawn',
  'egg',
  'keema',
  'pork',
  'beef',
  'wings',
  'salami',
  'pepperoni',
  'meat',
  'bacon',
];

const COMMON_TAGS = [
  'Spicy',
  'Chef Special',
  'Bestseller',
  'Jain',
  'Gluten-Free',
  'Signature',
  'Hot',
  'Cold',
  'Crispy',
];

/**
 * Checks if a trimmed line is a category heading.
 */
function isCategoryHeading(line: string): boolean {
  const clean = line.replace(/[:\-–—#*=_~]/g, ' ').trim();
  const lower = clean.toLowerCase();

  // If line matches known category keywords directly
  if (COMMON_CATEGORY_KEYWORDS.some((kw) => lower === kw || lower.startsWith(`${kw} `) || lower.endsWith(` ${kw}`))) {
    // Ensure it doesn't contain a clear price
    if (!/\d{2,5}/.test(line)) {
      return true;
    }
  }

  // If line ends with a colon and has no price
  if (line.trim().endsWith(':') && !/\d{2,5}/.test(line) && line.length < 40) {
    return true;
  }

  // If line is ALL UPPERCASE, short, and has no price
  if (clean.length >= 3 && clean.length <= 35 && clean === clean.toUpperCase() && !/\d{2,5}/.test(line) && /[A-Z]/.test(clean)) {
    return true;
  }

  return false;
}

/**
 * Extracts prices and variants from a line.
 */
function extractPricing(line: string): {
  pricingMode: 'single' | 'variants';
  pricePaise: number | null;
  variantPrices: Record<string, number> | null;
  cleanedLine: string;
} {
  let cleanedLine = line;

  // 1. Check for labeled variants (e.g., Half: 150, Full: 250 or Reg: 299, Lrg: 499)
  const labeledRegex = /(?:half|reg(?:ular)?|small|8"|ny)\s*[:=\-–]?\s*(?:₹|rs\.?)?\s*(\d{2,5})\s*[,|\/]?\s*(?:full|large|12"|neap(?:olitan)?)\s*[:=\-–]?\s*(?:₹|rs\.?)?\s*(\d{2,5})/i;
  const labeledMatch = line.match(labeledRegex);
  if (labeledMatch) {
    const p1 = parseInt(labeledMatch[1], 10) * 100;
    const p2 = parseInt(labeledMatch[2], 10) * 100;

    let k1 = 'Regular';
    let k2 = 'Large';
    if (/half/i.test(labeledMatch[0])) {
      k1 = 'Half';
      k2 = 'Full';
    } else if (/ny/i.test(labeledMatch[0])) {
      k1 = 'NY Style';
      k2 = 'Neapolitan';
    }

    cleanedLine = line.replace(labeledMatch[0], '').trim();
    return {
      pricingMode: 'variants',
      pricePaise: null,
      variantPrices: { [k1]: p1, [k2]: p2 },
      cleanedLine,
    };
  }

  // 2. Check for slash-separated prices (e.g. 150/250, ₹150 / ₹280, 120/200/350)
  const slashRegex = /(?:(?:₹|rs\.?|inr)\s*)?(\d{2,5})\s*[\/|]\s*(?:(?:₹|rs\.?|inr)\s*)?(\d{2,5})(?:\s*[\/|]\s*(?:(?:₹|rs\.?|inr)\s*)?(\d{2,5}))?/i;
  const slashMatch = line.match(slashRegex);
  if (slashMatch && slashMatch[1] && slashMatch[2]) {
    const p1 = parseInt(slashMatch[1], 10) * 100;
    const p2 = parseInt(slashMatch[2], 10) * 100;

    const variants: Record<string, number> = {
      'Half / Regular': p1,
      'Full / Large': p2,
    };

    if (slashMatch[3]) {
      variants['Jumbo / Family'] = parseInt(slashMatch[3], 10) * 100;
    }

    cleanedLine = line.replace(slashMatch[0], '').trim();
    return {
      pricingMode: 'variants',
      pricePaise: null,
      variantPrices: variants,
      cleanedLine,
    };
  }

  // 3. Check for single price (e.g., ₹250, 250/-, Rs. 250, 250.00, or trailing integer)
  const singleRegex = /(?:(?:₹|rs\.?|inr)\s*)?(\d{1,5}(?:\.\d{1,2})?)\s*(?:\/-|\.00)?(?:\s*$|\s+(?:veg|non-veg|\(v\)|\(nv\)))/i;
  const singleMatch = line.match(singleRegex);
  if (singleMatch && singleMatch[1]) {
    const rawVal = parseFloat(singleMatch[1]);
    if (!isNaN(rawVal) && rawVal > 0) {
      cleanedLine = line.replace(singleMatch[0], '').trim();
      return {
        pricingMode: 'single',
        pricePaise: Math.round(rawVal * 100),
        variantPrices: null,
        cleanedLine,
      };
    }
  }

  // Fallback: check trailing number at end of line (e.g. "Paneer Tikka 280")
  const trailingRegex = /\b(\d{2,5})\s*$/;
  const trailingMatch = line.match(trailingRegex);
  if (trailingMatch && trailingMatch[1]) {
    const rawVal = parseInt(trailingMatch[1], 10);
    cleanedLine = line.replace(trailingRegex, '').trim();
    return {
      pricingMode: 'single',
      pricePaise: rawVal * 100,
      variantPrices: null,
      cleanedLine,
    };
  }

  // No price detected
  return {
    pricingMode: 'single',
    pricePaise: 0,
    variantPrices: null,
    cleanedLine,
  };
}

/**
 * Determines dietary flag (isVeg) and tags from text.
 */
function extractDietaryAndTags(text: string): {
  isVeg: boolean | null;
  tags: string[];
  cleanText: string;
} {
  const lower = text.toLowerCase();
  let isVeg: boolean | null = null;
  const tags: string[] = [];

  // Check explicit markers
  if (/\b(?:\[v\]|\(v\)|\[veg\]|\(veg\)|pure\s*veg)\b/i.test(text)) {
    isVeg = true;
  } else if (/\b(?:\[nv\]|\(nv\)|\[non-?veg\]|\(non-?veg\)|non-?veg)\b/i.test(text)) {
    isVeg = false;
  } else if (NON_VEG_KEYWORDS.some((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(lower))) {
    isVeg = false;
  } else if (VEG_KEYWORDS.some((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(lower))) {
    isVeg = true;
  }

  // Extract tags
  for (const tag of COMMON_TAGS) {
    if (new RegExp(`\\b${tag}\\b`, 'i').test(lower)) {
      tags.push(tag);
    }
  }

  // Clean markers out of text
  const cleanText = text
    .replace(/\b(?:\[v\]|\(v\)|\[veg\]|\(veg\)|\[nv\]|\(nv\)|\[non-?veg\]|\(non-?veg\)|pure\s*veg)\b/gi, '')
    .trim();

  return { isVeg, tags, cleanText };
}

/**
 * Deterministically parses raw menu text (from OCR, PDF, or pasted text)
 * into categories and items.
 */
export function parseMenuText(
  rawText: string,
  sourceType: 'image' | 'pdf' | 'text' | 'csv' = 'text',
  baseConfidence: number = 0.85
): AIMenuExtractionOutput {
  const rawLines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const categories: AIExtractedCategory[] = [];
  let currentCategory: AIExtractedCategory = {
    name: 'General Menu',
    description: null,
    items: [],
  };

  let pendingItem: AIExtractedItem | null = null;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Ignore page numbers or noise like "Page 1 of 4"
    if (/^page\s+\d+(\s+of\s+\d+)?$/i.test(line) || /^[•\-—=~*]{3,}$/.test(line)) {
      continue;
    }

    // 1. Check if line is a Category Heading
    if (isCategoryHeading(line)) {
      if (pendingItem) {
        currentCategory.items.push(pendingItem);
        pendingItem = null;
      }

      if (currentCategory.items.length > 0) {
        categories.push(currentCategory);
      }

      const cleanCatName = line.replace(/[:\-–—#*=_~]/g, ' ').replace(/\s+/g, ' ').trim();
      currentCategory = {
        name: cleanCatName || 'Specialties',
        description: null,
        items: [],
      };
      continue;
    }

    // 2. Extract Price & Pricing Mode
    const pricing = extractPricing(line);

    // If a price was detected or line looks like a dish item
    if (pricing.pricePaise !== 0 || pricing.pricingMode === 'variants') {
      if (pendingItem) {
        currentCategory.items.push(pendingItem);
        pendingItem = null;
      }

      // Extract dietary flag and tags
      const { isVeg, tags, cleanText } = extractDietaryAndTags(pricing.cleanedLine);

      // Separate title and description if separated by delimiter
      let name = cleanText;
      let description: string | null = null;

      const delimiterMatch = cleanText.match(/^([^\-–|•()]+)[\-–|•]\s*(.+)$/);
      if (delimiterMatch) {
        name = delimiterMatch[1].trim();
        description = delimiterMatch[2].trim();
      } else {
        const parenMatch = cleanText.match(/^([^(]+)\(([^)]+)\)$/);
        if (parenMatch) {
          name = parenMatch[1].trim();
          description = parenMatch[2].trim();
        }
      }

      // Clean leftover dots or dashes
      name = name.replace(/[.…\-_]+$/, '').trim();

      if (name.length > 0) {
        pendingItem = {
          name,
          description: description || null,
          pricingMode: pricing.pricingMode,
          pricePaise: pricing.pricePaise,
          variantPrices: pricing.variantPrices,
          isVeg,
          tags,
          confidence: baseConfidence,
        };
      }
    } else {
      // Line has no price
      if (pendingItem && !pendingItem.description && line.length < 120 && !isCategoryHeading(line)) {
        // Line serves as description for previous item
        pendingItem.description = line.replace(/^[•\-–]\s*/, '').trim();
        currentCategory.items.push(pendingItem);
        pendingItem = null;
      } else {
        // Potentially an item with missing price (flagged with ₹0 for review)
        if (pendingItem) {
          currentCategory.items.push(pendingItem);
          pendingItem = null;
        }

        const { isVeg, tags, cleanText } = extractDietaryAndTags(line);
        const cleanName = cleanText.replace(/[.…\-_]+$/, '').trim();

        if (cleanName.length >= 3 && cleanName.length <= 60 && !/^(total|gst|tax|service charge|welcome|thank you)/i.test(cleanName)) {
          pendingItem = {
            name: cleanName,
            description: null,
            pricingMode: 'single',
            pricePaise: 0, // Flagged for review
            variantPrices: null,
            isVeg,
            tags,
            confidence: Math.max(0.4, baseConfidence - 0.3),
          };
        }
      }
    }
  }

  if (pendingItem) {
    currentCategory.items.push(pendingItem);
  }

  if (currentCategory.items.length > 0) {
    categories.push(currentCategory);
  }

  // If no categories were formed, group all items under 'Menu'
  const finalCategories = categories.length > 0 ? categories : [currentCategory];

  return {
    sourceType,
    confidence: baseConfidence,
    restaurantName: null,
    categories: finalCategories,
  };
}

/**
 * Parses CSV text flexibly supporting columns like Category, Item Name, Price, Variants, Veg/Non-Veg.
 */
export function parseMenuCsv(csvText: string): AIMenuExtractionOutput {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length < 2) {
    return parseMenuText(csvText, 'csv', 0.85);
  }

  // Parse header line
  const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(delimiter).map((h) => h.toLowerCase().replace(/['"]/g, '').trim());

  let catCol = headers.findIndex((h) => /category|section|group/i.test(h));
  let nameCol = headers.findIndex((h) => /item|name|dish|title/i.test(h));
  let priceCol = headers.findIndex((h) => /price|rate|cost|amount/i.test(h));
  let descCol = headers.findIndex((h) => /description|desc|details|ingredient/i.test(h));
  let vegCol = headers.findIndex((h) => /veg|dietary|type/i.test(h));
  let variantCol = headers.findIndex((h) => /variant|size|portion/i.test(h));

  // If standard headers not found, fallback to positional
  if (nameCol === -1) nameCol = 0;
  if (priceCol === -1) priceCol = Math.min(1, headers.length - 1);

  const categoryMap = new Map<string, AIExtractedItem[]>();

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(delimiter).map((col) => col.replace(/^["']|["']$/g, '').trim());
    if (row.length <= nameCol || !row[nameCol]) continue;

    const itemName = row[nameCol];
    const categoryName = (catCol !== -1 && row[catCol]) ? row[catCol] : 'General';
    const desc = (descCol !== -1 && row[descCol]) ? row[descCol] : null;

    // Price and variant logic
    let pricingMode: 'single' | 'variants' = 'single';
    let pricePaise: number | null = null;
    let variantPrices: Record<string, number> | null = null;

    const rawPrice = (priceCol !== -1 && row[priceCol]) ? row[priceCol] : '';
    const rawVariant = (variantCol !== -1 && row[variantCol]) ? row[variantCol] : '';

    if (rawVariant && rawVariant.includes(':')) {
      // Variant string like "Half: 150, Full: 250"
      pricingMode = 'variants';
      variantPrices = {};
      const parts = rawVariant.split(/[,|]/);
      for (const part of parts) {
        const [opt, pr] = part.split(':').map((s) => s.trim());
        const num = parseFloat(pr);
        if (opt && !isNaN(num)) {
          variantPrices[opt] = Math.round(num * 100);
        }
      }
    } else {
      const numPrice = parseFloat(rawPrice.replace(/[^\d.]/g, ''));
      if (!isNaN(numPrice) && numPrice > 0) {
        pricePaise = Math.round(numPrice * 100);
      } else {
        pricePaise = 0;
      }
    }

    // Dietary
    let isVeg: boolean | null = null;
    if (vegCol !== -1 && row[vegCol]) {
      const v = row[vegCol].toLowerCase();
      if (/^(veg|yes|true|y|vegetarian)$/i.test(v)) isVeg = true;
      else if (/^(non|nv|no|false|n|chicken|mutton|fish|egg)$/i.test(v)) isVeg = false;
    }

    if (isVeg === null) {
      const detected = extractDietaryAndTags(itemName);
      isVeg = detected.isVeg;
    }

    const item: AIExtractedItem = {
      name: itemName,
      description: desc,
      pricingMode,
      pricePaise,
      variantPrices,
      isVeg,
      tags: [],
      confidence: 0.98,
    };

    if (!categoryMap.has(categoryName)) {
      categoryMap.set(categoryName, []);
    }
    categoryMap.get(categoryName)!.push(item);
  }

  const categories: AIExtractedCategory[] = [];
  for (const [name, items] of categoryMap.entries()) {
    categories.push({ name, description: null, items });
  }

  return {
    sourceType: 'csv',
    confidence: 0.98,
    restaurantName: null,
    categories: categories.length > 0 ? categories : [{ name: 'General', description: null, items: [] }],
  };
}

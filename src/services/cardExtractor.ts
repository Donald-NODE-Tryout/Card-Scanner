import { ExtractedCardData } from '../types/card';

// -----------------------------------------------------------------------------
// LEXICONS & DICTIONARIES
// -----------------------------------------------------------------------------
const HONORIFICS = [
  'dr.', 'dr', 'doctor', 'vaidya', 'hakim', 'surgeon', 'physician',
  'er.', 'er', 'engineer', 'ar.', 'ar', 'architect',
  'adv.', 'adv', 'advocate', 'ca.', 'ca', 'cs.', 'cs', 'cma.', 'cma',
  'prof.', 'prof', 'professor', 'col.', 'capt.', 'major', 'shri', 'shree', 'smt.', 'mr.', 'mr', 'mrs.', 'mrs', 'ms.', 'ms'
];

const JOB_TITLES = [
  'founder', 'co-founder', 'ceo', 'cto', 'coo', 'cfo', 'cio', 'cmo', 'md', 'managing director', 'executive director',
  'president', 'vice president', 'vp', 'proprietor', 'prop.', 'owner', 'partner', 'managing partner', 'promoter',
  'general manager', 'gm', 'sales manager', 'marketing manager', 'project manager', 'operations manager',
  'branch manager', 'regional manager', 'zonal manager', 'plant head', 'factory manager',
  'consultant', 'senior consultant', 'advisor', 'analyst', 'developer', 'software engineer', 'civil engineer',
  'architect', 'graphic designer', 'creative director', 'advocate', 'lawyer', 'attorney',
  'sales executive', 'business development manager', 'bdm', 'accountant', 'officer', 'agent', 'executive'
];

const STREET_INDICATORS = [
  'road', 'rd.', 'rd', 'street', 'st.', 'st', 'lane', 'avenue', 'ave', 'chowk', 'rasta', 'marg', 'naka', 'circle', 'cross',
  'nagar', 'colony', 'enclave', 'vihar', 'society', 'soc.', 'apartment', 'apt', 'heights', 'residency', 'township',
  'sector', 'phase', 'block', 'plot', 'survey', 'shop', 'gala', 'office', 'suite', 'building', 'bldg', 'tower', 'complex', 'estate',
  'midc', 'gidc', 'riico', 'industrial', 'indl', 'zone', 'warehouse', 'godown',
  'opp.', 'opp', 'o/p', 'n/r', 'nr.', 'nr', 'b/h', 'bh.', 'bh', 'b/s', 'adj.', 'f/f', 'g/f', 'floor', 'flr'
];

const STATES_AND_CITIES = [
  'maharashtra', 'gujarat', 'tamil nadu', 'tamilnadu', 'karnataka', 'delhi', 'rajasthan', 'uttar pradesh', 'madhya pradesh',
  'mumbai', 'pune', 'nagpur', 'thane', 'dombivali', 'ahmedabad', 'surat', 'vadodara', 'rajkot', 'bhavnagar',
  'bengaluru', 'bangalore', 'chennai', 'coimbatore', 'hyderabad', 'kolkata', 'jaipur', 'lucknow', 'indore', 'bhopal', 'palakkad'
];

const COMMON_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'yahoo.co.in', 'outlook.com', 'hotmail.com',
  'icloud.com', 'rediffmail.com', 'protonmail.com', 'zoho.com', 'mail.com'
];

const CATEGORY_PATTERNS = [
  { category: 'Agriculture, Farming & Agro', regex: /\b(agro|agriculture|kissan|kisan|krishi|seeds|crop|farming|fertilizer|fertilizers|pesticides|organic|soil)\b/i },
  { category: 'Courier, Cargo & Logistics', regex: /\b(courier|couriers|cargo|logistics|freight|transport|shipping|express|parcel|delivery|packers|movers)\b/i },
  { category: 'Information Technology & Software', regex: /\b(software|tech|technologies|cloud|ai|digital|app|web|cyber|data|infotech|solutions|systems)\b/i },
  { category: 'Real Estate & Construction', regex: /\b(builders|developers|realtors|properties|infratech|construction|architecture|architects|housing)\b/i },
  { category: 'Healthcare & Medical', regex: /\b(hospital|clinic|doctor|dr\.|healthcare|pharmacy|dental|diagnostics|nursing|pharma|medical)\b/i },
  { category: 'Legal & Accounting', regex: /\b(advocate|lawyer|attorney|legal|tax|chartered accountant|ca\b|audit|counsel|solicitor)\b/i },
  { category: 'Finance & Insurance', regex: /\b(finance|financial|banking|insurance|wealth|investments|capital|advisory)\b/i },
  { category: 'Manufacturing & Industrial', regex: /\b(manufacturing|industries|works|engineering|fabrication|textiles|polymers|metals|machinery)\b/i },
  { category: 'Retail & Trading', regex: /\b(trading|exports|imports|store|retail|wholesale|distribution|traders|agency|agencies)\b/i },
  { category: 'Hospitality & Food', regex: /\b(hotel|resort|restaurant|cafe|catering|bakers|foods|travel|tourism)\b/i }
];

// -----------------------------------------------------------------------------
// TEXT SANITIZATION & ARTIFACT CLEANING
// -----------------------------------------------------------------------------
function sanitizeLine(line: string): string {
  if (!line) return '';
  // 1. Normalize diacritics/accents (e.g. Kíssan -> Kissan)
  let clean = line.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  // 2. Strip leading bullet points, icons, noise symbols
  clean = clean.replace(/^[•@&#*|~+\-:.\s_\\\/📍👤☎]+/, '').trim();

  // 3. Strip 1-2 char orphan lowercase/letter OCR glyph noise before a Capitalized word (e.g. "tp Royal Kissan" -> "Royal Kissan")
  clean = clean.replace(/^[a-z0-9]{1,2}\s+(?=[A-Z])/i, '').trim();

  return clean;
}

// -----------------------------------------------------------------------------
// DETERMINISTIC EXTRACTIONS
// -----------------------------------------------------------------------------
const EMAIL_REGEX = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/gi;
const URL_REGEX = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+(?:\/[^\s]*)?)/gi;
const PINCODE_REGEX = /\b[1-9][0-9]{2}\s?[0-9]{3}\b/;

function extractEmails(text: string): string[] {
  const emails: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = EMAIL_REGEX.exec(text)) !== null) {
    const email = m[0].toLowerCase();
    if (!emails.includes(email)) emails.push(email);
  }
  return emails;
}

function extractWebsites(text: string): string[] {
  const websites: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = URL_REGEX.exec(text)) !== null) {
    const raw = m[0].trim();
    if (raw.includes('@')) continue;
    const domain = raw.replace(/^https?:\/\//i, '').replace(/^www\./i, '').toLowerCase();
    if (COMMON_EMAIL_DOMAINS.some(d => domain === d || domain.startsWith(d + '/'))) continue;
    if (/\.(com|in|co|org|net|io|co\.in|biz|info|ai|ltd)/i.test(raw)) {
      const cleanUrl = raw.startsWith('http') ? raw : `www.${raw.replace(/^www\./i, '')}`;
      if (!websites.includes(cleanUrl)) websites.push(cleanUrl);
    }
  }
  return websites;
}

function extractTelecom(rawLines: string[]): { mobiles: string[]; landlines: string[]; whatsapp: string } {
  const mobiles: string[] = [];
  const landlines: string[] = [];
  let whatsapp = '';

  const phoneRegex = /(?:(?:\+|00)91[\s.-]?)?(?:\(?0\d{2,4}\)?[\s.-]?)?\d{3,5}[\s.-]?\d{3,5}/g;

  for (const line of rawLines) {
    const isExplicitWa = /(?:whatsapp|wa|w\/a)[\s.:-]/i.test(line);
    const isLandlineTagged = /(?:tel|telephone|phone|off|office|fax|landline)[\s.:-]/i.test(line);

    // Support numbers separated by slash e.g. 99875 65684/99875 65681
    const segments = line.split('/');
    for (const seg of segments) {
      let m: RegExpExecArray | null;
      while ((m = phoneRegex.exec(seg)) !== null) {
        const fullMatch = m[0].trim();
        const digits = fullMatch.replace(/[^\d]/g, '');
        const normalized = digits.replace(/^91/, '').replace(/^0/, '');

        // India 10-digit mobile detection
        if (normalized.length === 10) {
          const firstDigit = normalized[0];
          if (['6', '7', '8', '9'].includes(firstDigit) && !isLandlineTagged) {
            if (!mobiles.includes(normalized)) mobiles.push(normalized);
            if (isExplicitWa && !whatsapp) whatsapp = normalized;
          } else {
            // Local fixed-line starting with 2, 3, 4, 5
            if (!landlines.includes(fullMatch)) landlines.push(fullMatch);
          }
        } else if (digits.length >= 7 && digits.length <= 11) {
          // Fixed landlines with STD code (e.g. 0281-2465890, 022-2854XXXX)
          if (!landlines.includes(fullMatch)) landlines.push(fullMatch);
        }
      }
    }
  }

  if (!whatsapp && mobiles.length > 0) {
    whatsapp = mobiles[0];
  }

  return { mobiles, landlines, whatsapp };
}

function isAddressLine(line: string): boolean {
  const lower = line.toLowerCase();
  const hasPincode = PINCODE_REGEX.test(line);
  const hasStreetIndicator = STREET_INDICATORS.some(kw => new RegExp(`\\b${kw}\\b`, 'i').test(lower));
  const hasCityState = STATES_AND_CITIES.some(cs => new RegExp(`\\b${cs}\\b`, 'i').test(lower));

  // Regional mobile lines like "Gujarat - 7039926096" must NOT be treated as address!
  const digits = line.replace(/[^\d]/g, '');
  if (digits.length >= 10 && line.split(/[-:\s]+/).length <= 4) {
    return false;
  }

  return hasPincode || (hasStreetIndicator && (hasCityState || line.length > 15));
}

function extractDomainSlug(website?: string, email?: string): string {
  if (website) {
    const cleaned = website.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
    return cleaned.split('.')[0];
  }
  if (email) {
    const domainPart = email.split('@')[1] || '';
    if (!COMMON_EMAIL_DOMAINS.some(d => domainPart.includes(d))) {
      return domainPart.split('.')[0];
    }
  }
  return '';
}

// -----------------------------------------------------------------------------
// MAIN HYBRID EXTRACTOR
// -----------------------------------------------------------------------------
export function extractCardInfo(rawText: string): ExtractedCardData {
  if (!rawText || !rawText.trim()) {
    return {
      business_name: '',
      person_name: '',
      contact_number: '',
      landline_number: '',
      email: '',
      address: '',
      job_title: '',
      website: '',
      business_category: '',
      whatsapp_number: '',
      raw_text: '',
    };
  }

  const rawLines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const sanitizedLines = rawLines.map(sanitizeLine).filter(l => l.length > 0);

  // 1. Deterministic Extractions
  const emails = extractEmails(rawText);
  const websites = extractWebsites(rawText);
  const telecom = extractTelecom(rawLines);
  const domainSlug = extractDomainSlug(websites[0], emails[0]);

  // 2. Address Clustering & Candidate Segregation
  const addressLines: string[] = [];
  const candidateLines: string[] = [];

  for (const line of sanitizedLines) {
    if (emails.some(e => line.toLowerCase() === e) || websites.some(w => line.toLowerCase() === w.toLowerCase())) {
      continue;
    }

    // Skip regional sales numbers like "Tamilnadu - 9146395634"
    const digits = line.replace(/[^\d]/g, '');
    if (digits.length >= 10 && line.split(/[-:\s]+/).length <= 4) {
      continue;
    }

    if (isAddressLine(line)) {
      const cleanAddr = line.replace(/(?:[☎#]\s*)?(?:\+?\d{1,3}[-.\s]?)?\d{5,10}[\s.-]?\d{0,5}/g, '').trim();
      if (cleanAddr.length > 5) addressLines.push(cleanAddr);
    } else {
      candidateLines.push(line);
    }
  }

  // 3. Anchor: Job Title Detection
  let jobTitle = '';
  let jobTitleIndex = -1;

  for (let i = 0; i < candidateLines.length; i++) {
    const line = candidateLines[i];
    const lower = line.toLowerCase();
    const matched = JOB_TITLES.find(jt => new RegExp(`\\b${jt}\\b`, 'i').test(lower));
    if (matched && !jobTitle) {
      jobTitle = line;
      jobTitleIndex = i;
      break;
    }
  }

  // 4. Person Name Probabilistic Scoring
  let personName = '';
  let highestPersonScore = -999;
  let personLineIndex = -1;

  for (let i = 0; i < candidateLines.length; i++) {
    if (i === jobTitleIndex) continue;
    const line = candidateLines[i];
    const lower = line.toLowerCase();
    let score = 0;

    // Honorific indicator
    const hasHonorific = HONORIFICS.some(h => new RegExp(`^${h}\\b`, 'i').test(lower));
    if (hasHonorific) score += 50;

    // Spatial proximity to Job Title
    if (jobTitleIndex !== -1) {
      if (i === jobTitleIndex - 1) score += 45; // Directly above title
      else if (i === jobTitleIndex + 1) score += 30; // Directly below title
    }

    // Word structure: 2 to 4 capitalized words (e.g. "Natarajan Ramchandran")
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && words.every(w => /^[A-Z]/.test(w) || w.length <= 2)) {
      score += 25;
    }

    // Penalties (Street tokens, cities, digits, domains)
    if (STREET_INDICATORS.some(s => new RegExp(`\\b${s}\\b`, 'i').test(lower))) score -= 100;
    if (STATES_AND_CITIES.some(c => new RegExp(`\\b${c}\\b`, 'i').test(lower))) score -= 80;
    if (/\d/.test(line)) score -= 60;
    if (line.includes('@') || line.includes('.com') || line.includes('.in')) score -= 100;
    if (domainSlug && line.toLowerCase().replace(/[^a-z0-9]/g, '').includes(domainSlug)) score -= 50;

    if (score > highestPersonScore && score > 0) {
      highestPersonScore = score;
      personName = line;
      personLineIndex = i;
    }
  }

  // 5. Business Name Detection (Domain Cross-Correlation + Corporate Keywords)
  let businessName = '';
  let highestBizScore = -999;

  for (let i = 0; i < candidateLines.length; i++) {
    if (i === jobTitleIndex || i === personLineIndex) continue;
    const line = candidateLines[i];
    const lower = line.toLowerCase();
    const compactLine = lower.replace(/[^a-z0-9]/g, '');
    let score = 0;

    // Domain Cross-Correlation
    if (domainSlug && domainSlug.length > 3) {
      if (compactLine.includes(domainSlug) || domainSlug.includes(compactLine)) {
        score += 70;
      }
    }

    // Corporate suffix/keywords
    const corpKeywords = ['ltd', 'limited', 'pvt', 'llc', 'inc', 'corp', 'enterprises', 'solutions', 'services', 'industries', 'technologies', 'agro', 'courier'];
    if (corpKeywords.some(ck => new RegExp(`\\b${ck}\\b`, 'i').test(lower))) {
      score += 40;
    }

    if (i === 0) score += 20;

    if (/\d{5,}/.test(line)) score -= 50;
    if (HONORIFICS.some(h => new RegExp(`^${h}\\b`, 'i').test(lower))) score -= 60;

    if (score > highestBizScore && score > 0) {
      highestBizScore = score;
      businessName = line;
    }
  }

  if (!businessName) {
    const fallback = candidateLines.find((l, idx) => idx !== personLineIndex && idx !== jobTitleIndex && l.length > 2);
    if (fallback) businessName = fallback;
  }

  // 6. Industry Category Classification
  let category = 'Other';
  const cleanFullText = sanitizedLines.join(' ');
  for (const cat of CATEGORY_PATTERNS) {
    if (cat.regex.test(cleanFullText) || (domainSlug && cat.regex.test(domainSlug))) {
      category = cat.category;
      break;
    }
  }

  return {
    business_name: businessName.trim(),
    person_name: personName.trim(),
    job_title: jobTitle.trim(),
    contact_number: telecom.mobiles.join(', '),
    landline_number: telecom.landlines.join(', '),
    whatsapp_number: telecom.whatsapp,
    email: emails[0] || '',
    website: websites[0] || '',
    address: addressLines.join('\n').trim(),
    business_category: category,
    raw_text: rawText.trim(),
  };
}

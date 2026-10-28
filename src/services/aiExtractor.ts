import { ExtractedCardData } from '../types/card';
import { extractCardInfo as fallbackExtractCardInfo } from './cardExtractor';
import { GROQ_CONFIG } from '../config/constants';

const SYSTEM_PROMPT = `You are an expert NLP business card parsing engine.
Given the raw OCR text of a visiting/business card, analyze and extract structured contact details into strict JSON.

Rules:
1. "business_name": The actual company or enterprise name. Do NOT include dealership brands (like "MARUTI SUZUKI", "HONDA") or logos ("GLOBAL PARTNERS") unless it is the company itself.
2. "person_name": The actual human contact person's name (e.g. "Mohamed Sheik", "Purav", "Richard Ruan", "NITIN GUPTA", "Natarajan Ramchandran"). Do NOT mistake company names, car brands, or slogans for a person's name.
3. "job_title": The designation or role of the person (e.g. "Sales Manager", "Founder", "Director").
4. "mobile_numbers": Array of mobile phone numbers with clean formatting (e.g. ["9814008335", "6280008335"]).
5. "landline_numbers": Array of fixed-line/office telephone numbers with STD codes (e.g. ["0172-2706326"]).
6. "whatsapp_number": The primary WhatsApp number if tagged, or the primary mobile number.
7. "emails": Array of all email addresses (e.g. ["sales@h9tools.com", "sales@rkgd.in"]).
8. "websites": Array of website URLs (e.g. ["www.h9tools.com"]).
9. "address": The complete physical address. Never truncate pincodes, cities, states, or country names!
10. "pincode": The postal zip/pincode (e.g. "600066", "421302", "110006").
11. "business_category": Accurate industry categorization (e.g. "Agriculture & Farming", "Tools, Hardware & Machinery", "Automotive & Dealership", "Manufacturing & Industrial", "Courier & Logistics").
12. "business_description": Any specializations, services, or products mentioned (e.g. "Importers of Power Tools & Spares", "Deals in: Screw, Fastener, Anchor, Hand Tool, Power Tool Accessories...").

Return ONLY valid JSON matching this schema:
{
  "business_name": "string",
  "person_name": "string",
  "job_title": "string",
  "mobile_numbers": ["string"],
  "landline_numbers": ["string"],
  "whatsapp_number": "string",
  "emails": ["string"],
  "websites": ["string"],
  "address": "string",
  "pincode": "string",
  "business_category": "string",
  "business_description": "string"
}`;

/**
 * Extract structured business card information using Groq AI.
 * If offline or if the API call fails, seamlessly falls back to the local heuristic engine.
 */
export async function extractCardInfoWithAI(rawText: string): Promise<{ data: ExtractedCardData; usedAI: boolean }> {
  if (!rawText || !rawText.trim()) {
    return {
      data: fallbackExtractCardInfo(''),
      usedAI: false,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GROQ_CONFIG.TIMEOUT_MS);

    const response = await fetch(GROQ_CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_CONFIG.API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_CONFIG.MODEL,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Extract contact information from this business card OCR text:\n\n${rawText}` }
        ],
        temperature: GROQ_CONFIG.TEMPERATURE,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const json = await response.json();
      const content = json.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        const mobileList = Array.isArray(parsed.mobile_numbers) ? parsed.mobile_numbers : [];
        const landlineList = Array.isArray(parsed.landline_numbers) ? parsed.landline_numbers : [];
        const emailList = Array.isArray(parsed.emails) ? parsed.emails : [];
        const websiteList = Array.isArray(parsed.websites) ? parsed.websites : [];

        const structuredData: ExtractedCardData = {
          business_name: parsed.business_name || '',
          person_name: parsed.person_name || '',
          job_title: parsed.job_title || '',
          contact_number: mobileList.join(', '),
          mobile_numbers: mobileList,
          landline_number: landlineList.join(', '),
          landline_numbers: landlineList,
          whatsapp_number: parsed.whatsapp_number || mobileList[0] || '',
          email: emailList[0] || '',
          emails: emailList,
          website: websiteList[0] || '',
          websites: websiteList,
          address: parsed.address || '',
          pincode: parsed.pincode || '',
          business_category: parsed.business_category || 'Other',
          business_description: parsed.business_description || '',
          raw_text: rawText,
        };

        return { data: structuredData, usedAI: true };
      }
    }
  } catch (err) {
    console.warn('Groq AI extraction failed or timed out, falling back to local extractor:', err);
  }

  // Graceful fallback to local heuristic extractor
  const fallback = fallbackExtractCardInfo(rawText);
  return { data: fallback, usedAI: false };
}

/**
 * Application Constants and Default Configurations
 */

// -----------------------------------------------------------------------------
// Groq AI Configuration
// -----------------------------------------------------------------------------
export const GROQ_CONFIG = {
  API_URL: 'https://api.groq.com/openai/v1/chat/completions',
  API_KEY: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  MODEL: 'openai/gpt-oss-120b',
  TIMEOUT_MS: 12000,
  TEMPERATURE: 0.1,
};

// -----------------------------------------------------------------------------
// OCR.space API Configuration
// -----------------------------------------------------------------------------
export const OCR_CONFIG = {
  API_URL: 'https://api.ocr.space/parse/image',
  API_KEY: process.env.EXPO_PUBLIC_OCR_KEY || '',
  ENGINE: '2', // OCR Engine 2 is optimized for cards, labels, and numbers
  TIMEOUT_MS: 25000,
};

// -----------------------------------------------------------------------------
// Supabase Configuration
// -----------------------------------------------------------------------------
export const SUPABASE_CONFIG = {
  DEFAULT_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  DEFAULT_KEY: process.env.EXPO_PUBLIC_SUPABASE_KEY || '',
  TABLE_NAME: 'visiting_cards',
  BUCKET_NAME: 'card-images',
};

// -----------------------------------------------------------------------------
// AsyncStorage Keys
// -----------------------------------------------------------------------------
export const STORAGE_KEYS = {
  SUPABASE_URL: '@visiting_card_supabase_url',
  SUPABASE_KEY: '@visiting_card_supabase_anon_key',
  LOCAL_CARDS: '@visiting_cards_local',
  GOOGLE_USER_EMAIL: '@google_user_email',
  GOOGLE_USER_NAME: '@google_user_name',
};

// -----------------------------------------------------------------------------
// Common Business Categories (Standard Lexicon)
// -----------------------------------------------------------------------------
export const BUSINESS_CATEGORIES = [
  'Agriculture & Farming',
  'Automotive & Dealership',
  'Courier, Cargo & Logistics',
  'Finance, Banking & Insurance',
  'Healthcare, Medical & Pharma',
  'Hospitality, Travel & Food',
  'Information Technology & Software',
  'Legal & Accounting',
  'Manufacturing & Industrial',
  'Real Estate & Construction',
  'Retail, Wholesale & Trading',
  'Tools, Hardware & Machinery',
  'Other',
] as const;

export type BusinessCategory = typeof BUSINESS_CATEGORIES[number];

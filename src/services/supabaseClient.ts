import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VisitingCard } from '../types/card';
import { SUPABASE_CONFIG, STORAGE_KEYS } from '../config/constants';

const SUPABASE_URL_KEY = STORAGE_KEYS.SUPABASE_URL;
const SUPABASE_KEY_KEY = STORAGE_KEYS.SUPABASE_KEY;
const LOCAL_CARDS_STORAGE_KEY = STORAGE_KEYS.LOCAL_CARDS;

const DEFAULT_SUPABASE_URL = SUPABASE_CONFIG.DEFAULT_URL;
const DEFAULT_SUPABASE_KEY = SUPABASE_CONFIG.DEFAULT_KEY;

let cachedClient: SupabaseClient | null = null;

// Initial sample cards so the user can test the UI immediately
export const SAMPLE_CARDS: VisitingCard[] = [
  {
    id: 'sample-1',
    business_name: 'Apex Innovations Pvt Ltd',
    person_name: 'Rajesh Sharma',
    contact_number: '+91 98765 43210',
    whatsapp_number: '+91 98765 43210',
    email: 'rajesh.sharma@apexinno.com',
    job_title: 'Managing Director',
    business_category: 'Information Technology & Software',
    address: 'Plot 42, Cyber City, Sector 29, Gurugram, Haryana - 122002',
    website: 'www.apexinno.com',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'sample-2',
    business_name: 'CloudScale Technologies',
    person_name: 'Sarah Jenkins',
    contact_number: '+1 (555) 234-5678',
    whatsapp_number: '+1 (555) 234-5678',
    email: 'sarah.j@cloudscale.io',
    job_title: 'Chief Technology Officer',
    business_category: 'Information Technology & Software',
    address: '742 Evergreen Terrace, Suite 300, Austin, TX 78701',
    website: 'www.cloudscale.io',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

/**
 * Get configured Supabase Client, or null if credentials are not set
 */
export async function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (cachedClient) return cachedClient;

  const url = (await AsyncStorage.getItem(SUPABASE_URL_KEY)) || DEFAULT_SUPABASE_URL;
  const key = (await AsyncStorage.getItem(SUPABASE_KEY_KEY)) || DEFAULT_SUPABASE_KEY;

  if (url && key) {
    try {
      cachedClient = createClient(url, key);
      return cachedClient;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }

  return null;
}

/**
 * Save Supabase credentials to AsyncStorage
 */
export async function saveSupabaseConfig(url: string, anonKey: string): Promise<boolean> {
  try {
    await AsyncStorage.setItem(SUPABASE_URL_KEY, url.trim());
    await AsyncStorage.setItem(SUPABASE_KEY_KEY, anonKey.trim());
    cachedClient = createClient(url.trim(), anonKey.trim());
    return true;
  } catch (err) {
    console.error('Error saving Supabase config:', err);
    return false;
  }
}

/**
 * Retrieve current Supabase config
 */
export async function getSupabaseConfig(): Promise<{ url: string; anonKey: string }> {
  const url = (await AsyncStorage.getItem(SUPABASE_URL_KEY)) || DEFAULT_SUPABASE_URL;
  const anonKey = (await AsyncStorage.getItem(SUPABASE_KEY_KEY)) || DEFAULT_SUPABASE_KEY;
  return { url, anonKey };
}

/**
 * Load all cards: fetches from Supabase if connected, else from local storage
 */
export async function fetchAllCards(): Promise<VisitingCard[]> {
  const supabase = await getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('visiting_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Cache locally for offline access
        await AsyncStorage.setItem(LOCAL_CARDS_STORAGE_KEY, JSON.stringify(data));
        return data as VisitingCard[];
      }
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local storage:', err);
    }
  }

  // Fallback to local storage
  const stored = await AsyncStorage.getItem(LOCAL_CARDS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return SAMPLE_CARDS;
    }
  }

  // Initialize with sample cards if fresh install
  await AsyncStorage.setItem(LOCAL_CARDS_STORAGE_KEY, JSON.stringify(SAMPLE_CARDS));
  return SAMPLE_CARDS;
}

/**
 * Save or insert a new card
 */
export async function saveCard(card: VisitingCard): Promise<VisitingCard> {
  const newCard: VisitingCard = {
    ...card,
    id: card.id || `card_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    created_at: card.created_at || new Date().toISOString(),
  };

  const supabase = await getSupabaseClient();

  if (supabase) {
    try {
      let { data, error } = await supabase
        .from('visiting_cards')
        .insert([newCard])
        .select()
        .single();

      // If schema mismatch (e.g. unknown column 'mobile_numbers' etc.), retry with standard columns
      if (error && (error.message?.includes('column') || error.code === 'PGRST204')) {
        const { mobile_numbers, landline_numbers, emails, websites, business_description, pincode, ...coreCard } = newCard;
        const retryResult = await supabase
          .from('visiting_cards')
          .insert([coreCard])
          .select()
          .single();
        if (!retryResult.error && retryResult.data) {
          data = { ...newCard, ...(retryResult.data as VisitingCard) };
          error = null;
        }
      }

      if (!error && data) {
        // Also update local cache with full card
        const savedResult = { ...newCard, ...(data as VisitingCard) };
        await updateLocalCard(savedResult);
        return savedResult;
      }
    } catch (err) {
      console.warn('Supabase insert failed, saving locally:', err);
    }
  }

  // Save to local storage
  await updateLocalCard(newCard);
  return newCard;
}

/**
 * Delete a card by ID
 */
export async function deleteCard(cardId: string): Promise<boolean> {
  const supabase = await getSupabaseClient();

  if (supabase) {
    try {
      await supabase.from('visiting_cards').delete().eq('id', cardId);
    } catch (err) {
      console.warn('Supabase delete error:', err);
    }
  }

  // Remove from local storage
  const localCards = await getLocalCards();
  const filtered = localCards.filter(c => c.id !== cardId);
  await AsyncStorage.setItem(LOCAL_CARDS_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

async function getLocalCards(): Promise<VisitingCard[]> {
  const stored = await AsyncStorage.getItem(LOCAL_CARDS_STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

async function updateLocalCard(card: VisitingCard): Promise<void> {
  const cards = await getLocalCards();
  const existingIdx = cards.findIndex(c => c.id === card.id);
  if (existingIdx >= 0) {
    cards[existingIdx] = card;
  } else {
    cards.unshift(card);
  }
  await AsyncStorage.setItem(LOCAL_CARDS_STORAGE_KEY, JSON.stringify(cards));
}

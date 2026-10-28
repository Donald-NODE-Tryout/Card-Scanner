import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';

const GOOGLE_USER_EMAIL_KEY = STORAGE_KEYS.GOOGLE_USER_EMAIL;
const GOOGLE_USER_NAME_KEY = STORAGE_KEYS.GOOGLE_USER_NAME;

export interface GoogleUserState {
  isSignedIn: boolean;
  email?: string;
  name?: string;
}

/**
 * Get current Google Sign-In state
 */
export async function getGoogleUserState(): Promise<GoogleUserState> {
  try {
    const email = await AsyncStorage.getItem(GOOGLE_USER_EMAIL_KEY);
    const name = await AsyncStorage.getItem(GOOGLE_USER_NAME_KEY);
    if (email) {
      return { isSignedIn: true, email, name: name || email };
    }
  } catch (err) {
    console.warn('Error reading Google auth state:', err);
  }
  return { isSignedIn: false };
}

/**
 * Save Google Account sign in
 */
export async function saveGoogleUser(email: string, name?: string): Promise<void> {
  await AsyncStorage.setItem(GOOGLE_USER_EMAIL_KEY, email.trim());
  if (name) {
    await AsyncStorage.setItem(GOOGLE_USER_NAME_KEY, name.trim());
  }
}

/**
 * Sign out from Google Account
 */
export async function signOutGoogle(): Promise<void> {
  await AsyncStorage.removeItem(GOOGLE_USER_EMAIL_KEY);
  await AsyncStorage.removeItem(GOOGLE_USER_NAME_KEY);
}

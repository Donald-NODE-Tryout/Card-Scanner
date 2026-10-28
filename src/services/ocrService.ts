import { extractCardInfo } from './cardExtractor';
import { extractCardInfoWithAI } from './aiExtractor';
import { ExtractedCardData } from '../types/card';
import { OCR_CONFIG } from '../config/constants';

// Interface for OCR Result
export interface OCRResult {
  rawText: string;
  extracted: ExtractedCardData;
  source: 'groq-ai' | 'mlkit-native' | 'free-online-ocr' | 'mock-sample';
  error?: string;
}

// Pool of free community OCR keys (if one hits rate-limit, fallback to next)
const FREE_OCR_KEYS = [OCR_CONFIG.API_KEY, 'K88796853888957', 'K87899142388957', 'helloworld'];

/**
 * Recognize text from an image URI.
 * Dynamically detects if native ML Kit is available (in development build / APK),
 * or uses the fast OCR engine in Expo Go, then runs Groq AI for structured NLP extraction.
 */
export async function recognizeCardText(imageUri: string, base64Image?: string): Promise<OCRResult> {
  // 1. Try Native ML Kit (Works in EAS Build / Local APK / Prebuild)
  try {
    const mlkit = require('@react-native-ml-kit/text-recognition');
    if (mlkit && mlkit.default && typeof mlkit.default.recognize === 'function') {
      const result = await mlkit.default.recognize(imageUri);
      const rawText = result.text || '';
      if (rawText.trim()) {
        const { data, usedAI } = await extractCardInfoWithAI(rawText);
        return {
          rawText,
          extracted: data,
          source: usedAI ? 'groq-ai' : 'mlkit-native',
        };
      }
    }
  } catch (err) {
    // Native ML Kit not linked (standard in Expo Go) - proceed to cloud engine
  }

  // 2. Free OCR Engine with automatic key rotation
  if (base64Image) {
    for (const key of FREE_OCR_KEYS) {
      try {
        const formData = new FormData();
        formData.append('apikey', key);
        formData.append('base64image', `data:image/jpeg;base64,${base64Image}`);
        formData.append('language', 'eng');
        formData.append('isoverlayrequired', 'false');
        formData.append('filetype', 'JPG');
        formData.append('scale', 'true');
        formData.append('OCREngine', '2'); // Engine 2 is optimized for cards & printed text

        const response = await fetch('https://api.ocr.space/parse/image', {
          method: 'POST',
          body: formData,
        });

        const json = await response.json();

        if (json && json.ParsedResults && json.ParsedResults.length > 0) {
          const rawText = json.ParsedResults[0].ParsedText || '';
          if (rawText.trim()) {
            console.log('Successfully recognized card text:\n', rawText);
            const { data, usedAI } = await extractCardInfoWithAI(rawText);
            return {
              rawText,
              extracted: data,
              source: usedAI ? 'groq-ai' : 'free-online-ocr',
            };
          }
        } else if (json && json.ErrorMessage) {
          console.warn(`OCR Key ${key} error:`, json.ErrorMessage);
          continue;
        }
      } catch (err) {
        console.warn(`OCR attempt with key ${key} failed:`, err);
      }
    }
  }

  // 3. Fallback: Return empty extraction
  return {
    rawText: '',
    extracted: extractCardInfo(''),
    source: 'mock-sample',
    error: 'Could not read text clearly. Please try retaking the photo with brighter lighting.',
  };
}

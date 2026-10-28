import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  BackHandler,
  Alert,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { VisitingCard, ExtractedCardData } from './src/types/card';
import {
  fetchAllCards,
  deleteCard,
  getSupabaseConfig,
} from './src/services/supabaseClient';
import { ContactsView } from './src/screens/ContactsView';
import { ScanScreen } from './src/screens/ScanScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { CardDetailModal } from './src/components/CardDetailModal';
import { SupabaseConfigModal } from './src/components/SupabaseConfigModal';
import { OCRResult } from './src/services/ocrService';

type AppScreen = 'CONTACTS' | 'SCAN' | 'REVIEW';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('CONTACTS');
  const [cards, setCards] = useState<VisitingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Modals
  const [selectedCard, setSelectedCard] = useState<VisitingCard | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Scanned Card Data
  const [scannedImageUri, setScannedImageUri] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<ExtractedCardData | null>(null);
  const [scannedSource, setScannedSource] = useState('mlkit-native');

  useEffect(() => {
    loadCards();
    checkConnectionStatus();
  }, []);

  // Intercept Android hardware back button and swipe back gesture
  useEffect(() => {
    const onBackPress = () => {
      // 1. If detail modal is open, close it
      if (selectedCard) {
        setSelectedCard(null);
        return true; // handled, don't exit
      }

      // 2. If config modal is open, close it
      if (showConfigModal) {
        setShowConfigModal(false);
        return true; // handled, don't exit
      }

      // 3. If in ReviewScreen, go back to ScanScreen
      if (currentScreen === 'REVIEW') {
        setCurrentScreen('SCAN');
        return true; // handled, don't exit
      }

      // 4. If in ScanScreen, go back to ContactsView
      if (currentScreen === 'SCAN') {
        setCurrentScreen('CONTACTS');
        return true; // handled, don't exit
      }

      // 5. In ContactsView root screen: allow default Android behavior (minimize app)
      return false;
    };

    const backSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => backSubscription.remove();
  }, [currentScreen, selectedCard, showConfigModal]);

  const checkConnectionStatus = async () => {
    const config = await getSupabaseConfig();
    setIsSupabaseConnected(Boolean(config.url && config.anonKey));
  };

  const loadCards = async () => {
    try {
      const data = await fetchAllCards();
      setCards(data);
    } catch (err) {
      console.error('Error fetching cards:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    checkConnectionStatus();
    loadCards();
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await deleteCard(cardId);
      setCards(prev => prev.filter(c => c.id !== cardId));
    } catch (err) {
      Alert.alert('Error', 'Failed to delete card.');
    }
  };

  // Called when ScanScreen finishes OCR
  const handleScanComplete = (result: OCRResult, imageUri: string) => {
    setScannedImageUri(imageUri);
    setScannedData(result.extracted);
    setScannedSource(result.source);
    setCurrentScreen('REVIEW');
  };

  // Called when ReviewScreen saves card
  const handleSaveComplete = (savedCard: VisitingCard) => {
    setScannedImageUri(null);
    setScannedData(null);
    setCards(prev => [savedCard, ...prev.filter(c => c.id !== savedCard.id)]);
    setCurrentScreen('CONTACTS');
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar
        style={currentScreen === 'SCAN' ? 'light' : 'dark'}
      />

      {/* SCREEN 1: ContactsView (Visualizes Supabase cards + has single Scan Card button) */}
      {currentScreen === 'CONTACTS' ? (
        <View style={styles.safeContainer}>
          <ContactsView
            cards={cards}
            loading={loading}
            refreshing={refreshing}
            isSupabaseConnected={isSupabaseConnected}
            onRefresh={handleRefresh}
            onCardSelect={setSelectedCard}
            onCardDelete={handleDeleteCard}
            onOpenScan={() => setCurrentScreen('SCAN')}
            onOpenConfig={() => setShowConfigModal(true)}
          />
        </View>
      ) : null}

      {/* SCREEN 2: ScanScreen (Camera view ONLY, NO overlapping scan buttons) */}
      {currentScreen === 'SCAN' ? (
        <View style={StyleSheet.absoluteFill}>
          <ScanScreen
            onScanComplete={handleScanComplete}
            onCancel={() => setCurrentScreen('CONTACTS')}
          />
        </View>
      ) : null}

      {/* SCREEN 3: ReviewScreen (Review extracted info before saving) */}
      {currentScreen === 'REVIEW' && scannedData ? (
        <View style={StyleSheet.absoluteFill}>
          <ReviewScreen
            imageUri={scannedImageUri}
            initialData={scannedData}
            ocrSource={scannedSource}
            onSaveComplete={handleSaveComplete}
            onCancel={() => setCurrentScreen('SCAN')}
          />
        </View>
      ) : null}

      {/* Card Detail Modal */}
      <CardDetailModal
        card={selectedCard}
        visible={Boolean(selectedCard)}
        onClose={() => setSelectedCard(null)}
        onDelete={handleDeleteCard}
      />

      {/* Supabase Config Modal */}
      <SupabaseConfigModal
        visible={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onConfigSaved={() => {
          checkConnectionStatus();
          loadCards();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 44,
  },
});

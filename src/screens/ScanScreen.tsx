import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar as RNStatusBar,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { recognizeCardText, OCRResult } from '../services/ocrService';
import { extractCardInfo } from '../services/cardExtractor';

interface ScanScreenProps {
  onScanComplete: (result: OCRResult, imageUri: string) => void;
  onCancel: () => void;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({ onScanComplete, onCancel }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const cameraRef = useRef<CameraView | null>(null);

  // Dynamic dimensions for portrait & landscape orientation
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;

  // Standard business card aspect ratio is 3.5 : 2.0 (1.75 : 1)
  const CARD_ASPECT_RATIO = 1.75;

  let frameWidth: number;
  let frameHeight: number;

  if (isLandscape) {
    // In landscape mode, height is the constraining dimension.
    // Reserve room for header and bottom controls so borders remain completely inside screen.
    frameHeight = Math.min(Math.round(windowHeight * 0.46), 185);
    frameWidth = Math.round(frameHeight * CARD_ASPECT_RATIO);
  } else {
    // In portrait mode, width is the constraining dimension.
    frameWidth = Math.min(Math.round(windowWidth * 0.82), 320);
    frameHeight = Math.round(frameWidth / CARD_ASPECT_RATIO);
  }

  // 1. Capture photo directly from the LIVE camera view
  const handleShutterPress = async () => {
    if (processing) return;

    if (cameraRef.current) {
      try {
        setProcessing(true);
        setStatusMessage('Capturing card...');

        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: true,
        });

        if (photo && photo.uri) {
          await processCardImage(photo.uri, photo.base64);
        } else {
          setProcessing(false);
        }
      } catch (err: any) {
        console.warn('Live capture failed, trying fallback:', err);
        setProcessing(false);
        // Fallback to system camera if takePicture fails
        handleFallbackCamera();
      }
    } else {
      handleFallbackCamera();
    }
  };

  // Fallback system camera (ImagePicker)
  const handleFallbackCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        processCardImage(asset.uri, asset.base64 || undefined);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err.message || 'Unable to open camera');
    }
  };

  // 2. Pick a card image from Gallery
  const handlePickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permission Needed',
          'Gallery access is required to select card photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        processCardImage(asset.uri, asset.base64 || undefined);
      }
    } catch (err: any) {
      Alert.alert('Gallery Error', err.message || 'Unable to select photo');
    }
  };

  // 3. Instant Sample Card for quick testing without taking a photo
  const handleTestSample = () => {
    const sampleRawText = `
TECHVISION DYNAMICS PVT. LTD.
Enterprise Cloud & AI Solutions

Vikramaditya Singhania
Chief Executive Officer & Founder

Cell: +91 98200 12345, +91 98200 54321
WhatsApp: +91 98200 12345
Email: v.singhania@techvision.io
Web: www.techvision.io

Office: 12th Floor, Tower B, Horizon Tech Park,
Outer Ring Road, Bellandur, Bangalore - 560103
    `;

    const sampleUri =
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80';
    const extracted = extractCardInfo(sampleRawText);
    onScanComplete(
      {
        rawText: sampleRawText,
        extracted,
        source: 'mock-sample',
      },
      sampleUri
    );
  };

  // Run the OCR & Extractor
  const processCardImage = async (uri: string, base64?: string) => {
    setProcessing(true);
    setStatusMessage('Reading text & extracting details...');

    try {
      const ocrResult = await recognizeCardText(uri, base64);
      setProcessing(false);
      onScanComplete(ocrResult, uri);
    } catch (err: any) {
      setProcessing(false);
      Alert.alert('Extraction Error', 'Could not parse text. Opening editor manually.');
      onScanComplete(
        {
          rawText: '',
          extracted: extractCardInfo(''),
          source: 'mock-sample',
        },
        uri
      );
    }
  };

  // Handle permission request screen if camera is not granted yet
  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.permissionText}>Checking camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#6366F1" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionDesc}>
          To show the live scanner and capture visiting cards, please allow camera access.
        </Text>
        <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
          <Text style={styles.grantBtnText}>Grant Camera Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>Back to Card List</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* LIVE CAMERA PREVIEW FEED */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchEnabled}
      />

      {/* OVERLAY UI */}
      <View style={styles.overlayContainer}>
        {/* Top Header */}
        <View style={[styles.header, isLandscape && styles.headerLandscape]}>
          <TouchableOpacity onPress={onCancel} style={styles.headerBtn}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Scan Visiting Card</Text>

          <TouchableOpacity
            onPress={() => setTorchEnabled(!torchEnabled)}
            style={[styles.headerBtn, torchEnabled && styles.torchActive]}
          >
            <Ionicons
              name={torchEnabled ? 'flash' : 'flash-outline'}
              size={22}
              color={torchEnabled ? '#F59E0B' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>

        {/* Viewfinder Guide Cutout */}
        <View style={styles.viewfinderContainer}>
          <View style={[styles.cardFrame, { width: frameWidth, height: frameHeight }]}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {processing ? (
              <View style={styles.processingBox}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.processingText}>{statusMessage}</Text>
              </View>
            ) : (
              <View style={[styles.instructionBox, isLandscape && styles.instructionBoxLandscape]}>
                <Text style={styles.instructionText}>Align card inside frame</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Controls */}
        <View style={[styles.controlsSection, isLandscape && styles.controlsSectionLandscape]}>
          <TouchableOpacity
            style={[styles.sampleTestBtn, isLandscape && styles.sampleTestBtnLandscape]}
            onPress={handleTestSample}
            disabled={processing}
          >
            <Ionicons name="sparkles" size={14} color="#4F46E5" />
            <Text style={[styles.sampleTestText, isLandscape && styles.sampleTestTextLandscape]}>Try Sample Card Demo</Text>
          </TouchableOpacity>

          <View style={styles.actionButtonsRow}>
            {/* Gallery Picker */}
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handlePickFromGallery}
              disabled={processing}
            >
              <Ionicons name="images" size={24} color="#FFFFFF" />
              <Text style={styles.btnLabel}>Photo Library</Text>
            </TouchableOpacity>

            {/* Live Camera Shutter Button */}
            <TouchableOpacity
              style={styles.shutterBtn}
              onPress={handleShutterPress}
              disabled={processing}
              activeOpacity={0.8}
            >
              <View style={styles.shutterInner}>
                <Ionicons name="camera" size={30} color="#4F46E5" />
              </View>
            </TouchableOpacity>

            {/* Quick Info */}
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() =>
                Alert.alert(
                  'Card Scanner Tips',
                  '1. Hold phone steadily over the card.\n2. Align all 4 corners inside the outline.\n3. Tap the Flash icon in dim light.'
                )
              }
            >
              <Ionicons name="help-circle-outline" size={26} color="#CBD5E1" />
              <Text style={styles.btnLabel}>Help Tips</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionDesc: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  permissionText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 14,
  },
  grantBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    marginBottom: 14,
  },
  grantBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.35)', // Semi-transparent overlay so live camera shines through
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 20) + 12 : 54,
    paddingBottom: 16,
  },
  headerLandscape: {
    paddingTop: Platform.OS === 'android' ? 10 : 16,
    paddingBottom: 6,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  torchActive: {
    backgroundColor: '#FEF3C7',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  viewfinderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cardFrame: {
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#6366F1',
  },
  topLeft: {
    top: -3,
    left: -3,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: -3,
    right: -3,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: -3,
    left: -3,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: -3,
    right: -3,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  instructionBox: {
    position: 'absolute',
    bottom: -32,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
  },
  instructionBoxLandscape: {
    bottom: -24,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  processingBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  processingText: {
    color: '#A5B4FC',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  controlsSection: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'android' ? 36 : 48,
    alignItems: 'center',
  },
  controlsSectionLandscape: {
    paddingBottom: 10,
  },
  sampleTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  sampleTestBtnLandscape: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  sampleTestText: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 13,
  },
  sampleTestTextLandscape: {
    fontSize: 11,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  secondaryBtn: {
    alignItems: 'center',
    width: 80,
  },
  btnLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  shutterBtn: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

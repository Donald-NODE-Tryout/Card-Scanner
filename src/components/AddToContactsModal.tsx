import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VisitingCard } from '../types/card';
import { createNewContact, addToExistingContact } from '../services/contactService';
import { getGoogleUserState, saveGoogleUser, signOutGoogle, GoogleUserState } from '../services/googleAuthService';

interface AddToContactsModalProps {
  visible: boolean;
  card: VisitingCard | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddToContactsModal: React.FC<AddToContactsModalProps> = ({
  visible,
  card,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [googleUser, setGoogleUser] = useState<GoogleUserState>({ isSignedIn: false });
  const [showGoogleInput, setShowGoogleInput] = useState(false);
  const [inputEmail, setInputEmail] = useState('');

  useEffect(() => {
    if (visible) {
      loadGoogleState();
    }
  }, [visible]);

  const loadGoogleState = async () => {
    const state = await getGoogleUserState();
    setGoogleUser(state);
  };

  if (!card) return null;

  const handleCreateNew = async () => {
    setLoading(true);
    try {
      const res = await createNewContact(card);
      setLoading(false);
      if (res.success) {
        Alert.alert('Contact Created', res.message || 'Saved to contacts successfully.');
        onSuccess?.();
        onClose();
      } else if (res.message && res.message !== 'Permission denied') {
        Alert.alert('Error', res.message);
      }
    } catch (e: any) {
      setLoading(false);
      Alert.alert('Error', e?.message || 'Failed to save contact.');
    }
  };

  const handleAddToExisting = async () => {
    setLoading(true);
    try {
      const res = await addToExistingContact(card);
      setLoading(false);
      if (res.success) {
        Alert.alert('Contact Updated', res.message || 'Updated contact successfully.');
        onSuccess?.();
        onClose();
      } else if (res.message && res.message !== 'No contact selected' && res.message !== 'Permission denied') {
        Alert.alert('Notice', res.message);
      }
    } catch (e: any) {
      setLoading(false);
      Alert.alert('Error', e?.message || 'Failed to update contact.');
    }
  };

  const handleSaveGoogleUser = async () => {
    if (!inputEmail.trim() || !inputEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid Google email address.');
      return;
    }
    await saveGoogleUser(inputEmail.trim());
    setInputEmail('');
    setShowGoogleInput(false);
    await loadGoogleState();
    Alert.alert('Google Connected', `Signed in as ${inputEmail.trim()}. Contacts sync is linked.`);
  };

  const handleSignOutGoogle = async () => {
    await signOutGoogle();
    await loadGoogleState();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="person-circle-outline" size={26} color="#4F46E5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Add to Contacts</Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {card.person_name || card.business_name}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.loadingText}>Accessing Device Contacts...</Text>
            </View>
          ) : (
            <View style={styles.body}>
              {/* Option 1: Create New Contact */}
              <TouchableOpacity
                style={styles.optionCard}
                activeOpacity={0.8}
                onPress={handleCreateNew}
              >
                <View style={[styles.optionIconBox, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="person-add" size={22} color="#4F46E5" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>Create a new Contact</Text>
                  <Text style={styles.optionDesc}>
                    Save as a fresh contact with all mobile/landline numbers, email, company, and address.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>

              {/* Option 2: Add to Existing Contact */}
              <TouchableOpacity
                style={styles.optionCard}
                activeOpacity={0.8}
                onPress={handleAddToExisting}
              >
                <View style={[styles.optionIconBox, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="people" size={22} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>Add to existing Contact</Text>
                  <Text style={styles.optionDesc}>
                    Pick an existing contact from your phone and append this card's details.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>

              {/* Info & Google Sync Status */}
              <View style={styles.syncBanner}>
                <Ionicons name="sync-circle-outline" size={18} color="#059669" />
                <Text style={styles.syncText}>
                  Automatically syncs to your Google Contacts on Android and iCloud on Apple.
                </Text>
              </View>

              {/* Optional Google Sign-In */}
              {googleUser.isSignedIn ? (
                <View style={styles.googleAccountBox}>
                  <Ionicons name="logo-google" size={16} color="#4285F4" />
                  <Text style={styles.googleAccountText} numberOfLines={1}>
                    Linked: {googleUser.email}
                  </Text>
                  <TouchableOpacity onPress={handleSignOutGoogle}>
                    <Text style={styles.googleSignOutText}>Sign out</Text>
                  </TouchableOpacity>
                </View>
              ) : showGoogleInput ? (
                <View style={styles.googleInputBox}>
                  <TextInput
                    style={styles.googleTextInput}
                    placeholder="Enter Google email (e.g. user@gmail.com)"
                    placeholderTextColor="#94A3B8"
                    value={inputEmail}
                    onChangeText={setInputEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <View style={styles.googleBtnRow}>
                    <TouchableOpacity
                      style={styles.googleCancelBtn}
                      onPress={() => setShowGoogleInput(false)}
                    >
                      <Text style={styles.googleCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.googleConfirmBtn}
                      onPress={handleSaveGoogleUser}
                    >
                      <Text style={styles.googleConfirmText}>Link</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.googleSignInBtn}
                  onPress={() => setShowGoogleInput(true)}
                >
                  <Ionicons name="logo-google" size={16} color="#4285F4" />
                  <Text style={styles.googleSignInText}>Sign in with Google (Optional)</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 6,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  body: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  optionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
  },
  syncText: {
    fontSize: 12,
    color: '#047857',
    flex: 1,
    lineHeight: 16,
    fontWeight: '500',
  },
  googleSignInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
  },
  googleSignInText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  googleAccountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
  },
  googleAccountText: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
    fontWeight: '500',
  },
  googleSignOutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  googleInputBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  googleTextInput: {
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    marginBottom: 8,
  },
  googleBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  googleCancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  googleCancelText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  googleConfirmBtn: {
    backgroundColor: '#4285F4',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  googleConfirmText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VisitingCard, ExtractedCardData } from '../types/card';
import { saveCard } from '../services/supabaseClient';
import { AddToContactsModal } from '../components/AddToContactsModal';

interface ReviewScreenProps {
  imageUri: string | null;
  initialData: ExtractedCardData;
  ocrSource: string;
  onSaveComplete: (savedCard: VisitingCard) => void;
  onCancel: () => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({
  imageUri,
  initialData,
  ocrSource,
  onSaveComplete,
  onCancel,
}) => {
  const [personName, setPersonName] = useState(initialData.person_name);
  const [businessName, setBusinessName] = useState(initialData.business_name);

  // Dynamic Mobile Numbers
  const [mobileNumbers, setMobileNumbers] = useState<string[]>(() => {
    if (initialData.mobile_numbers && initialData.mobile_numbers.length > 0) {
      return initialData.mobile_numbers;
    }
    if (initialData.contact_number) {
      const split = initialData.contact_number.split(',').map(s => s.trim()).filter(Boolean);
      return split.length > 0 ? split : [''];
    }
    return [''];
  });

  // Dynamic Landline Numbers
  const [landlineNumbers, setLandlineNumbers] = useState<string[]>(() => {
    if (initialData.landline_numbers && initialData.landline_numbers.length > 0) {
      return initialData.landline_numbers;
    }
    if (initialData.landline_number) {
      const split = initialData.landline_number.split(',').map(s => s.trim()).filter(Boolean);
      return split.length > 0 ? split : [];
    }
    return [];
  });

  const [email, setEmail] = useState(initialData.email);
  const [jobTitle, setJobTitle] = useState(initialData.job_title);
  const [address, setAddress] = useState(initialData.address);
  const [pincode, setPincode] = useState(initialData.pincode || '');
  const [website, setWebsite] = useState(initialData.website);
  const [businessCategory, setBusinessCategory] = useState(initialData.business_category || '');
  const [businessDescription, setBusinessDescription] = useState(initialData.business_description || '');
  const [whatsappNumber, setWhatsappNumber] = useState(initialData.whatsapp_number || '');
  const [notes, setNotes] = useState('');
  const [showRawText, setShowRawText] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);

  const getCurrentCard = (): VisitingCard => {
    const cleanMobiles = mobileNumbers.map(m => m.trim()).filter(Boolean);
    const cleanLandlines = landlineNumbers.map(l => l.trim()).filter(Boolean);
    return {
      person_name: personName.trim(),
      business_name: businessName.trim() || 'Business Contact',
      contact_number: cleanMobiles.join(', '),
      mobile_numbers: cleanMobiles,
      landline_number: cleanLandlines.join(', '),
      landline_numbers: cleanLandlines,
      email: email.trim(),
      job_title: jobTitle.trim(),
      address: address.trim(),
      pincode: pincode.trim(),
      website: website.trim(),
      business_category: businessCategory.trim(),
      business_description: businessDescription.trim(),
      whatsapp_number: whatsappNumber.trim() || cleanMobiles[0] || '',
      notes: notes.trim(),
      raw_text: initialData.raw_text,
      image_url: imageUri || undefined,
    };
  };

  const handleAddMobile = () => {
    setMobileNumbers(prev => [...prev, '']);
  };

  const handleUpdateMobile = (index: number, val: string) => {
    setMobileNumbers(prev => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const handleRemoveMobile = (index: number) => {
    setMobileNumbers(prev => {
      if (prev.length <= 1) return [''];
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleAddLandline = () => {
    setLandlineNumbers(prev => [...prev, '']);
  };

  const handleUpdateLandline = (index: number, val: string) => {
    setLandlineNumbers(prev => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const handleRemoveLandline = (index: number) => {
    setLandlineNumbers(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!personName.trim() && !businessName.trim()) {
      Alert.alert(
        'Required Information',
        'Please provide at least a Person Name or Business Name for the card.'
      );
      return;
    }

    const cleanMobiles = mobileNumbers.map(m => m.trim()).filter(Boolean);
    const cleanLandlines = landlineNumbers.map(l => l.trim()).filter(Boolean);

    setIsSaving(true);
    try {
      const cardToSave: VisitingCard = {
        person_name: personName.trim(),
        business_name: businessName.trim() || 'Business Contact',
        contact_number: cleanMobiles.join(', '),
        mobile_numbers: cleanMobiles,
        landline_number: cleanLandlines.join(', '),
        landline_numbers: cleanLandlines,
        email: email.trim(),
        job_title: jobTitle.trim(),
        address: address.trim(),
        pincode: pincode.trim(),
        website: website.trim(),
        business_category: businessCategory.trim(),
        business_description: businessDescription.trim(),
        whatsapp_number: whatsappNumber.trim() || cleanMobiles[0] || '',
        notes: notes.trim(),
        raw_text: initialData.raw_text,
        image_url: imageUri || undefined,
      };

      const saved = await saveCard(cardToSave);
      Alert.alert('Saved!', 'Visiting card successfully stored.');
      onSaveComplete(saved);
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not save card to database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onCancel} style={styles.navBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Verify &amp; Save Card</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
        {/* Scanned Image Preview Banner */}
        {imageUri ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.cardImage} resizeMode="cover" />
            <View style={[styles.ocrBadge, ocrSource === 'groq-ai' && styles.aiBadge]}>
              <Ionicons
                name={ocrSource === 'groq-ai' ? 'sparkles' : 'scan-circle'}
                size={14}
                color={ocrSource === 'groq-ai' ? '#4F46E5' : '#16A34A'}
              />
              <Text style={[styles.ocrBadgeText, ocrSource === 'groq-ai' && styles.aiBadgeText]}>
                {ocrSource === 'groq-ai' ? 'Extracted via Groq AI ⚡' : `Extracted via ${ocrSource}`}
              </Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionSubtitle}>
          Review and tweak the extracted details before saving:
        </Text>

        {/* Input Form */}
        <View style={styles.formContainer}>
          <InputField
            label="Person Name *"
            icon="person-outline"
            value={personName}
            onChangeText={setPersonName}
            placeholder="e.g. Nitin Gupta / Richard Ruan"
          />

          <InputField
            label="Business Name *"
            icon="business-outline"
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="e.g. Nirali Overseas / Rattan Motors"
          />

          <InputField
            label="Job Title / Designation"
            icon="briefcase-outline"
            value={jobTitle}
            onChangeText={setJobTitle}
            placeholder="e.g. Sales Manager / Founder / Director"
          />

          <InputField
            label="Business Category / Industry"
            icon="grid-outline"
            value={businessCategory}
            onChangeText={setBusinessCategory}
            placeholder="e.g. Tools, Hardware & Machinery / Automotive"
          />

          <InputField
            label="Specialization / Products / Services"
            icon="cube-outline"
            value={businessDescription}
            onChangeText={setBusinessDescription}
            placeholder="e.g. Importers of Power Tools & Spares, Fasteners..."
            multiline
          />

          {/* Dynamic Mobile Numbers Section */}
          <View style={styles.dynamicHeaderRow}>
            <Text style={styles.inputLabel}>Mobile Numbers *</Text>
            <TouchableOpacity onPress={handleAddMobile} style={styles.addMiniBtn}>
              <Ionicons name="add-circle-outline" size={16} color="#4F46E5" />
              <Text style={styles.addMiniBtnText}>Add Number</Text>
            </TouchableOpacity>
          </View>
          {mobileNumbers.map((num, idx) => (
            <View key={`mob-${idx}`} style={styles.dynamicInputRow}>
              <View style={{ flex: 1 }}>
                <InputField
                  label={idx === 0 ? 'Primary Mobile' : `Mobile #${idx + 1}`}
                  icon="call-outline"
                  value={num}
                  onChangeText={val => handleUpdateMobile(idx, val)}
                  placeholder="e.g. +91 98765 43210"
                  keyboardType="phone-pad"
                />
              </View>
              {mobileNumbers.length > 1 ? (
                <TouchableOpacity
                  onPress={() => handleRemoveMobile(idx)}
                  style={styles.removeIconBtn}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              ) : null}
            </View>
          ))}

          {/* Dynamic Landline Numbers Section */}
          <View style={styles.dynamicHeaderRow}>
            <Text style={styles.inputLabel}>Landline / Office Numbers</Text>
            <TouchableOpacity onPress={handleAddLandline} style={styles.addMiniBtn}>
              <Ionicons name="add-circle-outline" size={16} color="#4F46E5" />
              <Text style={styles.addMiniBtnText}>Add Landline</Text>
            </TouchableOpacity>
          </View>
          {landlineNumbers.length === 0 ? (
            <Text style={styles.emptyNoticeText}>No landline detected. Tap Add Landline to add one.</Text>
          ) : (
            landlineNumbers.map((num, idx) => (
              <View key={`land-${idx}`} style={styles.dynamicInputRow}>
                <View style={{ flex: 1 }}>
                  <InputField
                    label={`Landline #${idx + 1}`}
                    icon="business-outline"
                    value={num}
                    onChangeText={val => handleUpdateLandline(idx, val)}
                    placeholder="e.g. 0172-2706326 or 022-2854XXXX"
                    keyboardType="phone-pad"
                  />
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveLandline(idx)}
                  style={styles.removeIconBtn}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          )}

          <InputField
            label="WhatsApp Number"
            icon="logo-whatsapp"
            value={whatsappNumber}
            onChangeText={setWhatsappNumber}
            placeholder="e.g. +91 98765 43210"
            keyboardType="phone-pad"
          />

          <InputField
            label="Email Address"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="e.g. contact@business.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <InputField
            label="Website"
            icon="globe-outline"
            value={website}
            onChangeText={setWebsite}
            placeholder="e.g. www.business.com"
            autoCapitalize="none"
          />

          <InputField
            label="Physical Address"
            icon="location-outline"
            value={address}
            onChangeText={setAddress}
            placeholder="e.g. 123 Tech Park, Suite 400"
            multiline
          />

          <InputField
            label="Postal / Zip Code"
            icon="mail-unread-outline"
            value={pincode}
            onChangeText={setPincode}
            placeholder="e.g. 600066, 421302"
            keyboardType="number-pad"
          />

          <InputField
            label="Notes"
            icon="document-text-outline"
            value={notes}
            onChangeText={setNotes}
            placeholder="Met at trade expo, discussed power tools..."
            multiline
          />
        </View>

        {/* Raw OCR Accordion */}
        {initialData.raw_text ? (
          <View style={styles.rawTextSection}>
            <TouchableOpacity
              style={styles.rawTextToggle}
              onPress={() => setShowRawText(!showRawText)}
            >
              <Text style={styles.rawTextToggleLabel}>
                {showRawText ? 'Hide Raw OCR Text' : 'View Raw OCR Text'}
              </Text>
              <Ionicons
                name={showRawText ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#64748B"
              />
            </TouchableOpacity>
            {showRawText ? (
              <View style={styles.rawTextBox}>
                <Text style={styles.rawTextContent}>{initialData.raw_text}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Action Buttons: Add to Contacts & Save */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.contactsBtn}
            onPress={() => setShowContactsModal(true)}
            activeOpacity={0.88}
          >
            <Ionicons name="person-add" size={19} color="#4F46E5" style={{ marginRight: 8 }} />
            <Text style={styles.contactsBtnText}>Add to Contacts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.88}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.saveBtnText}>Save Card to Database</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <AddToContactsModal
          visible={showContactsModal}
          card={getCurrentCard()}
          onClose={() => setShowContactsModal(false)}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const InputField: React.FC<{
  label: string;
  icon: any;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: any;
  autoCapitalize?: any;
  multiline?: boolean;
}> = ({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  multiline,
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={[styles.inputWrapper, multiline && styles.multilineWrapper]}>
      <Ionicons name={icon} size={18} color="#6366F1" style={styles.inputIcon} />
      <TextInput
        style={[styles.textInput, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  navBtn: {
    padding: 6,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollArea: {
    flex: 1,
    padding: 16,
  },
  imagePreviewContainer: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    marginBottom: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  ocrBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  aiBadge: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
  },
  ocrBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  aiBadgeText: {
    color: '#4338CA',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dynamicHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    marginTop: 4,
  },
  addMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  addMiniBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  dynamicInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeIconBtn: {
    padding: 8,
    marginTop: 14,
  },
  emptyNoticeText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
  },
  multilineWrapper: {
    alignItems: 'flex-start',
    paddingTop: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 10,
  },
  multilineInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  rawTextSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rawTextToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rawTextToggleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
  rawTextBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  rawTextContent: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  actionButtonsContainer: {
    gap: 12,
    marginTop: 10,
  },
  contactsBtn: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 16,
  },
  contactsBtnText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

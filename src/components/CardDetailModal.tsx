import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VisitingCard } from '../types/card';
import { AddToContactsModal } from './AddToContactsModal';

interface CardDetailModalProps {
  card: VisitingCard | null;
  visible: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  card,
  visible,
  onClose,
  onDelete,
}) => {
  const [showContactsModal, setShowContactsModal] = useState(false);

  if (!card) return null;

  const handleCall = () => {
    if (card.contact_number) {
      const first = card.contact_number.split(',')[0].trim();
      Linking.openURL(`tel:${first}`).catch(() => Alert.alert('Error', 'Cannot dial'));
    }
  };

  const handleEmail = () => {
    if (card.email) {
      Linking.openURL(`mailto:${card.email}`).catch(() => Alert.alert('Error', 'Cannot email'));
    }
  };

  const handleWebsite = () => {
    if (card.website) {
      const url = card.website.startsWith('http') ? card.website : `https://${card.website}`;
      Linking.openURL(url).catch(() => Alert.alert('Error', 'Cannot open website'));
    }
  };

  const handleWhatsApp = () => {
    const wa = card.whatsapp_number || card.contact_number;
    if (wa) {
      const cleanDigits = wa.replace(/[^\d]/g, '');
      Linking.openURL(`https://wa.me/${cleanDigits}`).catch(() => Alert.alert('Error', 'Cannot open WhatsApp'));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Visiting Card</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Business Card Banner Style */}
            <View style={styles.cardHeaderBanner}>
              <View style={styles.badgeRow}>
                <Ionicons name="briefcase" size={16} color="#6366F1" />
                <Text style={styles.businessText}>{card.business_name || 'Business Name'}</Text>
              </View>
              <Text style={styles.personName}>{card.person_name || 'Name Unknown'}</Text>
              {card.job_title ? <Text style={styles.jobTitle}>{card.job_title}</Text> : null}
              {card.business_category ? (
                <View style={styles.categoryPill}>
                  <Ionicons name="pricetag-outline" size={12} color="#4338CA" />
                  <Text style={styles.categoryPillText}>{card.business_category}</Text>
                </View>
              ) : null}
            </View>

            {/* Quick Actions Row */}
            <View style={styles.quickActions}>
              {(card.mobile_numbers?.[0] || card.contact_number) ? (
                <TouchableOpacity style={styles.quickActionBtn} onPress={handleCall}>
                  <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
                    <Ionicons name="call" size={20} color="#4F46E5" />
                  </View>
                  <Text style={styles.quickActionLabel}>Call</Text>
                </TouchableOpacity>
              ) : null}

              {(card.whatsapp_number || card.mobile_numbers?.[0] || card.contact_number) ? (
                <TouchableOpacity style={styles.quickActionBtn} onPress={handleWhatsApp}>
                  <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="logo-whatsapp" size={20} color="#16A34A" />
                  </View>
                  <Text style={styles.quickActionLabel}>WhatsApp</Text>
                </TouchableOpacity>
              ) : null}

              {(card.emails?.[0] || card.email) ? (
                <TouchableOpacity style={styles.quickActionBtn} onPress={handleEmail}>
                  <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
                    <Ionicons name="mail" size={20} color="#0EA5E9" />
                  </View>
                  <Text style={styles.quickActionLabel}>Email</Text>
                </TouchableOpacity>
              ) : null}

              {(card.websites?.[0] || card.website) ? (
                <TouchableOpacity style={styles.quickActionBtn} onPress={handleWebsite}>
                  <View style={[styles.iconCircle, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="globe" size={20} color="#16A34A" />
                  </View>
                  <Text style={styles.quickActionLabel}>Website</Text>
                </TouchableOpacity>
              ) : null}

              {/* Add to Contacts Quick Action */}
              <TouchableOpacity style={styles.quickActionBtn} onPress={() => setShowContactsModal(true)}>
                <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="person-add" size={20} color="#4F46E5" />
                </View>
                <Text style={styles.quickActionLabel}>Contacts</Text>
              </TouchableOpacity>
            </View>

            {/* Field Details */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Contact Information</Text>

              {/* Mobile Numbers */}
              {card.mobile_numbers && card.mobile_numbers.length > 0 ? (
                card.mobile_numbers.map((num, idx) => (
                  <DetailField
                    key={`mob-${idx}`}
                    icon="call-outline"
                    label={card.mobile_numbers!.length > 1 ? `Mobile Number ${idx + 1}` : 'Mobile Number'}
                    value={num}
                    onPress={() => Linking.openURL(`tel:${num.trim()}`).catch(() => Alert.alert('Error', 'Cannot dial'))}
                  />
                ))
              ) : (
                <DetailField
                  icon="call-outline"
                  label="Mobile Number"
                  value={card.contact_number}
                  onPress={handleCall}
                />
              )}

              {/* Landline Numbers */}
              {card.landline_numbers && card.landline_numbers.length > 0 ? (
                card.landline_numbers.map((land, idx) => (
                  <DetailField
                    key={`land-${idx}`}
                    icon="business-outline"
                    label={card.landline_numbers!.length > 1 ? `Landline / Office ${idx + 1}` : 'Landline / Office'}
                    value={land}
                    onPress={() => Linking.openURL(`tel:${land.trim()}`).catch(() => Alert.alert('Error', 'Cannot dial'))}
                  />
                ))
              ) : (
                <DetailField
                  icon="business-outline"
                  label="Landline / Office"
                  value={card.landline_number}
                  onPress={() => {
                    if (card.landline_number) {
                      Linking.openURL(`tel:${card.landline_number.split(',')[0].trim()}`).catch(() => Alert.alert('Error', 'Cannot dial'));
                    }
                  }}
                />
              )}

              {/* WhatsApp */}
              <DetailField
                icon="logo-whatsapp"
                label="WhatsApp"
                value={card.whatsapp_number}
                onPress={handleWhatsApp}
              />

              {/* Emails */}
              {card.emails && card.emails.length > 0 ? (
                card.emails.map((em, idx) => (
                  <DetailField
                    key={`email-${idx}`}
                    icon="mail-outline"
                    label={card.emails!.length > 1 ? `Email ${idx + 1}` : 'Email Address'}
                    value={em}
                    onPress={() => Linking.openURL(`mailto:${em.trim()}`).catch(() => Alert.alert('Error', 'Cannot email'))}
                  />
                ))
              ) : (
                <DetailField
                  icon="mail-outline"
                  label="Email Address"
                  value={card.email}
                  onPress={handleEmail}
                />
              )}

              {/* Websites */}
              {card.websites && card.websites.length > 0 ? (
                card.websites.map((wb, idx) => (
                  <DetailField
                    key={`web-${idx}`}
                    icon="globe-outline"
                    label={card.websites!.length > 1 ? `Website ${idx + 1}` : 'Website'}
                    value={wb}
                    onPress={() => {
                      const url = wb.startsWith('http') ? wb : `https://${wb}`;
                      Linking.openURL(url).catch(() => Alert.alert('Error', 'Cannot open website'));
                    }}
                  />
                ))
              ) : (
                <DetailField
                  icon="globe-outline"
                  label="Website"
                  value={card.website}
                  onPress={handleWebsite}
                />
              )}

              {/* Category */}
              <DetailField
                icon="grid-outline"
                label="Business Category / Industry"
                value={card.business_category}
              />

              {/* Business Description / Products */}
              <DetailField
                icon="cube-outline"
                label="Specialization / Products / Services"
                value={card.business_description}
              />

              {/* Physical Address */}
              <DetailField
                icon="location-outline"
                label="Physical Address"
                value={card.address}
              />

              {/* Pincode */}
              <DetailField
                icon="navigate-outline"
                label="Postal / Zip Code"
                value={card.pincode}
              />
            </View>

            {/* Raw OCR Text */}
            {card.raw_text ? (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>Extracted Raw OCR Text</Text>
                <View style={styles.rawTextBox}>
                  <Text style={styles.rawTextContent}>{card.raw_text}</Text>
                </View>
              </View>
            ) : null}

            {/* Save to Phone Contacts Button */}
            <TouchableOpacity
              style={styles.saveContactBtn}
              onPress={() => setShowContactsModal(true)}
            >
              <Ionicons name="person-add-outline" size={18} color="#4F46E5" style={{ marginRight: 8 }} />
              <Text style={styles.saveContactText}>Add / Update in Phone Contacts</Text>
            </TouchableOpacity>

            {/* Delete button */}
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => {
                if (card.id) {
                  onDelete(card.id);
                  onClose();
                }
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.deleteText}>Delete Card</Text>
            </TouchableOpacity>

            <AddToContactsModal
              visible={showContactsModal}
              card={card}
              onClose={() => setShowContactsModal(false)}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const DetailField: React.FC<{
  icon: any;
  label: string;
  value?: string;
  onPress?: () => void;
}> = ({ icon, label, value, onPress }) => {
  if (!value) return null;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={styles.fieldItem}
    >
      <Ionicons name={icon} size={20} color="#6366F1" style={styles.fieldIcon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={[styles.fieldValue, onPress && styles.interactiveValue]}>{value}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
  },
  scrollArea: {
    marginBottom: 10,
  },
  cardHeaderBanner: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  businessText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },
  personName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  jobTitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    gap: 4,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4338CA',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  quickActionBtn: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  fieldItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  fieldIcon: {
    marginTop: 2,
    marginRight: 14,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  interactiveValue: {
    color: '#4F46E5',
    textDecorationLine: 'underline',
  },
  rawTextBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rawTextContent: {
    fontSize: 12,
    color: '#475569',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  saveContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    marginTop: 10,
    marginBottom: 8,
  },
  saveContactText: {
    color: '#4F46E5',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    marginTop: 4,
    marginBottom: 20,
  },
  deleteText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VisitingCard } from '../types/card';

interface CardItemProps {
  card: VisitingCard;
  onPress: (card: VisitingCard) => void;
  onDelete: (cardId: string) => void;
}

export const CardItem: React.FC<CardItemProps> = ({ card, onPress, onDelete }) => {
  const handleCall = () => {
    if (card.contact_number) {
      const firstPhone = card.contact_number.split(',')[0].trim();
      Linking.openURL(`tel:${firstPhone}`).catch(() => {
        Alert.alert('Error', 'Unable to initiate call on this device');
      });
    }
  };

  const handleEmail = () => {
    if (card.email) {
      Linking.openURL(`mailto:${card.email}`).catch(() => {
        Alert.alert('Error', 'Unable to open email client');
      });
    }
  };

  const handleWebsite = () => {
    if (card.website) {
      const url = card.website.startsWith('http') ? card.website : `https://${card.website}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Unable to open website');
      });
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Card',
      `Are you sure you want to delete ${card.person_name || 'this card'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => card.id && onDelete(card.id) },
      ]
    );
  };

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={() => onPress(card)} style={styles.cardContainer}>
      {/* Top Banner with Business Name and Delete icon */}
      <View style={styles.headerRow}>
        <View style={styles.businessBadge}>
          <Ionicons name="business" size={14} color="#6366F1" style={{ marginRight: 6 }} />
          <Text style={styles.businessName} numberOfLines={1}>
            {card.business_name || 'Business Card'}
          </Text>
        </View>
        <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={confirmDelete}>
          <Ionicons name="trash-outline" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Person Name & Job Title */}
      <View style={styles.personSection}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>
            {(card.person_name || card.business_name || 'C').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.personName} numberOfLines={1}>
            {card.person_name || 'Unknown Contact'}
          </Text>
          {card.job_title ? (
            <Text style={styles.jobTitle} numberOfLines={1}>
              {card.job_title}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Details (Phone, Email, Address) */}
      <View style={styles.detailsSection}>
        {card.contact_number ? (
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={15} color="#4F46E5" style={styles.detailIcon} />
            <Text style={styles.detailText} numberOfLines={1}>
              {card.contact_number}
            </Text>
          </View>
        ) : null}

        {card.email ? (
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={15} color="#0EA5E9" style={styles.detailIcon} />
            <Text style={styles.detailText} numberOfLines={1}>
              {card.email}
            </Text>
          </View>
        ) : null}

        {card.address ? (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={15} color="#F59E0B" style={styles.detailIcon} />
            <Text style={styles.detailText} numberOfLines={1}>
              {card.address}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.actionsRow}>
        {card.contact_number ? (
          <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={handleCall}>
            <Ionicons name="call" size={14} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Call</Text>
          </TouchableOpacity>
        ) : null}

        {card.email ? (
          <TouchableOpacity style={[styles.actionBtn, styles.emailBtn]} onPress={handleEmail}>
            <Ionicons name="mail" size={14} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Email</Text>
          </TouchableOpacity>
        ) : null}

        {card.website ? (
          <TouchableOpacity style={[styles.actionBtn, styles.webBtn]} onPress={handleWebsite}>
            <Ionicons name="globe-outline" size={14} color="#1E293B" />
            <Text style={[styles.actionBtnText, { color: '#1E293B' }]}>Web</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  businessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  businessName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4338CA',
    flexShrink: 1,
  },
  personSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  personName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  jobTitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  detailsSection: {
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  detailIcon: {
    width: 20,
    marginRight: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
  },
  callBtn: {
    backgroundColor: '#4F46E5',
  },
  emailBtn: {
    backgroundColor: '#0EA5E9',
  },
  webBtn: {
    backgroundColor: '#F1F5F9',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

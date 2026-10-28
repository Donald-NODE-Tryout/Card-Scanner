import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VisitingCard } from '../types/card';
import { CardItem } from '../components/CardItem';

interface ContactsViewProps {
  cards: VisitingCard[];
  loading: boolean;
  refreshing: boolean;
  isSupabaseConnected: boolean;
  onRefresh: () => void;
  onCardSelect: (card: VisitingCard) => void;
  onCardDelete: (cardId: string) => void;
  onOpenScan: () => void;
  onOpenConfig: () => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  cards,
  loading,
  refreshing,
  isSupabaseConnected,
  onRefresh,
  onCardSelect,
  onCardDelete,
  onOpenScan,
  onOpenConfig,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    cards.forEach(c => {
      if (c.business_category) set.add(c.business_category);
    });
    return ['All', ...Array.from(set)];
  }, [cards]);

  // Filtered Cards based on search query & category
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      // Category filter
      if (selectedCategory !== 'All' && card.business_category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        card.person_name.toLowerCase().includes(q) ||
        card.business_name.toLowerCase().includes(q) ||
        card.contact_number.toLowerCase().includes(q) ||
        (card.job_title && card.job_title.toLowerCase().includes(q)) ||
        (card.email && card.email.toLowerCase().includes(q)) ||
        (card.business_category && card.business_category.toLowerCase().includes(q)) ||
        (card.business_description && card.business_description.toLowerCase().includes(q)) ||
        (card.address && card.address.toLowerCase().includes(q)) ||
        (card.pincode && card.pincode.toLowerCase().includes(q))
      );
    });
  }, [cards, searchQuery, selectedCategory]);

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.appTitle}>Card Scanner</Text>
          <Text style={styles.appSubtitle}>
            {cards.length} {cards.length === 1 ? 'card' : 'cards'} in database
          </Text>
        </View>

        {/* Database Status Pill */}
        <TouchableOpacity
          style={[
            styles.dbStatusPill,
            isSupabaseConnected ? styles.pillConnected : styles.pillLocal,
          ]}
          onPress={onOpenConfig}
        >
          <Ionicons
            name={isSupabaseConnected ? 'cloud-done' : 'server-outline'}
            size={14}
            color={isSupabaseConnected ? '#15803D' : '#D97706'}
          />
          <Text
            style={[
              styles.dbStatusText,
              isSupabaseConnected ? styles.textConnected : styles.textLocal,
            ]}
          >
            {isSupabaseConnected ? 'Supabase' : 'Offline Mode'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, company, or phone..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category Filter Chips (if multiple categories exist) */}
      {categories.length > 2 ? (
        <View style={styles.categoriesContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={item => item}
            contentContainerStyle={styles.categoriesList}
            renderItem={({ item }) => {
              const isSelected = selectedCategory === item;
              return (
                <TouchableOpacity
                  style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                  onPress={() => setSelectedCategory(item)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected && styles.categoryChipTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      ) : null}

      {/* Cards List / Supabase Data Visualizer */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Syncing cards from Supabase...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCards}
          keyExtractor={item => item.id || String(Math.random())}
          renderItem={({ item }) => (
            <CardItem
              card={item}
              onPress={onCardSelect}
              onDelete={onCardDelete}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="card-outline" size={42} color="#6366F1" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery || selectedCategory !== 'All'
                  ? 'No matching cards found'
                  : 'No visiting cards yet'}
              </Text>
              <Text style={styles.emptySub}>
                {searchQuery || selectedCategory !== 'All'
                  ? 'Try adjusting your search terms or filter.'
                  : 'Tap "Scan Card" below to capture your first business card.'}
              </Text>
              {!searchQuery && selectedCategory === 'All' ? (
                <TouchableOpacity style={styles.emptyScanBtn} onPress={onOpenScan}>
                  <Ionicons name="camera" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.emptyScanBtnText}>Scan First Card</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
      )}

      {/* Floating Scan Action Button - ONLY rendered on ContactsView */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.88}
        onPress={onOpenScan}
      >
        <Ionicons name="camera" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={styles.fabText}>Scan Card</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  dbStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  pillConnected: {
    backgroundColor: '#DCFCE7',
  },
  pillLocal: {
    backgroundColor: '#FEF3C7',
  },
  dbStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textConnected: {
    color: '#15803D',
  },
  textLocal: {
    color: '#B45309',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  categoriesContainer: {
    marginVertical: 6,
  },
  categoriesList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 110,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyScanBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 30,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

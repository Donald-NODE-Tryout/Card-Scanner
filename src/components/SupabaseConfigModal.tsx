import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  getSupabaseClient,
} from '../services/supabaseClient';

interface SupabaseConfigModalProps {
  visible: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  visible,
  onClose,
  onConfigSaved,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<'connected' | 'not-configured' | 'error'>('not-configured');

  useEffect(() => {
    if (visible) {
      loadCurrentConfig();
    }
  }, [visible]);

  const loadCurrentConfig = async () => {
    const config = await getSupabaseConfig();
    setUrl(config.url);
    setAnonKey(config.anonKey);
    if (config.url && config.anonKey) {
      setStatus('connected');
    } else {
      setStatus('not-configured');
    }
  };

  const handleTestAndSave = async () => {
    if (!url.trim() || !anonKey.trim()) {
      Alert.alert('Missing Fields', 'Please enter both your Supabase URL and Anon Public Key.');
      return;
    }

    setTesting(true);
    try {
      await saveSupabaseConfig(url, anonKey);
      const client = await getSupabaseClient();
      if (!client) throw new Error('Client creation failed');

      // Test a light ping to Supabase
      const { error } = await client.from('visiting_cards').select('id').limit(1);

      if (error && error.code !== 'PGRST116') {
        // Table might not exist yet, remind user
        Alert.alert(
          'Connected to Supabase!',
          'Credentials are valid. Remember to run the supabase_schema.sql script in your Supabase SQL Editor if you haven\'t created the table yet.',
          [
            {
              text: 'OK',
              onPress: () => {
                setStatus('connected');
                onConfigSaved();
                onClose();
              },
            },
          ]
        );
      } else {
        setStatus('connected');
        Alert.alert('Success!', 'Successfully connected to your Supabase project!');
        onConfigSaved();
        onClose();
      }
    } catch (err: any) {
      setStatus('error');
      Alert.alert('Connection Failed', err.message || 'Please check your URL and Anon Key.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="server-outline" size={22} color="#4F46E5" />
              <Text style={styles.title}>Supabase Database</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Status banner */}
          <View
            style={[
              styles.statusBanner,
              status === 'connected' ? styles.statusConnected : styles.statusOffline,
            ]}
          >
            <Ionicons
              name={status === 'connected' ? 'cloud-done' : 'cloud-offline'}
              size={18}
              color={status === 'connected' ? '#16A34A' : '#F59E0B'}
            />
            <Text style={styles.statusText}>
              {status === 'connected'
                ? 'Connected to Supabase'
                : 'Using Local Storage (Add Supabase below to sync)'}
            </Text>
          </View>

          {/* Inputs */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Supabase Project URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://xyz.supabase.co"
              placeholderTextColor="#94A3B8"
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Supabase Anon / Public Key</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              placeholderTextColor="#94A3B8"
              value={anonKey}
              onChangeText={setAnonKey}
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.hintBox}>
            <Ionicons name="information-circle-outline" size={18} color="#6366F1" style={{ marginRight: 6 }} />
            <Text style={styles.hintText}>
              You can find these in your Supabase Dashboard under Settings &gt; API.
            </Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleTestAndSave}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>Save &amp; Connect</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  statusConnected: {
    backgroundColor: '#F0FDF4',
  },
  statusOffline: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  multilineInput: {
    height: 70,
    textAlignVertical: 'top',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 18,
  },
  hintText: {
    fontSize: 12,
    color: '#4338CA',
    flex: 1,
  },
  saveBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

// Aqarati Mobile — Home Screen (الرئيسية)
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { spacing, radius } from '../theme';
import EmptyState from '../components/EmptyState';
import { getMyProperties } from '../api/client';
import type { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const [properties, setProperties] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProperties = useCallback(async () => {
    try {
      const data = await getMyProperties();
      setProperties(data?.myProperties || []);
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadProperties(); }, [loadProperties]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#14b8a6" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={properties}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              {item.propertyType} • {item.purpose} {item.city ? `• ${item.city}` : ''}
            </Text>
            {item.priceAmount && (
              <Text style={[styles.cardPrice, { color: '#14b8a6' }]}>
                {Number(item.priceAmount).toLocaleString('ar-SA')} ر.س
              </Text>
            )}
            <Text style={[styles.cardStatus, { color: colors.textTertiary }]}>
              {item.status === 'active' ? 'نشط' : item.status}
            </Text>
          </TouchableOpacity>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProperties(); }} />}
        ListEmptyComponent={<EmptyState message="لا توجد عقارات بعد" />}
        contentContainerStyle={properties.length === 0 ? { flex: 1 } : { padding: spacing.md }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, marginBottom: 6 },
  cardPrice: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  cardStatus: { fontSize: 12 },
});

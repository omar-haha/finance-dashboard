import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { BACKEND_URL } from '../config';

const CATEGORY_COLORS = [
  '#2dd4bf', '#f97316', '#6366f1', '#f59e0b', '#8b5cf6',
  '#ec4899', '#3b82f6', '#10b981', '#ef4444', '#84cc16',
];

export default function DashboardScreen() {
  const [summary, setSummary] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      Promise.all([
        axios.get(`${BACKEND_URL}/summary/monthly`),
        axios.get(`${BACKEND_URL}/summary/categories`),
      ])
        .then(([m, c]) => {
          if (!active) return;
          setSummary(m.data.reverse());
          setCategories(c.data);
        })
        .catch((err) => console.error('Error loading dashboard', err.message))
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }, [])
  );

  const totalExpenses = summary.reduce((s, i) => s + Number(i.expenses || 0), 0);
  const totalIncome = summary.reduce((s, i) => s + Number(i.income || 0), 0);
  const net = totalIncome - totalExpenses;
  const maxAmount = Math.max(
    ...summary.map((i) => Math.max(Number(i.expenses || 0), Number(i.income || 0))),
    1
  );
  const categoryTotal = categories.reduce((s, c) => s + Number(c.total), 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2dd4bf" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero balance card */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>NET BALANCE</Text>
          <Text style={[styles.heroAmount, net < 0 && styles.heroAmountNegative]}>
            {net >= 0 ? '+' : '-'}${Math.abs(net).toFixed(2)}
          </Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>INCOME</Text>
              <Text style={styles.heroStatIncome}>+${totalIncome.toFixed(2)}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>EXPENSES</Text>
              <Text style={styles.heroStatExpense}>-${totalExpenses.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {summary.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptySubtitle}>Add your first transaction to see your overview.</Text>
          </View>
        ) : (
          <>
            {/* Monthly chart */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>MONTHLY BREAKDOWN</Text>
              <View style={styles.chartContainer}>
                {summary.map((item, idx) => {
                  const expH = ((Number(item.expenses || 0) / maxAmount) * 160) || 4;
                  const incH = ((Number(item.income || 0) / maxAmount) * 160) || 4;
                  return (
                    <View key={idx} style={styles.barGroup}>
                      <View style={styles.barRow}>
                        <View style={[styles.bar, { height: expH, backgroundColor: '#ef476f' }]} />
                        <View style={[styles.bar, { height: incH, backgroundColor: '#2dd4bf' }]} />
                      </View>
                      <Text style={styles.barLabel}>{item.month.slice(5)}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#ef476f' }]} />
                  <Text style={styles.legendText}>Expenses</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#2dd4bf' }]} />
                  <Text style={styles.legendText}>Income</Text>
                </View>
              </View>
            </View>

            {/* Category breakdown */}
            {categories.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>SPENDING BY CATEGORY</Text>
                {categories.map((cat, idx) => {
                  const pct = categoryTotal > 0 ? Number(cat.total) / categoryTotal : 0;
                  const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                  return (
                    <View key={cat.category} style={styles.catRow}>
                      <View style={styles.catMeta}>
                        <View style={styles.catLeft}>
                          <View style={[styles.catDot, { backgroundColor: color }]} />
                          <Text style={styles.catName}>{cat.category}</Text>
                        </View>
                        <View style={styles.catRight}>
                          <Text style={styles.catAmount}>${Number(cat.total).toFixed(2)}</Text>
                          <Text style={styles.catPct}>{(pct * 100).toFixed(0)}%</Text>
                        </View>
                      </View>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 32 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },

  // Hero
  hero: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  heroAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 28,
    letterSpacing: -1,
  },
  heroAmountNegative: { color: '#f87171' },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
  },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatLabel: { fontSize: 10, fontWeight: '600', color: '#64748b', letterSpacing: 1.2, marginBottom: 4 },
  heroStatIncome: { fontSize: 16, fontWeight: '700', color: '#2dd4bf' },
  heroStatExpense: { fontSize: 16, fontWeight: '700', color: '#f87171' },
  heroStatDivider: { width: 1, height: 32, backgroundColor: '#334155' },

  // Cards
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: 1.5,
    marginBottom: 16,
  },

  // Empty state
  emptyCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },

  // Chart
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 180,
    marginBottom: 16,
  },
  barGroup: { alignItems: 'center', flex: 1 },
  barRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 12, borderRadius: 6, minHeight: 4 },
  barLabel: { fontSize: 11, color: '#94a3b8', marginTop: 8, fontWeight: '500' },
  legend: { flexDirection: 'row', gap: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: '#64748b', fontWeight: '500' },

  // Categories
  catRow: { marginBottom: 16 },
  catMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  catAmount: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  catPct: { fontSize: 12, color: '#94a3b8', fontWeight: '500', minWidth: 32, textAlign: 'right' },
  barTrack: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
});

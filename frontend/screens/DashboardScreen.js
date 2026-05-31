import React, { useState, useCallback } from 'react';
import {
  ScrollView, View, Text, StyleSheet, ActivityIndicator,
  useWindowDimensions, TouchableOpacity,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';
import { BACKEND_URL } from '../config';

const CATEGORY_COLORS = [
  '#2dd4bf', '#f97316', '#818cf8', '#f59e0b',
  '#c084fc', '#fb7185', '#60a5fa', '#34d399',
];

// Donut chart constants
const D_SIZE = 200;
const D_CX = D_SIZE / 2;
const D_CY = D_SIZE / 2;
const D_RADIUS = 72;
const D_STROKE = 30;
const CIRCUMFERENCE = 2 * Math.PI * D_RADIUS;

function DonutChart({ data, total }) {
  let startFraction = 0;
  return (
    <View style={styles.donutWrapper}>
      <Svg width={D_SIZE} height={D_SIZE}>
        {/* track */}
        <Circle cx={D_CX} cy={D_CY} r={D_RADIUS} fill="none" stroke="#1c1c1e" strokeWidth={D_STROKE} />
        {data.map((item, idx) => {
          const pct = total > 0 ? Number(item.total) / total : 0;
          if (pct === 0) return null;
          const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
          const dash = pct * CIRCUMFERENCE;
          const offset = CIRCUMFERENCE * (0.25 - startFraction);
          startFraction += pct;
          return (
            <Circle
              key={item.category}
              cx={D_CX} cy={D_CY} r={D_RADIUS}
              fill="none"
              stroke={color}
              strokeWidth={D_STROKE}
              strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
              strokeDashoffset={offset}
            />
          );
        })}
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.donutCenter}>
          <Text style={styles.donutAmount} allowFontScaling={false}>
            ${total.toFixed(0)}
          </Text>
          <Text style={styles.donutLabel}>SPENT</Text>
        </View>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const [summary, setSummary] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catView, setCatView] = useState('bars'); // 'bars' | 'pie'
  const { height: screenHeight } = useWindowDimensions();

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
      <SafeAreaView style={styles.screen} edges={['top']}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#2dd4bf" style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      >
        {/* Balance hero */}
        <View style={[styles.hero, { minHeight: screenHeight * 0.38 }]}>
          <Text style={styles.heroLabel}>NET BALANCE</Text>
          <Text style={[styles.heroAmount, net < 0 && styles.heroAmountNeg]} allowFontScaling={false}>
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
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptySubtitle}>Add your first to see your overview</Text>
          </View>
        ) : (
          <>
            {/* Monthly bar chart */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>MONTHLY BREAKDOWN</Text>
              <View style={styles.chartRow}>
                {summary.map((item, idx) => {
                  const expH = ((Number(item.expenses || 0) / maxAmount) * 140) || 4;
                  const incH = ((Number(item.income || 0) / maxAmount) * 140) || 4;
                  return (
                    <View key={idx} style={styles.barGroup}>
                      <View style={styles.barPair}>
                        <View style={[styles.bar, { height: expH, backgroundColor: '#f87171' }]} />
                        <View style={[styles.bar, { height: incH, backgroundColor: '#2dd4bf' }]} />
                      </View>
                      <Text style={styles.barLabel}>{item.month.slice(5)}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#f87171' }]} />
                  <Text style={styles.legendText}>Expenses</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#2dd4bf' }]} />
                  <Text style={styles.legendText}>Income</Text>
                </View>
              </View>
            </View>

            <View style={styles.separator} />

            {/* Category breakdown */}
            {categories.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>SPENDING BY CATEGORY</Text>
                  <View style={styles.toggle}>
                    <TouchableOpacity
                      style={[styles.toggleBtn, catView === 'bars' && styles.toggleBtnActive]}
                      onPress={() => setCatView('bars')}
                    >
                      <Text style={[styles.toggleBtnText, catView === 'bars' && styles.toggleBtnTextActive]}>Bars</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.toggleBtn, catView === 'pie' && styles.toggleBtnActive]}
                      onPress={() => setCatView('pie')}
                    >
                      <Text style={[styles.toggleBtnText, catView === 'pie' && styles.toggleBtnTextActive]}>Pie</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {catView === 'pie' ? (
                  <View style={styles.pieContainer}>
                    <DonutChart data={categories} total={categoryTotal} />
                    <View style={styles.pieLegend}>
                      {categories.map((cat, idx) => (
                        <View key={cat.category} style={styles.pieLegendRow}>
                          <View style={[styles.pieLegendDot, { backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }]} />
                          <Text style={styles.pieLegendName}>{cat.category}</Text>
                          <Text style={styles.pieLegendAmount}>${Number(cat.total).toFixed(2)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  categories.map((cat, idx) => {
                    const pct = categoryTotal > 0 ? Number(cat.total) / categoryTotal : 0;
                    const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                    return (
                      <View key={cat.category} style={styles.catRow}>
                        <View style={styles.catHeader}>
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
                  })
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  scroll: { flex: 1, backgroundColor: '#000000' },

  hero: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  heroLabel: { fontSize: 11, fontWeight: '600', color: '#4b5563', letterSpacing: 1.5, marginBottom: 12 },
  heroAmount: { fontSize: 52, fontWeight: '800', color: '#ffffff', letterSpacing: -1, marginBottom: 32 },
  heroAmountNeg: { color: '#f87171' },
  heroStats: { flexDirection: 'row', backgroundColor: '#1c1c1e', borderRadius: 18, padding: 18 },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatLabel: { fontSize: 10, fontWeight: '600', color: '#4b5563', letterSpacing: 1.2, marginBottom: 6 },
  heroStatIncome: { fontSize: 17, fontWeight: '700', color: '#2dd4bf' },
  heroStatExpense: { fontSize: 17, fontWeight: '700', color: '#f87171' },
  heroStatDivider: { width: 1, height: 36, backgroundColor: '#2c2c2e' },

  emptyContainer: { padding: 32, alignItems: 'center', marginTop: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#ffffff', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#4b5563' },

  separator: { height: 1, backgroundColor: '#1c1c1e', marginHorizontal: 24, marginVertical: 4 },

  section: { paddingHorizontal: 24, paddingVertical: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#4b5563', letterSpacing: 1.5 },

  toggle: { flexDirection: 'row', backgroundColor: '#1c1c1e', borderRadius: 8, padding: 2 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#2c2c2e' },
  toggleBtnText: { fontSize: 12, fontWeight: '600', color: '#4b5563' },
  toggleBtnTextActive: { color: '#ffffff' },

  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 160,
    marginBottom: 16,
  },
  barGroup: { alignItems: 'center', flex: 1 },
  barPair: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 11, borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 10, color: '#4b5563', marginTop: 8, fontWeight: '600' },
  legend: { flexDirection: 'row', gap: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 12, color: '#8e8e93', fontWeight: '500' },

  // Donut chart
  pieContainer: { alignItems: 'center' },
  donutWrapper: { width: D_SIZE, height: D_SIZE },
  donutCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  donutAmount: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  donutLabel: { fontSize: 10, fontWeight: '700', color: '#4b5563', letterSpacing: 1.2, marginTop: 2 },

  pieLegend: { width: '100%', marginTop: 24 },
  pieLegendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  pieLegendDot: { width: 9, height: 9, borderRadius: 5, marginRight: 10 },
  pieLegendName: { flex: 1, fontSize: 14, fontWeight: '500', color: '#ffffff' },
  pieLegendAmount: { fontSize: 14, fontWeight: '700', color: '#ffffff' },

  // Bars view
  catRow: { marginBottom: 18 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catDot: { width: 9, height: 9, borderRadius: 5 },
  catName: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  catAmount: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  catPct: { fontSize: 12, color: '#4b5563', minWidth: 30, textAlign: 'right' },
  barTrack: { height: 4, backgroundColor: '#1c1c1e', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
});

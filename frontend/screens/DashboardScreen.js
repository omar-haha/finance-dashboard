import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { BACKEND_URL } from '../config';

export default function DashboardScreen() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      axios
        .get(`${BACKEND_URL}/summary/monthly`)
        .then((res) => { if (active) setSummary(res.data.reverse()); })
        .catch((err) => console.error('Error loading summary', err.message))
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }, [])
  );

  const totalExpenses = summary.reduce((sum, item) => sum + Number(item.expenses || 0), 0);
  const totalIncome = summary.reduce((sum, item) => sum + Number(item.income || 0), 0);
  const maxAmount = Math.max(
    ...summary.map((item) => Math.max(Number(item.expenses || 0), Number(item.income || 0))),
    1
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : summary.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No transactions yet. Add one to see your summary!</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Monthly Overview</Text>
          <View style={styles.metricsRow}>
            <View style={[styles.metricBox, styles.expenseBox]}>
              <Text style={styles.metricLabel}>Total Expenses</Text>
              <Text style={[styles.metricValue, styles.expenseText]}>-${totalExpenses.toFixed(2)}</Text>
            </View>
            <View style={[styles.metricBox, styles.incomeBox]}>
              <Text style={styles.metricLabel}>Total Income</Text>
              <Text style={[styles.metricValue, styles.incomeText]}>+${totalIncome.toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.netBox}>
            <Text style={styles.metricLabel}>Net Balance</Text>
            <Text style={[styles.netValue, (totalIncome - totalExpenses) >= 0 ? styles.incomeText : styles.expenseText]}>
              {(totalIncome - totalExpenses) >= 0 ? '+' : ''}${(totalIncome - totalExpenses).toFixed(2)}
            </Text>
          </View>
          <Text style={styles.chartTitle}>Income vs Expenses by Month</Text>
          <View style={styles.chartContainer}>
            {summary.map((item, idx) => {
              const expenseHeight = ((Number(item.expenses || 0) / maxAmount) * 180) || 6;
              const incomeHeight = ((Number(item.income || 0) / maxAmount) * 180) || 6;
              return (
                <View key={idx} style={styles.barGroup}>
                  <View style={styles.barRow}>
                    <View style={[styles.bar, { height: expenseHeight, backgroundColor: '#ef476f' }]} />
                    <View style={[styles.bar, { height: incomeHeight, backgroundColor: '#2a9d8f' }]} />
                  </View>
                  <Text style={styles.chartLabel}>{item.month.slice(5)}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: '#ef476f' }]} />
              <Text style={styles.legendText}>Expenses</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: '#2a9d8f' }]} />
              <Text style={styles.legendText}>Income</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eef2f7' },
  content: { padding: 16, paddingBottom: 32 },
  loader: { marginTop: 60 },
  empty: { marginTop: 60, alignItems: 'center' },
  emptyText: { color: '#6b7280', fontSize: 15 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  metricBox: { flex: 1, padding: 14, borderRadius: 14 },
  expenseBox: { backgroundColor: '#fff0f3' },
  incomeBox: { backgroundColor: '#edfaf7' },
  metricLabel: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  metricValue: { fontSize: 18, fontWeight: '700' },
  expenseText: { color: '#ef476f' },
  incomeText: { color: '#2a9d8f' },
  netBox: {
    backgroundColor: '#f4f6fb',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  netValue: { fontSize: 22, fontWeight: '800' },
  chartTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    marginBottom: 12,
  },
  barGroup: { alignItems: 'center', flex: 1 },
  barRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 13, borderRadius: 4, minHeight: 6 },
  chartLabel: { fontSize: 11, color: '#6b7280', marginTop: 6 },
  legend: { flexDirection: 'row', gap: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f3f6' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 12, color: '#4b5563' },
});

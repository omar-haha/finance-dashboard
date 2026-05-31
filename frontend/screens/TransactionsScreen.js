import React, { useState, useCallback } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, TextInput, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { BACKEND_URL } from '../config';

const TYPE_OPTIONS = ['all', 'expense', 'income'];

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [category, setCategory] = useState('');
  const [type, setType] = useState('all');
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [pickerTarget, setPickerTarget] = useState(null);

  const isFiltered = category.trim() || type !== 'all' || from || to;

  const fetchTransactions = useCallback(() => {
    setLoading(true);
    const params = {};
    if (category.trim()) params.category = category.trim();
    if (type !== 'all') params.type = type;
    if (from) params.from = formatDate(from);
    if (to) params.to = formatDate(to);
    axios
      .get(BACKEND_URL, { params })
      .then((res) => setTransactions(res.data))
      .catch((err) => console.error('Error loading transactions', err.message))
      .finally(() => setLoading(false));
  }, [category, type, from, to]);

  useFocusEffect(fetchTransactions);

  const clearFilters = () => { setCategory(''); setType('all'); setFrom(null); setTo(null); };

  const deleteTransaction = async (id) => {
    try {
      await axios.delete(`${BACKEND_URL}/${id}`);
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    } catch (err) {
      console.error('Error deleting transaction', err.message);
    }
  };

  const handleDatePick = (event, date) => {
    if (event.type === 'dismissed' || !date) { setPickerTarget(null); return; }
    if (pickerTarget === 'from') setFrom(date);
    else setTo(date);
    if (Platform.OS === 'android') setPickerTarget(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      {/* Filter toggle */}
      <TouchableOpacity style={styles.filterToggle} onPress={() => setFiltersOpen((v) => !v)} activeOpacity={0.7}>
        <View style={styles.filterToggleLeft}>
          <Text style={styles.filterToggleText}>Filter</Text>
          {isFiltered && <View style={styles.filterActiveDot} />}
        </View>
        {isFiltered ? (
          <TouchableOpacity onPress={clearFilters} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.filterChevron}>{filtersOpen ? '▲' : '▼'}</Text>
        )}
      </TouchableOpacity>

      {filtersOpen && (
        <View style={styles.filterCard}>
          <Text style={styles.filterLabel}>CATEGORY</Text>
          <TextInput
            style={styles.filterInput}
            placeholder="e.g. Food"
            placeholderTextColor="#94a3b8"
            value={category}
            onChangeText={setCategory}
            returnKeyType="search"
            onSubmitEditing={fetchTransactions}
          />

          <Text style={styles.filterLabel}>TYPE</Text>
          <View style={styles.typeRow}>
            {TYPE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.typeChip, type === opt && styles.typeChipActive]}
                onPress={() => setType(opt)}
              >
                <Text style={[styles.typeChipText, type === opt && styles.typeChipTextActive]}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>DATE RANGE</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.dateChip} onPress={() => setPickerTarget('from')}>
              <Text style={[styles.dateChipText, !from && styles.datePlaceholder]}>{from ? formatDate(from) : 'From'}</Text>
            </TouchableOpacity>
            <Text style={styles.dateSep}>—</Text>
            <TouchableOpacity style={styles.dateChip} onPress={() => setPickerTarget('to')}>
              <Text style={[styles.dateChipText, !to && styles.datePlaceholder]}>{to ? formatDate(to) : 'To'}</Text>
            </TouchableOpacity>
          </View>
          {pickerTarget && (
            <DateTimePicker
              value={pickerTarget === 'from' ? (from || new Date()) : (to || new Date())}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDatePick}
            />
          )}
        </View>
      )}

      {/* Transaction list */}
      {loading ? (
        <ActivityIndicator size="large" color="#2a9d8f" style={styles.loader} />
      ) : transactions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{isFiltered ? 'No matches' : 'No transactions yet'}</Text>
          <Text style={styles.emptySubtitle}>{isFiltered ? 'Try adjusting your filters.' : 'Add your first transaction.'}</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            {isFiltered ? `${transactions.length} RESULT${transactions.length !== 1 ? 'S' : ''}` : 'ALL TRANSACTIONS'}
          </Text>
          {transactions.map((tx, idx) => (
            <View key={tx.id} style={[styles.row, idx === transactions.length - 1 && styles.rowLast]}>
              <View style={[styles.typeBar, tx.type === 'expense' ? styles.typeBarExpense : styles.typeBarIncome]} />
              <View style={styles.rowInfo}>
                <Text style={styles.txTitle}>{tx.title}</Text>
                <Text style={styles.txMeta}>{tx.category} · {tx.date}</Text>
              </View>
              <View style={styles.rowActions}>
                <Text style={[styles.txAmount, tx.type === 'expense' ? styles.expenseText : styles.incomeText]}>
                  {tx.type === 'expense' ? '-' : '+'}${Number(tx.amount).toFixed(2)}
                </Text>
                <TouchableOpacity style={styles.deleteButton} onPress={() => deleteTransaction(tx.id)}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 32 },
  loader: { marginTop: 60 },

  filterToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  filterToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterToggleText: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  filterActiveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2a9d8f' },
  filterChevron: { fontSize: 11, color: '#94a3b8' },
  clearText: { fontSize: 13, color: '#ef476f', fontWeight: '600' },

  filterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  filterLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.2, marginBottom: 8, marginTop: 4 },
  filterInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 11,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    marginBottom: 14,
  },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  typeChipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  typeChipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  typeChipTextActive: { color: '#ffffff' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateChip: {
    flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10,
    padding: 11, backgroundColor: '#f8fafc', alignItems: 'center',
  },
  dateChipText: { fontSize: 14, color: '#0f172a', fontWeight: '500' },
  datePlaceholder: { color: '#94a3b8', fontWeight: '400' },
  dateSep: { color: '#94a3b8', fontSize: 16 },

  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginTop: 8,
    elevation: 2,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8' },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    elevation: 3,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  cardLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.5, marginBottom: 12, paddingHorizontal: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowLast: { borderBottomWidth: 0 },
  typeBar: { width: 3, height: 36, borderRadius: 2, marginRight: 12 },
  typeBarExpense: { backgroundColor: '#ef476f' },
  typeBarIncome: { backgroundColor: '#2a9d8f' },
  rowInfo: { flex: 1 },
  rowActions: { alignItems: 'flex-end' },
  txTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  txMeta: { color: '#94a3b8', marginTop: 3, fontSize: 12, fontWeight: '500' },
  txAmount: { fontSize: 15, fontWeight: '700' },
  expenseText: { color: '#ef476f' },
  incomeText: { color: '#2a9d8f' },
  deleteButton: {
    marginTop: 5,
    paddingVertical: 3,
    paddingHorizontal: 10,
    backgroundColor: '#fff0f3',
    borderRadius: 8,
  },
  deleteButtonText: { color: '#ef476f', fontSize: 11, fontWeight: '700' },
});

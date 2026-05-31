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
  const [pickerTarget, setPickerTarget] = useState(null); // 'from' | 'to'

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

  const clearFilters = () => {
    setCategory('');
    setType('all');
    setFrom(null);
    setTo(null);
  };

  const deleteTransaction = async (id) => {
    try {
      await axios.delete(`${BACKEND_URL}/${id}`);
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    } catch (error) {
      console.error('Error deleting transaction', error.message);
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
      {/* Filter bar toggle */}
      <TouchableOpacity style={styles.filterToggle} onPress={() => setFiltersOpen((v) => !v)}>
        <Text style={styles.filterToggleText}>
          {filtersOpen ? 'Hide Filters' : 'Filter'}
          {isFiltered ? '  •' : ''}
        </Text>
        {isFiltered && (
          <TouchableOpacity onPress={clearFilters} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {filtersOpen && (
        <View style={styles.filterCard}>
          <Text style={styles.filterLabel}>Category</Text>
          <TextInput
            style={styles.filterInput}
            placeholder="e.g. Food"
            placeholderTextColor="#b0b7c3"
            value={category}
            onChangeText={setCategory}
            returnKeyType="search"
            onSubmitEditing={fetchTransactions}
          />

          <Text style={styles.filterLabel}>Type</Text>
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

          <Text style={styles.filterLabel}>Date Range</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.dateChip} onPress={() => setPickerTarget('from')}>
              <Text style={[styles.dateChipText, !from && styles.datePlaceholder]}>
                {from ? formatDate(from) : 'From'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.dateSep}>—</Text>
            <TouchableOpacity style={styles.dateChip} onPress={() => setPickerTarget('to')}>
              <Text style={[styles.dateChipText, !to && styles.datePlaceholder]}>
                {to ? formatDate(to) : 'To'}
              </Text>
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

      {/* Results */}
      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : transactions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {isFiltered ? 'No transactions match your filters.' : 'No transactions yet.'}
          </Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {isFiltered ? `${transactions.length} result${transactions.length !== 1 ? 's' : ''}` : 'All Transactions'}
          </Text>
          {transactions.map((tx) => (
            <View key={tx.id} style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.txTitle}>{tx.title}</Text>
                <Text style={styles.txMeta}>{tx.category} • {tx.date}</Text>
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
  container: { flex: 1, backgroundColor: '#eef2f7' },
  content: { padding: 16, paddingBottom: 32 },
  loader: { marginTop: 60 },
  empty: { marginTop: 40, alignItems: 'center' },
  emptyText: { color: '#6b7280', fontSize: 15 },
  filterToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  filterToggleText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  clearText: { fontSize: 13, color: '#ef476f', fontWeight: '600' },
  filterCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  filterLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 4 },
  filterInput: {
    borderWidth: 1,
    borderColor: '#d7dce3',
    borderRadius: 10,
    padding: 11,
    fontSize: 15,
    color: '#1a1a1a',
    backgroundColor: '#fafbff',
    marginBottom: 14,
  },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d7dce3',
    backgroundColor: '#fafbff',
  },
  typeChipActive: { backgroundColor: '#2a9d8f', borderColor: '#2a9d8f' },
  typeChipText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  typeChipTextActive: { color: '#fff' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  dateChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d7dce3',
    borderRadius: 10,
    padding: 11,
    backgroundColor: '#fafbff',
    alignItems: 'center',
  },
  dateChipText: { fontSize: 14, color: '#1a1a1a', fontWeight: '500' },
  datePlaceholder: { color: '#b0b7c3', fontWeight: '400' },
  dateSep: { color: '#9ca3af', fontSize: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f6',
  },
  rowInfo: { flex: 1, paddingRight: 12 },
  rowActions: { alignItems: 'flex-end' },
  txTitle: { fontSize: 15, fontWeight: '600' },
  txMeta: { color: '#7b7f88', marginTop: 3, fontSize: 12 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  expenseText: { color: '#ef476f' },
  incomeText: { color: '#2a9d8f' },
  deleteButton: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#fff0f3',
    borderRadius: 10,
  },
  deleteButtonText: { color: '#ef476f', fontSize: 12, fontWeight: '700' },
});

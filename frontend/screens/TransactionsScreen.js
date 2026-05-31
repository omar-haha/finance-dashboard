import React, { useState, useCallback } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { BACKEND_URL, CATEGORIES_URL } from '../config';

const TYPE_OPTIONS = ['all', 'expense', 'income'];

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateHeader(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d)
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    .toUpperCase();
}

function groupByDate(transactions) {
  const map = {};
  for (const tx of transactions) {
    if (!map[tx.date]) map[tx.date] = [];
    map[tx.date].push(tx);
  }
  return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
}

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [type, setType] = useState('all');
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [pickerTarget, setPickerTarget] = useState(null);

  const isFiltered = selectedCategory || type !== 'all' || from || to;

  useFocusEffect(
    useCallback(() => {
      axios.get(CATEGORIES_URL)
        .then(res => setCategories(res.data))
        .catch(err => console.error('Error loading categories', err.message));
    }, [])
  );

  const fetchTransactions = useCallback(() => {
    setLoading(true);
    const params = {};
    if (selectedCategory) params.category = selectedCategory;
    if (type !== 'all') params.type = type;
    if (from) params.from = formatDate(from);
    if (to) params.to = formatDate(to);
    axios
      .get(BACKEND_URL, { params })
      .then(res => setTransactions(res.data))
      .catch(err => console.error('Error loading transactions', err.message))
      .finally(() => setLoading(false));
  }, [selectedCategory, type, from, to]);

  useFocusEffect(fetchTransactions);

  const clearFilters = () => {
    setSelectedCategory('');
    setType('all');
    setFrom(null);
    setTo(null);
  };

  const confirmDelete = (id) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(id) },
      ]
    );
  };

  const deleteTransaction = async (id) => {
    try {
      await axios.delete(`${BACKEND_URL}/${id}`);
      setTransactions(prev => prev.filter(tx => tx.id !== id));
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

  const groups = groupByDate(transactions);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      overScrollMode="never"
    >
      <StatusBar style="light" />

      {/* Filter toggle row */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.pill, filtersOpen && styles.pillActive]}
          onPress={() => setFiltersOpen(v => !v)}
        >
          <Text style={[styles.pillText, filtersOpen && styles.pillTextActive]}>
            Filters {isFiltered ? '·' : '▾'}
          </Text>
        </TouchableOpacity>
        {isFiltered && (
          <TouchableOpacity style={styles.pill} onPress={clearFilters}>
            <Text style={styles.pillText}>Clear ✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter panel */}
      {filtersOpen && (
        <View style={styles.filterPanel}>

          {/* Category dropdown */}
          <Text style={styles.filterLabel}>CATEGORY</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.catScroll}
            contentContainerStyle={styles.catScrollContent}
          >
            <TouchableOpacity
              style={[styles.catPill, !selectedCategory && styles.catPillActive]}
              onPress={() => setSelectedCategory('')}
            >
              <Text style={[styles.catPillText, !selectedCategory && styles.catPillTextActive]}>All</Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catPill, selectedCategory === cat.name && styles.catPillActive]}
                onPress={() => setSelectedCategory(selectedCategory === cat.name ? '' : cat.name)}
              >
                <Text style={[styles.catPillText, selectedCategory === cat.name && styles.catPillTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Type */}
          <Text style={styles.filterLabel}>TYPE</Text>
          <View style={styles.typeRow}>
            {TYPE_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.typePill, type === opt && styles.typePillActive]}
                onPress={() => setType(opt)}
              >
                <Text style={[styles.typePillText, type === opt && styles.typePillTextActive]}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Date range */}
          <Text style={styles.filterLabel}>DATE RANGE</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.datePill} onPress={() => setPickerTarget('from')}>
              <Text style={[styles.datePillText, !from && styles.datePillPlaceholder]}>
                {from ? formatDate(from) : 'From'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.dateSep}>—</Text>
            <TouchableOpacity style={styles.datePill} onPress={() => setPickerTarget('to')}>
              <Text style={[styles.datePillText, !to && styles.datePillPlaceholder]}>
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

      {/* Transaction list */}
      {loading ? (
        <ActivityIndicator color="#2dd4bf" style={{ marginTop: 60 }} />
      ) : transactions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{isFiltered ? 'No matches' : 'No transactions yet'}</Text>
          <Text style={styles.emptySubtitle}>{isFiltered ? 'Try adjusting your filters.' : 'Add your first transaction.'}</Text>
        </View>
      ) : (
        <>
          {isFiltered && (
            <Text style={styles.resultCount}>
              {transactions.length} result{transactions.length !== 1 ? 's' : ''}
            </Text>
          )}
          {groups.map(([date, items]) => (
            <View key={date}>
              <Text style={styles.dateHeader}>{formatDateHeader(date)}</Text>
              {items.map((tx, idx) => (
                <View key={tx.id} style={[styles.txRow, idx < items.length - 1 && styles.txRowBorder]}>
                  <View style={[styles.txIcon, tx.type === 'expense' ? styles.txIconExpense : styles.txIconIncome]}>
                    <Text style={styles.txIconText}>{tx.category.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txTitle}>{tx.title}</Text>
                    <Text style={styles.txMeta}>{tx.category}</Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, tx.type === 'expense' ? styles.expenseText : styles.incomeText]}>
                      {tx.type === 'expense' ? '–' : '+'} ${Number(tx.amount).toFixed(2)}
                    </Text>
                    <TouchableOpacity onPress={() => confirmDelete(tx.id)}>
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },

  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  pill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#1c1c1e', borderWidth: 1, borderColor: '#2c2c2e',
  },
  pillActive: { backgroundColor: '#2c2c2e', borderColor: '#4b5563' },
  pillText: { fontSize: 13, fontWeight: '600', color: '#8e8e93' },
  pillTextActive: { color: '#ffffff' },

  filterPanel: {
    backgroundColor: '#0f0f0f', borderRadius: 16, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#1c1c1e',
  },
  filterLabel: {
    fontSize: 10, fontWeight: '700', color: '#4b5563',
    letterSpacing: 1.2, marginBottom: 10, marginTop: 4,
  },

  catScroll: { marginBottom: 14 },
  catScrollContent: { gap: 8, paddingBottom: 2 },
  catPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#1c1c1e', borderWidth: 1, borderColor: '#2c2c2e',
  },
  catPillActive: { backgroundColor: '#2dd4bf', borderColor: '#2dd4bf' },
  catPillText: { fontSize: 13, fontWeight: '600', color: '#8e8e93' },
  catPillTextActive: { color: '#000000' },

  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  typePill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1c1c1e',
  },
  typePillActive: { backgroundColor: '#2dd4bf' },
  typePillText: { fontSize: 13, fontWeight: '600', color: '#8e8e93' },
  typePillTextActive: { color: '#000000' },

  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  datePill: {
    flex: 1, backgroundColor: '#1c1c1e', borderRadius: 10, padding: 12, alignItems: 'center',
  },
  datePillText: { fontSize: 14, color: '#ffffff', fontWeight: '500' },
  datePillPlaceholder: { color: '#4b5563' },
  dateSep: { color: '#4b5563', fontSize: 16 },

  empty: { paddingTop: 60, alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#ffffff', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#4b5563' },
  resultCount: { fontSize: 13, color: '#4b5563', fontWeight: '600', marginBottom: 16 },

  dateHeader: {
    fontSize: 11, fontWeight: '700', color: '#4b5563',
    letterSpacing: 1.2, marginTop: 24, marginBottom: 8,
  },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  txRowBorder: { borderBottomWidth: 1, borderBottomColor: '#1c1c1e' },
  txIcon: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  txIconExpense: { backgroundColor: '#2d1515' },
  txIconIncome: { backgroundColor: '#0d2a25' },
  txIconText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 15, fontWeight: '600', color: '#ffffff', marginBottom: 3 },
  txMeta: { fontSize: 13, color: '#4b5563' },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  expenseText: { color: '#f87171' },
  incomeText: { color: '#2dd4bf' },
  deleteText: { fontSize: 11, color: '#4b5563', fontWeight: '600' },
});

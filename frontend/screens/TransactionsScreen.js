import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { BACKEND_URL } from '../config';

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      axios
        .get(BACKEND_URL)
        .then((res) => { if (active) setTransactions(res.data); })
        .catch((err) => console.error('Error loading transactions', err.message))
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }, [])
  );

  const deleteTransaction = async (id) => {
    try {
      await axios.delete(`${BACKEND_URL}/${id}`);
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    } catch (error) {
      console.error('Error deleting transaction', error.message);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {transactions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No transactions yet.</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>All Transactions</Text>
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

import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TextInput, Button, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';

const backendUrl = 'http://192.168.0.132:4000/api/transactions';

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', category: '', amount: '', type: 'expense', date: '' });
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const txRes = await axios.get(backendUrl);
      setTransactions(txRes.data);
      const sumRes = await axios.get(`${backendUrl}/summary/monthly`);
      setSummary(sumRes.data.reverse());
    } catch (error) {
      console.error('Error loading transactions', error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitTransaction = async () => {
    if (!form.title || !form.category || !form.amount || !form.date) return;
    try {
      await axios.post(backendUrl, {
        ...form,
        amount: Number(form.amount),
      });
      setForm({ title: '', category: '', amount: '', type: 'expense', date: '' });
      loadTransactions();
    } catch (error) {
      console.error('Error creating transaction', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Finance Dashboard</Text>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Monthly Summary</Text>
          {loading ? (
            <ActivityIndicator size="large" />
          ) : summary.length > 0 ? (
            <View>
              <View style={styles.chartContainer}>
                {summary.map((item, idx) => {
                  const maxAmount = Math.max(
                    ...summary.map((s) => Math.max(s.expenses || 0, s.income || 0))
                  );
                  const expenseHeight = ((item.expenses || 0) / maxAmount) * 200;
                  const incomeHeight = ((item.income || 0) / maxAmount) * 200;
                  return (
                    <View key={idx} style={styles.barGroup}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                        <View
                          style={[
                            styles.bar,
                            { height: expenseHeight || 10, backgroundColor: '#ff6b6b' },
                          ]}
                        />
                        <View
                          style={[
                            styles.bar,
                            { height: incomeHeight || 10, backgroundColor: '#4caf50' },
                          ]}
                        />
                      </View>
                      <Text style={styles.chartLabel}>{item.month.slice(5)}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.legend}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 12, height: 12, backgroundColor: '#ff6b6b' }} />
                  <Text style={{ fontSize: 12 }}>Expenses</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 12, height: 12, backgroundColor: '#4caf50' }} />
                  <Text style={{ fontSize: 12 }}>Income</Text>
                </View>
              </View>
            </View>
          ) : (
            <Text>No transactions yet. Add one to see your summary!</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Add Transaction</Text>
          <TextInput
            style={styles.input}
            placeholder="Title"
            value={form.title}
            onChangeText={(value) => setForm((prev) => ({ ...prev, title: value }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Category"
            value={form.category}
            onChangeText={(value) => setForm((prev) => ({ ...prev, category: value }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Amount"
            keyboardType="numeric"
            value={form.amount}
            onChangeText={(value) => setForm((prev) => ({ ...prev, amount: value }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Date (YYYY-MM-DD)"
            value={form.date}
            onChangeText={(value) => setForm((prev) => ({ ...prev, date: value }))}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.typeButton, form.type === 'expense' && styles.typeButtonActive]} onPress={() => setForm((prev) => ({ ...prev, type: 'expense' }))}>
              <Text style={styles.typeButtonText}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.typeButton, form.type === 'income' && styles.typeButtonActive]} onPress={() => setForm((prev) => ({ ...prev, type: 'income' }))}>
              <Text style={styles.typeButtonText}>Income</Text>
            </TouchableOpacity>
          </View>
          <Button title="Save Transaction" onPress={submitTransaction} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.slice(0, 8).map((tx) => (
            <View key={tx.id} style={styles.transactionRow}>
              <View>
                <Text style={styles.txTitle}>{tx.title}</Text>
                <Text style={styles.txMeta}>{tx.category} • {tx.date}</Text>
              </View>
              <Text style={[styles.txAmount, tx.type === 'expense' ? styles.expenseText : styles.incomeText]}>
                {tx.type === 'expense' ? '-' : '+'}${Number(tx.amount).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eef2f7' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#d7dce3',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fafbff',
  },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7dce3',
    marginRight: 8,
    alignItems: 'center',
  },
  typeButtonActive: { backgroundColor: '#4caf50', borderColor: '#4caf50' },
  typeButtonText: { color: '#1a1a1a', fontWeight: '600' },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f6',
  },
  txTitle: { fontSize: 16, fontWeight: '600' },
  txMeta: { color: '#7b7f88', marginTop: 4, fontSize: 12 },
  txAmount: { fontSize: 16, fontWeight: '700' },
  expenseText: { color: '#ef476f' },
  incomeText: { color: '#2a9d8f' },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 240,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  barGroup: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 14,
    borderRadius: 4,
    minHeight: 10,
  },
  chartLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 8,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f6',
  },
});
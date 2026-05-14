import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TextInput, Button, StyleSheet, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';
import DatePicker from 'react-native-date-picker';

const backendUrl = 'http://192.168.0.132:4000/api/transactions';

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', category: '', amount: '', type: 'expense', date: '' });
  const [summary, setSummary] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  const handleDateConfirm = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    setForm((prev) => ({ ...prev, date: dateStr }));
    setShowDatePicker(false);
  };

  const openDatePicker = () => {
    if (form.date) {
      const [year, month, day] = form.date.split('-').map(Number);
      setSelectedDate(new Date(year, month - 1, day));
    } else {
      setSelectedDate(new Date());
    }
    setShowDatePicker(true);
  };

  const totalExpenses = summary.reduce((sum, item) => sum + Number(item.expenses || 0), 0);
  const totalIncome = summary.reduce((sum, item) => sum + Number(item.income || 0), 0);
  const maxAmount = Math.max(
    ...summary.map((item) => Math.max(Number(item.expenses || 0), Number(item.income || 0))),
    1
  );

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
              <View style={styles.metricsRow}>
                <View style={[styles.metricBox, styles.expenseBox]}>
                  <Text style={styles.metricLabel}>Total Expenses</Text>
                  <Text style={styles.metricValue}>-${totalExpenses.toFixed(2)}</Text>
                </View>
                <View style={[styles.metricBox, styles.incomeBox]}>
                  <Text style={styles.metricLabel}>Total Income</Text>
                  <Text style={styles.metricValue}>+${totalIncome.toFixed(2)}</Text>
                </View>
              </View>
              <View style={styles.chartContainer}>
                {summary.map((item, idx) => {
                  const expenseHeight = ((Number(item.expenses || 0) / maxAmount) * 200) || 10;
                  const incomeHeight = ((Number(item.income || 0) / maxAmount) * 200) || 10;
                  return (
                    <View key={idx} style={styles.barGroup}>
                      <View style={styles.barRow}>
                        <View
                          style={[
                            styles.bar,
                            { height: expenseHeight, backgroundColor: '#ff6b6b', marginRight: 4 },
                          ]}
                        />
                        <View
                          style={[
                            styles.bar,
                            { height: incomeHeight, backgroundColor: '#4caf50' },
                          ]}
                        />
                      </View>
                      <Text style={styles.chartLabel}>{item.month.slice(5)}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={styles.legendSwatchExpense} />
                  <Text style={styles.legendText}>Expenses</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={styles.legendSwatchIncome} />
                  <Text style={styles.legendText}>Income</Text>
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
          <TouchableOpacity style={styles.dateButton} onPress={openDatePicker}>
            <Text style={styles.dateButtonText}>
              {form.date ? `📅 ${form.date}` : '📅 Select Date'}
            </Text>
          </TouchableOpacity>
          <Modal visible={showDatePicker} transparent={true} animationType="slide">
            <View style={styles.datePickerModal}>
              <View style={styles.datePickerContent}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.datePickerCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerTitle}>Select Date</Text>
                  <TouchableOpacity onPress={() => handleDateConfirm(selectedDate)}>
                    <Text style={styles.datePickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DatePicker
                  date={selectedDate}
                  onDateChange={setSelectedDate}
                  mode="date"
                  textColor="#1a1a1a"
                />
              </View>
            </View>
          </Modal>
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
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  chartLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#f7f9fc',
    marginRight: 12,
  },
  expenseBox: {
    backgroundColor: '#fff0f0',
  },
  incomeBox: {
    backgroundColor: '#effaf4',
    marginRight: 0,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f6',
  },
  legendItem: {
  dateButton: {
    borderWidth: 1,
    borderColor: '#d7dce3',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fafbff',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  datePickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  datePickerContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f6',
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  datePickerCancel: {
    fontSize: 16,
    color: '#999',
  },
  datePickerDone: {
    fontSize: 16,
    color: '#4caf50',
    fontWeight: '600',
  },
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendSwatchExpense: {
    width: 12,
    height: 12,
    backgroundColor: '#ff6b6b',
    borderRadius: 2,
  },
  legendSwatchIncome: {
    width: 12,
    height: 12,
    backgroundColor: '#4caf50',
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#4b5563',
  },
});
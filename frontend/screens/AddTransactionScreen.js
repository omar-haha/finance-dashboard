import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { BACKEND_URL } from '../config';

export default function AddTransactionScreen() {
  const [form, setForm] = useState({ title: '', category: '', amount: '', type: 'expense', date: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [saving, setSaving] = useState(false);

  const openDatePicker = () => {
    if (form.date) {
      const [year, month, day] = form.date.split('-').map(Number);
      setSelectedDate(new Date(year, month - 1, day));
    } else {
      setSelectedDate(new Date());
    }
    setShowDatePicker(true);
  };

  const handleDateChange = (event, date) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      setForm((prev) => ({ ...prev, date: `${year}-${month}-${day}` }));
    }
    if (Platform.OS === 'android') setShowDatePicker(false);
  };

  const submit = async () => {
    if (!form.title || !form.category || !form.amount || !form.date) {
      Alert.alert('Missing fields', 'Please fill in all fields before saving.');
      return;
    }
    setSaving(true);
    try {
      await axios.post(BACKEND_URL, { ...form, amount: Number(form.amount) });
      setForm({ title: '', category: '', amount: '', type: 'expense', date: '' });
      Alert.alert('Saved', 'Transaction added successfully.');
    } catch (error) {
      console.error('Error saving transaction', error.message);
      Alert.alert('Error', 'Could not save transaction. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Grocery run"
          placeholderTextColor="#b0b7c3"
          value={form.title}
          onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
        />

        <Text style={styles.fieldLabel}>Category</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Food, Transport, Rent"
          placeholderTextColor="#b0b7c3"
          value={form.category}
          onChangeText={(v) => setForm((p) => ({ ...p, category: v }))}
        />

        <Text style={styles.fieldLabel}>Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor="#b0b7c3"
          keyboardType="numeric"
          value={form.amount}
          onChangeText={(v) => setForm((p) => ({ ...p, amount: v }))}
        />

        <Text style={styles.fieldLabel}>Date</Text>
        <TouchableOpacity style={styles.dateButton} onPress={openDatePicker}>
          <Text style={[styles.dateButtonText, !form.date && styles.datePlaceholder]}>
            {form.date ? form.date : 'Select a date'}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
          />
        )}

        <Text style={styles.fieldLabel}>Type</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeButton, form.type === 'expense' && styles.typeButtonExpense]}
            onPress={() => setForm((p) => ({ ...p, type: 'expense' }))}
          >
            <Text style={[styles.typeButtonText, form.type === 'expense' && styles.typeButtonTextExpense]}>
              Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, form.type === 'income' && styles.typeButtonIncome]}
            onPress={() => setForm((p) => ({ ...p, type: 'income' }))}
          >
            <Text style={[styles.typeButtonText, form.type === 'income' && styles.typeButtonTextIncome]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={submit} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Transaction'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eef2f7' },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d7dce3',
    borderRadius: 12,
    padding: 13,
    marginBottom: 14,
    backgroundColor: '#fafbff',
    fontSize: 15,
    color: '#1a1a1a',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#d7dce3',
    borderRadius: 12,
    padding: 13,
    marginBottom: 14,
    backgroundColor: '#fafbff',
  },
  dateButtonText: { fontSize: 15, color: '#1a1a1a', fontWeight: '500' },
  datePlaceholder: { color: '#b0b7c3', fontWeight: '400' },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  typeButton: {
    flex: 1,
    padding: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7dce3',
    alignItems: 'center',
    backgroundColor: '#fafbff',
  },
  typeButtonExpense: { backgroundColor: '#fff0f3', borderColor: '#ef476f' },
  typeButtonIncome: { backgroundColor: '#edfaf7', borderColor: '#2a9d8f' },
  typeButtonText: { fontWeight: '600', color: '#9ca3af', fontSize: 15 },
  typeButtonTextExpense: { color: '#ef476f' },
  typeButtonTextIncome: { color: '#2a9d8f' },
  saveButton: {
    backgroundColor: '#2a9d8f',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

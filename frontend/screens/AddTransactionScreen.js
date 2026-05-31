import React, { useState, useCallback } from 'react';
import {
  ScrollView, View, Text, TextInput, StyleSheet, TouchableOpacity,
  Platform, Alert, Modal, FlatList, KeyboardAvoidingView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { BACKEND_URL, CATEGORIES_URL } from '../config';

export default function AddTransactionScreen() {
  const [form, setForm] = useState({ title: '', category: '', amount: '', type: 'expense', date: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingNew, setAddingNew] = useState(false);

  useFocusEffect(
    useCallback(() => {
      axios.get(CATEGORIES_URL)
        .then((res) => setCategories(res.data))
        .catch((err) => console.error('Error loading categories', err.message));
    }, [])
  );

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
    if (event.type === 'dismissed') { setShowDatePicker(false); return; }
    if (date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      setForm((p) => ({ ...p, date: `${y}-${m}-${d}` }));
    }
    if (Platform.OS === 'android') setShowDatePicker(false);
  };

  const selectCategory = (name) => {
    setForm((p) => ({ ...p, category: name }));
    setShowCategoryModal(false);
    setAddingNew(false);
    setNewCategoryName('');
  };

  const saveNewCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      const { data } = await axios.post(CATEGORIES_URL, { name });
      setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      selectCategory(data.name);
    } catch (err) {
      if (err.response?.status === 409) {
        Alert.alert('Already exists', `"${name}" is already a category.`);
      } else {
        Alert.alert('Error', 'Could not save category.');
      }
    }
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
      Alert.alert('Error', 'Could not save transaction. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
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
          <TouchableOpacity style={styles.pickerButton} onPress={() => setShowCategoryModal(true)}>
            <Text style={[styles.pickerButtonText, !form.category && styles.placeholder]}>
              {form.category || 'Select a category'}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

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
          <TouchableOpacity style={styles.pickerButton} onPress={openDatePicker}>
            <Text style={[styles.pickerButtonText, !form.date && styles.placeholder]}>
              {form.date || 'Select a date'}
            </Text>
            <Text style={styles.chevron}>›</Text>
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

      {/* Category picker modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide" onRequestClose={() => setShowCategoryModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => { setShowCategoryModal(false); setAddingNew(false); setNewCategoryName(''); }} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Select Category</Text>

          {categories.length === 0 && !addingNew ? (
            <Text style={styles.emptyText}>No categories yet. Add your first one below.</Text>
          ) : (
            <FlatList
              data={categories}
              keyExtractor={(item) => String(item.id)}
              style={styles.categoryList}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.categoryOption} onPress={() => selectCategory(item.name)}>
                  <Text style={styles.categoryOptionText}>{item.name}</Text>
                  {form.category === item.name && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}

          <View style={styles.modalFooter}>
            {addingNew ? (
              <View style={styles.newCategoryRow}>
                <TextInput
                  style={styles.newCategoryInput}
                  placeholder="Category name"
                  placeholderTextColor="#b0b7c3"
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={saveNewCategory}
                />
                <TouchableOpacity style={styles.saveNewButton} onPress={saveNewCategory}>
                  <Text style={styles.saveNewButtonText}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelNewButton} onPress={() => { setAddingNew(false); setNewCategoryName(''); }}>
                  <Text style={styles.cancelNewButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addNewButton} onPress={() => setAddingNew(true)}>
                <Text style={styles.addNewButtonText}>+ New Category</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
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
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 4 },
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
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d7dce3',
    borderRadius: 12,
    padding: 13,
    marginBottom: 14,
    backgroundColor: '#fafbff',
  },
  pickerButtonText: { fontSize: 15, color: '#1a1a1a', fontWeight: '500' },
  placeholder: { color: '#b0b7c3', fontWeight: '400' },
  chevron: { fontSize: 20, color: '#9ca3af', lineHeight: 22 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  typeButton: {
    flex: 1, padding: 13, borderRadius: 12, borderWidth: 1,
    borderColor: '#d7dce3', alignItems: 'center', backgroundColor: '#fafbff',
  },
  typeButtonExpense: { backgroundColor: '#fff0f3', borderColor: '#ef476f' },
  typeButtonIncome: { backgroundColor: '#edfaf7', borderColor: '#2a9d8f' },
  typeButtonText: { fontWeight: '600', color: '#9ca3af', fontSize: 15 },
  typeButtonTextExpense: { color: '#ef476f' },
  typeButtonTextIncome: { color: '#2a9d8f' },
  saveButton: { backgroundColor: '#2a9d8f', borderRadius: 12, padding: 15, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: '#d7dce3', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  emptyText: { color: '#9ca3af', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  categoryList: { maxHeight: 300 },
  categoryOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 4,
  },
  categoryOptionText: { fontSize: 16, color: '#1a1a1a' },
  checkmark: { fontSize: 16, color: '#2a9d8f', fontWeight: '700' },
  separator: { height: 1, backgroundColor: '#f1f3f6' },
  modalFooter: { paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f3f6', marginTop: 8 },
  addNewButton: { paddingVertical: 14, alignItems: 'center' },
  addNewButtonText: { fontSize: 15, fontWeight: '600', color: '#2a9d8f' },
  newCategoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  newCategoryInput: {
    flex: 1, borderWidth: 1, borderColor: '#d7dce3', borderRadius: 10,
    padding: 11, fontSize: 15, color: '#1a1a1a', backgroundColor: '#fafbff',
  },
  saveNewButton: { backgroundColor: '#2a9d8f', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11 },
  saveNewButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cancelNewButton: { paddingHorizontal: 8, paddingVertical: 11 },
  cancelNewButtonText: { color: '#9ca3af', fontSize: 14 },
});

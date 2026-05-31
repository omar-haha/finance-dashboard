import React, { useState, useCallback } from 'react';
import {
  ScrollView, View, Text, TextInput, StyleSheet, TouchableOpacity,
  Platform, Alert, Modal, FlatList, KeyboardAvoidingView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
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
    setSelectedDate(form.date ? new Date(...form.date.split('-').map((v, i) => i === 1 ? Number(v) - 1 : Number(v))) : new Date());
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
      Alert.alert(
        err.response?.status === 409 ? 'Already exists' : 'Error',
        err.response?.status === 409 ? `"${name}" is already a category.` : 'Could not save category.'
      );
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
    } catch {
      Alert.alert('Error', 'Could not save transaction. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <StatusBar style="dark" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>TITLE</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Grocery run"
            placeholderTextColor="#94a3b8"
            value={form.title}
            onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
          />

          <Text style={styles.fieldLabel}>CATEGORY</Text>
          <TouchableOpacity style={styles.pickerRow} onPress={() => setShowCategoryModal(true)}>
            <Text style={[styles.pickerText, !form.category && styles.pickerPlaceholder]}>
              {form.category || 'Select a category'}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <Text style={styles.fieldLabel}>AMOUNT</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            value={form.amount}
            onChangeText={(v) => setForm((p) => ({ ...p, amount: v }))}
          />

          <Text style={styles.fieldLabel}>DATE</Text>
          <TouchableOpacity style={styles.pickerRow} onPress={openDatePicker}>
            <Text style={[styles.pickerText, !form.date && styles.pickerPlaceholder]}>
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

          <Text style={styles.fieldLabel}>TYPE</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeButton, form.type === 'expense' && styles.typeButtonExpense]}
              onPress={() => setForm((p) => ({ ...p, type: 'expense' }))}
            >
              <Text style={[styles.typeButtonText, form.type === 'expense' && styles.typeButtonTextExpense]}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, form.type === 'income' && styles.typeButtonIncome]}
              onPress={() => setForm((p) => ({ ...p, type: 'income' }))}
            >
              <Text style={[styles.typeButtonText, form.type === 'income' && styles.typeButtonTextIncome]}>Income</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={submit} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save Transaction'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showCategoryModal} transparent animationType="slide" onRequestClose={() => setShowCategoryModal(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => { setShowCategoryModal(false); setAddingNew(false); setNewCategoryName(''); }} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Category</Text>
          {categories.length === 0 && !addingNew && (
            <Text style={styles.sheetEmpty}>No categories yet. Add your first one below.</Text>
          )}
          <FlatList
            data={categories}
            keyExtractor={(item) => String(item.id)}
            style={styles.catList}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.catOption} onPress={() => selectCategory(item.name)}>
                <Text style={styles.catOptionText}>{item.name}</Text>
                {form.category === item.name && <Text style={styles.catCheck}>✓</Text>}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.catSep} />}
          />
          <View style={styles.sheetFooter}>
            {addingNew ? (
              <View style={styles.newRow}>
                <TextInput
                  style={styles.newInput}
                  placeholder="Category name"
                  placeholderTextColor="#94a3b8"
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={saveNewCategory}
                />
                <TouchableOpacity style={styles.newSaveBtn} onPress={saveNewCategory}>
                  <Text style={styles.newSaveBtnText}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setAddingNew(false); setNewCategoryName(''); }} style={styles.newCancelBtn}>
                  <Text style={styles.newCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addNewBtn} onPress={() => setAddingNew(true)}>
                <Text style={styles.addNewBtnText}>+ New Category</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.2, marginBottom: 8, marginTop: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
    backgroundColor: '#f8fafc',
    fontSize: 15,
    color: '#0f172a',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
    backgroundColor: '#f8fafc',
  },
  pickerText: { fontSize: 15, color: '#0f172a', fontWeight: '500' },
  pickerPlaceholder: { color: '#94a3b8', fontWeight: '400' },
  chevron: { fontSize: 22, color: '#94a3b8', lineHeight: 24 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 24, marginTop: 4 },
  typeButton: {
    flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5,
    borderColor: '#e2e8f0', alignItems: 'center', backgroundColor: '#f8fafc',
  },
  typeButtonExpense: { backgroundColor: '#fff0f3', borderColor: '#ef476f' },
  typeButtonIncome: { backgroundColor: '#edfaf7', borderColor: '#2a9d8f' },
  typeButtonText: { fontWeight: '700', color: '#94a3b8', fontSize: 15 },
  typeButtonTextExpense: { color: '#ef476f' },
  typeButtonTextIncome: { color: '#2a9d8f' },
  saveButton: { backgroundColor: '#0f172a', borderRadius: 14, padding: 16, alignItems: 'center' },
  saveButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },
  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)' },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: '70%',
  },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginTop: 14, marginBottom: 18 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  sheetEmpty: { color: '#94a3b8', fontSize: 14, textAlign: 'center', paddingVertical: 24 },
  catList: { maxHeight: 300 },
  catOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 2 },
  catOptionText: { fontSize: 16, color: '#0f172a', fontWeight: '500' },
  catCheck: { fontSize: 16, color: '#2a9d8f', fontWeight: '700' },
  catSep: { height: 1, backgroundColor: '#f1f5f9' },
  sheetFooter: { paddingTop: 14, borderTopWidth: 1, borderTopColor: '#f1f5f9', marginTop: 4 },
  addNewBtn: { paddingVertical: 14, alignItems: 'center' },
  addNewBtnText: { fontSize: 15, fontWeight: '700', color: '#2a9d8f' },
  newRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  newInput: {
    flex: 1, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    padding: 12, fontSize: 15, color: '#0f172a', backgroundColor: '#f8fafc',
  },
  newSaveBtn: { backgroundColor: '#0f172a', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  newSaveBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  newCancelBtn: { paddingHorizontal: 6, paddingVertical: 12 },
  newCancelText: { color: '#94a3b8', fontSize: 14 },
});

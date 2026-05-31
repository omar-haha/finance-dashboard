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
    if (form.date) {
      const [y, m, d] = form.date.split('-').map(Number);
      setSelectedDate(new Date(y, m - 1, d));
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

  const confirmDeleteCategory = (id, name) => {
    Alert.alert(
      'Delete Category',
      `Delete "${name}"? Existing transactions won't be affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${CATEGORIES_URL}/${id}`);
              setCategories(prev => prev.filter(c => c.id !== id));
              if (form.category === name) setForm(p => ({ ...p, category: '' }));
            } catch {
              Alert.alert('Error', 'Could not delete category.');
            }
          },
        },
      ]
    );
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
      <StatusBar style="light" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        overScrollMode="never"
      >
        <Text style={styles.fieldLabel}>TITLE</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Grocery run"
          placeholderTextColor="#4b5563"
          value={form.title}
          onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
        />

        <Text style={styles.fieldLabel}>CATEGORY</Text>
        <TouchableOpacity style={styles.selectRow} onPress={() => setShowCategoryModal(true)}>
          <Text style={[styles.selectText, !form.category && styles.selectPlaceholder]}>
            {form.category || 'Select a category'}
          </Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <Text style={styles.fieldLabel}>AMOUNT</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor="#4b5563"
          keyboardType="numeric"
          value={form.amount}
          onChangeText={(v) => setForm((p) => ({ ...p, amount: v }))}
        />

        <Text style={styles.fieldLabel}>DATE</Text>
        <TouchableOpacity style={styles.selectRow} onPress={openDatePicker}>
          <Text style={[styles.selectText, !form.date && styles.selectPlaceholder]}>
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
            style={[styles.typeBtn, form.type === 'expense' && styles.typeBtnExpense]}
            onPress={() => setForm((p) => ({ ...p, type: 'expense' }))}
          >
            <Text style={[styles.typeBtnText, form.type === 'expense' && styles.typeBtnTextExpense]}>Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, form.type === 'income' && styles.typeBtnIncome]}
            onPress={() => setForm((p) => ({ ...p, type: 'income' }))}
          >
            <Text style={[styles.typeBtnText, form.type === 'income' && styles.typeBtnTextIncome]}>Income</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={submit} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Transaction'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showCategoryModal} transparent animationType="slide" onRequestClose={() => { setShowCategoryModal(false); setAddingNew(false); setNewCategoryName(''); }}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => { setShowCategoryModal(false); setAddingNew(false); setNewCategoryName(''); }} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Category</Text>
          {categories.length === 0 && !addingNew && (
            <Text style={styles.sheetEmpty}>No categories yet. Add your first below.</Text>
          )}
          <FlatList
            data={categories}
            keyExtractor={(item) => String(item.id)}
            style={styles.catList}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.catOption} onPress={() => selectCategory(item.name)}>
                <Text style={styles.catOptionText}>{item.name}</Text>
                <View style={styles.catOptionActions}>
                  {form.category === item.name && <Text style={styles.catCheck}>✓</Text>}
                  <TouchableOpacity
                    onPress={() => confirmDeleteCategory(item.id, item.name)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.catDeleteBtn}
                  >
                    <Text style={styles.catDeleteText}>✕</Text>
                  </TouchableOpacity>
                </View>
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
                  placeholderTextColor="#4b5563"
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={saveNewCategory}
                />
                <TouchableOpacity style={styles.newSaveBtn} onPress={saveNewCategory}>
                  <Text style={styles.newSaveBtnText}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setAddingNew(false); setNewCategoryName(''); }}>
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
  container: { flex: 1, backgroundColor: '#000000' },
  content: { padding: 20, paddingBottom: 40 },

  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4b5563',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#ffffff',
  },
  selectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
  },
  selectText: { fontSize: 15, color: '#ffffff', fontWeight: '500' },
  selectPlaceholder: { color: '#4b5563', fontWeight: '400' },
  chevron: { fontSize: 22, color: '#4b5563', lineHeight: 24 },

  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
  },
  typeBtnExpense: { backgroundColor: '#2d1515' },
  typeBtnIncome: { backgroundColor: '#0d2a25' },
  typeBtnText: { fontWeight: '700', color: '#4b5563', fontSize: 15 },
  typeBtnTextExpense: { color: '#f87171' },
  typeBtnTextIncome: { color: '#2dd4bf' },

  saveBtn: {
    backgroundColor: '#2dd4bf',
    borderRadius: 14,
    padding: 17,
    alignItems: 'center',
    marginTop: 32,
  },
  saveBtnText: { color: '#000000', fontWeight: '800', fontSize: 16 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: {
    backgroundColor: '#0f0f0f',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: '70%',
    borderTopWidth: 1,
    borderColor: '#1c1c1e',
  },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#2c2c2e', borderRadius: 2, alignSelf: 'center', marginTop: 14, marginBottom: 18 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff', marginBottom: 12 },
  sheetEmpty: { color: '#4b5563', fontSize: 14, textAlign: 'center', paddingVertical: 24 },
  catList: { maxHeight: 300 },
  catOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15 },
  catOptionText: { fontSize: 16, color: '#ffffff', fontWeight: '500', flex: 1 },
  catOptionActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catCheck: { fontSize: 16, color: '#2dd4bf', fontWeight: '700' },
  catDeleteBtn: { padding: 2 },
  catDeleteText: { fontSize: 14, color: '#4b5563', fontWeight: '600' },
  catSep: { height: 1, backgroundColor: '#1c1c1e' },
  sheetFooter: { paddingTop: 14, borderTopWidth: 1, borderTopColor: '#1c1c1e', marginTop: 4 },
  addNewBtn: { paddingVertical: 14, alignItems: 'center' },
  addNewBtnText: { fontSize: 15, fontWeight: '700', color: '#2dd4bf' },
  newRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  newInput: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#ffffff',
  },
  newSaveBtn: { backgroundColor: '#2dd4bf', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  newSaveBtnText: { color: '#000000', fontWeight: '800', fontSize: 14 },
  newCancelText: { color: '#4b5563', fontSize: 14, paddingHorizontal: 6, paddingVertical: 12 },
});

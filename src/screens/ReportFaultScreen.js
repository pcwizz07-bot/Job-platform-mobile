import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { api } from '../services/api';

export default function ReportFaultScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert('Required', 'Title is required');
    setBusy(true);
    try {
      await api.reportFault({ title, fault_description: description });
      Alert.alert('Submitted', 'Your fault has been reported. The team will be notified.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) { Alert.alert('Error', e.message); }
    setBusy(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📢 Report a Fault</Text>
      <Text style={styles.subtitle}>Report an issue or query to the service team</Text>

      <TextInput style={styles.input} placeholder="Brief title of the issue" placeholderTextColor="#666"
        value={title} onChangeText={setTitle} />
      <TextInput style={styles.textArea} placeholder="Describe the fault in detail..." placeholderTextColor="#666"
        value={description} onChangeText={setDescription} multiline numberOfLines={6} />

      <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Report</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117', padding: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#e4e6f0', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#8b8fa3', marginBottom: 20 },
  input: { backgroundColor: '#232734', borderWidth: 1, borderColor: '#2d3140', borderRadius: 8,
    padding: 12, fontSize: 16, color: '#e4e6f0', marginBottom: 12 },
  textArea: { backgroundColor: '#232734', borderWidth: 1, borderColor: '#2d3140', borderRadius: 8,
    padding: 12, fontSize: 14, color: '#e4e6f0', minHeight: 120, textAlignVertical: 'top', marginBottom: 20 },
  btn: { backgroundColor: '#ef4444', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 12 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', padding: 10 },
  cancelText: { color: '#8b8fa3', fontSize: 14 },
});
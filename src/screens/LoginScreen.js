import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { api } from '../services/api';

export default function LoginScreen({ navigation, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step2FA, setStep2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [code, setCode] = useState('');

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Email and password required');
    setLoading(true);
    try {
      const res = await api.login(email, password);
      if (res.requires_2fa) {
        setTempToken(res.temp_token);
        setStep2FA(true);
      } else {
        await api.saveToken(res.token);
        await api.saveUser(res.user);
        onLogin(res.user, res.token);
      }
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    }
    setLoading(false);
  };

  const handle2FA = async () => {
    if (!code) return Alert.alert('Error', 'Enter verification code');
    setLoading(true);
    try {
      const res = await api.verify2fa(tempToken, code);
      await api.saveToken(res.token);
      await api.saveUser(res.user);
      onLogin(res.user, res.token);
    } catch (err) {
      Alert.alert('2FA Failed', err.message);
    }
    setLoading(false);
  };

  if (step2FA) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Two-Factor Auth</Text>
          <Text style={styles.subtitle}>Enter code from authenticator app</Text>
          <TextInput style={styles.input} placeholder="000000" placeholderTextColor="#666"
            value={code} onChangeText={setCode} maxLength={6} keyboardType="number-pad" />
          <TouchableOpacity style={styles.button} onPress={handle2FA} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>⚡</Text>
        <Text style={styles.title}>JobBoard</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#666"
          value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#666"
          value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#1a1d27', borderRadius: 16, padding: 32, borderWidth: 1, borderColor: '#2d3140' },
  logo: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#e4e6f0', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#8b8fa3', textAlign: 'center', marginBottom: 24 },
  input: { backgroundColor: '#232734', borderWidth: 1, borderColor: '#2d3140', borderRadius: 8,
    padding: 12, fontSize: 16, color: '#e4e6f0', marginBottom: 12 },
  button: { backgroundColor: '#6366f1', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
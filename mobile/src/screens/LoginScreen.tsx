import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { login, register } from '../api/client';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        await register(email, password, fullName, phone || undefined);
      } else {
        await login(email, password);
      }
      navigation.replace('Dashboard');
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏠 عقاراتي</Text>
      <Text style={styles.subtitle}>{isRegister ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}</Text>
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      {isRegister && (
        <>
          <TextInput style={styles.input} placeholder="الاسم الكامل" placeholderTextColor="#666" value={fullName} onChangeText={setFullName} />
          <TextInput style={styles.input} placeholder="رقم الجوال (اختياري)" placeholderTextColor="#666" value={phone} onChangeText={setPhone} />
        </>
      )}
      <TextInput style={styles.input} placeholder="البريد الإلكتروني" placeholderTextColor="#666" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="كلمة المرور" placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry />
      
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isRegister ? 'إنشاء حساب' : 'دخول'}</Text>}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
        <Text style={styles.switchText}>{isRegister ? 'لديك حساب؟ سجل دخول' : 'ليس لديك حساب؟ أنشئ حساباً'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020907', justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32 },
  input: { backgroundColor: '#0a1510', borderRadius: 12, padding: 16, color: '#fff', fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1e3028' },
  button: { backgroundColor: '#10b981', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  error: { color: '#ef4444', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  switchText: { color: '#10b981', fontSize: 14, textAlign: 'center', marginTop: 24 },
});

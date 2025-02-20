import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function UpdatePasswordScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  async function handleUpdatePassword() {
    if (!formData.password || !formData.confirmPassword) {
      Alert.alert('خطأ', 'الرجاء إدخال كلمة المرور وتأكيدها');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('خطأ', 'كلمات المرور غير متطابقة');
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) {
        Alert.alert('خطأ', error.message);
        return;
      }

      Alert.alert(
        'تم تحديث كلمة المرور',
        'يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة',
        [
          {
            text: 'تسجيل الدخول',
            onPress: () => router.replace('/(auth)/login')
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('خطأ', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>يوني جو | UniGo</Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>تحديث كلمة المرور</Text>
            <Text style={styles.subtitle}>الرجاء إدخال كلمة المرور الجديدة</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="lock-outline" size={24} color="#666" />
              <TextInput 
                placeholder="كلمة المرور الجديدة"
                style={styles.input}
                placeholderTextColor="#666"
                secureTextEntry
                value={formData.password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="lock-check-outline" size={24} color="#666" />
              <TextInput 
                placeholder="تأكيد كلمة المرور"
                style={styles.input}
                placeholderTextColor="#666"
                secureTextEntry
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
              />
            </View>

            <TouchableOpacity 
              style={[styles.updateButton, loading && styles.disabledButton]}
              onPress={handleUpdatePassword}
              disabled={loading}
            >
              <Text style={styles.updateButtonText}>
                {loading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
  },
  logo: {
    fontSize: 20,
    fontWeight: '600',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    padding: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    textAlign: 'right',
  },
  updateButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
}); 
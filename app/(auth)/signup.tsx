import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

export default function SignupScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    username: '',
    collegeId: ''
  });

  async function handleSignup() {
    try {
      // Validate inputs
      if (!formData.email || !formData.password || !formData.username || !formData.fullName || !formData.collegeId) {
        Alert.alert('خطأ', 'الرجاء إدخال جميع البيانات المطلوبة');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        Alert.alert('خطأ', 'كلمات المرور غير متطابقة');
        return;
      }

      if (formData.username.length < 3) {
        Alert.alert('خطأ', 'يجب أن يكون اسم المستخدم 3 أحرف على الأقل');
        return;
      }

      // Validate college ID format (8-10 digits)
      if (!/^[0-9]{8,10}$/.test(formData.collegeId.trim())) {
        Alert.alert('خطأ', 'الرقم الجامعي يجب أن يكون من 8 إلى 10 أرقام');
        return;
      }

      // Example: 202310649
      if (!formData.collegeId.startsWith('202')) {
        Alert.alert('خطأ', 'الرقم الجامعي يجب أن يبدأ بـ 202');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        Alert.alert('خطأ', 'الرجاء إدخال بريد إلكتروني صحيح');
        return;
      }

      setLoading(true);

      // Check if username already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', formData.username.trim())
        .single();

      if (existingUser) {
        Alert.alert('خطأ', 'اسم المستخدم مستخدم بالفعل');
        setLoading(false);
        return;
      }

      // Sign up the user with all metadata at once
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            username: formData.username.trim(),
            full_name: formData.fullName.trim(),
            college_id: formData.collegeId.trim(),
            gender: 'other', // Default value, can be updated later
            tempPassword: formData.password, // For auto-fill in login
            name: formData.fullName.trim(), // Duplicate for compatibility
            collegeId: formData.collegeId.trim() // Duplicate for compatibility
          },
          emailRedirectTo: 'unigo://login' // Deep link URL for the app
        }
      });

      if (error) {
        console.error('Signup error:', error);
        Alert.alert('خطأ في التسجيل', error.message);
        setLoading(false);
        return;
      }

      if (!data?.user) {
        Alert.alert('خطأ', 'فشل في إنشاء الحساب');
        setLoading(false);
        return;
      }

      // Let the trigger handle profile creation
      Alert.alert(
        'تم إنشاء الحساب بنجاح',
        'تم إرسال رابط التفعيل إلى بريدك الإلكتروني',
        [
          {
            text: 'حسناً',
            onPress: () => {
              setLoading(false);
              router.replace('/(auth)/login');
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('Signup error:', error);
      Alert.alert('خطأ غير متوقع', error.message || 'حدث خطأ أثناء التسجيل');
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
          <Text style={styles.logo}>UniGO | يوني جو</Text>
          <TouchableOpacity style={styles.languageButton}>
            <MaterialCommunityIcons name="translate" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Text */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>إنشاء حساب</Text>
            <Text style={styles.welcomeSubtitle}>أدخل بياناتك للتسجيل</Text>
          </View>

          {/* Signup Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="account" size={24} color="#666" />
              <TextInput 
                placeholder="الاسم الكامل"
                style={styles.input}
                placeholderTextColor="#666"
                value={formData.fullName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="account-circle" size={24} color="#666" />
              <TextInput 
                placeholder="اسم المستخدم"
                style={styles.input}
                placeholderTextColor="#666"
                autoCapitalize="none"
                value={formData.username}
                onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="card-account-details" size={24} color="#666" />
              <TextInput 
                placeholder="الرقم الجامعي (مثال: 202310649)"
                style={styles.input}
                placeholderTextColor="#666"
                keyboardType="numeric"
                maxLength={10}
                value={formData.collegeId}
                onChangeText={(text) => {
                  // Only allow numbers
                  if (/^\d*$/.test(text)) {
                    setFormData(prev => ({ ...prev, collegeId: text }))
                  }
                }}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="email-outline" size={24} color="#666" />
              <TextInput 
                placeholder="البريد الجامعي"
                style={styles.input}
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="lock-outline" size={24} color="#666" />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
              >
                <MaterialCommunityIcons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={24} 
                  color="#666" 
                />
              </TouchableOpacity>
              <TextInput 
                placeholder="كلمة المرور"
                style={styles.input}
                placeholderTextColor="#666"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="lock-check-outline" size={24} color="#666" />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.passwordToggle}
              >
                <MaterialCommunityIcons 
                  name={showConfirmPassword ? "eye-off" : "eye"} 
                  size={24} 
                  color="#666" 
                />
              </TouchableOpacity>
              <TextInput 
                placeholder="تأكيد كلمة المرور"
                style={styles.input}
                placeholderTextColor="#666"
                secureTextEntry={!showConfirmPassword}
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
              />
            </View>

            <TouchableOpacity 
              style={[styles.signupButton, loading && styles.disabledButton]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.signupButtonText}>
                {loading ? 'جاري التسجيل...' : 'إنشاء حساب'}
              </Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>لديك حساب بالفعل؟</Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.loginLink}>تسجيل الدخول</Text>
                </TouchableOpacity>
              </Link>
            </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
  },
  logo: {
    fontSize: 20,
    fontWeight: '600',
  },
  languageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#666',
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
    marginLeft: 4,
    fontSize: 16,
    textAlign: 'right',
  },
  signupButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.7,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#000',
    fontSize: 14,
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
  passwordToggle: {
    padding: 8,
    marginLeft: 8,
  },
}); 
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '', // Can be either email or username
    password: '',
    rememberMe: false,
  });

  // Check for auto-fill data from signup
  useEffect(() => {
    const checkAutoFill = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user?.email) {
          setFormData(prev => ({
            ...prev,
            identifier: sessionData.session.user.email,
            password: sessionData.session.user.user_metadata?.tempPassword || ''
          }));
        }
      } catch (error) {
        console.log('Auto-fill check error:', error);
      }
    };
    checkAutoFill();
  }, []);

  async function handleLogin() {
    try {
      setLoading(true);
      
      // First try to find the user by username if the identifier is not an email
      const isEmail = formData.identifier.includes('@');
      let email = formData.identifier;

      if (!isEmail) {
        // If not an email, look up the email by username
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email, username')
          .eq('username', formData.identifier.trim())
          .single();

        if (profileError || !profileData?.email) {
          Alert.alert('خطأ', 'اسم المستخدم غير موجود');
          setLoading(false);
          return;
        }

        email = profileData.email;
      }

      // Check if email is verified
      const { data: userData, error: userError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: formData.password,
      });

      if (userError) {
        Alert.alert('خطأ', userError.message);
        return;
      }

      // Check if email is verified
      if (userData.user && !userData.user.email_confirmed_at) {
        Alert.alert(
          'تنبيه',
          'يجب تفعيل الحساب من الايميل',
          [
            {
              text: 'إعادة إرسال رابط التفعيل',
              onPress: async () => {
                try {
                  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
                  if (error) throw error;
                  Alert.alert('تم', 'تم إرسال رابط التفعيل مرة أخرى');
                } catch (error: any) {
                  Alert.alert('خطأ', error.message);
                }
              }
            },
            { text: 'حسناً', style: 'cancel' }
          ]
        );
        // Sign out the unverified user
        await supabase.auth.signOut();
        return;
      }

      // On successful login, redirect to home
      router.replace('/(app)/home');
      
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
            <Text style={styles.welcomeTitle}>مرحباً بك</Text>
            <Text style={styles.welcomeSubtitle}>سجل دخولك للمتابعة</Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="account" size={24} color="#666" />
              <TextInput 
                placeholder="اسم المستخدم أو البريد الجامعي"
                style={styles.input}
                placeholderTextColor="#666"
                autoCapitalize="none"
                value={formData.identifier}
                onChangeText={(text) => setFormData(prev => ({ ...prev, identifier: text }))}
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

            <View style={styles.rememberMeContainer}>
              <TouchableOpacity 
                style={styles.rememberMeCheckbox}
                onPress={() => setFormData(prev => ({ ...prev, rememberMe: !prev.rememberMe }))}
              >
                <MaterialCommunityIcons 
                  name={formData.rememberMe ? "checkbox-marked" : "checkbox-blank-outline"} 
                  size={24} 
                  color="#666" 
                />
                <Text style={styles.rememberMeText}>تذكرني</Text>
              </TouchableOpacity>

              <Link href="/(auth)/reset-password" asChild>
                <TouchableOpacity>
                  <Text style={styles.forgotPasswordText}>نسيت كلمة المرور؟</Text>
                </TouchableOpacity>
              </Link>
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'جاري التسجيل...' : 'تسجيل الدخول'}
              </Text>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>ليس لديك حساب؟</Text>
              <Link href="/(auth)/signup" asChild>
                <TouchableOpacity>
                  <Text style={styles.signupLink}>إنشاء حساب</Text>
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
  rememberMeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rememberMeText: {
    color: '#666',
    fontSize: 14,
  },
  forgotPassword: {
    alignItems: 'flex-end',
  },
  forgotPasswordText: {
    color: '#666',
    fontSize: 14,
  },
  loginButton: {
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
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  signupText: {
    color: '#666',
    fontSize: 14,
  },
  signupLink: {
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
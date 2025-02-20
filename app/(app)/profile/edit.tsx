import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Image, ScrollView, KeyboardAvoidingView, Platform, I18nManager, Keyboard } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useUser } from '../../../lib/context/UserContext';
import { useAuth } from '../../../lib/auth/AuthContext';
import { supabase } from '../../../lib/supabase';
import { pickImage, uploadAvatar } from '../../../lib/storage/avatar';
import { DefaultAvatar } from '../../../assets';
import { Button, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../lib/i18n/LanguageContext';

type Gender = 'male' | 'female' | 'other';

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  gender: Gender | null;
  college_id: string | null;
  language_preference: 'ar' | 'en';
  created_at: string;
  updated_at: string;
};

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { userProfile, setUserProfile } = useUser();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: userProfile?.full_name || '',
    username: userProfile?.username || '',
    email: userProfile?.email || '',
    college_id: userProfile?.college_id || '',
    gender: userProfile?.gender || null,
    language_preference: userProfile?.language_preference || 'ar',
  });

  async function handleUpdateProfile() {
    if (!user?.id) {
      Alert.alert(t('common.errorMessage'), 'User not authenticated');
      return;
    }

    if (!formData.full_name || !formData.username || !formData.gender || !formData.college_id) {
      Alert.alert(t('common.errorMessage'), t('common.fillRequiredFields'));
      return;
    }

    // Validate college ID format if provided
    if (formData.college_id) {
      if (!/^[0-9]{8,10}$/.test(formData.college_id.trim())) {
        Alert.alert('خطأ', 'الرقم الجامعي يجب أن يكون من 8 إلى 10 أرقام');
        return;
      }

      // Example: 202310649
      if (!formData.college_id.startsWith('202')) {
        Alert.alert('خطأ', 'الرقم الجامعي يجب أن يبدأ بـ 202');
        return;
      }
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          username: formData.username.trim(),
          college_id: formData.college_id.trim(),
          gender: formData.gender,
          language_preference: formData.language_preference,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        if (error.message.includes('username_length')) {
          Alert.alert('خطأ', 'يجب أن يكون اسم المستخدم 3 أحرف على الأقل');
          return;
        }
        if (error.message.includes('username_unique')) {
          Alert.alert('خطأ', 'اسم المستخدم مستخدم من قبل');
          return;
        }
        if (error.message.includes('valid_college_id')) {
          Alert.alert('خطأ', 'الرقم الجامعي غير صالح');
          return;
        }
        Alert.alert(t('common.errorMessage'), error.message);
        return;
      }

      if (data) {
        setUserProfile(data);
        Alert.alert(t('common.successMessage'), t('profile.profileUpdated'), [
          { text: t('common.ok'), onPress: () => router.back() }
        ]);
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      Alert.alert(t('common.errorMessage'), error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadAvatar() {
    try {
      const uri = await pickImage();
      
      if (!uri || !userProfile?.id) return;

      setLoading(true);
      const { url } = await uploadAvatar(uri, userProfile.id);

      // Update profile with new avatar URL
      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', userProfile.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setUserProfile(data);
        Alert.alert(t('common.successMessage'), t('profile.avatarUpdated'));
      }
    } catch (error: any) {
      Alert.alert(t('common.errorMessage'), error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons 
              name={isRTL ? "arrow-right" : "arrow-left"} 
              size={24} 
              color="#000" 
            />
            <Text style={[
              styles.backText,
              { marginLeft: isRTL ? 8 : 0, marginRight: isRTL ? 0 : 8 }
            ]}>
              {t('common.back')}
            </Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('personal.profile.editProfile')}</Text>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={
                    userProfile?.avatar_url 
                      ? { uri: userProfile.avatar_url }
                      : DefaultAvatar
                  }
                  style={styles.avatar}
                />
                <TouchableOpacity 
                  style={styles.editAvatarButton}
                  onPress={handleUploadAvatar}
                  disabled={loading}
                >
                  <MaterialCommunityIcons name="camera" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.avatarHint}>{t('personal.profile.tapToChange')}</Text>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('personal.profile.fullName')}</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="account" size={24} color="#000" />
                <TextInput 
                  placeholder={t('personal.profile.fullName')}
                  style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  value={formData.full_name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, full_name: text }))}
                  placeholderTextColor="#666"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('personal.profile.username')}</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="at" size={24} color="#000" />
                <TextInput 
                  placeholder={t('personal.profile.username')}
                  style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  value={formData.username}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
                  placeholderTextColor="#666"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('personal.profile.collegeId')}</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="card-account-details" size={24} color="#000" />
                <TextInput 
                  placeholder="مثال: 202310649"
                  style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  value={formData.college_id}
                  onChangeText={(text) => {
                    // Only allow numbers
                    if (/^\d*$/.test(text)) {
                      setFormData(prev => ({ ...prev, college_id: text }))
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={10}
                  placeholderTextColor="#666"
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('personal.profile.email')}</Text>
              <View style={[styles.inputWrapper, styles.disabledInput]}>
                <MaterialCommunityIcons name="email" size={24} color="#666" />
                <TextInput 
                  placeholder={t('personal.profile.email')}
                  style={[
                    styles.input, 
                    styles.disabledText,
                    { textAlign: isRTL ? 'right' : 'left' }
                  ]}
                  value={formData.email}
                  editable={false}
                  placeholderTextColor="#666"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('personal.profile.gender.title')}</Text>
              <View style={styles.genderButtons}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    formData.gender === 'male' && styles.genderButtonSelected,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, gender: 'male' }))}
                >
                  <MaterialCommunityIcons
                    name="gender-male"
                    size={24}
                    color={formData.gender === 'male' ? '#2196F3' : '#666'}
                  />
                  <Text style={[
                    styles.genderButtonText,
                    formData.gender === 'male' && styles.genderButtonTextSelected
                  ]}>
                    {t('personal.profile.gender.male')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    formData.gender === 'female' && styles.genderButtonSelected,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, gender: 'female' }))}
                >
                  <MaterialCommunityIcons
                    name="gender-female"
                    size={24}
                    color={formData.gender === 'female' ? '#E91E63' : '#666'}
                  />
                  <Text style={[
                    styles.genderButtonText,
                    formData.gender === 'female' && styles.genderButtonTextSelected
                  ]}>
                    {t('personal.profile.gender.female')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={handleUpdateProfile}
              loading={loading}
              disabled={loading}
              style={styles.updateButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              {loading ? t('common.saving') : t('personal.profile.saveChanges')}
            </Button>

            <Button
              mode="outlined"
              onPress={() => router.back()}
              disabled={loading}
              style={styles.cancelButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.cancelButtonLabel}
            >
              {t('common.cancel')}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginRight: 16,
    color: '#000',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  avatarSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f5f5f5',
  },
  editAvatarButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarHint: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
    textAlign: 'right',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#000',
  },
  disabledInput: {
    backgroundColor: '#E5E7EB',
  },
  disabledText: {
    color: '#666',
  },
  actionButtons: {
    gap: 12,
  },
  updateButton: {
    backgroundColor: '#000',
    borderRadius: 12,
  },
  cancelButton: {
    borderRadius: 12,
    borderColor: '#000',
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  genderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  genderButtonSelected: {
    borderColor: '#000',
    backgroundColor: '#F5F5F5',
  },
  genderButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  genderButtonTextSelected: {
    color: '#000',
    fontWeight: '500',
  },
}); 